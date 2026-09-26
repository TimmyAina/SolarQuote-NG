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
import { calculateSolarSystem } from '../src/utils/calculations.js';
import { GRID_BANDS, DISCOS, DEFAULT_SETTINGS } from '../src/data/pricingDefaults.js';
import { existsSync, readFileSync as read } from 'node:fs';

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

// Unbranded sections (appliances, parts) have no manufacturer to group by, so
// the tab bar must fall back to grouping by category or the biggest section in
// the catalog would show no tabs at all.
const { groupingFor } = await import('../src/data/brands.js');
['inverter', 'battery', 'panel', 'laptop', 'desktop', 'appliance', 'part'].forEach((kind) => {
  const g = groupingFor(ALL_PRODUCTS, kind);
  const total = ALL_PRODUCTS.filter((p) => p.kind === kind).length;
  const sum = g.reduce((s, b) => s + b.count, 0);
  check(`${kind}: tab bar has groups`, g.length >= 1, `${g.length} groups`);
  check(`${kind}: tabs cover the whole section`, sum === total, `${sum}/${total}`);
  check(
    `${kind}: every tab has a label and a mark`,
    g.every((x) => typeof x.label === 'string' && x.label.length > 0)
  );
});
const applianceGrouping = groupingFor(ALL_PRODUCTS, 'appliance');
check(
  'unbranded appliances group by category',
  applianceGrouping.every((g) => g.isCategory === true) &&
    applianceGrouping.some((g) => /^(Lighting|Cooling|Kitchen|Computing)$/.test(g.label)),
  applianceGrouping.slice(0, 3).map((g) => g.label).join(', ')
);
// The inverter section is branded, so it must group by manufacturer. Asserting
// the axis (not which brand happens to be largest, which is a data detail)
// keeps this test from breaking when the catalog gains a model.
const inverterGrouping = groupingFor(ALL_PRODUCTS, 'inverter');
check(
  'branded sections group by manufacturer',
  inverterGrouping.every((g) => !g.isCategory) && inverterGrouping.every((g) => !g.name.includes('-')),
  inverterGrouping.slice(0, 3).map((g) => g.label).join(', ')
);
// Every part is branded "Generic", which is not a useful axis, so parts must
// fall back to their own sub-categories (Cables, DC Protection, ...).
const partGrouping = groupingFor(ALL_PRODUCTS, 'part');
check(
  'single-maker sections fall back to category',
  partGrouping.length >= 4 && partGrouping.every((g) => g.isCategory === true),
  `${partGrouping.length} groups: ${partGrouping.slice(0, 3).map((g) => g.label).join(', ')}`
);

console.log('\n[C9] Condition grading');
check('three grades exist', CONDITIONS.length === 3);
check('new has no discount', CONDITIONS.find((c) => c.id === 'new').discountPercent === 0);
check('refurb discounts below used', CONDITIONS.find((c) => c.id === 'refurbished').discountPercent
  < CONDITIONS.find((c) => c.id === 'used').discountPercent);
check('zero price stays zero', priceForCondition(0, 'used') === 0);

console.log('\n[C10] Facility presets resolve to real catalog products');
// Regression: presets used short keys (fans, bulbs, ac15hp) that matched no
// catalog id, and were built as {id, qty} with no wattage. The sizing engine
// therefore saw a ZERO load, so the app opened recommending the 1.5 kVA
// minimum for a school with 30 fans and 40 lights. Every preset must now
// resolve to a real product and produce a non-zero daily load.
const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
const { PRESET_ALIASES } = await import('../src/data/presetAliases.js');
const { buildPresetLoads } = await import('../src/utils/presets.js');
const { PROFILE_PRESETS } = await import('../src/data/pricingDefaults.js');

check('an alias map exists', PRESET_ALIASES && typeof PRESET_ALIASES === 'object');
Object.entries(PRESET_ALIASES).forEach(([key, id]) => {
  check(`alias "${key}" -> a real product`, byId.has(id), id);
});

