/**
 * Encoding repair.
 *
 * Fixes the corruption PowerShell's Set-Content introduced: UTF-8 bytes that
 * were decoded as CP1252 and written back. The Naira sign (U+20A6) and every
 * em dash in the tree were mangled this way, so user-facing currency and
 * spec text rendered as garbage in the UI and the exported PDF.
 *
 * The repair is a round trip. Mojibake is the result of decoding UTF-8 bytes as
 * CP1252, so re-encoding that text back to its CP1252 bytes and reading those
 * as UTF-8 restores the original characters. It is applied ONLY to maximal runs
 * that match the round-trip signature, and only where the result decodes cleanly
 * and actually differs, so correct characters in a mixed file are preserved.
 *
 * Also strips a UTF-8 BOM. PowerShell's `-Encoding UTF8` writes one, and some
 * landed inside file bodies rather than at the start.
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
 * This MUST stay in step with encoding-audit.mjs. Matching the stray Latin-1
 * characters themselves (â, Â, Ã) is unreliable — those code points are legal in
 * real text, so that produced both misses and false positives. The structural
 * signal is a CP1252 lead byte immediately followed by the character CP1252
 * placed in the C1 range or the Latin-1 supplement.
 */
const CP1252_TAIL = '\\u0080-\\u00BF\\u20AC\\u201A\\u0192\\u2122\\u0153\\u017D\\u0161\\u201E';
const MOJIBAKE_RE = new RegExp(`[\\u00C2\\u00C3\\u00E2][${CP1252_TAIL}]`);

function looksMojibake(s) {
  return MOJIBAKE_RE.test(s);
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
/**
 * Undoes one round of UTF-8-as-CP1252 corruption, SELECTIVELY.
 *
 * The naive version re-encoded the WHOLE file and bailed if the result held a
 * U+FFFD. That fails on a MIXED file: some characters are genuinely corrupt
 * (U+00C2 U+00B7, a mis-decoded middle dot) while others are already correct (a
 * real U+00B7 typed in the source). Re-encoding a correct U+00B7 as CP1252 gives
 * the lone byte 0xB7, which is not valid UTF-8 alone, so the whole repair was
 * rejected and the real corruption survived.
 *
 * The repair therefore applies to CORRUPT RUNS ONLY: maximal stretches matching
 * the mojibake signature. Correct characters pass through untouched, so a file
 * containing a valid U+00B7 keeps it.
 *
 * Returns null when there was nothing to repair.
 */
function repair(text) {
  if (!MOJIBAKE_RE.test(text)) return null;

  // Characters CP1252 can produce in place of a multi-byte UTF-8 sequence.
  //
  // This must cover BOTH parts of a round trip: the lead byte (U+00C2/U+00C3/
  // U+00E2) and the tail CP1252 relocated. Getting this wrong silently splits a
  // corrupt run in two, so the repair lands on fragments that decode to U+FFFD
  // and get rejected — which is exactly why an earlier version reported
  // "repaired" while the corruption survived. The tail range is 0x80-0xBF plus
  // the named CP1252 specials; 0xA0-0xBF (·, ¦, ²) matters as much as 0x80-0x9F,
  // and the quote/dash family (U+201D, U+201E, U+201C) completes an em dash.
  const isCorrupt = (ch) => {
    const c = ch.codePointAt(0);
    return (
      (c >= 0xc2 && c <= 0xe2) ||
      (c >= 0x80 && c <= 0xbf) ||
      c === 0x20ac || c === 0x201a || c === 0x0192 || c === 0x2122 ||
      c === 0x0153 || c === 0x017d || c === 0x0161 ||
      c === 0x201e || c === 0x201d || c === 0x201c
    );
  };

  const out = [];
  let run = [];
  let repairedAny = false;

  const flush = () => {
    if (!run.length) return;
    const original = run.join('');
    const bytes = run.map((ch) => CP1252.get(ch));
    const candidate = Buffer.from(bytes).toString('utf8');
    // Accept only if it decodes cleanly AND actually changed something.
    if (!candidate.includes('\uFFFD') && candidate !== original) {
      out.push(candidate);
      repairedAny = true;
    } else {
      out.push(original);
    }
    run = [];
  };

  for (const ch of text) {
    if (isCorrupt(ch)) run.push(ch);
    else { flush(); out.push(ch); }
  }
  flush();

  return repairedAny ? out.join('') : null;
}

const files = [];
const walk = (dir) => {
  if (!existsSync(dir)) return;
  readdirSync(dir).forEach((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); return; }
    if (!EXTS.has(extname(p))) return;
    if (p.includes('noto-sans-subset') || p.includes('brandLogos.generated')) return;
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
  text = text.replace(/\uFEFF/g, '').split('').join('').split('').join('');

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
