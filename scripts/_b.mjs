// BOOTMARKER
/**
 * Visual audit harness Ã¢â‚¬â€ drives the REAL app in headless Chrome over CDP.
 *
 * Uses Node 22's built-in WebSocket and the Chrome already installed on the
 * machine, so there is no Playwright/Puppeteer dependency to install. It walks
 * the app the way a user would and writes a PNG per state.
 *
 * Usage: node scripts/visual-audit.mjs [outDir]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync, mkdtempSync, createReadStream, statSync, appendFileSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';

export const OUT = process.argv[2] || '.tmp-shots';
export const PORT = 4319;
export const CDP_PORT = 9333;
export const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const BASE = `http://localhost:${PORT}`;
// The profile MUST live outside the repo: Chrome keeps a lock on it, and
// deleting a locked directory on Windows throws and aborts the run's cleanup.
export const PROFILE = mkdtempSync(join(tmpdir(), 'sq-chrome-'));

export const shots = [];
export const PROGRESS = join(process.cwd(), '.tmp-shots', 'progress.log');
/**
 * Writes to stdout AND an on-disk progress log, unbuffered, so a run that is
 * detached from its parent process still leaves an auditable trail.
 */
export const log = (m) => {
  const line = '  ' + m;
  console.log(line);
  try {
    mkdirSync(OUT, { recursive: true });
    appendFileSync(PROGRESS, line + '\n');
  } catch { /* ignore */ }
};
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

/**
 * A tiny static server for dist/.
 *
 * `vite preview` was unreliable here (it never bound the port in the harness),
 * and this keeps the audit dependency-free and deterministic.
 */
