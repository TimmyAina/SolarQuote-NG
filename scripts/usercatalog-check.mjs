/**
 * User Catalog verification — price overrides and self-added products
 * ---------------------------------------------------------------------------
 * Guards the rules that must never break a quotation: an override is always a
 * sane positive Naira amount, custom products are validated and carry the power
 * data the sizing engine needs, and nothing can be corrupted via storage.
 *
 * Usage: node scripts/usercatalog-check.mjs
 */
import {
  createUserCatalog,
  hydrateUserCatalog,
  setPrice,
  clearPrice,
  resetPrices,
  effectivePrice,
  hasOverride,
  normaliseCustomProduct,
  addCustomProduct,
  updateCustomProduct,
  removeCustomProduct,
  resetUserCatalog,
  withEffectivePrices,
  ADDABLE_KINDS,
} from '../src/data/userCatalog.js';
import { INVERTERS, BATTERIES, PANELS } from '../src/data/catalog/index.js';
import { FEATURES, planAllowsFeature } from '../src/data/pricingDefaults.js';

let failures = 0;
const check = (label, cond, detail = '') => {
  const ok = Boolean(cond);
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -> ${detail}` : ''}`);
};

const S0 = createUserCatalog();
const sample = INVERTERS[0];

console.log('\n[U1] Fresh store is empty');
check('no overrides', Object.keys(S0.priceOverrides).length === 0);
check('no custom products', S0.customProducts.length === 0);

console.log('\n[U2] Price overrides');
const p1 = setPrice(S0, sample.id, 3100000);
check('override accepted', p1.ok);
check('override stored', p1.state.priceOverrides[sample.id] === 3100000, `₦${p1.state.priceOverrides[sample.id]}`);
check('effective price uses override', effectivePrice(sample, p1.state) === 3100000);
check('hasOverride true', hasOverride(sample.id, p1.state));
check('untouched product keeps shipped price', effectivePrice(INVERTERS[5], p1.state) === INVERTERS[5].indicativePriceNGN);
[0, -100, NaN, 'abc', null, undefined].forEach((v) => {
  check(`bad price ${JSON.stringify(v)} rejected`, !setPrice(S0, sample.id, v).ok);
});
check('absurd price rejected', !setPrice(S0, sample.id, 1e12).ok);
check('shipped dataset not mutated', INVERTERS[0].indicativePriceNGN !== 3100000);
check('second product override is independent', setPrice(S0, INVERTERS[1].id, 200).state.priceOverrides[INVERTERS[1].id] === 200);

const cleared = clearPrice(p1.state, sample.id);
check('clear removes override', cleared.state.priceOverrides[sample.id] === undefined);
check('cleared falls back to shipped price', effectivePrice(sample, cleared.state) === sample.indicativePriceNGN);
check('clearing twice is safe', clearPrice(cleared.state, sample.id).ok);

const many = INVERTERS.slice(0, 3).reduce((s, x) => setPrice(s, x.id, 999).state, S0);
check('multiple overrides accumulate', Object.keys(many.priceOverrides).length === 3);
check('resetPrices clears all', Object.keys(resetPrices(many).state.priceOverrides).length === 0);

console.log('\n[U3] withEffectivePrices rewrites the visible figure');
const merged = withEffectivePrices(INVERTERS.slice(0, 2), many);
check('override reflected in array', merged[0].indicativePriceNGN === 999, `₦${merged[0].indicativePriceNGN}`);
check('shipped product untouched in source', INVERTERS[1].indicativePriceNGN !== 999);


console.log('\n[U4] Custom inverter');
const inv = addCustomProduct(S0, {
  kind: 'inverter', name: 'MyPower 6K', brand: 'SunPower Lagos', watts: 6000, priceNGN: 1450000,
});
check('added', inv.ok, inv.error);
check('marked custom', inv.product.custom === true);
check('id is namespaced to user', inv.product.id.startsWith('usr-inverter-'), inv.product.id);
check('price stored', inv.product.indicativePriceNGN === 1450000);
check('rated watts stored', inv.product.watts === 6000);
check('surge defaults to 2x rated', inv.product.surgeVA === 12000, `${inv.product.surgeVA}VA`);
check('phase defaults', inv.product.specs.phase === 'Single-Phase');
check('brand defaults when blank', addCustomProduct(S0, { kind: 'inverter', name: 'X1', watts: 1000, priceNGN: 100 }).product.brand === 'Mine');

