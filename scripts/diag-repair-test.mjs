/** Does the CP1252 repair actually work on the known-bad sequence? */
import { TextDecoder } from 'node:util';

const CP1252 = (() => {
  const dec = new TextDecoder('windows-1252');
  const table = new Map();
  for (let b = 0; b <= 0xff; b += 1) {
    const ch = dec.decode(new Uint8Array([b]));
    if (ch !== '\uFFFD' && !table.has(ch)) table.set(ch, b);
  }
  return table;
})();

// Build the exact corrupted string the earlier probe observed.
const bad = 'Your price (\u00E2\u201A\u00A6)';
console.log('corrupt string codepoints:', [...bad].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' '));

const bytes = [];
let failed = null;
for (const ch of bad) {
  const b = CP1252.get(ch);
  if (b === undefined) { failed = ch; break; }
  bytes.push(b);
}
console.log('chars with no CP1252 byte:', failed ? `U+${failed.codePointAt(0).toString(16).toUpperCase()}` : 'none');
const fixed = Buffer.from(bytes).toString('utf8');
console.log('repaired:', fixed);
console.log('has real Naira:', fixed.includes('\u20A6'));

// Also verify a real file: does the CURRENT ProductEditor.jsx still hold the bug,
// and can repair fix that exact text?
const { readFileSync } = await import('node:fs');
const text = readFileSync('src/components/ProductEditor.jsx', 'utf8');
const i = text.indexOf('Your price (');
const seg = text.slice(i, i + 14);
console.log('\nfile segment:', seg);
console.log('file codepoints:', [...seg].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' '));
const segBytes = [];
let segFail = null;
for (const ch of seg) {
  const b = CP1252.get(ch);
  if (b === undefined) { segFail = ch; break; }
  segBytes.push(b);
}
console.log('segment repair blocked by:', segFail ? `U+${segFail.codePointAt(0).toString(16).toUpperCase()}` : 'nothing');
if (!segFail) {
  const sf = Buffer.from(segBytes).toString('utf8');
  console.log('segment repaired:', sf, '| has Naira:', sf.includes('\u20A6'));
}
