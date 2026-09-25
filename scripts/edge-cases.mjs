/**
 * Numeric / robustness edge-case suite for the solar engine.
 * Usage: node scripts/edge-cases.mjs
 */
import { DEFAULT_SETTINGS, COMMON_APPLIANCES } from '../src/data/pricingDefaults.js';
import { calculateSolarSystem, formatNaira } from '../src/utils/calculations.js';

let failures = 0;
const check = (label, cond, extra = '') => {
  if (cond) {
    console.log(`  PASS  ${label}${extra ? ' -> ' + extra : ''}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${extra ? ' -> ' + extra : ''}`);
  }
};

const base = () => COMMON_APPLIANCES.map(a => ({ ...a, qty: 0, watts: a.defaultWatts, hoursDay: 4, hoursNight: 4 }));
const mk = (qtyOverrides, hoursOverrides = {}) => base().map(a => ({
  ...a,
  qty: qtyOverrides[a.id] ?? 0,
  hoursDay: hoursOverrides.day ?? a.hoursDay,
  hoursNight: hoursOverrides.night ?? a.hoursNight
}));

const run = (appliances, settings = DEFAULT_SETTINGS, sunHours = 4.8) =>
  calculateSolarSystem({ appliances, sunHours, backupHoursNight: 8, settings, installerMarkupPercent: 15 });

console.log('\n[E1] Zero-load quote (client has no appliances yet)');
const zero = run(mk({}));
console.log(`  peak ${zero.totalPeakWatts}W | inverter ${zero.recommendedInverterKVA}kVA | battery ${zero.recommendedBatteryKWh}kWh | pv ${zero.recommendedSolarKW}kWp`);
console.log(`  monthlySavings ${formatNaira(zero.economics.monthlySavings)} | payback ${zero.economics.paybackMonths} mo`);
check('zero load -> no phantom monthly savings', zero.economics.monthlySavings === 0, formatNaira(zero.economics.monthlySavings));
check('zero load -> payback not fabricated', zero.economics.paybackMonths === 0, String(zero.economics.paybackMonths));
check('zero load -> still quotable sizes', zero.recommendedInverterKVA >= 1.5 && zero.recommendedBatteryKWh >= 2.5);

console.log('\n[E2] Negative quantities typed into the counter');
const negative = run(mk({ fans: -5, bulbs: -10 }));
check('negative qty cannot reduce peak load', negative.totalPeakWatts === 0, `${negative.totalPeakWatts}W`);
check('negative qty cannot create negative energy', negative.totalDailyKWh === 0, `${negative.totalDailyKWh}kWh`);

console.log('\n[E3] Operating hours beyond 24 h/day');
const longHours = run(mk({ bulbs: 10 }, { day: 30, night: 30 }));
console.log(`  daily energy: ${longHours.totalDailyKWh} kWh (max legal 24h x 10 bulbs x 15W = 3.6 kWh)`);
check('hours clamped to 24/day', longHours.totalDailyKWh <= 3.6, `${longHours.totalDailyKWh}kWh`);

console.log('\n[E4] Corrupt engineering inputs');
const zeroSun = run(mk({ bulbs: 20 }), DEFAULT_SETTINGS, 0);
check('sunHours = 0 does not yield non-finite PV', Number.isFinite(zeroSun.recommendedSolarKW) && Number.isFinite(zeroSun.tiers[0].totalCost),
  `pv ${zeroSun.recommendedSolarKW}kWp, cost ${formatNaira(zeroSun.tiers[0].totalCost)}`);

const badDod = run(mk({ bulbs: 20 }), { ...DEFAULT_SETTINGS, batteryDoD: 0 });
check('batteryDoD = 0 does not yield non-finite battery', Number.isFinite(badDod.recommendedBatteryKWh),
  `${badDod.recommendedBatteryKWh}kWh`);

const badLoss = run(mk({ bulbs: 20 }), { ...DEFAULT_SETTINGS, systemLossFactor: 0 });
check('systemLossFactor = 0 handled', Number.isFinite(badLoss.recommendedSolarKW), `${badLoss.recommendedSolarKW}kWp`);

const badSurge = run(mk({ bulbs: 20 }), { ...DEFAULT_SETTINGS, safetySurgeFactor: 0 });
check('safetySurgeFactor = 0 handled', Number.isFinite(badSurge.recommendedInverterKVA), `${badSurge.recommendedInverterKVA}kVA`);

const noEquipment = { installerName: 'Partial Co' };
let equipmentCrash = null;
try { run(mk({ bulbs: 5 }), noEquipment); } catch (err) { equipmentCrash = err.message; }
check('missing settings.equipment does not crash', equipmentCrash === null, equipmentCrash || 'ok');

console.log('\n[E5] Currency formatting guards');
check('formatNaira(NaN) is not "₦NaN"', formatNaira(NaN) !== '₦NaN', formatNaira(NaN));
check('formatNaira(Infinity) is not "₦Infinity"', !formatNaira(Infinity).includes('Infinity'), formatNaira(Infinity));

console.log('\n[E6] Absurd but finite load (100k bulbs)');
const huge = run(mk({ bulbs: 100000 }, { day: 12, night: 12 }));
check('huge load stays finite', Number.isFinite(huge.tiers[0].totalCost) && Number.isFinite(huge.recommendedBatteryKWh),
  `${(huge.totalPeakWatts / 1000).toFixed(0)}kW, ${huge.recommendedBatteryKWh}kWh, ${formatNaira(huge.tiers[0].totalCost)}`);

console.log(`\n=== EDGE CASES: ${failures === 0 ? 'ALL PASSED' : failures + ' FAILED'} ===`);
process.exit(failures === 0 ? 0 : 1);
