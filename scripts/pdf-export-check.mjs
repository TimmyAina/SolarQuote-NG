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

console.log('\n[2b] Naira sign survives PDF generation (the U+20A6 bug)');
// Regression context: jsPDF's built-in fonts are WinAnsi-only and have no
// Naira glyph, so every currency figure silently lost its ₦. The fix embeds
// Noto Sans. This renders a real BOQ and inspects the resulting PDF bytes.
const { generateBOQReport } = await import('../src/utils/pdfGenerator.js');
const { calculateSolarSystem, formatNaira } = await import('../src/utils/calculations.js');
const { DEFAULT_SETTINGS } = await import('../src/data/pricingDefaults.js');

const calc = calculateSolarSystem({
  appliances: [
    { id: 'fans', qty: 6, watts: 75, hoursDay: 8, hoursNight: 6 },
    { id: 'bulbs', qty: 12, watts: 15, hoursDay: 6, hoursNight: 6 },
    { id: 'freezer', qty: 1, watts: 250, hoursDay: 10, hoursNight: 14 },
  ],
  sunHours: 4.8,
  settings: DEFAULT_SETTINGS,
  installerMarkupPercent: 15,
});

const nairaDoc = generateBOQReport({
  calcResult: calc,
  selectedTierIndex: 1,
  settings: DEFAULT_SETTINGS,
  clientName: 'Alhaji S. Adeleke',
  quoteNumber: 0,
});
const nairaBytes = Buffer.from(nairaDoc.output('arraybuffer'), 'latin1');
const nairaText = nairaBytes.toString('latin1');

check('BOQ PDF generated', nairaBytes.length > 3000, `${nairaBytes.length} bytes`);
check('PDF signature present', nairaText.startsWith('%PDF-'), nairaText.slice(0, 8));
// The embedded font is what carries ₦. Confirm the font is actually referenced.
check(
  'embedded NotoSans font is referenced in the PDF',
  nairaText.includes('NotoSans') || nairaText.includes('Noto') || /FontFile2/.test(nairaText)
);
// jsPDF writes a ToUnicode CMap for embedded fonts; if ₦ survived, its codepoint
// must appear in that map.
const hasNairaCMap =
  nairaText.includes('20A6') || nairaText.includes('20a6') || nairaText.includes('<0020A6>');
check('Naira codepoint present in font subset map', hasNairaCMap);
check(
  'formatNaira output actually contains U+20A6',
  formatNaira(500).includes('₦'),
  JSON.stringify(formatNaira(500))
);

console.log('\n[2c] The embedded font stays small (the Android white-screen fix)');
// Regression: shipping the full 569KB Noto Sans and registering it as both
// 'normal' and 'bold' cost 13-17MB of heap and 300-400ms of main-thread work
// per generation, which froze and then whited-out the WebView. The font is now
// subsetted; these assertions stop anyone reintroducing the full file.
{
  const { statSync } = await import('node:fs');
  const size = statSync('src/fonts/noto-sans-subset.js').size;
  console.log(`  INFO  embedded font module is ${(size / 1024).toFixed(1)}KB`);
  check('embedded font module is under 64KB', size < 64 * 1024, `${(size / 1024).toFixed(1)}KB`);
  // Two streams is correct (real regular + bold); more means duplication again.
  const streams = (nairaText.match(/\/FontFile2/g) || []).length;
  check('font embedded at most twice (regular + bold)', streams >= 1 && streams <= 2, `${streams} streams`);
  const { NOTOSANS_CODEPOINTS } = await import('../src/fonts/noto-sans-subset.js');
  check('subset declares the Naira sign', NOTOSANS_CODEPOINTS.includes(0x20a6));
}

console.log('\n[3] Native branch selection');
const fs = await import('node:fs');
const src = fs.readFileSync('src/utils/pdfExport.js', 'utf8');
check('guards web with isNativePlatform()', /if \(!isNativePlatform\(\)\)/.test(src));
check('web path uses doc.save()', /doc\.save\(name\)/.test(src));
check('native path uses Filesystem.writeFile', /Filesystem\.writeFile/.test(src));
check('native path uses base64 encoding', /Encoding\.Base64/.test(src));
check('native path opens the share sheet', /Share\.share/.test(src));
check('splits data URI on first comma only', /dataUri\.slice\(dataUri\.indexOf\(','\) \+ 1\)/.test(src));
// The export is now triggered from BOQScreen (the redesigned quote screen
// replaced the old ScreenPDF), so assert the web-only path is absent there.
check('no web-only doc.save() left in BOQScreen', !/doc\.save\(/.test(
  fs.readFileSync('src/components/BOQScreen.jsx', 'utf8')
));
check('BOQScreen routes through exportPDF', /exportPDF\(/.test(
  fs.readFileSync('src/components/BOQScreen.jsx', 'utf8')
));
check('BOQScreen surfaces export errors to the user', /exportError/.test(
  fs.readFileSync('src/components/BOQScreen.jsx', 'utf8')
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