const inv2 = addCustomProduct(S0, {
  kind: 'inverter', name: 'Big 30K', watts: 30000, surgeVA: 60000, phase: 'Three-Phase', priceNGN: 4200000,
});
check('explicit surge honoured', inv2.product.surgeVA === 60000);
check('explicit phase honoured', inv2.product.specs.phase === 'Three-Phase');

console.log('\n[U5] Custom battery sizes on energy, not draw');
const batt = addCustomProduct(S0, {
  kind: 'battery', name: 'MyLiFe 10k', watts: 5000, energyKWh: 10.5, priceNGN: 2800000,
});
check('added', batt.ok, batt.error);
check('energy stored', batt.product.energyKWh === 10.5, `${batt.product.energyKWh} kWh`);
check('default 48V bus', batt.product.volts === 48);
check('chemistry default', batt.product.specs.chemistry === 'LiFePO4');
const battNoEnergy = addCustomProduct(S0, { kind: 'battery', name: 'Fallback', watts: 6000, priceNGN: 100 });
check('energy derived from watts when omitted', battNoEnergy.product.energyKWh === 6, `${battNoEnergy.product.energyKWh} kWh`);

console.log('\n[U6] Custom panel + loads');
const panel = addCustomProduct(S0, { kind: 'panel', name: 'MyPanel 450', watts: 450, priceNGN: 95000 });
check('panel added', panel.ok, panel.error);
check('panel keeps watts', panel.product.watts === 450);
const load = addCustomProduct(S0, { kind: 'appliance', name: 'Deep freezer', watts: 320, priceNGN: 480000 });
check('load added', load.ok, load.error);
check('load keeps draw watts', load.product.watts === 320);
check('load has no energy field', load.product.energyKWh === undefined);
['laptop', 'desktop'].forEach((kind) => {
  const r = addCustomProduct(S0, { kind, name: `My ${kind}`, watts: 65, priceNGN: 700000 });
  check(`${kind} addable`, r.ok, r.error);
});

console.log('\n[U7] Validation rejects bad input');
check('missing kind rejected', !addCustomProduct(S0, { name: 'X', watts: 100, priceNGN: 100 }).ok);
check('unknown kind rejected', !addCustomProduct(S0, { kind: 'nuclear', name: 'X', watts: 1, priceNGN: 1 }).ok);
check('blank name rejected', !addCustomProduct(S0, { kind: 'inverter', name: '  ', watts: 100, priceNGN: 100 }).ok);
check('one-char name rejected', !addCustomProduct(S0, { kind: 'inverter', name: 'X', watts: 100, priceNGN: 100 }).ok);
check('zero watts rejected', !addCustomProduct(S0, { kind: 'inverter', name: 'OK', watts: 0, priceNGN: 100 }).ok);
check('negative watts rejected', !addCustomProduct(S0, { kind: 'inverter', name: 'OK', watts: -5, priceNGN: 100 }).ok);
check('non-numeric watts rejected', !addCustomProduct(S0, { kind: 'inverter', name: 'OK', watts: 'lots', priceNGN: 100 }).ok);
check('missing price rejected', !addCustomProduct(S0, { kind: 'inverter', name: 'OK', watts: 100 }).ok);
check('zero price rejected', !addCustomProduct(S0, { kind: 'inverter', name: 'OK', watts: 100, priceNGN: 0 }).ok);
check('failed add leaves state untouched', addCustomProduct(S0, { kind: 'inverter', name: '', watts: 0 }).state === S0);


