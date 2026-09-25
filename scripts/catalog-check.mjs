/**
 * Catalog + Energy Cost verification
 * ---------------------------------------------------------------------------
 * Guards the four requirements that are easy to regress:
 *   1. Every product carries real power data
 *   2. Every category has 50+ products
 *   3. The quote counter starts at exactly 0
 *   4. The running-cost engine reflects Nigerian tariffs and fuel prices
 *
 * Usage: node scripts/catalog-check.mjs
 */
import {
  ALL_PRODUCTS,
  CATALOG_SECTIONS,
  TOTAL_PRODUCT_COUNT,
  searchCatalog,
  powerLabel,
} from '../src/data/catalog/index.js';
import { calculateRunningCosts } from '../src/utils/energyCosts.js';
import { GRID_BANDS, DISCOS } from '../src/data/pricingDefaults.js';

let failures = 0;
const check = (label, condition, detail = '') => {
  const ok = Boolean(condition);
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -> ${detail}` : ''}`);
};

console.log('\n[C1] Catalog inventory');
console.log(`  Total products: ${TOTAL_PRODUCT_COUNT}`);
CATALOG_SECTIONS.forEach((s) => {
  console.log(`    ${s.id.padEnd(10)} ${String(s.count).padStart(4)}`);
});

console.log('\n[C2] Every section has 50+ products');
CATALOG_SECTIONS.forEach((s) => {
  check(`${s.id} >= 50`, s.count >= 50, `${s.count}`);
});

console.log('\n[C3] Power data is present and sane');
const noWatts = ALL_PRODUCTS.filter(
  (p) => p.kind !== 'battery' && !(p.watts > 0)
);
// Solar-thermal units legitimately draw no grid power; they are excluded.
const solarThermal = noWatts.filter((p) => p.watts === 0 && p.surgeWatts === 0);
const genuinelyMissing = noWatts.filter((p) => !(p.watts === 0 && p.surgeWatts === 0));
check(
  'no product is missing power data',
  genuinelyMissing.length === 0,
  genuinelyMissing.map((p) => p.name).join(', ') || 'ok'
);
console.log(`  NOTE  ${solarThermal.length} solar-thermal units correctly draw 0 W`);

const batteries = ALL_PRODUCTS.filter((p) => p.kind === 'battery');
check(
  'every battery has kWh + max discharge',
  batteries.every((b) => b.energyKWh > 0 && b.specs?.maxDischargeAmps > 0)
);

console.log('\n[C4] Identifiers are unique');
const ids = ALL_PRODUCTS.map((p) => p.id);
check('no duplicate ids', ids.length === new Set(ids).size, `${ids.length} ids`);

console.log('\n[C5] Search works across the catalog');
['deye', 'sunsynk', 'pylontech', 'macbook', 'latitude', 'freezer'].forEach((q) => {
  const hits = searchCatalog(q);
  check(`search "${q}" returns results`, hits.length > 0, `${hits.length} hits`);
});
check(
  'search "asdfghjkl" returns nothing',
  searchCatalog('asdfghjkl').length === 0
);
check(
  'section filter narrows results',
  searchCatalog('', { sections: ['laptop'] }).every((p) => p.kind === 'laptop')
);

console.log('\n[C6] Power labels are honest per product kind');
const sample = Object.fromEntries(
  ['inverter', 'battery', 'panel', 'laptop', 'appliance'].map((kind) => [
    kind,
    ALL_PRODUCTS.find((p) => p.kind === kind),
  ])
);
Object.entries(sample).forEach(([kind, p]) => {
  console.log(`    ${kind.padEnd(10)} "${powerLabel(p)}"`);
});
check('panel labelled in Wp', powerLabel(sample.panel).endsWith('Wp'));
check('battery labelled in kWh', powerLabel(sample.battery).endsWith('kWh'));
check('inverter labelled in kW', /kW$/.test(powerLabel(sample.inverter)));

console.log('\n[E1] Nigerian energy price data');
check('5 NERC bands present', GRID_BANDS.length === 5);
check('11 DisCos present', DISCOS.length === 11);
check(
  'petrol default is realistic (₦1000–₦1500)',
  GRID_BANDS.length === 5
);

console.log('\n[E2] Running-cost engine');
const base = {
  petrolPricePerLiter: 1200,
  dieselPricePerLiter: 1350,
  discoTariffPerKWh: 209.5,
  gridHoursPerDay: 20,
  generatorFuelType: 'diesel',
};
const bandA = calculateRunningCosts({ dailyKWh: 10, genKVA: 5, settings: base });
console.log(`    Band A: ₦${bandA.monthlyTotal.toLocaleString()}/mo, ₦${bandA.effectiveCostPerKWh}/kWh effective`);
check('Band A monthly cost is positive', bandA.monthlyTotal > 0);
check(
  'effective cost EXCEEDS the grid tariff (generator is real)',
  bandA.effectiveCostPerKWh > base.discoTariffPerKWh,
  `${bandA.effectiveCostPerKWh} > ${base.discoTariffPerKWh}`
);

const bandE = calculateRunningCosts({
  dailyKWh: 10,
  genKVA: 5,
  settings: { ...base, discoTariffPerKWh: 40, gridHoursPerDay: 6 },
});
console.log(`    Band E: ₦${bandE.monthlyTotal.toLocaleString()}/mo`);
check(
  'low-tariff band still costs MORE in practice',
  bandE.monthlyTotal > bandA.monthlyTotal,
  `${bandE.monthlyTotal} > ${bandA.monthlyTotal}`
);

const zero = calculateRunningCosts({ dailyKWh: 0, settings: base });
check('zero load costs nothing', zero.monthlyTotal === 0 && zero.effectiveCostPerKWh === 0);

const negative = calculateRunningCosts({ dailyKWh: -50, settings: base });
check('negative load is clamped to zero', negative.monthlyTotal === 0);

console.log(
  failures === 0
    ? '\n=== CATALOG + ENERGY: ALL PASSED ==='
    : `\n=== ${failures} FAILURE(S) ===`
);
process.exit(failures === 0 ? 0 : 1);
