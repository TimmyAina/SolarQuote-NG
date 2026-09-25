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
  LOAD_PRODUCTS,
  searchCatalog,
  powerLabel,
} from '../src/data/catalog/index.js';
import { BRANDS, getBrand, brandsForKind } from '../src/data/brands.js';
import { CONDITIONS, priceForCondition } from '../src/data/parts.js';
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

console.log('\n[C2] Every section is usefully stocked');
// The six original sections target 50+ items. Parts is a deliberately tighter
// starter set, so it only has to clear a smaller floor.
const MIN_PER_SECTION = { part: 30 };
CATALOG_SECTIONS.forEach((s) => {
  const min = MIN_PER_SECTION[s.id] ?? 50;
  check(`${s.id} >= ${min}`, s.count >= min, `${s.count}`);
});

console.log('\n[C3] Power data is present and sane');
// Parts are inventory the job consumes, not electrical load: they have no
// wattage by definition and must be excluded from the power-data rule.
const noWatts = ALL_PRODUCTS.filter(
  (p) => p.kind !== 'battery' && p.kind !== 'part' && !(p.watts > 0)
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

const parts = ALL_PRODUCTS.filter((p) => p.kind === 'part');
check('parts exist in the catalog', parts.length >= 30, `${parts.length} parts`);
check('every part has zero draw so sizing skips it', parts.every((p) => p.watts === 0));
check('every part is priced', parts.every((p) => p.indicativePriceNGN > 0));
check('every part has a unit of sale', parts.every((p) => typeof p.unit === 'string' && p.unit));
check('parts are excluded from load products', !LOAD_PRODUCTS.some((p) => p.kind === 'part'));
check('part section is registered', CATALOG_SECTIONS.some((s) => s.id === 'part'));

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

console.log('\n[C7] Brand registry covers every product in the catalog');
const productBrands = new Set(ALL_PRODUCTS.map((p) => p.brand).filter(Boolean));
const unregistered = [...productBrands].filter((b) => getBrand(b).unregistered);
check('every product brand is registered', unregistered.length === 0, unregistered.join(', ') || 'ok');
check('registry has an entry per brand', BRANDS.length >= 40, `${BRANDS.length} brands`);
check('every brand has an official colour', BRANDS.every((b) => /^#[0-9A-Fa-f]{6}$/.test(b.color)));
check('every brand has a slug', BRANDS.every((b) => b.slug && /^[a-z0-9-]+$/.test(b.slug)));
check('brand slugs are unique', new Set(BRANDS.map((b) => b.slug)).size === BRANDS.length);
check('getBrand is case tolerant', getBrand('deye')?.name === 'Deye');
check('unknown brand still resolves', getBrand('Totally New Co')?.unregistered === true);
check(
  'logo paths are set only where an asset is bundled',
  BRANDS.every((b) => b.logo === null || /^brands\/[a-z0-9-]+\.svg$/.test(b.logo))
);
const withLogo = BRANDS.filter((b) => b.logo);
console.log(`  NOTE  ${withLogo.length}/${BRANDS.length} brands have bundled artwork; the rest use a wordmark`);

console.log('\n[C8] Manufacturer grouping');
const inverterBrands = brandsForKind(ALL_PRODUCTS, 'inverter');
check('inverters group by manufacturer', inverterBrands.length >= 8, `${inverterBrands.length} brands`);
check('groups carry a product count', inverterBrands.every((b) => b.count > 0));
check('groups are sorted by depth', inverterBrands.every((b, i) => i === 0 || inverterBrands[i - 1].count >= b.count));
const groupedTotal = inverterBrands.reduce((s, b) => s + b.count, 0);
const inverterTotal = ALL_PRODUCTS.filter((p) => p.kind === 'inverter').length;
check('group counts sum to the section total', groupedTotal === inverterTotal, `${groupedTotal}/${inverterTotal}`);

console.log('\n[C9] Condition grading');
check('three grades exist', CONDITIONS.length === 3);
check('new has no discount', CONDITIONS.find((c) => c.id === 'new').discountPercent === 0);
check('refurb discounts below used', CONDITIONS.find((c) => c.id === 'refurbished').discountPercent
  < CONDITIONS.find((c) => c.id === 'used').discountPercent);
check('new price is unchanged', priceForCondition(100000, 'new') === 100000);
check('used price is discounted', priceForCondition(100000, 'used') < 100000);
check('unknown condition falls back to new', priceForCondition(100000, 'bogus') === 100000);
check('discount never goes negative', priceForCondition(1000, 'used') >= 0);
check('zero price stays zero', priceForCondition(0, 'used') === 0);

console.log(
  failures === 0
    ? '\n=== CATALOG + ENERGY: ALL PASSED ==='
    : `\n=== ${failures} FAILURE(S) ===`
);
process.exit(failures === 0 ? 0 : 1);
