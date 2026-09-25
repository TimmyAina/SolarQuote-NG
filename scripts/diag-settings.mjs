/** Can a corrupt settings payload really strip the equipment block? */
import { normalizeSettings, DEFAULT_SETTINGS } from '../src/utils/calculations.js';
import { calculateSolarSystem } from '../src/utils/calculations.js';

const cases = [
  ['{}', {}],
  ['{ equipment: null }', { equipment: null }],
  ['{ equipment: "x" }', { equipment: 'x' }],
  ['{ equipment: [] }', { equipment: [] }],
  ['{ equipment: {} }', { equipment: {} }],
  ['{ equipment: { costPerKVA: null } }', { equipment: { costPerKVA: null } }],
];

console.log('input                     -> has equipment?  costPerKVA   then calc?');
cases.forEach(([label, input]) => {
  let n, kva, calc;
  try {
    n = normalizeSettings(input);
    kva = n?.equipment?.costPerKVA;
    calc = calculateSolarSystem({
      appliances: [{ id: 'f', qty: 4, watts: 75, hoursDay: 8, hoursNight: 6 }],
      sunHours: 5, settings: n, installerMarkupPercent: 15,
    });
    calc = `${calc.recommendedInverterKVA} kVA / ₦${Math.round(calc.tiers[1].totalCost).toLocaleString('en-NG')}`;
  } catch (e) {
    calc = 'THREW: ' + e.message;
  }
  console.log(`${label.padEnd(26)} ${String(!!n?.equipment).padEnd(16)} ${String(kva).padEnd(12)} ${calc}`);
});

console.log('\nDEFAULT_SETTINGS.equipment keys:', Object.keys(DEFAULT_SETTINGS.equipment || {}).join(', '));
console.log('DEFAULT costPerKVA:', DEFAULT_SETTINGS.equipment?.costPerKVA);