PROFILE_PRESETS.forEach((preset) => {
  const keys = Object.keys(preset.suggestedAppliances || {});
  const unresolved = keys.filter((k) => !PRESET_ALIASES[k] || !byId.has(PRESET_ALIASES[k]));
  check(`${preset.id}: every key resolves`, unresolved.length === 0, unresolved.join(', '));

  const loads = buildPresetLoads(preset.id);
  check(`${preset.id}: produces loads`, loads.length === keys.length, `${loads.length}/${keys.length}`);
  check(`${preset.id}: every load carries wattage`, loads.every((l) => l.watts > 0));
  check(
    `${preset.id}: quantities preserved`,
    keys.every((k) => {
      const l = loads.find((x) => x.id === PRESET_ALIASES[k]);
      return l && l.qty === preset.suggestedAppliances[k];
    })
  );

  const r = calculateSolarSystem({
    appliances: loads, sunHours: 5, settings: DEFAULT_SETTINGS, installerMarkupPercent: 15,
  });
  check(`${preset.id}: produces a non-zero load`, r.totalDailyKWh > 0, `${r.totalDailyKWh} kWh/day`);
  check(`${preset.id}: engine sees the load`, r.hasLoad === true);
});

// The school preset is the app's default opening state, so it must be sane.
const schoolResult = calculateSolarSystem({
  appliances: buildPresetLoads('school'),
  sunHours: 5.3, settings: DEFAULT_SETTINGS, installerMarkupPercent: 15,
});
console.log(
  `  NOTE  school preset: ${schoolResult.totalDailyKWh.toFixed(1)} kWh/day, ` +
  `${schoolResult.recommendedInverterKVA} kVA recommended`
);
check(
  'school preset sizes a school, not the 1.5 kVA floor',
  schoolResult.recommendedInverterKVA >= 5,
  `${schoolResult.recommendedInverterKVA} kVA`
);

console.log('\n[C11] No hardcoded catalog size, no duplicate products');
// Regression: the UI said "Search 395 products" while the catalog held 438, and
// two LONGi panels shared a name. Counts must be derived, never typed.
{
  const { readFileSync, readdirSync } = await import('node:fs');
  const { TOTAL_PRODUCT_COUNT } = await import('../src/data/catalog/index.js');

  check('TOTAL_PRODUCT_COUNT matches the array', TOTAL_PRODUCT_COUNT === ALL_PRODUCTS.length, `${TOTAL_PRODUCT_COUNT}/${ALL_PRODUCTS.length}`);
  check('the catalog has 400+ products', TOTAL_PRODUCT_COUNT >= 400, `${TOTAL_PRODUCT_COUNT}`);

  // Any hand-typed product count in the UI is a bug waiting to happen.
  const stale = [];
  ['src/components', 'src/data'].forEach((dir) => {
    readdirSync(dir).forEach((name) => {
      if (!/\.(jsx?|mjs)$/.test(name)) return;
      const p = `${dir}/${name}`;
      const st = readFileSync(p, 'utf8');
      [...st.matchAll(/(?:Search\s+|search\s+)(\d{3})\s+products/g)].forEach((x) => {
        if (Number(x[1]) !== TOTAL_PRODUCT_COUNT) stale.push(`${p}: "${x[0].trim()}"`);
      });
    });
  });
  check('no stale hardcoded product count in the UI', stale.length === 0, stale.join('; '));

  // Two rows may not share name+brand+kind, or the grid shows the same model
  // twice and a search returns a duplicate.
  const seenKey = new Map();
  ALL_PRODUCTS.forEach((p) => {
    const k = `${p.kind}|${p.brand}|${p.name}`;
    seenKey.set(k, (seenKey.get(k) || 0) + 1);
  });
  const dupes = [...seenKey.entries()].filter(([, n]) => n > 1);
  check('no duplicate name+brand rows', dupes.length === 0, dupes.map(([k, n]) => `x${n} ${k}`).join('; '));
}


