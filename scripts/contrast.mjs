/**
 * Contrast calculator.
 *
 * Used to pick accessible replacements for tokens that the visual audit found
 * failing WCAG AA. Rather than eyeball a darker green, this solves for the
 * lightest shade that clears the ratio against its intended partner.
 */
const hex = (h) => {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const srgb = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
export const ratio = (a, b) => {
  const L1 = lum(hex(a));
  const L2 = lum(hex(b));
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
};
const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);

console.log('=== CURRENT (light mode) ===');
const checks = [
  ['primary button label', '#FFFFFF', '#059669', 4.5],
  ['ink-3 on canvas', '#6B7C74', '#F2FBF7', 4.5],
  ['ink-3 on surface', '#6B7C74', '#FFFFFF', 4.5],
  ['ink-2 on canvas', '#3E5C50', '#F2FBF7', 4.5],
  ['ink on canvas', '#052E24', '#F2FBF7', 4.5],
];
checks.forEach(([name, fg, bg, need]) => {
  const r = ratio(fg, bg);
  console.log(`  ${r < need ? 'FAIL' : 'PASS'}  ${name.padEnd(22)} ${fg} on ${bg}  ${fmt(r)} (need ${need})`);
});

console.log('\n=== CANDIDATE PRIMARY GREENS vs white text ===');
// Emerald ramp, darkest first, to find the lightest that still clears 4.5.
['#059669', '#04885E', '#047857', '#036B4C', '#026A43', '#065F46', '#064E3B'].forEach((c) => {
  const r = ratio('#FFFFFF', c);
  console.log(`  ${r >= 4.5 ? 'PASS' : 'fail'}  ${c}  ${fmt(r)}`);
});

console.log('\n=== CANDIDATE ink-3 on canvas #F2FBF7 and on surface #FFFFFF ===');
['#6B7C74', '#5F7169', '#556860', '#4E615A', '#475A52', '#3E5C50'].forEach((c) => {
  const a = ratio(c, '#F2FBF7');
  const b = ratio(c, '#FFFFFF');
  console.log(`  ${a >= 4.5 && b >= 4.5 ? 'PASS' : 'fail'}  ${c}  canvas ${fmt(a)}  surface ${fmt(b)}`);
});

console.log('\n=== DARK MODE check (existing) ===');
[['#7FD1B0', '#052E24', 'ink-3 on dark canvas'], ['#8FE3C2', '#041F19', 'ink-3 on deep canvas']]
  .forEach(([fg, bg, name]) => console.log(`  ${ratio(fg, bg) >= 4.5 ? 'PASS' : 'FAIL'}  ${name.padEnd(24)} ${fg} on ${bg}  ${fmt(ratio(fg, bg))}`));

console.log('\n=== ink-3 #5b8577 actual + candidates ===');
['#5b8577','#4e7a6c','#487469','#437065','#3e6b60','#5F7169'].forEach((c) => {
  const a = ratio(c, '#F2FBF7');
  const b = ratio(c, '#FFFFFF');
  const d = ratio(c, '#d1fae5');
  console.log(`  ${a>=4.5&&b>=4.5?'PASS':'fail'}  ${c}  canvas ${a.toFixed(2)}  surface ${b.toFixed(2)}  accentSoft ${d.toFixed(2)}`);
});
console.log('\n=== dark mode ink-3 #7ba697 on dark canvas ===');
['#7ba697','#8fbfae','#7FB1A0'].forEach((c) => {
  const a = ratio(c, '#052e24');
  const b = ratio(c, '#041f19');
  console.log(`  ${a>=4.5&&b>=4.5?'PASS':'fail'}  ${c}  canvas ${a.toFixed(2)}  deep ${b.toFixed(2)}`);
});
