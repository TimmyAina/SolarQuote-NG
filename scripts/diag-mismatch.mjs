/** Investigates the "395 vs 438" mismatch and the empty Generic tab glyph. */
import { ALL_PRODUCTS, TOTAL_PRODUCT_COUNT, searchCatalog } from '../src/data/catalog/index.js';
import { LOAD_PRODUCTS } from '../src/data/catalog/index.js';
import { groupingFor } from '../src/data/brands.js';

console.log('=== Where do 395 and 438 come from? ===');
console.log(`  TOTAL_PRODUCT_COUNT        = ${TOTAL_PRODUCT_COUNT}`);
console.log(`  ALL_PRODUCTS.length        = ${ALL_PRODUCTS.length}`);
console.log(`  searchCatalog('').length    = ${searchCatalog('').length}`);
console.log(`  LOAD_PRODUCTS.length       = ${LOAD_PRODUCTS.length}`);
console.log(`  sum of section counts      = ${(await import('../src/data/catalog/index.js')).CATALOG_SECTIONS.reduce((s, x) => s + x.count, 0)}`);

const byKind = {};
ALL_PRODUCTS.forEach((p) => { byKind[p.kind] = (byKind[p.kind] || 0) + 1; });
console.log(`  by kind: ${JSON.stringify(byKind)}`);

console.log('\n=== Duplicates inflating the search result set? ===');
const seen = new Map();
ALL_PRODUCTS.forEach((p) => {
  const key = `${p.kind}|${p.name}|${p.brand}`;
  seen.set(key, (seen.get(key) || 0) + 1);
});
const dups = [...seen.entries()].filter(([, n]) => n > 1);
console.log(`  exact duplicate name+brand rows: ${dups.length}`);
dups.slice(0, 5).forEach(([k, n]) => console.log(`    x${n}  ${k}`));

const idSeen = new Set();
let idDupes = 0;
ALL_PRODUCTS.forEach((p) => { if (idSeen.has(p.id)) idDupes += 1; idSeen.add(p.id); });
console.log(`  duplicate ids: ${idDupes}`);
console.log(`  unique ids: ${idSeen.size}  ->  ${ALL_PRODUCTS.length} rows`);

console.log('\n=== The "Generic" tab glyph ===');
const groups = groupingFor(ALL_PRODUCTS, 'desktop');
groups.slice(0, 4).forEach((g) => {
  console.log(`  key=${String(g.name).padEnd(12)} label=${String(g.label).padEnd(12)} isCategory=${!!g.isCategory} logo=${g.logo}`);
});
console.log('  -> a brand group named "Generic" has no CATEGORY_ICON entry, so its');
console.log('     mark renders an empty square. Confirms the screenshot.');