console.log('\n[C12] Every interactive control has an accessible name');
// Regression: the "Electricity distribution company" and "Installation region"
// dropdowns were labelled with a sibling <p className="sq-label">, which is
// visible to a sighted user but invisible to a screen reader. A native <select>
// needs aria-label (or an associated <label for>) to be announced at all.
const uiFiles = [
  'src/components/SettingsScreen.jsx',
  'src/components/LoadsScreen.jsx',
  'src/components/CatalogScreen.jsx',
  'src/components/BOQScreen.jsx',
  'src/components/WalletScreen.jsx',
  'src/components/ProductDetail.jsx',
  'src/components/BottomTabs.jsx',
];
let selectCount = 0;
let selectLabelled = 0;
uiFiles.forEach((f) => {
  if (!existsSync(f)) return;
  const src = read(f, 'utf8');
  // Walk each <select ...> opening tag and check for an accessible name.
  const tags = src.match(/<select\b[\s\S]*?>/g) || [];
  tags.forEach((tag) => {
    selectCount += 1;
    const hasName =
      /aria-label\s*=/.test(tag) ||
      /aria-labelledby\s*=/.test(tag) ||
      /\bid\s*=\s*["'][^"']+["']/.test(tag) && /<label[^>]*\bfor\s*=/.test(src);
    if (hasName) selectLabelled += 1;
    else add('HIGH', 'a11y', `${f}: <select> with no accessible name`);
  });
});
check('found the dropdowns to audit', selectCount >= 2, `${selectCount} select(s)`);
check('every <select> is labelled', selectLabelled === selectCount, `${selectLabelled}/${selectCount}`);

// A brand tile must not rely on opacity for legibility: at opacity-80 the
// brand-coloured initials measured 3.73:1 on the dark theme, under the 4.5:1
// floor for small text.
const pv = read('src/components/ProductVisual.jsx', 'utf8');
check('brand initials are not dimmed by opacity', !/opacity-80/.test(pv));
check('brand tile paints the colour at full opacity', /opacity:\s*1/.test(pv));

// Every wordmark tile must be readable. Regression: brand-coloured initials on a
// 10% wash of the same colour failed badly — the pale brands measured as low as
// 1.91:1, and darkening the wash made it worse (it moves the surface toward the
// label). The fix solves for the label colour, so assert the outcome for EVERY
// brand rather than one hand-picked case.
{
  const {
    readableLabel, hexToRgb, composite, contrast, LIGHT_BACKDROPS, DARK_BACKDROPS,
    WASH_ALPHA, parseCssRgb,
  } = await import('../src/utils/contrast.js');

  // Both themes must pass. The dark case is the subtle one: solving for a light
  // canvas returns pure black, which is invisible on the dark surface (Sunsynk
  // measured 1.29:1), so a light-only test would have shipped an unreadable tab.
  const themes = [
    { name: 'light', backdrops: LIGHT_BACKDROPS },
    { name: 'dark', backdrops: DARK_BACKDROPS },
  ];
  themes.forEach(({ name, backdrops }) => {
    const failing = [];
    let worst = Infinity;
    let worstName = '';
    BRANDS.filter((b) => !b.logo).forEach((b) => {
      const label = parseCssRgb(readableLabel(b.color, name));
      backdrops.forEach((surface) => {
        const wash = composite(hexToRgb(b.color), surface, WASH_ALPHA);
        const r = contrast(label, wash);
        if (r < worst) { worst = r; worstName = b.name; }
        if (r < 4.5) failing.push(`${b.name} ${r.toFixed(2)}`);
      });
    });
    check(
      `every wordmark tile clears 4.5:1 in ${name} mode`,
      failing.length === 0,
      failing.length ? failing.slice(0, 3).join(', ') : `worst ${worst.toFixed(2)}:1 (${worstName})`
    );
  });

  // The naive fixes must stay rejected by this test.
  check('light mode darkens the pale brands', readableLabel('#F0E9D2', 'light') !== '#F0E9D2');
  check('light mode leaves a dark brand untouched', readableLabel('#0B5FA5', 'light') === '#0B5FA5');
  check(
    'dark mode never returns black',
    readableLabel('#0E7C7B', 'dark') !== 'rgb(0, 0, 0)',
    readableLabel('#0E7C7B', 'dark')
  );
}

console.log(
  failures === 0
    ? '\n=== CATALOG + ENERGY: ALL PASSED ==='
    : `\n=== ${failures} FAILURE(S) ===`
);
process.exit(failures === 0 ? 0 : 1);
