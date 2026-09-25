/**
 * Encoding audit.
 *
 * Several edits in this session were made with PowerShell Set-Content, which
 * re-encodes UTF-8 files and can corrupt non-ASCII characters (the Naira sign
 * U+20A6, superscript ², en/em dashes) into mojibake. A corrupted Naira sign
 * would silently break every currency assertion, so the whole tree is scanned
 * for replacement characters and known mojibake byte sequences.
 *
 * Usage: node scripts/encoding-audit.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src', 'scripts'];
const EXTS = new Set(['.js', '.jsx', '.mjs', '.json', '.css', '.html']);

// Sequences that only appear when UTF-8 was decoded as Latin-1/CP1252.
const MOJIBAKE = [
  ['â‚¦', 'Naira sign U+20A6'],
  ['â€“', 'en dash U+2013'],
  ['â€”', 'em dash U+2014'],
  ['Â·', 'middle dot U+00B7'],
  ['Â²', 'superscript two U+00B2'],
  ['Ã', 'A-tilde (CP1252 leak)'],
  ['ï»¿', 'BOM leaked into content'],
];

const problems = [];

function walk(dir) {
  if (!existsSync(dir)) return;
  readdirSync(dir).forEach((name) => {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) { walk(p); return; }
    if (!EXTS.has(extname(p))) return;
    // Skip generated/vendored blobs that legitimately hold bytes, not text.
    if (p.includes('noto-sans') || p.includes('brandLogos.generated')) return;

    const text = readFileSync(p, 'utf8');
    MOJIBAKE.forEach(([seq, what]) => {
      let idx = text.indexOf(seq);
      let hits = 0;
      while (idx !== -1 && hits < 5) {
        hits += 1;
        const line = text.slice(0, idx).split('\n').length;
        const ctx = text.slice(Math.max(0, idx - 30), idx + 30).replace(/\n/g, ' ');
        problems.push({ file: p, what, line, ctx });
        idx = text.indexOf(seq, idx + seq.length);
      }
    });

    if (text.includes('\uFFFD')) {
      const line = text.slice(0, text.indexOf('\uFFFD')).split('\n').length;
      problems.push({ file: p, what: 'U+FFFD replacement character', line, ctx: '' });
    }
  });
}

ROOTS.forEach(walk);
['index.html', 'package.json', '.github/workflows/build-apk.yml'].forEach((p) => {
  if (!existsSync(p)) return;
  const text = readFileSync(p, 'utf8');
  MOJIBAKE.forEach(([seq, what]) => {
    if (text.includes(seq)) problems.push({ file: p, what, line: text.slice(0, text.indexOf(seq)).split('\n').length, ctx: '' });
  });
});

console.log(`\n=== ENCODING AUDIT: ${problems.length} problem(s) ===`);
const grouped = new Map();
problems.forEach((pr) => {
  const k = pr.file;
  if (!grouped.has(k)) grouped.set(k, []);
  grouped.get(k).push(pr);
});
grouped.forEach((list, file) => {
  console.log(`\n  ${file}`);
  list.slice(0, 3).forEach((pr) => {
    console.log(`    line ${pr.line}: ${pr.what}`);
    if (pr.ctx) console.log(`      ...${pr.ctx}...`);
  });
  if (list.length > 3) console.log(`    +${list.length - 3} more`);
});

if (!problems.length) console.log('  All files clean: no mojibake, no replacement characters.');
process.exit(problems.length ? 1 : 0);
