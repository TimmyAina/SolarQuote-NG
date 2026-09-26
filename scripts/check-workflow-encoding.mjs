/**
 * Validates the release workflow before it can break a release.
 *
 * Guards three things: the YAML block scalar is still well formed, the notes
 * users will actually read carry no CP1252 corruption, and the notes describe
 * THIS release rather than the previous one.
 */
import { readFileSync } from 'node:fs';

const f = '.github/workflows/build-apk.yml';
const t = readFileSync(f, 'utf8');
const lines = t.split('\n');

let fails = 0;
const check = (label, cond, extra = '') => {
  if (!cond) fails += 1;
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? ` -> ${extra}` : ''}`);
};

// A real corruption is U+00E2 followed by a CP1252 continuation byte.
const moji = lines.filter((l) => /\u00e2[\u0080-\u00bf\u2000-\u20ff]/.test(l));
check('no CP1252 corruption in release notes', moji.length === 0, `${moji.length} line(s)`);
check('no replacement characters', !t.includes('\uFFFD'));

const bodyIdx = lines.findIndex((l) => /^\s+body: \|\s*$/.test(l));
check('release body literal present', bodyIdx !== -1, `line ${bodyIdx + 1}`);

if (bodyIdx !== -1) {
  const indentOf = (l) => (l.match(/^\s*/) || [''])[0].length;
  const bodyIndent = indentOf(lines[bodyIdx]);
  // The block ends at the first non-blank line indented at or below the marker.
  const end = lines.findIndex(
    (l, i) => i > bodyIdx && l.trim() && indentOf(l) <= bodyIndent
  );
  const body = lines.slice(bodyIdx + 1, end === -1 ? lines.length : end);
  const text = body.join('\n');

  check('body is non-trivial', body.length > 20, `${body.length} lines`);
  check('every body line is indented', body.every((l) => !l.trim() || indentOf(l) > bodyIndent));
  check('body mentions the version', text.includes('v0.2.1'));
  check('body has a Fixed section', /###\s*Fixed/.test(text));
  check('body has a New section', /###\s*New/.test(text));
  // The notes must describe THIS release, not the wallet release before it.
  check('notes are not the previous release text', !text.includes('Pay-As-You-Go at'));
  check('notes mention the preset fix', /presets sized the system to zero/i.test(text));
  check('block scalar was not truncated', end !== -1, `ends before line ${end + 1}`);
}

check('tag_name is v0.2.1', /tag_name:\s*v0\.2\.1/.test(t));
check('APK is attached to the release', /files: \|/.test(t) && /app-release\.apk/.test(t));
// The condition is `github.ref == 'refs/heads/main' || ...` — note the
// alternation binds loosely, so the two refs are checked separately.
check(
  'release gated to the default branch',
  /github\.ref == 'refs\/heads\/main'/.test(t) && /github\.ref == 'refs\/heads\/master'/.test(t)
);

console.log(fails ? `\n=== WORKFLOW: ${fails} PROBLEM(S) ===` : '\n=== WORKFLOW OK ===');
process.exit(fails ? 1 : 0);
