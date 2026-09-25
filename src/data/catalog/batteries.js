/**
 * LiFePO4 Battery Catalog — 48V rack & wall modules sold in Nigeria
 * ---------------------------------------------------------------------------
 * Row schema (positional, expanded by `toBattery`):
 *   [model, brand, energyKWh, priceNGN, opts]
 *   opts: { volts, maxChargeA, maxDischargeA, cycles, depthOfDischarge, chemistry }
 *
 * `maxDischargeA` is the figure that actually constrains a battery bank: a
 * 5 kWh rack can be paired with a 12 kW inverter on paper but only if its BMS
 * is rated for the current. The sizing engine checks this pairing.
 */

// prettier-ignore
const ROWS = [
  ['US5000',              'Pylontech',    4.8, 1420000, { volts: 48, maxChargeA: 108, maxDischargeA: 108, cycles: 6000, depthOfDischarge: 0.95, chemistry: 'LiFePO4' }],
  ['US3000',              'Pylontech',    2.9,  980000, { volts: 48, maxChargeA: 64,  maxDischargeA: 64,  cycles: 6000, depthOfDischarge: 0.95, chemistry: 'LiFePO4' }],
  ['US2000',              'Pylontech',    2.0,  760000, { volts: 48, maxChargeA: 45,  maxDischargeA: 45,  cycles: 6000, depthOfDischarge: 0.95, chemistry: 'LiFePO4' }],
  ['US6000',              'Pylontech',    6.0, 1780000, { volts: 48, maxChargeA: 130, maxDischargeA: 130, cycles: 6000, depthOfDischarge: 0.95, chemistry: 'LiFePO4' }],
  ['US10100',             'Pylontech',   10.1, 2950000, { volts: 48, maxChargeA: 200, maxDischargeA: 200, cycles: 6000, depthOfDischarge: 0.95, chemistry: 'LiFePO4' }],

  ['HV6143',              'Dyness',       3.5, 1150000, { volts: 48, maxChargeA: 30,  maxDischargeA: 30,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['HV10240',             'Dyness',       10.2, 2950000, { volts: 48, maxChargeA: 25,  maxDischargeA: 25,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['SE-5.1Pro',           'Dyness',       5.1, 1520000, { volts: 48, maxChargeA: 50,  maxDischargeA: 50,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['SE-3.8Pro',           'Dyness',       3.8, 1240000, { volts: 48, maxChargeA: 38,  maxDischargeA: 38,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['Power Vault D5.5',     'Dyness',       5.5, 1650000, { volts: 48, maxChargeA: 50,  maxDischargeA: 50,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],

  ['FEB-5368S2-H',        'Felicity',     5.4, 1150000, { volts: 48, maxChargeA: 80,  maxDischargeA: 80,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['FEB-5182S2-H',        'Felicity',     5.18, 1100000, { volts: 48, maxChargeA: 80,  maxDischargeA: 80,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['FEB-5129S2-H',        'Felicity',     5.12, 1080000, { volts: 48, maxChargeA: 80,  maxDischargeA: 80,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['FEB-2868S2-H',        'Felicity',     2.86,  780000, { volts: 48, maxChargeA: 45,  maxDischargeA: 45,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['FES-5115S2-L',        'Felicity',     5.12, 1050000, { volts: 48, maxChargeA: 80,  maxDischargeA: 80,  cycles: 4000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],

  ['ESS-5128',            'Freedom Won',  5.12, 1380000, { volts: 48, maxChargeA: 100, maxDischargeA: 100, cycles: 8000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['ESS-5140',            'Freedom Won',  5.12, 1420000, { volts: 48, maxChargeA: 100, maxDischargeA: 100, cycles: 8000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['Lynx 10.2kWh',        'Freedom Won', 10.2, 2680000, { volts: 48, maxChargeA: 200, maxDischargeA: 200, cycles: 8000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['Snake 10kWh',         'Freedom Won', 10.0, 2620000, { volts: 48, maxChargeA: 200, maxDischargeA: 200, cycles: 8000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],

  ['HV-B6000',            'Hubble',       6.0, 1520000, { volts: 48, maxChargeA: 100, maxDischargeA: 100, cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['HV-B5100',            'Hubble',       5.1, 1380000, { volts: 48, maxChargeA: 100, maxDischargeA: 100, cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['HV-B2550',            'Hubble',       2.55,  920000, { volts: 48, maxChargeA: 50,  maxDischargeA: 50,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['LFP-51-HV',           'Hubble',       5.12, 1340000, { volts: 48, maxChargeA: 50,  maxDischargeA: 50,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],

  ['REVOLUTION 48V 5.1',  'Revov',        5.12, 1280000, { volts: 48, maxChargeA: 100, maxDischargeA: 100, cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['REVOLUTION 48V 3.8',  'Revov',        3.8, 1080000, { volts: 48, maxChargeA: 75,  maxDischargeA: 75,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['REVOLUTION 48V 10.2', 'Revov',       10.2, 2520000, { volts: 48, maxChargeA: 200, maxDischargeA: 200, cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],

  ['S-12V-100Ah LiFePO4', 'Shoto',        1.28, 780000, { volts: 12, maxChargeA: 100, maxDischargeA: 100, cycles: 3000, depthOfDischarge: 0.8,  chemistry: 'LiFePO4' }],
  ['ST-12V-200Ah',        'Shoto',        2.56, 1250000, { volts: 12, maxChargeA: 200, maxDischargeA: 200, cycles: 3000, depthOfDischarge: 0.8,  chemistry: 'LiFePO4' }],

  ['Soltaro T-5.12kWh',   'Soltaro',      5.12, 1320000, { volts: 48, maxChargeA: 80,  maxDischargeA: 80,  cycles: 5000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['Soltaro T-2.56kWh',   'Soltaro',      2.56,  890000, { volts: 48, maxChargeA: 50,  maxDischargeA: 50,  cycles: 5000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],

  ['Bluesun 48V 5.12kWh', 'Bluesun',      5.12, 1050000, { volts: 48, maxChargeA: 100, maxDischargeA: 100, cycles: 6000, depthOfDischarge: 0.95, chemistry: 'LiFePO4' }],
  ['Bluesun 48V 3.84kWh', 'Bluesun',      3.84,  880000, { volts: 48, maxChargeA: 80,  maxDischargeA: 80,  cycles: 6000, depthOfDischarge: 0.95, chemistry: 'LiFePO4' }],
  ['Bluesun 48V 10.2kWh', 'Bluesun',     10.24, 1980000, { volts: 48, maxChargeA: 200, maxDischargeA: 200, cycles: 6000, depthOfDischarge: 0.95, chemistry: 'LiFePO4' }],

  ['Aolithium 12V 100Ah', 'Aolithium',    1.28, 820000, { volts: 12, maxChargeA: 100, maxDischargeA: 100, cycles: 3500, depthOfDischarge: 0.8,  chemistry: 'LiFePO4' }],
  ['Aolithium 48V 5.12',  'Aolithium',    5.12, 1180000, { volts: 48, maxChargeA: 100, maxDischargeA: 100, cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],

  ['C&D 48V 5.12kWh',     'C&D',          5.12, 1140000, { volts: 48, maxChargeA: 100, maxDischargeA: 100, cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['C&D 48V 10.24kWh',    'C&D',         10.24, 2050000, { volts: 48, maxChargeA: 200, maxDischargeA: 200, cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],

  ['4800Wh Solar Battery','Generic',      4.8,  690000, { volts: 48, maxChargeA: 60,  maxDischargeA: 60,  cycles: 3000, depthOfDischarge: 0.8,  chemistry: 'LiFePO4' }],
  ['5120Wh LiFePO4 Rack', 'Generic',      5.12,  780000, { volts: 48, maxChargeA: 60,  maxDischargeA: 60,  cycles: 3000, depthOfDischarge: 0.8,  chemistry: 'LiFePO4' }],
  ['10240Wh LiFePO4 Rack','Generic',     10.24, 1380000, { volts: 48, maxChargeA: 120, maxDischargeA: 120, cycles: 3000, depthOfDischarge: 0.8,  chemistry: 'LiFePO4' }],
  ['15360Wh LiFePO4 Rack','Generic',     15.36, 1980000, { volts: 48, maxChargeA: 150, maxDischargeA: 150, cycles: 3000, depthOfDischarge: 0.8,  chemistry: 'LiFePO4' }],
  ['2560Wh LiFePO4 Slim', 'Generic',      2.56,  480000, { volts: 48, maxChargeA: 50,  maxDischargeA: 50,  cycles: 3000, depthOfDischarge: 0.8,  chemistry: 'LiFePO4' }],

  ['Tesla Powerwall 2',   'Tesla',       13.5, 9800000, { volts: 48, maxChargeA: 37,  maxDischargeA: 37,  cycles: 12500, depthOfDischarge: 1.0, chemistry: 'NMC' }],

  ['US3000C',             'Pylontech',    2.88, 990000, { volts: 48, maxChargeA: 64,  maxDischargeA: 64,  cycles: 6000, depthOfDischarge: 0.95, chemistry: 'LiFePO4' }],
  ['US5000C',             'Pylontech',    4.8, 1440000, { volts: 48, maxChargeA: 108, maxDischargeA: 108, cycles: 6000, depthOfDischarge: 0.95, chemistry: 'LiFePO4' }],
  ['HV5123',              'Dyness',       5.12, 1470000, { volts: 48, maxChargeA: 60,  maxDischargeA: 60,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['HV4850',              'Dyness',       4.85, 1380000, { volts: 48, maxChargeA: 30,  maxDischargeA: 30,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['FEB-8044S2',          'Felicity',     8.06, 1620000, { volts: 48, maxChargeA: 100, maxDischargeA: 100, cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['ESS-5115',            'Freedom Won',  5.12, 1400000, { volts: 48, maxChargeA: 100, maxDischargeA: 100, cycles: 8000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['RHI-3.8K',            'Revov',        3.8, 1090000, { volts: 48, maxChargeA: 70,  maxDischargeA: 70,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['HV-B5120',            'Hubble',       5.12, 1360000, { volts: 48, maxChargeA: 55,  maxDischargeA: 55,  cycles: 6000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['SG-BATT-5.12',        'Soltaro',      5.12, 1300000, { volts: 48, maxChargeA: 100, maxDischargeA: 100, cycles: 5000, depthOfDischarge: 0.9,  chemistry: 'LiFePO4' }],
  ['LE-48V-15.36kWh',     'Generic',     15.36, 2450000, { volts: 48, maxChargeA: 200, maxDischargeA: 200, cycles: 3000, depthOfDischarge: 0.8,  chemistry: 'LiFePO4' }],
];

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Expands a positional row into a full catalog object. */
export const toBattery = ([model, brand, energyKWh, priceNGN, o], i) => ({
  id: `bat-${slug(brand)}-${slug(model)}-${i}`,
  category: 'battery',
  kind: 'battery',
  name: model,
  brand,
  /** Nominal energy in kWh — the number that sizes the bank. */
  energyKWh: energyKWh,
  watts: 0, // a battery is an energy store, not a load
  indicativePriceNGN: priceNGN,
  specs: {
    nominalVoltage: o.volts,
    maxChargeAmps: o.maxChargeA,
    maxDischargeAmps: o.maxDischargeA,
    cycleLife: o.cycles,
    depthOfDischarge: o.depthOfDischarge,
    chemistry: o.chemistry,
    // Continuous power the module can deliver at nominal voltage.
    maxPowerW: o.maxDischargeA * o.volts,
  },
});

export const BATTERIES = ROWS.map(toBattery);

export const BATTERY_BRANDS = [...new Set(BATTERIES.map((b) => b.brand))].sort();

export default BATTERIES;
