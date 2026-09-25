/**
 * Ground truth: verify by CODEPOINT, never by rendered glyphs.
 *
 * The PowerShell console renders UTF-8 through a legacy codepage, so a correct
 * U+20A6 displays as "Ã¢â€šÂ¦" on screen. Judging encoding by reading console
 * output is therefore unreliable — the earlier audit was misled by its own
 * display layer. Codepoints read from disk are the only trustworthy signal.
 */
import { readFileSync } from 'node:fs';

const cps = (s) =>
  [...s].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');

const FILES = [
  'src/components/ProductEditor.jsx',
  'src/components/BOQScreen.jsx',
  'src/components/WalletScreen.jsx',
  'src/components/ManufacturerTabs.jsx',
  'src/data/catalog/batteries.js',
  'src/data/catalog/panels.js',
  'src/data/parts.js',
  'src/data/userCatalog.js',
  'src/utils/pdfGenerator.js',
  'src/utils/calculations.js',
  'src/data/pricingDefaults.js',
  'src/data/presetAliases.js',
  'scripts/catalog-check.mjs',
];

// Characters the app genuinely uses.
const WANT = {
  NAIRA: '\u20A6', EMDASH: '\u2014', ENDASH: '\u2013', MIDDOT: '\u00B7', SUP2: '\u00B2',
};
// Tell-tale byte sequences of a CP1252 round trip.
const BAD = ['\u00E2\u201A', '\u00C3\u00A2', '\u00C2\u00A6', '\u00E2\u20AC', '\u00C2\u00B7', '\u00C3\u00AF'];

let totalBad = 0;
FILES.forEach((f) => {
  let text;
  try { text = readFileSync(f, 'utf8'); } catch { return; }
  const bad = BAD.filter((b) => text.includes(b));
  const good = Object.entries(WANT).filter(([, ch]) => text.includes(ch)).map(([k]) => k);
  totalBad += bad.length;
  console.log(`\n${f}`);
  console.log(`  good chars: ${good.length ? good.join(', ') : 'none'}`);
  console.log(`  CORRUPT:    ${bad.length ? bad.map((b) => [...b].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase()).join('+')).join('  ') : 'none'}`);
  const i = text.indexOf(WANT.NAIRA);
  if (i !== -1) console.log(`  naira @${i}: ${cps(text.slice(i - 6, i + 6))}`);
});

console.log(`\n=== files with corrupt sequences: ${totalBad === 0 ? 'NONE' : totalBad} ===`);
