/**
 * Verifies the PDF export path used on Android.
 *
 * Regression context: jsPDF's `doc.save()` relies on an <a download> click on a
 * blob URL. Android WebView never triggers a download for blob: hrefs, so the
 * call silently produced no file on the tablet. The fix routes native builds
 * through Capacitor Filesystem + Share instead.
 *
 * Usage: node scripts/pdf-export-check.mjs
 */
import { safeFileName } from '../src/utils/pdfExport.js';

let failures = 0;
const check = (label, cond, extra = '') => {
  if (cond) {
    console.log(`  PASS  ${label}${extra ? ' -> ' + extra : ''}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${extra ? ' -> ' + extra : ''}`);
  }
};

console.log('\n[1] Filename sanitisation (Android external storage rules)');
check('spaces become underscores', safeFileName('Alhaji S Adeleke') === 'Alhaji_S_Adeleke', safeFileName('Alhaji S Adeleke'));
check('illegal chars stripped', !/[\\/:*?"<>|]/.test(safeFileName('A/B:C*D?E"F<G>H|I')), safeFileName('A/B:C*D?E"F<G>H|I'));
check('no path traversal', !safeFileName('../../etc/passwd').includes('..'), safeFileName('../../etc/passwd'));
check('never empty', safeFileName('') === 'SolarQuote', safeFileName(''));
check('length capped', safeFileName('x'.repeat(200)).length <= 80, String(safeFileName('x'.repeat(200)).length));

console.log('\n[2] jsPDF produces a valid base64 payload for Filesystem.writeFile');
const { jsPDF } = await import('jspdf');
const doc = new jsPDF({ unit: 'mm', format: 'a4' });
doc.text('SolarQuote NG export test', 14, 20);
const dataUri = doc.output('datauristring');
console.log('  INFO  data URI prefix -> ' + JSON.stringify(dataUri.slice(0, dataUri.indexOf(',') + 1)));
const base64 = dataUri.split(',')[1];
check('base64 payload non-empty', base64.length > 500, `${base64.length} chars`);
check('payload is pure base64', /^[A-Za-z0-9+/=]+$/.test(base64));
const decoded = Buffer.from(base64, 'base64');
check('decodes to a real PDF', decoded.subarray(0, 5).toString() === '%PDF-', decoded.subarray(0, 8).toString());
check('PDF has EOF marker', decoded.subarray(-1024).toString('latin1').includes('%%EOF'));

console.log('\n[3] Native branch selection');
const fs = await import('node:fs');
const src = fs.readFileSync('src/utils/pdfExport.js', 'utf8');
check('guards web with isNativePlatform()', /if \(!isNativePlatform\(\)\)/.test(src));
check('web path uses doc.save()', /doc\.save\(name\)/.test(src));
check('native path uses Filesystem.writeFile', /Filesystem\.writeFile/.test(src));
check('native path uses base64 encoding', /Encoding\.Base64/.test(src));
check('native path opens the share sheet', /Share\.share/.test(src));
check('splits data URI on first comma only', /dataUri\.slice\(dataUri\.indexOf\(','\) \+ 1\)/.test(src));
check('no web-only doc.save() left in ScreenPDF', !/doc\.save\(/.test(
  fs.readFileSync('src/components/ScreenPDF.jsx', 'utf8')
));

console.log('\n[4] Runtime behaviour of exportPDF on a native device (stubbed bridge)');

// The real plugins talk over the Capacitor native bridge, which does not exist
// in Node. The loader hook (scripts/stubs/loader.mjs, wired up in the npm
// script via --experimental-loader) swaps in stubs so the branch logic under
// test is the genuine code from src/utils/pdfExport.js.
const { exportPDF } = await import('../src/utils/pdfExport.js');
const { calls } = await import('./stubs/cap-filesystem.mjs');

const nativeDoc = {
  output: () => 'data:application/pdf;filename=generated.pdf;base64,' + base64,
  save: () => { throw new Error('doc.save() must never run natively'); }
};

const res = await exportPDF(nativeDoc, 'Alhaji S. Adeleke BOQ');

check('result reports a share', res.method === 'share', res.method);
check('writeFile targeted the cache dir', calls.written?.directory === 'CACHE', calls.written?.directory);
check('writeFile used base64 encoding', calls.written?.encoding === 'base64', calls.written?.encoding);
check('written filename is sanitised', calls.written?.path === 'Alhaji_S_Adeleke_BOQ.pdf', calls.written?.path);
check('payload carried no data-URI prefix', calls.written?.data === base64);
check('share sheet received the file uri', /\/Alhaji_S_Adeleke_BOQ\.pdf$/.test(calls.shared?.files?.[0] || ''), calls.shared?.files?.[0]);
check('doc.save() was never called natively', true);

console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===\n`);
process.exit(failures === 0 ? 0 : 1);
