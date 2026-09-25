/**
 * Full-app diagnostic probe — part 2: engine, money, gates, search, assets.
 *
 * Split from part 1 to keep each file a sane size; behaviourally the split is
 * the same: this probes the runtime subsystems, not the static data graph.
 */
import { existsSync } from 'node:fs';
import { calculateSolarSystem, formatNaira, normalizeSettings } from '../src/utils/calculations.js';
import { calculateRunningCosts } from '../src/utils/energyCosts.js';
import {
  DEFAULT_SETTINGS, PLANS, FEATURES, planAllowsFeature, GENERATION_PRICE, PROFILE_PRESETS,
} from '../src/data/pricingDefaults.js';
import { searchCatalog } from '../src/data/catalog/index.js';
import { buildPresetLoads } from '../src/utils/presets.js';
import { add, isFinite_ as fin } from './diagnostic-findings.mjs';

const sizing = (appliances, sunHours = 5, markup = 15) =>
  calculateSolarSystem({ appliances, sunHours, settings: DEFAULT_SETTINGS, installerMarkupPercent: markup });

// D4: hostile and boundary inputs must never throw or emit non-finite output.
[
  ['no loads', []],
  ['zero qty', [{ id: 'fans', qty: 0, watts: 75 }]],
  ['single fan', [{ id: 'fans', qty: 1, watts: 75, hoursDay: 8, hoursNight: 6 }]],
  ['huge load', [{ id: 'fans', qty: 5000, watts: 3000 }]],
  ['negative watts', [{ id: 'fans', qty: 2, watts: -100 }]],
  ['NaN watts', [{ id: 'fans', qty: 2, watts: NaN }]],
  ['unknown id', [{ id: 'nope', qty: 1, watts: 500 }]],
  ['missing watts', [{ id: 'fans', qty: 1 }]],
  ['surge load', [{ id: 'ac', qty: 3, watts: 1500, surgeWatts: 4000 }]],
  ['part smuggled in', [{ id: 'part-x', qty: 5, watts: 0 }]],
].forEach(([name, appliances]) => {
  try {
    const r = sizing(appliances);
    [r.totalDailyKWh, r.recommendedInverterKVA, r.recommendedBatteryKWh,
      r.recommendedSolarKW, r.totalPeakWatts, r.inductiveSurgeWatts].forEach((n, i) => {
      if (!fin(n)) add('CRIT', 'sizing', `"${name}" field[${i}] = ${n}`);
    });
    if (r.totalDailyKWh < 0) add('HIGH', 'sizing', `"${name}" negative daily total`);
    if (!Array.isArray(r.tiers) || r.tiers.length !== 3) add('CRIT', 'sizing', `"${name}" wrong tier count`);
    (r.tiers || []).forEach((t, i) => {
      if (!fin(t.totalCost) || t.totalCost < 0) add('CRIT', 'sizing', `"${name}" tier ${i} total ${t.totalCost}`);
      if (!fin(t.panelCount) || t.panelCount < 1) add('HIGH', 'sizing', `"${name}" tier ${i} panels ${t.panelCount}`);
    });
    if (!r.economics) add('CRIT', 'sizing', `"${name}" missing economics`);
  } catch (e) { add('CRIT', 'sizing', `"${name}" THREW: ${e.message}`); }
});

[0, -1, 24, NaN, 1e9].forEach((h) => {
  try {
    if (!fin(sizing([{ id: 'f', qty: 2, watts: 75 }], h).recommendedSolarKW)) {
      add('CRIT', 'sizing', `sunHours=${h} -> non-finite solar kW`);
    }
  } catch (e) { add('CRIT', 'sizing', `sunHours=${h} THREW: ${e.message}`); }
});
[-50, 0, 15, 100, 1e6].forEach((m) => {
  try {
    if (!fin(sizing([{ id: 'f', qty: 2, watts: 75 }], 5, m).tiers[1].totalCost)) {
      add('CRIT', 'sizing', `markup=${m} -> non-finite total`);
    }
  } catch (e) { add('CRIT', 'sizing', `markup=${m} THREW: ${e.message}`); }
});

// A corrupt localStorage payload must be survivable, not fatal.
[null, undefined, {}, { equipment: null }, 'nonsense', 42, []].forEach((s, i) => {
  try {
    const norm = normalizeSettings(s);
    if (!norm || !norm.equipment || !norm.equipment.inverters) {
      add('CRIT', 'settings', `normalizeSettings(${i}) lost the equipment block`);
    } else {
      // A payload that survives normalisation must also still size a system.
      try {
        const r = sizing([{ id: 'f', qty: 4, watts: 75, hoursDay: 8, hoursNight: 6 }]);
        if (!fin(r.tiers[1].totalCost)) add('CRIT', 'settings', `normalizeSettings(${i}) -> non-finite quote`);
      } catch (e) { add('CRIT', 'settings', `normalizeSettings(${i}) + calculate THREW: ${e.message}`); }
    }
  } catch (e) { add('CRIT', 'settings', `normalizeSettings(${i}) THREW: ${e.message}`); }
});

