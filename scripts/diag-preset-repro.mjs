/**
 * F1 reproduction: do the shipped facility presets actually produce a load?
 *
 * Root cause so far: PROFILE_PRESETS.suggestedAppliances uses short ids
 * (fans, bulbs, ac15hp) but the catalog's appliance ids are long generated
 * slugs (app-lighting-led-bulb-9w). If the sizing engine resolves by id, a
 * preset contributes zero watts and the app under-sizes the system.
 */
import { PROFILE_PRESETS } from '../src/data/pricingDefaults.js';
import { APPLIANCES } from '../src/data/catalog/appliances.js';
import { ALL_PRODUCTS } from '../src/data/catalog/index.js';
import { calculateSolarSystem, normalizeSettings } from '../src/utils/calculations.js';
import { DEFAULT_SETTINGS } from '../src/data/pricingDefaults.js';

const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
const byName = new Map(APPLIANCES.map((a) => [a.name.toLowerCase(), a]));

console.log('=== Step 1: what the presets ask for ===');
PROFILE_PRESETS.forEach((p) => {
  const ids = Object.keys(p.suggestedAppliances || {});
  const resolvable = ids.filter((id) => byId.has(id));
  console.log(`  ${p.id.padEnd(12)} ids=${String(ids.length).padStart(2)} resolvableById=${resolvable.length}`);
});

console.log('\n=== Step 2: what the app builds from a preset (App.jsx applyPreset) ===');
const preset = PROFILE_PRESETS[0];
const built = Object.entries(preset.suggestedAppliances).map(([id, qty]) => ({ id, qty }));
console.log('  first 3 built appliances:', JSON.stringify(built.slice(0, 3)));

console.log('\n=== Step 3: does the sizing engine see any load? ===');
const fromPreset = calculateSolarSystem({
  appliances: built,
  sunHours: 5,
  settings: DEFAULT_SETTINGS,
  installerMarkupPercent: 15,
});
console.log(`  totalDailyKWh = ${fromPreset.totalDailyKWh}`);
console.log(`  recommendedInverterKVA = ${fromPreset.recommendedInverterKVA}`);
console.log(`  hasLoad = ${fromPreset.hasLoad}`);

console.log('\n=== Step 4: the same loads, but resolved to real catalog entries ===');
const resolved = built.map((a) => {
  const hit = byId.get(a.id);
  if (hit) return { ...a, watts: hit.watts };
  // Try a name match, which is what a human would do to fix the data.
  const guess = [...byName.values()].find((ap) =>
    ap.id.startsWith(a.id.replace(/s$/, '')) || ap.name.toLowerCase().includes(a.id.slice(0, 3))
  );
  return { ...a, watts: guess ? guess.watts : 0, name: guess?.name };
});
const fromResolved = calculateSolarSystem({
  appliances: resolved,
  sunHours: 5,
  settings: DEFAULT_SETTINGS,
  installerMarkupPercent: 15,
});
console.log(`  totalDailyKWh = ${fromResolved.totalDailyKWh}`);
console.log(`  recommendedInverterKVA = ${fromResolved.recommendedInverterKVA}`);

console.log('\n=== Step 5: control — a hand-built load with explicit watts ===');
const control = calculateSolarSystem({
  appliances: [{ id: 'app-lighting-led-bulb-9w', qty: 12, watts: 9, hoursDay: 6, hoursNight: 6 }],
  sunHours: 5,
  settings: DEFAULT_SETTINGS,
  installerMarkupPercent: 15,
});
console.log(`  totalDailyKWh = ${control.totalDailyKWh}`);
console.log(`  recommendedInverterKVA = ${control.recommendedInverterKVA}`);

console.log('\n=== Verdict ===');
if (fromPreset.totalDailyKWh === 0) {
  console.log('  CONFIRMED: a facility preset yields a ZERO load. The app under-sizes.');
  console.log('  This is the app default state (useState initialiser uses preset[0]).');
} else {
  console.log('  Preset resolves somehow; re-check the trace.');
}

// Is the default state really the preset?
const src = (await import('node:fs')).readFileSync('src/App.jsx', 'utf8');
const usesPreset = /PROFILE_PRESETS\[0\]\.suggestedAppliances/.test(src);
console.log(`  App default state derives from PROFILE_PRESETS[0]: ${usesPreset}`);
