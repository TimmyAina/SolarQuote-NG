import { pathToFileURL } from 'node:url';
/**
 * Runtime mount check
 * ---------------------------------------------------------------------------
 * A successful `vite build` only proves the code compiles. This bundles the real
 * App with esbuild and renders it through jsdom to prove React actually mounts,
 * the welcome screen appears on first run, and nothing throws.
 *
 * Usage: node scripts/render-check.mjs
 */
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

let failures = 0;
const check = (label, condition, detail = '') => {
  const ok = Boolean(condition);
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -> ${detail}` : ''}`);
};

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

global.window = dom.window;
global.document = dom.window.document;
// Node 22 exposes `navigator` as a getter-only global, so plain assignment throws.
Object.defineProperty(global, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
  writable: true,
});
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.IS_REACT_ACT_ENVIRONMENT = true;

if (!dom.window.matchMedia) {
  dom.window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
}

// jsdom defines scrollTo but it throws "Not implemented"; always override it.
dom.window.scrollTo = () => {};
global.scrollTo = () => {};

// jsdom has no localStorage unless the URL opts in, and the app persists
// settings. Without this every launch logs a persistence warning.
if (!dom.window.localStorage) {
  const store = new Map();
  dom.window.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}
global.localStorage = dom.window.localStorage;

// jsdom has no canvas; jsPDF touches it on import.
dom.window.HTMLCanvasElement.prototype.getContext = () => null;

// Node cannot parse JSX, so bundle the app (stubbing the heavy PDF libs) first.
mkdirSync('.tmp-render', { recursive: true });
const pdfStub = resolve('.tmp-render/pdf-stub.mjs');
const autoTableStub = resolve('.tmp-render/auto-table.mjs');
writeFileSync(
  pdfStub,
  'export const jsPDF = class { output(){ return "data:application/pdf;base64,JVBERi0="; } save(){} };\n' +
    'export default { jsPDF };\n'
);
writeFileSync(autoTableStub, 'export default function autoTable() {}\n');

await build({
  entryPoints: ['src/App.jsx'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  outfile: '.tmp-render/app.mjs',
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [
    {
      name: 'stub-pdf',
      setup(b) {
        b.onResolve({ filter: /^jspdf$/ }, () => ({ path: pdfStub }));
        b.onResolve({ filter: /^jspdf-autotable$/ }, () => ({ path: autoTableStub }));
      },
    },
    {
      // The harness imports React at runtime to create the root, and the app
      // bundle needs the SAME instance. Bundling a second copy leaves the
      // dispatcher null, so React and react-dom must stay external.
      name: 'react-external',
      setup(b) {
        [/^react$/, /^react\/jsx-runtime$/, /^react-dom$/, /^react-dom\/client$/]
          .forEach((filter) => {
            b.onResolve({ filter }, (a) => ({ path: a.path, external: true }));
          });
      },
    },
    {
      // lucide-react is CJS; under Node ESM esbuild's interop drops the named
      // icon re-exports. The shim re-exports the exact names the app imports.
      name: 'lucide-shim',
      setup(b) {
        b.onResolve({ filter: /^lucide-react$/ }, () => ({
          path: pathToFileURL('scripts/stubs/lucide-shim.mjs').href,
          external: true,
        }));
      },
    },
  ],
  logLevel: 'error',
});

const errors = [];
const origError = console.error;
console.error = (...args) => {
  errors.push(args.map(String).join(' '));
};

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const App = (await import('../.tmp-render/app.mjs')).default;


console.log('\n[R1] First run shows the welcome screen');
const root = createRoot(document.getElementById('root'));
await act(async () => {
  root.render(React.createElement(App));
});

const text = () => document.getElementById('root').textContent || '';
check('app mounted', text().length > 0, `${text().length} chars`);
check('welcome heading present', /Build accurate solar quotes/i.test(text()));
check('no login/signup demanded', !/sign in|log in|create account|password/i.test(text()));
check('no React errors thrown', errors.length === 0, errors[0] || 'none');

console.log('\n[R2] Completing onboarding reaches the app shell');
const startBtn = [...document.querySelectorAll('button')].find((b) =>
  /get started/i.test(b.textContent || '')
);
check('Get Started button exists', Boolean(startBtn));
if (process.env.RC_DEBUG) {
  console.log('    DEBUG buttons:', [...document.querySelectorAll('button')].map((b) => (b.textContent || '').trim()).join(' | '));
}

await act(async () => {
  startBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
});

const modeStep = text();
check(
  'mode options offered',
  /Simple Mode/i.test(modeStep) && /Professional Mode/i.test(modeStep),
  modeStep.slice(60, 150)
);

const modeBtn = [...document.querySelectorAll('button')].find((b) =>
  /\bcontinue\b/i.test(b.textContent || '')
);
check('continue to plan', Boolean(modeBtn));

await act(async () => {
  modeBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
});

const afterMode = text();
check(
  'plan options offered',
  /Pay As You Go/i.test(afterMode) &&
    /Limited/i.test(afterMode) &&
    /Unlimited/i.test(afterMode)
);

const finishBtn = [...document.querySelectorAll('button')].find((b) =>
  /start building quotes/i.test(b.textContent || '')
);
check('plan step reached', Boolean(finishBtn));

await act(async () => {
  finishBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
});

const after = text();
check('dashboard rendered', /Dashboard|What your power costs/i.test(after), after.slice(0, 60));
check('bottom navigation present', /Catalog/.test(after) && /Settings/.test(after));
check('wallet tab present', /Wallet/.test(after));
check('quote number starts at #0', /#0/.test(after));
check('no React errors after onboarding', errors.length === 0, errors[0] || 'none');

console.log('\n[R3] Catalog is reachable and the user-catalog entry point renders');
const catalogTab = [...document.querySelectorAll('button')].find((b) =>
  /catalog/i.test(b.textContent || '')
);
check('catalog tab exists', Boolean(catalogTab));
await act(async () => {
  catalogTab.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
});
const cat = text();
check('catalog rendered', /Inverters/i.test(cat), cat.slice(0, 60));
// Browsing the catalog is free, so the add-your-own affordance must be present
// (either the unlocked button or the upgrade prompt).
check(
  'add-your-own entry point present',
  /add your own product/i.test(cat) || /upgrade/i.test(cat)
);
// The producer tab bar is the grouping axis: a section with several makers
// must render manufacturer tabs, not just a dropdown.
check('manufacturer tabs render', /tablist|Filter by manufacturer/i.test(document.body.innerHTML));
check('a real brand tab is shown', /Deye|Sunsynk|Growatt|Victron|Pylontech|LONGi/i.test(cat));
check('brand artwork or wordmark is used', document.querySelectorAll('[role="img"]').length > 0);
check('parts section is reachable', /Parts/i.test(cat) || /parts/i.test(cat));
check('no React errors on catalog', errors.length === 0, errors[0] || 'none');

console.error = origError;
console.log(
  failures === 0
    ? '\n=== RENDER: ALL PASSED ==='
    : `\n=== ${failures} FAILURE(S) ===`
);
// jsdom keeps the event loop alive; exit explicitly once the checks are done.
process.exit(failures === 0 ? 0 : 1);
