/**
 * Minimal CDP client.
 * Node 22 ships a global WebSocket, and Chrome is already installed, so the
 * visual audit needs no Playwright/Puppeteer dependency.
 */
import { spawn, exec } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Lists PIDs listening on a TCP port, via netstat (no dependencies). */
async function pidsOnPort(port) {
  return new Promise((resolve) => {
    exec('netstat -ano -p tcp', { windowsHide: true }, (err, stdout) => {
      if (err) { resolve([]); return; }
      const pids = stdout
        .split('\n')
        .filter((l) => l.includes(`:${port}`) && l.trim().endsWith('LISTENING'))
        .map((l) => Number(l.trim().split(/\s+/).pop()))
        .filter((n) => Number.isInteger(n) && n > 0);
      resolve([...new Set(pids)]);
    });
  });
}

export class Session {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.waiting = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      const slot = this.waiting.get(msg.id);
      if (!slot) return;
      this.waiting.delete(msg.id);
      if (msg.error) slot.reject(new Error(msg.error.message));
      else slot.resolve(msg.result);
    });
  }

  static async open(url) {
    const ws = new WebSocket(url);
    await new Promise((ok, bad) => {
      ws.addEventListener('open', ok, { once: true });
      ws.addEventListener('error', bad, { once: true });
    });
    return new Session(ws);
  }

  send(method, params = {}) {
    const id = ++this.seq;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.waiting.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.waiting.has(id)) {
          this.waiting.delete(id);
          reject(new Error(`${method} timed out`));
        }
      }, 25000);
    });
  }

  async js(code) {
    const out = await this.send('Runtime.evaluate', {
      expression: code, returnByValue: true, awaitPromise: true,
    });
    if (out.exceptionDetails) {
      throw new Error(out.exceptionDetails.exception?.description || 'js failed');
    }
    return out.result.value;
  }

  /** Clicks the first node whose visible text matches (case-insensitive). */
  async tap(text, exact = false) {
    return this.js(`(() => {
      const want = ${JSON.stringify(text)}.toLowerCase();
      const all = [...document.querySelectorAll('button, a, [role=tab], [role=button]')];
      const hit = all.find((n) => {
        const t = (n.innerText || n.textContent || '').trim().toLowerCase();
        return ${exact} ? t === want : t.indexOf(want) !== -1;
      });
      if (!hit) return { ok: false, saw: all.slice(0, 14).map((n) => (n.innerText || '').trim().slice(0, 22)) };
      hit.scrollIntoView({ block: 'center' });
      hit.click();
      return { ok: true, label: (hit.innerText || '').trim().slice(0, 40) };
    })()`);
  }

  async size(w, h) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 2, mobile: true,
    });
  }

  async shot() {
    const r = await this.send('Page.captureScreenshot', { format: 'png' });
    return Buffer.from(r.data, 'base64');
  }
}

/** Boots headless Chrome and returns a session attached to a fresh tab. */
export async function launch({ chrome, port }) {
  // A previous run that was killed can leave Chrome holding the port, in which
  // case the new instance never binds and CDP appears to "never come up".
  // Clear the port first so the audit is repeatable.
  for (const pid of await pidsOnPort(port)) {
    try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ }
  }
  await sleep(400);

  const profile = mkdtempSync(join(tmpdir(), 'sq-chrome-'));
  const child = spawn(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run',
    '--disable-dev-shm-usage', '--hide-scrollbars',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i += 1) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl;
    } catch { await sleep(500); }
  }
  if (!wsUrl) { child.kill(); throw new Error('chrome CDP never came up'); }

  const browser = await Session.open(wsUrl);
  const made = await browser.send('Target.createTarget', { url: 'about:blank' });
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = list.find((t) => t.id === made.targetId);
  const page = await Session.open(target.webSocketDebuggerUrl);
  await page.send('Page.enable');
  await page.send('Runtime.enable');

  return {
    page,
    close() {
      try { page.ws.close(); browser.ws.close(); } catch { /* ignore */ }
      try { child.kill(); } catch { /* ignore */ }
      try { rmSync(profile, { recursive: true, force: true, maxRetries: 2 }); } catch { /* ignore */ }
    },
  };
}
