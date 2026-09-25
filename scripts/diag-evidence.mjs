/** Root-cause evidence for the two part-1 findings. */
import { APPLIANCES } from '../src/data/catalog/appliances.js';
import { ALL_PRODUCTS, LOAD_PRODUCTS } from '../src/data/catalog/index.js';
import { PARTS } from '../src/data/parts.js';
import { brandsForKind } from '../src/data/brands.js';
import { readFileSync } from 'node:fs';

console.log('--- F1: are the preset ids real appliance ids? ---');
const applianceIds = new Set(APPLIANCES.map((a) => a.id));
['fans', 'bulbs', 'ac15hp', 'cctv_wifi', 'pumping_machine', 'computers'].forEach((id) => {
  console.log(`  ${id.padEnd(18)} in APPLIANCES: ${applianceIds.has(id)}`);
});
console.log('  sample appliance ids:', APPLIANCES.slice(0, 5).map((a) => a.id).join(', '));

// Where do the bare "8:" / "4:" matches come from?
const src = readFileSync('src/data/pricingDefaults.js', 'utf8');
const block = src.slice(src.indexOf('PROFILE_PRESETS'));
const bogus = [...block.matchAll(/(^|[^a-z0-9_])([0-9]+):\s*(\d+)/gm)].slice(0, 4);
console.log('  numeric-key matches (probe artifact if any):',
  bogus.length ? bogus.map((m) => `"${m[2]}:${m[3]}"`).join(' ') : 'none');

console.log('\n--- F2: do appliances carry a brand? ---');
const withBrand = ALL_PRODUCTS.filter((p) => p.kind === 'appliance' && p.brand);
const noBrand = ALL_PRODUCTS.filter((p) => p.kind === 'appliance' && !p.brand);
console.log(`  appliances with brand: ${withBrand.length}, without: ${noBrand.length}`);
const partsNoBrand = PARTS.filter((p) => !p.brand).length;
console.log(`  parts without brand: ${partsNoBrand}`);

console.log('\n--- F2 impact: what the manufacturer tab bar would show per section ---');
['inverter', 'battery', 'panel', 'laptop', 'desktop', 'appliance', 'part'].forEach((kind) => {
  const section = ALL_PRODUCTS.filter((p) => p.kind === kind);
  const groups = brandsForKind(ALL_PRODUCTS, kind);
  const covered = groups.reduce((s, b) => s + b.count, 0);
  console.log(
    `  ${kind.padEnd(10)} section=${String(section.length).padStart(4)} ` +
    `tabs=${String(groups.length).padStart(3)} covered=${String(covered).padStart(4)} ` +
    `${covered < section.length ? '<-- INVISIBLE' : ''}`
  );
});

console.log('\n--- F2: LOAD_PRODUCTS brand coverage (feeds the add-load flow) ---');
const loadNoBrand = LOAD_PRODUCTS.filter((p) => !p.brand);
console.log(`  load products without a brand: ${loadNoBrand.length} of ${LOAD_PRODUCTS.length}`);
console.log('  examples:', loadNoBrand.slice(0, 3).map((p) => p.name).join(' | '));
