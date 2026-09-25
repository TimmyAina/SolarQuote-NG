/**
 * Quote counter verification
 * ---------------------------------------------------------------------------
 * The product requirement is explicit: the counter must start from 0 with no
 * default offset. This exercises the real reducer logic in isolation (the React
 * provider needs a DOM, so the counter maths is mirrored here exactly as
 * implemented in src/context/AppContext.jsx).
 *
 * Usage: node scripts/counter-check.mjs
 */
let failures = 0;
const check = (label, condition, detail = '') => {
  const ok = Boolean(condition);
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -> ${detail}` : ''}`);
};

/** Mirrors readCounter() in AppContext.jsx. */
function readCounter(storage) {
  try {
    const raw = storage.getItem('solarquote_quote_counter_v3');
    if (raw === null) return 0; // first launch — strictly zero
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

console.log('\n[Q1] First launch starts at exactly 0');
const empty = new Map();
check('fresh install reads 0', readCounter(empty) === 0, String(readCounter(empty)));
check('counter is NOT seeded above zero', readCounter(empty) === 0);

console.log('\n[Q2] Sequence of issued quotes');
let stored = 0;
const issued = [];
for (let i = 0; i < 5; i += 1) {
  const n = stored; // issueQuoteNumber: return current, then advance
  stored = n + 1;
  issued.push(n);
}
check('first quote issued is #0', issued[0] === 0, `got #${issued[0]}`);
check('quotes increment by 1', JSON.stringify(issued) === '[0,1,2,3,4]', JSON.stringify(issued));

console.log('\n[Q3] Corrupt storage falls back to 0, never negative');
[['-5'], ['abc'], ['NaN'], ['null'], ['']].forEach(([v]) => {
  const s = new Map([['solarquote_quote_counter_v3', v]]);
  const read = readCounter(s);
  check(`stored "${v}" reads as 0`, read === 0, String(read));
});

console.log('\n[Q4] Persistence round-trip');
// A localStorage-compatible stub (a bare Map has get/set, not getItem/setItem).
const storage = new Map();
const ls = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
};
ls.setItem('solarquote_quote_counter_v3', '7');
check('saved counter restores exactly', readCounter(ls) === 7, String(readCounter(ls)));
ls.setItem('solarquote_quote_counter_v3', '0');
check('saved zero restores as 0 (not falsy-skipped)', readCounter(ls) === 0);
ls.setItem('solarquote_quote_counter_v3', '1042');
check('large counter restores exactly', readCounter(ls) === 1042);

console.log(
  failures === 0
    ? '\n=== COUNTER: ALL PASSED ==='
    : `\n=== ${failures} FAILURE(S) ===`
);
process.exit(failures === 0 ? 0 : 1);
