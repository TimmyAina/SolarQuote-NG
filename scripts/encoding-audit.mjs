/**
 * Encoding audit (codepoint/structural based).
 *
 * Earlier revisions matched LITERAL mojibake strings. That was wrong twice over:
 *   1. It cannot distinguish a genuine corruption from a file that legitimately
 *      contains those characters because it is *documenting* them, and
 *   2. once the corruption is repaired, the detector's own literals stop matching
 *      anything, so a clean tree reported 343 false positives.
 *
 * This matches the STRUCTURAL signature instead. A CP1252 round trip always
 * leaves a lead byte (U+00C2/U+00C3/U+00E2) immediately followed by a character
 * CP1252 placed in the C1 range or the Latin-1 supplement. Real prose never has
 * that adjacency, whatever the console happens to render.
 *
 * A U+FEFF anywhere other than byte 0 is also corruption: PowerShell's
 * `-Encoding UTF8` writes one and it leaked into file bodies.
 *
 * Usage: node scripts/encoding-audit.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src', 'scripts'];
const EXTRA = ['index.html', 'package.json', '.github/workflows/build-apk.yml'];
const EXTS = new Set(['.js', '.jsx', '.mjs', '.json', '.css', '.html', '.yml']);

// Characters CP1252 puts in the C1 range / Latin-1 supplement for bytes that
// actually belong to multi-byte UTF-8 sequences.
const CP1252_TAIL = '\\u0080-\\u00BF\\u20AC\\u201A\\u0192\\u2122\\u0153\\u017D\\u0161\\u201E';
const CP1252_PAIR = new RegExp(`[\\u00C2\\u00C3\\u00E2][${CP1252_TAIL}]`);

const problems = [];

function scan(file, text) {
  const m = CP1252_PAIR.exec(text);
  if (m) {
    problems.push({
      file,
      line: text.slice(0, m.index).split('\n').length,
      what: 'CP1252 round-trip sequence',
      ctx: text.slice(Math.max(0, m.index - 25), m.index + 25).replace(/\r?\n/g, ' '),
    });
  }
  const r = text.indexOf('\uFFFD');
  if (r !== -1) {
    problems.push({
      file, line: text.slice(0, r).split('\n').length,
      what: 'U+FFFD replacement character', ctx: '',
    });
  }
  // A BOM is only valid as the very first character.
  const bomAt = text.indexOf('\uFEFF');
  if (bomAt > 0) {
    problems.push({
      file, line: text.slice(0, bomAt).split('\n').length,
      what: 'stray U+FEFF inside content', ctx: '',
    });
  }
}

const walk = (dir) => {
  if (!existsSync(dir)) return;
  readdirSync(dir).forEach((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); return; }
    if (!EXTS.has(extname(p))) return;
    // Generated blobs hold bytes rather than prose.
    if (p.includes('noto-sans-subset') || p.includes('brandLogos.generated')) return;
    scan(p, readFileSync(p, 'utf8'));
  });
};
ROOTS.forEach(walk);
EXTRA.forEach((p) => { if (existsSync(p)) scan(p, readFileSync(p, 'utf8')); });

console.log(`\n=== ENCODING AUDIT: ${problems.length} problem(s) ===`);
if (!problems.length) {
  console.log('  Clean: no CP1252 round-trips, no U+FFFD, no stray BOMs.');
} else {
  const grouped = new Map();
  problems.forEach((pr) => {
    if (!grouped.has(pr.file)) grouped.set(pr.file, []);
    grouped.get(pr.file).push(pr);
  });
  grouped.forEach((list, file) => {
    console.log(`\n  ${file}`);
    list.slice(0, 3).forEach((pr) => {
      console.log(`    line ${pr.line}: ${pr.what}`);
      if (pr.ctx) console.log(`      ...${pr.ctx}...`);
    });
    if (list.length > 3) console.log(`    +${list.length - 3} more`);
  });
}
process.exit(problems.length ? 1 : 0);
