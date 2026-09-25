/** Why does repair() bail on a known-corrupt file? Instrument the decision. */
import { readFileSync } from 'node:fs';

const CP1252 = (() => {
  const dec = new TextDecoder('windows-1252');
  const t = new Map();
  for (let b = 0; b <= 0xff; b += 1) {
    const ch = dec.decode(new Uint8Array([b]));
    if (ch !== '\uFFFD' && !t.has(ch)) t.set(ch, b);
  }
  return t;
})();

const FILES = [
  'src/components/ProductEditor.jsx',
  'src/components/BOQScreen.jsx',
  'src/components/WalletScreen.jsx',
  'src/data/catalog/panels.js',
  'src/data/parts.js',
  'src/utils/pdfGenerator.js',
];

FILES.forEach((f) => {
  const text = readFileSync(f, 'utf8');
  const blockedBy = [];
  for (const ch of text) {
    if (CP1252.get(ch) === undefined) blockedBy.push('U+' + ch.codePointAt(0).toString(16).toUpperCase());
  }
  const uniq = [...new Set(blockedBy)];
  console.log(`\n${f}`);
  console.log(`  chars lacking a CP1252 byte: ${uniq.length ? uniq.join(' ') : 'none'}`);
  if (uniq.length) {
    // Show one offending context.
    const ch = String.fromCodePoint(parseInt(uniq[0].slice(2), 16));
    const i = text.indexOf(ch);
    const seg = text.slice(Math.max(0, i - 25), i + 25);
    console.log(`  context: ${JSON.stringify(seg)}`);
    console.log(`  cps: ${[...seg].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ')}`);
  }
});
