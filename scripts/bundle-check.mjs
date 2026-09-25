/** Verifies the SHIPPED bundle, not the source: Naira sign and clean encoding. */
import { readdirSync, readFileSync, existsSync } from 'node:fs';

const assets = readdirSync('dist/assets').filter((n) => /^index-.*\.js$/.test(n));
// The app entry is the largest index chunk; the *.es-* one is jsPDF.
const sizes = assets.map((n) => [n, readFileSync(`dist/assets/${n}`).length]).sort((a, b) => b[1] - a[1]);
const entry = sizes[0][0];
const text = readFileSync(`dist/assets/${entry}`, 'utf8');

const countCp = (cp) => [...text].filter((c) => c.codePointAt(0) === cp).length;

console.log(`\n=== BUNDLE: ${entry} (${(sizes[0][1] / 1024).toFixed(0)} KB) ===`);
console.log(`  U+20A6 Naira sign : ${countCp(0x20a6)}`);
console.log(`  U+2014 em dash    : ${countCp(0x2014)}`);
console.log(`  U+00B2 superscript: ${countCp(0x00b2)}`);
console.log(`  U+FFFD (corrupt)  : ${countCp(0xfffd)}`);

// A CP1252 round trip is detected on the UTF-8 TEXT, not on a latin1 re-read.
// Reading the file as latin1 and pattern-matching bytes is wrong: every
// multi-byte UTF-8 sequence (the Naira sign, an em dash) turns into a
// byte pair that looks like mojibake, which produced a false "PRESENT" here
// even though the bundle was clean.
const corrupt = /[\u00C2\u00C3\u00E2][\u0080-\u00BF\u20AC\u201A\u201D]/.test(text);
console.log(`  CP1252 round-trip : ${corrupt ? 'PRESENT' : 'none'}`);

// Fonts and logos must ship, or currency and brands break on the device.
const brands = existsSync('dist/brands') ? readdirSync('dist/brands').filter((f) => f.endsWith('.svg')) : [];
console.log(`  brand logos shipped: ${brands.length}`);
const fontEmbedded = text.includes('NotoSans') || text.includes('FontFile2');
console.log(`  Naira font embedded: ${fontEmbedded}`);

const ok =
  countCp(0x20a6) > 0 &&
  countCp(0xfffd) === 0 &&
  !corrupt &&
  brands.length > 0 &&
  fontEmbedded;
console.log(`\n  RESULT: ${ok ? 'shippable' : 'PROBLEM'}`);
process.exit(ok ? 0 : 1);