export function serveDist(root = 'dist') {
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    // Strip leading slash, then block any traversal outside dist.
    let rel = normalize(url).replace(/^([/\\])+/, '');
    if (rel === '' || rel.endsWith('..')) rel = 'index.html';
    const file = join(root, rel);
    if (!file.startsWith(normalize(root))) { res.writeHead(403).end(); return; }
    if (!existsSync(file) || !statSync(file).isFile()) {
      // SPA fallback.
      const index = join(root, 'index.html');
      if (!existsSync(index)) { res.writeHead(404).end('no dist'); return; }
      res.writeHead(200, { 'Content-Type': MIME['.html'] });
      createReadStream(index).pipe(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  server.listen(PORT);
  return server;
}


// ---------------------------------------------------------------- CDP client
export class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }

  static async attach(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', rej, { once: true });
    });
    return new CDP(ws);
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`${method} timed out`));
        }
      }, 30000);
    });
  }

  async evaluate(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || 'evaluate failed');
    }
    return r.result.value;
  }

  /** Clicks the first element whose trimmed text matches; reports what it saw. */
  async clickText(text, { exact = false, tag = 'button,a,[role=tab],[role=button]' } = {}) {
    return this.evaluate(`(() => {
      const want = ${JSON.stringify(text)};
      const nodes = [...document.querySelectorAll(${JSON.stringify(tag)})];
      const hit = nodes.find((n) => {
        const t = (n.innerText || n.textContent || '').trim();
        return ${exact ? 't === want' : 't.includes(want)'};
      });
      if (!hit) return { ok: false, tried: nodes.length,
        sample: nodes.slice(0, 12).map((n) => (n.innerText || '').trim().slice(0, 24)) };
      hit.scrollIntoView({ block: 'center' });
      hit.click();
      return { ok: true, text: (hit.innerText || '').trim().slice(0, 40) };
    })()`);
  }

  async screenshot(name) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(OUT, `${name}.png`), Buffer.from(data, 'base64'));
    shots.push(name);
    log(`shot ${name}.png`);
  }

  /**
   * Reads the live DOM for problems a screenshot alone will not reveal:
   * horizontal overflow, undersized touch targets, unlabelled inputs, images
   * without alt text, and text failing WCAG contrast.
   */
  async inspect() {
    return this.evaluate(`(() => {
      const out = { overflow: [], tiny: [], unlabeled: [], lowContrast: [],
        imgNoAlt: 0, docW: document.documentElement.scrollWidth,
        winW: window.innerWidth, h: document.documentElement.scrollHeight };
      const srgb = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
      const parse = (s) => {
        const m = s && s.match(/rgba?\\(([^)]+)\\)/);
        if (!m) return null;
        const p = m[1].split(',').map((x) => parseFloat(x));
        return p.length > 3 && p[3] === 0 ? null : p.slice(0, 3);
      };
      const bgOf = (el) => {
        let n = el;
        while (n && n !== document.documentElement) {
          const c = parse(getComputedStyle(n).backgroundColor);
          if (c) return c;
          n = n.parentElement;
        }
        return parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255];
      };

      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const cs = getComputedStyle(el);

        if (cs.position !== 'fixed' && cs.overflow !== 'hidden' &&
            (r.right > window.innerWidth + 1 || r.left < -1)) {
          out.overflow.push({ tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 44),
            left: Math.round(r.left), right: Math.round(r.right),
            text: (el.innerText || '').trim().slice(0, 30) });
        }
        if ((el.tagName === 'BUTTON' || el.tagName === 'A') && (r.width < 44 || r.height < 44)) {
          out.tiny.push({ tag: el.tagName.toLowerCase(), w: Math.round(r.width),
            h: Math.round(r.height), text: (el.innerText || '').trim().slice(0, 24) });
        }
        if (['INPUT','SELECT','TEXTAREA'].includes(el.tagName)) {
          const labelled = (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) ||
            el.closest('label') || el.getAttribute('aria-label') ||
            el.getAttribute('aria-labelledby') || el.placeholder;
          if (!labelled) out.unlabeled.push({ tag: el.tagName.toLowerCase(), type: el.type });
        }
        if (el.tagName === 'IMG' && !el.alt && !el.getAttribute('aria-hidden')) out.imgNoAlt++;

        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (hasText && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.5) {
          const fg = parse(cs.color);
          if (fg) {
            const L1 = lum(fg), L2 = lum(bgOf(el));
            const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
            const size = parseFloat(cs.fontSize);
            const bold = parseInt(cs.fontWeight, 10) >= 700;
            const large = size >= 24 || (size >= 18.66 && bold);
            const need = large ? 3 : 4.5;
            if (ratio < need) {
              out.lowContrast.push({ ratio: Math.round(ratio * 100) / 100, need,
                size: Math.round(size), text: el.textContent.trim().slice(0, 28),
                cls: (el.className || '').toString().slice(0, 40) });
            }
          }
        }
      });
      const dedupe = (a, k) => { const s = new Set();
        return a.filter((x) => { const v = k(x); if (s.has(v)) return false; s.add(v); return true; }); };
      out.overflow = dedupe(out.overflow, (x) => x.cls + x.text).slice(0, 10);
      out.tiny = dedupe(out.tiny, (x) => x.text + x.w + x.h).slice(0, 10);
      out.unlabeled = dedupe(out.unlabeled, (x) => x.tag + x.type).slice(0, 10);
      out.lowContrast = dedupe(out.lowContrast, (x) => x.cls).slice(0, 12);
      return out;
    })()`);
  }
}

// ------------------------------------------------------------------- helpers
function startChrome() {
  return spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run',
    '--disable-dev-shm-usage', '--hide-scrollbars',
    `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
    'about:blank',
  ], { stdio: 'ignore' });
}

async function waitForCdp() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(500);
  }
  throw new Error('Chrome did not expose a CDP endpoint');
}

async function waitForServer() {
  for (let i = 0; i < 80; i += 1) {
    try { if ((await fetch(BASE)).ok) return; } catch { /* not up yet */ }
    await sleep(500);
  }
  throw new Error('preview server did not start');

// ---------------------------------------------------------------------- main
let server, chrome, cdp;
console.log('OK-262');
