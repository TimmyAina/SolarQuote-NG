/**
 * Encoding repair.
 *
 * Fixes the mojibake that PowerShell Set-Content introduced: UTF-8 bytes that
 * were decoded as CP1252/Latin-1 and written back, turning the Naira sign into
 * "Ã¢â€šÂ¦", em dashes into "Ã¢â‚¬â€", and so on.
 *
 * The repair is a straight round-trip: mojibake text is the result of
 * encoding UTF-8 bytes as Latin-1, so decoding that Latin-1 back to bytes and
 * re-reading them as UTF-8 restores the original characters. It is applied only
 * where the result is actually valid UTF-8 and contains no replacement chars, so
 * clean files are never touched.
 *
 * Also strips a UTF-8 BOM that leaked into a file's first line.
 *
 * Usage: node scripts/fix-encoding.mjs [--check]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const CHECK_ONLY = process.argv.includes('--check');
const ROOTS = ['src', 'scripts'];
const EXTRA = ['index.html', 'package.json', '.github/workflows/build-apk.yml'];
const EXTS = new Set(['.js', '.jsx', '.mjs', '.json', '.css', '.html', '.yml']);

/**
 * True when the text shows a CP1252 round-trip signature.
 *
 * The reliable signals are the byte pairs that decode back to a multi-byte
 * UTF-8 lead/continuation. Listing the stray Latin-1 characters themselves
 * (â, Â, Ã) is unreliable — those code points are legitimate in real text, so
 * matching them alone produced both false negatives and false positives. Only
 * the paired sequences are diagnostic.
 */
function looksMojibake(s) {
  return /[\u00C2\u00C3\u00E2][\u0080-\u20AC]|[\u00C3][\u00AF\u00BF]/.test(s);
}

/**
 * Builds a CP1252 char -> byte table.
 *
 * The corruption is specifically CP1252 (the Windows ANSI codepage), NOT Latin-1.
 * The Naira sign's UTF-8 bytes are E2 82 A6; mis-decoded as CP1252 they become
 * U+00E2 U+201A U+00A6. U+201A is above 0xFF, so `Buffer.from(text, 'latin1')`
 * cannot reverse the mapping and silently mangles the fix. WHATWG ships a
 * CP1252 decoder; the encoder is simply its inverse.
 */
const CP1252 = (() => {
  const dec = new TextDecoder('windows-1252');
  const table = new Map();
  for (let b = 0; b <= 0xff; b += 1) {
    const ch = dec.decode(new Uint8Array([b]));
    if (ch !== '\uFFFD' && !table.has(ch)) table.set(ch, b);
  }
  return table;
})();

/**
 * Undoes one round of UTF-8-as-Latin-1 corruption.
 * Returns null when the repair would not produce clean UTF-8.
 */
function repair(text) {
  if (!looksMojibake(text)) return null;
  // Buffer holds the bytes of the mis-decoded text; read them as UTF-8.
  const bytes = [];
  for (const ch of text) {
    const b = CP1252.get(ch);
    // A char with no CP1252 byte means this is not a CP1252 mis-decode.
    if (b === undefined) return null;
    bytes.push(b);
  }
  const fixed = Buffer.from(bytes).toString('utf8');
  // A valid repair must not introduce replacement characters.
  if (fixed.includes('\uFFFD')) return null;
  return fixed;
}

const files = [];
const walk = (dir) => {
  if (!existsSync(dir)) return;
  readdirSync(dir).forEach((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); return; }
    if (!EXTS.has(extname(p))) return;
    if (p.includes('noto-sans') || p.includes('brandLogos.generated')) return;
    files.push(p);
  });
};
ROOTS.forEach(walk);
EXTRA.forEach((p) => { if (existsSync(p)) files.push(p); });

let fixedFiles = 0;
let fixedBytes = 0;

files.forEach((p) => {
  const original = readFileSync(p, 'utf8');
  let text = original;

  // Strip a BOM. PowerShell's `-Encoding UTF8` writes a real U+FEFF, and some
  // of those landed INSIDE the content rather than at the file start (a previous
  // repair had already turned the first one into the mojibake "ï¿¿"). Both forms
  // must go, and the removal has to happen before the CP1252 pass, because
  // U+FEFF has no CP1252 byte and would otherwise abort the whole file.
  text = text.replace(/\uFEFF/g, '').split('ï»¿').join('').split('ï»¿').join('');

  // Repair repeatedly: some characters went through more than one round.
  for (let i = 0; i < 4; i += 1) {
    const next = repair(text);
    if (next === null || next === text) break;
    text = next;
  }

  if (text !== original) {
    if (!CHECK_ONLY) {
      // Write UTF-8 with no BOM, preserving Unix line endings.
      writeFileSync(p, text, { encoding: 'utf8' });
    }
    fixedFiles += 1;
    fixedBytes += Math.abs(text.length - original.length);
    console.log(`  ${CHECK_ONLY ? 'WOULD FIX' : 'fixed'}  ${p}`);
  }
});

console.log(
  CHECK_ONLY
    ? `\n=== ENCODING: ${fixedFiles} file(s) need repair ===`
    : `\n=== ENCODING: repaired ${fixedFiles} file(s) ===`
);
process.exit(CHECK_ONLY && fixedFiles ? 1 : 0);