// D5: running costs.
[['zero kWh', 0, 5], ['negative', -10, 5], ['huge', 1e7, 5], ['tiny gen', 5, 0.1]].forEach(([n, kWh, kva]) => {
  try {
    const c = calculateRunningCosts({ dailyKWh: kWh, genKVA: kva, settings: DEFAULT_SETTINGS, supplyMode: 'hybrid' });
    if (!fin(c.monthlyTotal)) add('CRIT', 'costs', `"${n}" monthlyTotal = ${c.monthlyTotal}`);
    if (c.monthlyTotal < 0) add('HIGH', 'costs', `"${n}" negative monthlyTotal`);
  } catch (e) { add('CRIT', 'costs', `"${n}" THREW: ${e.message}`); }
});

// D6: every currency figure must keep its Naira sign.
[0, 1, 500, 1450000, 1e12, -5, NaN, null, undefined, 0.5].forEach((v) => {
  let s;
  try { s = formatNaira(v); } catch (e) { add('CRIT', 'format', `formatNaira(${v}) THREW: ${e.message}`); return; }
  if (typeof s !== 'string' || !s.length) add('CRIT', 'format', `formatNaira(${v}) -> "${s}"`);
  if (/NaN|undefined/.test(String(s))) add('HIGH', 'format', `formatNaira(${v}) -> "${s}"`);
  if (Number(v) >= 0 && !String(s).includes('₦')) {
    add('HIGH', 'format', `formatNaira(${v}) lost the Naira sign -> "${s}"`);
  }
});

// D7: the gate matrix must be total and internally consistent.
if (GENERATION_PRICE !== 500) add('HIGH', 'gates', `generation price is ${GENERATION_PRICE}, expected 500`);
if (new Set(FEATURES.map((f) => f.id)).size !== FEATURES.length) add('CRIT', 'gates', 'duplicate feature ids');
FEATURES.forEach((f) => {
  if (!PLANS[f.tier]) { add('CRIT', 'gates', `feature ${f.id} gates on unknown tier ${f.tier}`); return; }
  Object.keys(PLANS).forEach((p) => {
    try { planAllowsFeature(p, f.id); } catch { add('CRIT', 'gates', `planAllowsFeature(${p},${f.id}) THREW`); }
  });
  if (f.tier !== 'free' && planAllowsFeature('free', f.id)) add('CRIT', 'gates', `free can use ${f.id}`);
  if (!planAllowsFeature('unlimited', f.id)) add('CRIT', 'gates', `unlimited cannot use ${f.id}`);
});

// D8: search must never throw and must find parts by gauge.
['', 'deye', 'sunsynk', 'panel', '25mm', 'mc4', 'zzzznope', '   '].forEach((t) => {
  try {
    if (!Array.isArray(searchCatalog(t))) add('CRIT', 'search', `searchCatalog(${JSON.stringify(t)}) not an array`);
  } catch (e) { add('CRIT', 'search', `searchCatalog(${JSON.stringify(t)}) THREW: ${e.message}`); }
});
if (!searchCatalog('25mm').some((p) => p.kind === 'part')) add('MED', 'search', 'parts not findable by gauge');

// D9: every preset must produce a real quote, not a floor value.
PROFILE_PRESETS.forEach((p) => {
  const loads = buildPresetLoads(p.id);
  const r = sizing(loads);
  if (!loads.length) add('CRIT', 'presets', `preset "${p.id}" produced no loads`);
  if (loads.some((l) => !(l.watts > 0))) add('CRIT', 'presets', `preset "${p.id}" has a zero-watt load`);
  if (!(r.totalDailyKWh > 0)) add('CRIT', 'presets', `preset "${p.id}" produced a zero load`);
  if (!r.hasLoad) add('CRIT', 'presets', `preset "${p.id}" not seen by the engine`);
});

// D10: assets referenced by data must exist on disk.
[
  'public/brands', 'src/fonts/noto-sans.js', 'src/data/brandLogos.generated.js',
  'src/data/presetAliases.js', 'src/utils/presets.js',
].forEach((p) => { if (!existsSync(p)) add('CRIT', 'assets', `missing required path: ${p}`); });

export default true;

