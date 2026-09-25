/**
 * Visual audit — drives the REAL app in headless Chrome and captures a PNG of
 * every screen, plus a DOM defect report for each.
 *
 * Zero external dependencies: Node 22's global WebSocket speaks CDP to the
 * Chrome already installed on the machine, and dist/ is served by a small
 * built-in static server.
 *
 * Usage: node scripts/visual-audit.mjs [outDir]
 */
import { mkdirSync, writeFileSync, createReadStream, existsSync, statSync, appendFileSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { createServer } from 'node:http';
import { launch, sleep } from './cdp.mjs';
import { AUDIT_FN } from './dom-audit.mjs';

const OUT = process.argv[2] || '.tmp-shots';
const PORT = 4319;
const CDP_PORT = 9333;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = `http://localhost:${PORT}`;
const PROGRESS = join(OUT, 'progress.log');

const say = (m) => {
  const line = '  ' + m;
  console.log(line);
  try { appendFileSync(PROGRESS, line + '\n'); } catch { /* ignore */ }
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

/** Serves dist/ with an SPA fallback. */
function serveDist(root = 'dist') {
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let rel = normalize(url).replace(/^([/\\])+/, '');
    if (rel === '' || rel.endsWith('..')) rel = 'index.html';
    const file = join(root, rel);
    if (!file.startsWith(normalize(root))) { res.writeHead(403).end(); return; }
    if (!existsSync(file) || !statSync(file).isFile()) {
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

const shots = [];
const reports = {};
let server = null;
let session = null;

try {
  mkdirSync(OUT, { recursive: true });
  say('=== VISUAL AUDIT ===');

  server = serveDist();
  say('static server on ' + PORT);
  for (let i = 0; i < 40; i += 1) {
    try { if ((await fetch(BASE)).ok) break; } catch { await sleep(300); }
  }
  say('server responding');

  session = await launch({ chrome: CHROME, port: CDP_PORT });
  say('chrome + CDP attached');
  const { page } = session;
  await page.size(390, 844);

  // Pin the OS preference to light so the first pass is deterministic, and
  // report what the app picks on a genuinely fresh install.
  await page.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'light' }],
  });

  const capture = async (name) => {
    writeFileSync(join(OUT, name + '.png'), await page.shot());
    shots.push(name);
    await page.js(AUDIT_FN + '; audit();').then((r) => { reports[name] = r; });
    const r = reports[name];
    const total = r.overflow.length + r.tiny.length + r.unlabeled.length + r.lowContrast.length;
    say('shot ' + name + '  overflow=' + r.overflow.length +
      ' tiny=' + r.tiny.length + ' unlabeled=' + r.unlabeled.length +
      ' contrast=' + r.lowContrast.length + (total ? '   <-- inspect' : ''));
  };

  // ---- first launch, exactly as a new user sees it
  await page.send('Page.navigate', { url: BASE });
  await sleep(3000);
  const freshTheme = await page.js(`({
    darkClass: document.documentElement.classList.contains('dark'),
    stored: localStorage.getItem('solarquote_settings_v3'),
    h: document.documentElement.scrollHeight,
    winH: window.innerHeight,
  })`);
  say('fresh install -> dark=' + freshTheme.darkClass +
    ' scrollH=' + freshTheme.h + ' viewportH=' + freshTheme.winH +
    ' stored=' + JSON.stringify(freshTheme.stored));
  await capture('01-welcome-intro');

  say('tap: ' + JSON.stringify(await page.tap('Get started')));
  await sleep(900);
  await capture('02-welcome-mode');

  await page.tap('Professional');
  await sleep(400);
  say('tap: ' + JSON.stringify(await page.tap('Continue')));
  await sleep(900);
  await capture('03-welcome-plan');

  // Step 3's CTA is "Start Building Quotes", not "Get Started".
  say('tap: ' + JSON.stringify(await page.tap('Start Building Quotes')));
  await sleep(2000);
  await capture('04-home');

  // ---- every tab
  for (const pair of [['Catalog', '05-catalog'], ['Quote', '06-quote-loads'],
    ['BOQ', '07-boq'], ['Wallet', '08-wallet'], ['Settings', '09-settings']]) {
    const r = await page.tap(pair[0], true);
    if (!r.ok) say('WARN tab missing "' + pair[0] + '" saw ' + JSON.stringify(r.saw));
    await sleep(1300);
    await capture(pair[1]);
  }

  // ---- a product sheet
  await page.tap('Catalog', true);
  await sleep(1000);
  const card = await page.js(`(() => {
    const el = [...document.querySelectorAll('button, [role=button]')]
      .find((n) => /Deye|Sunsynk|Growatt|Pylontech|LONONi/i.test(n.innerText || ''));
    if (!el) return null;
    el.click();
    return (el.innerText || '').trim().slice(0, 34);
  })()`);
  say('product card: ' + card);
  await sleep(1300);
  await capture('10-product-detail');

  // ---- dark mode
  await page.js("document.documentElement.classList.add('dark'); true");
  await sleep(400);
  await page.tap('Catalog', true);
  await sleep(1200);
  await capture('11-catalog-dark');
  await page.tap('BOQ', true);
  await sleep(1200);
  await capture('12-boq-dark');
  await page.tap('Wallet', true);
  await sleep(1200);
  await capture('13-wallet-dark');

  // ---- narrowest supported phone
  await page.size(320, 640);
  await page.tap('Home', true);
  await sleep(1200);
  await capture('14-home-320');
  await page.size(390, 844);

  writeFileSync(join(OUT, 'report.json'), JSON.stringify(reports, null, 2));
  console.log('=== ' + shots.length + ' screenshots in ' + OUT + ' ===');
} catch (err) {
  console.error('VISUAL AUDIT FAILED: ' + err.message);
  process.exitCode = 1;
} finally {
  if (session) session.close();
  if (server) server.close();
}