console.log('\n[U8] Dedup, edit, delete');
const withOne = addCustomProduct(S0, { kind: 'inverter', name: 'Dup', watts: 1000, priceNGN: 100000 }).state;
const dupAgain = addCustomProduct(withOne, { kind: 'inverter', name: 'Dup', watts: 1000, priceNGN: 250000 });
check('re-adding same item updates not duplicates', dupAgain.state.customProducts.length === 1, `${dupAgain.state.customProducts.length}`);
check('update reported', dupAgain.updated === true);
check('new price applied', dupAgain.product.indicativePriceNGN === 250000);
check('id preserved on update', dupAgain.product.id === withOne.customProducts[0].id);

const edited = updateCustomProduct(withOne, withOne.customProducts[0].id, {
  kind: 'inverter', name: 'Dup Renamed', watts: 2000, priceNGN: 300000,
});
check('edit works', edited.ok, edited.error);
check('name updated', edited.product.name === 'Dup Renamed');
check('id unchanged', edited.product.id === withOne.customProducts[0].id);
check('edit of missing id fails', !updateCustomProduct(withOne, 'nope', { kind: 'inverter', name: 'A', watts: 1, priceNGN: 1 }).ok);

const pricedThenDeleted = removeCustomProduct(
  setPrice(withOne, withOne.customProducts[0].id, 999).state,
  withOne.customProducts[0].id
);
check('delete removes product', pricedThenDeleted.state.customProducts.length === 0);
check('delete removes its price override', pricedThenDeleted.state.priceOverrides[withOne.customProducts[0].id] === undefined);

console.log('\n[U9] Reset');
const messy = addCustomProduct(addCustomProduct(setPrice(S0, sample.id, 5).state, { kind: 'panel', name: 'Panel X', watts: 400, priceNGN: 1 }).state, { kind: 'inverter', name: 'Inverter Y', watts: 100, priceNGN: 1 }).state;
const wiped = resetUserCatalog(messy);
check('reset clears overrides', Object.keys(wiped.state.priceOverrides).length === 0);
check('reset clears custom products', wiped.state.customProducts.length === 0);

console.log('\n[U10] Hydration survives corrupt storage');
check('null -> empty', hydrateUserCatalog(null).customProducts.length === 0);
check('garbage string -> empty', hydrateUserCatalog('{not json').customProducts.length === 0);
check('non-object still has shape', hydrateUserCatalog(42).priceOverrides !== undefined);
check('valid override kept', hydrateUserCatalog(JSON.stringify({ priceOverrides: { b: 10 } })).priceOverrides.b === 10);
check('negative override dropped', hydrateUserCatalog(JSON.stringify({ priceOverrides: { a: -5 } })).priceOverrides.a === undefined);
check('invalid custom product dropped', hydrateUserCatalog(JSON.stringify({ customProducts: [{ kind: 'inverter', name: '', watts: 0 }] })).customProducts.length === 0);
const round = hydrateUserCatalog(JSON.stringify(messy));
check('valid state round-trips', round.customProducts.length === 2, `${round.customProducts.length}`);
check('round-trip keeps override', round.priceOverrides[sample.id] === 5);

console.log('\n[U11] Catalog + gating intact');
check('all 6 kinds addable', ADDABLE_KINDS.length === 6, `${ADDABLE_KINDS.length}`);
check('shipped catalog still intact', INVERTERS.length > 0 && BATTERIES.length > 0 && PANELS.length > 0);
check('normaliseCustomProduct is pure', normaliseCustomProduct({ kind: 'panel', name: 'Panel X', watts: 1, priceNGN: 1 }).product.name === 'Panel X');
check('custom catalog is a declared feature', FEATURES.some((f) => f.id === 'custom_catalog'));
check('free cannot use it', !planAllowsFeature('free', 'custom_catalog'));
check('limited cannot use it', !planAllowsFeature('limited', 'custom_catalog'));
check('unlimited can use it', planAllowsFeature('unlimited', 'custom_catalog'));

console.log(
  failures === 0
    ? '\n=== USER CATALOG: ALL PASSED ==='
    : `\n=== ${failures} FAILURE(S) ===`
);
process.exit(failures === 0 ? 0 : 1);
