/** Chrome headless works; now verify the CDP path the audit depends on. */
import { spawn } from 'node:child_process';
import { rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE = mkdtempSync(join(tmpdir(), 'sq-chrome-'));
const PORT = 9337;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run',
  '--disable-dev-shm-usage', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`, 'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let chromeErr = '';
chrome.stderr.on('data', (d) => { chromeErr += d.toString(); });
chrome.on('exit', (code) => console.log(`  chrome exited early: code=${code} err=${chromeErr.slice(0, 200)}`));

let wsUrl = null;
for (let i = 0; i < 40; i += 1) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; }
  } catch { /* not up yet */ }
  await sleep(500);
}
console.log(`  CDP version endpoint: ${wsUrl ? 'UP' : 'NEVER CAME UP'}`);
if (!wsUrl) { console.log(`  chrome stderr: ${chromeErr.slice(0, 400)}`); process.exit(1); }

const sock = new WebSocket(wsUrl);
await new Promise((res, rej) => {
  sock.addEventListener('open', res, { once: true });
  sock.addEventListener('error', rej, { once: true });
});
console.log('  browser WebSocket: CONNECTED');

let id = 0;
const pending = new Map();
sock.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
const send = (method, params = {}) =>
  new Promise((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });

const { targetId } = await send('Target.createTarget', {
  url: 'data:text/html,<body style="background:%23059669"><h1 style="color:white;font:700 40px sans-serif">SOLARQUOTE</h1></body>',
});
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find((t) => t.id === targetId);
console.log(`  target found: ${!!page}`);

const p = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res) => p.addEventListener('open', res, { once: true }));
let pid = 0;
const pp = new Map();
p.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pp.has(m.id)) { pp.get(m.id)(m.result); pp.delete(m.id); }
});
const pSend = (method, params = {}) =>
  new Promise((r) => { const i = ++pid; pp.set(i, r); p.send(JSON.stringify({ id: i, method, params })); });

await pSend('Page.enable');
await pSend('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await sleep(1200);
const shot = await pSend('Page.captureScreenshot', { format: 'png' });
console.log(`  screenshot bytes: ${shot && shot.data ? Buffer.from(shot.data, 'base64').length : 0}`);
const dom = await pSend('Runtime.evaluate', { expression: 'document.body.innerText.trim()', returnByValue: true });
console.log(`  page text: ${JSON.stringify(dom && dom.result && dom.result.value)}`);

try { sock.close(); p.close(); chrome.kill(); } catch { /* ignore */ }
rmSync(PROFILE, { recursive: true, force: true });
console.log('  CDP PATH OK');
