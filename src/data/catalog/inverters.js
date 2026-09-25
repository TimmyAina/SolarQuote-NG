/**
 * Solar Inverter Catalog — models available in the Nigerian market
 * ---------------------------------------------------------------------------
 * POWER IS THE PRIMARY DATA. Every row carries a real rated output (W) plus the
 * surge capability that actually sizes an inverter, so selecting a model here
 * feeds the sizing engine directly instead of guessing from a tier label.
 *
 * Row schema (positional, expanded by `toInverter`):
 *   [model, brand, ratedW, priceNGN, opts]
 *   opts: { phase, mpptV, vocV, batteryV, maxPvA, surgeVA, warranty, kind }
 *
 * `priceNGN` is an INDICATIVE Alaba/Computer Village street price for the 2026
 * cycle — any figure can be overridden from Settings. Sizing and running-cost
 * maths depend on `watts`/`surgeVA`, never on price.
 */

// prettier-ignore
const ROWS = [
  ['SUN-12K-SG04LP3-EU',  'Deye',       12000, 2850000, { phase: 'Three-Phase', mpptV: 650, vocV: 800, batteryV: 48, maxPvA: 26,  surgeVA: 24000, warranty: 5, kind: 'Hybrid' }],
  ['SUN-15K-SG04LP3-EU',  'Deye',       15000, 3450000, { phase: 'Three-Phase', mpptV: 650, vocV: 800, batteryV: 48, maxPvA: 26,  surgeVA: 30000, warranty: 5, kind: 'Hybrid' }],
  ['SUN-20K-SG04LP3-EU',  'Deye',       20000, 4600000, { phase: 'Three-Phase', mpptV: 650, vocV: 800, batteryV: 48, maxPvA: 26,  surgeVA: 40000, warranty: 5, kind: 'Hybrid' }],
  ['SUN-8K-SG01LP1-EU',   'Deye',        8000, 1980000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 13, surgeVA: 16000, warranty: 5, kind: 'Hybrid' }],
  ['SUN-5K-SG03LP1-EU',   'Deye',        5000, 1320000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 13, surgeVA: 10000, warranty: 5, kind: 'Hybrid' }],
  ['SUN-6K-SG01LP1-EU',   'Deye',        6000, 1520000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 13, surgeVA: 12000, warranty: 5, kind: 'Hybrid' }],
  ['SUN-10K-SG03LP1-EU',  'Deye',       10000, 2420000, { phase: 'Single-Phase', mpptV: 650, vocV: 600, batteryV: 48, maxPvA: 26, surgeVA: 20000, warranty: 5, kind: 'Hybrid' }],

  ['8KTA-200',            'Sunsynk',     8000, 1750000, { phase: 'Three-Phase', mpptV: 800, vocV: 800, batteryV: 48, maxPvA: 26, surgeVA: 16000, warranty: 5, kind: 'Hybrid' }],
  ['12KTA-200',           'Sunsynk',    12000, 2480000, { phase: 'Three-Phase', mpptV: 800, vocV: 800, batteryV: 48, maxPvA: 26, surgeVA: 24000, warranty: 5, kind: 'Hybrid' }],
  ['15KTA-200',           'Sunsynk',    15000, 3050000, { phase: 'Three-Phase', mpptV: 800, vocV: 800, batteryV: 48, maxPvA: 26, surgeVA: 30000, warranty: 5, kind: 'Hybrid' }],
  ['20KTA-200',           'Sunsynk',    20000, 3900000, { phase: 'Three-Phase', mpptV: 800, vocV: 800, batteryV: 48, maxPvA: 26, surgeVA: 40000, warranty: 5, kind: 'Hybrid' }],
  ['50KTA-200',           'Sunsynk',    50000, 8900000, { phase: 'Three-Phase', mpptV: 850, vocV: 850, batteryV: 48, maxPvA: 300, surgeVA: 100000, warranty: 5, kind: 'Hybrid' }],
  ['SN-PW-A2.8K-48V',     'Sunsynk',     2800,  890000, { phase: 'Single-Phase', mpptV: 550, vocV: 550, batteryV: 48, maxPvA: 13, surgeVA: 5600,  warranty: 5, kind: 'Hybrid' }],
  ['SN-PW-A5.0K-48V',     'Sunsynk',     5000, 1290000, { phase: 'Single-Phase', mpptV: 550, vocV: 550, batteryV: 48, maxPvA: 13, surgeVA: 10000, warranty: 5, kind: 'Hybrid' }],
  ['SUN-5.2K-SG03LP1-EU', 'Sunsynk',     5200, 1350000, { phase: 'Single-Phase', mpptV: 550, vocV: 550, batteryV: 48, maxPvA: 13, surgeVA: 10400, warranty: 5, kind: 'Hybrid' }],
  ['SUN-8.2K-SG01LP1-EU', 'Sunsynk',     8200, 1780000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 13, surgeVA: 16400, warranty: 5, kind: 'Hybrid' }],

  ['SPF 5000 TL HVM-M1',  'Growatt',     5000, 1180000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 18, surgeVA: 10000, warranty: 10, kind: 'Hybrid' }],
  ['SPF 6000 TL HVM-M1',  'Growatt',     6000, 1380000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 18, surgeVA: 12000, warranty: 10, kind: 'Hybrid' }],
  ['SPF 3500 ES',         'Growatt',     3500,  920000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 18, surgeVA: 7000,  warranty: 5, kind: 'Hybrid' }],
  ['SPF 5000 ES',         'Growatt',     5000, 1150000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 18, surgeVA: 10000, warranty: 5, kind: 'Hybrid' }],
  ['SPF 6000 ES',         'Growatt',     6000, 1350000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 18, surgeVA: 12000, warranty: 5, kind: 'Hybrid' }],
  ['SPF 10000 TL HV',     'Growatt',    10000, 2250000, { phase: 'Three-Phase', mpptV: 650, vocV: 850, batteryV: 48, maxPvA: 27, surgeVA: 20000, warranty: 10, kind: 'Hybrid' }],
  ['MOD 5000 TL3-S',      'Growatt',     5000, 1150000, { phase: 'Three-Phase', mpptV: 650, vocV: 850, batteryV: 48, maxPvA: 27, surgeVA: 10000, warranty: 10, kind: 'String' }],
  ['MAX 125KTL3-XL',      'Growatt',   125000,18500000, { phase: 'Three-Phase', mpptV: 850, vocV: 1500, batteryV: 48, maxPvA: 300, surgeVA: 250000, warranty: 10, kind: 'Hybrid' }],

  ['HYD 3600ES',          'Sofar',       3600,  980000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 18, surgeVA: 7200,  warranty: 5, kind: 'Hybrid' }],
  ['HYD 5000ES',          'Sofar',       5000, 1260000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 18, surgeVA: 10000, warranty: 5, kind: 'Hybrid' }],
  ['HYD 6000ES',          'Sofar',       6000, 1440000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 18, surgeVA: 12000, warranty: 5, kind: 'Hybrid' }],
  ['HYD 8000ES',          'Sofar',       8000, 1850000, { phase: 'Single-Phase', mpptV: 650, vocV: 600, batteryV: 48, maxPvA: 18, surgeVA: 16000, warranty: 5, kind: 'Hybrid' }],
  ['10KTLH3-A0',          'Sofar',      10000, 2150000, { phase: 'Three-Phase', mpptV: 650, vocV: 1000, batteryV: 48, maxPvA: 60, surgeVA: 20000, warranty: 10, kind: 'Hybrid' }],
  ['12KTLH3-A0',          'Sofar',      12000, 2550000, { phase: 'Three-Phase', mpptV: 650, vocV: 1000, batteryV: 48, maxPvA: 60, surgeVA: 24000, warranty: 10, kind: 'Hybrid' }],
  ['15KTLH3-A0',          'Sofar',      15000, 3150000, { phase: 'Three-Phase', mpptV: 650, vocV: 1000, batteryV: 48, maxPvA: 60, surgeVA: 30000, warranty: 10, kind: 'Hybrid' }],

  ['FIV-4.8KW',           'Felicity',    4800,  890000, { phase: 'Single-Phase', mpptV: 500, vocV: 450, batteryV: 48, maxPvA: 18, surgeVA: 9600,  warranty: 5, kind: 'Hybrid' }],
  ['FIV-5.6KW',           'Felicity',    5600,  980000, { phase: 'Single-Phase', mpptV: 500, vocV: 450, batteryV: 48, maxPvA: 18, surgeVA: 11200, warranty: 5, kind: 'Hybrid' }],
  ['FIV-8.8KW',           'Felicity',    8800, 1320000, { phase: 'Single-Phase', mpptV: 500, vocV: 450, batteryV: 48, maxPvA: 18, surgeVA: 17600, warranty: 5, kind: 'Hybrid' }],
  ['FIV-11.2KW',          'Felicity',   11200, 1580000, { phase: 'Single-Phase', mpptV: 500, vocV: 450, batteryV: 48, maxPvA: 18, surgeVA: 22400, warranty: 5, kind: 'Hybrid' }],
  ['EMP-8.8KW',           'Felicity',    8800, 1420000, { phase: 'Single-Phase', mpptV: 500, vocV: 450, batteryV: 48, maxPvA: 18, surgeVA: 17600, warranty: 5, kind: 'Hybrid' }],
  ['EMP-12KW',            'Felicity',   12000, 1780000, { phase: 'Single-Phase', mpptV: 500, vocV: 450, batteryV: 48, maxPvA: 18, surgeVA: 24000, warranty: 5, kind: 'Hybrid' }],

  ['PV18-5248V',          'Must',        5000,  560000, { phase: 'Single-Phase', mpptV: 500, vocV: 450, batteryV: 48, maxPvA: 18, surgeVA: 10000, warranty: 2, kind: 'Hybrid' }],
  ['PV18-8248V',          'Must',        8000,  780000, { phase: 'Single-Phase', mpptV: 500, vocV: 450, batteryV: 48, maxPvA: 18, surgeVA: 16000, warranty: 2, kind: 'Hybrid' }],
  ['EP-5448V',            'Must',        4000,  490000, { phase: 'Single-Phase', mpptV: 500, vocV: 450, batteryV: 48, maxPvA: 18, surgeVA: 8000,  warranty: 2, kind: 'Hybrid' }],
  ['EP-8648V',            'Must',        8000,  740000, { phase: 'Single-Phase', mpptV: 500, vocV: 450, batteryV: 48, maxPvA: 18, surgeVA: 16000, warranty: 2, kind: 'Hybrid' }],


  ['SNA5000',             'Luxpower',    5000, 1150000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 18, surgeVA: 10000, warranty: 10, kind: 'Hybrid' }],
  ['SNA8000',             'Luxpower',    8000, 1720000, { phase: 'Single-Phase', mpptV: 550, vocV: 600, batteryV: 48, maxPvA: 18, surgeVA: 16000, warranty: 10, kind: 'Hybrid' }],
  ['SNA12000',            'Luxpower',   12000, 2400000, { phase: 'Three-Phase', mpptV: 650, vocV: 850, batteryV: 48, maxPvA: 27, surgeVA: 24000, warranty: 10, kind: 'Hybrid' }],
  ['SNA15000',            'Luxpower',   15000, 2950000, { phase: 'Three-Phase', mpptV: 650, vocV: 850, batteryV: 48, maxPvA: 27, surgeVA: 30000, warranty: 10, kind: 'Hybrid' }],

  ['MGR-5KW',             'Megarevo',    5000,  860000, { phase: 'Single-Phase', mpptV: 550, vocV: 500, batteryV: 48, maxPvA: 18, surgeVA: 10000, warranty: 5, kind: 'Hybrid' }],
  ['MGR-8KW',             'Megarevo',    8000, 1180000, { phase: 'Single-Phase', mpptV: 550, vocV: 500, batteryV: 48, maxPvA: 18, surgeVA: 16000, warranty: 5, kind: 'Hybrid' }],
  ['MGR-12KW',            'Megarevo',   12000, 1650000, { phase: 'Three-Phase', mpptV: 650, vocV: 850, batteryV: 48, maxPvA: 27, surgeVA: 24000, warranty: 5, kind: 'Hybrid' }],

  ['MultiPlus-II 48/5000','Victron',     5000, 3450000, { phase: 'Single-Phase', mpptV: 150,  vocV: 150, batteryV: 48, maxPvA: 0, surgeVA: 10000, warranty: 5, kind: 'Inverter/Charger' }],
  ['Quattro 48/5000',     'Victron',     5000, 3300000, { phase: 'Single-Phase', mpptV: 150,  vocV: 150, batteryV: 48, maxPvA: 0, surgeVA: 10000, warranty: 5, kind: 'Inverter/Charger' }],
  ['MultiPlus-II 48/10000','Victron',   10000, 6200000, { phase: 'Three-Phase', mpptV: 150,  vocV: 150, batteryV: 48, maxPvA: 0, surgeVA: 20000, warranty: 5, kind: 'Inverter/Charger' }],
  ['Quattro 48/15000',    'Victron',    15000, 8900000, { phase: 'Three-Phase', mpptV: 150,  vocV: 150, batteryV: 48, maxPvA: 0, surgeVA: 30000, warranty: 5, kind: 'Inverter/Charger' }],

  ['PIP-5048',            'MPP Solar',   5000,  980000, { phase: 'Single-Phase', mpptV: 550, vocV: 550, batteryV: 48, maxPvA: 18, surgeVA: 10000, warranty: 5, kind: 'Hybrid' }],
  ['PIP-6048',            'MPP Solar',   6000, 1150000, { phase: 'Single-Phase', mpptV: 550, vocV: 550, batteryV: 48, maxPvA: 18, surgeVA: 12000, warranty: 5, kind: 'Hybrid' }],
  ['PIP-8048',            'MPP Solar',   8000, 1350000, { phase: 'Single-Phase', mpptV: 550, vocV: 550, batteryV: 48, maxPvA: 18, surgeVA: 16000, warranty: 5, kind: 'Hybrid' }],

  ['POW-HVM3.2K-48V',     'PowMr',       3200,  690000, { phase: 'Single-Phase', mpptV: 500, vocV: 500, batteryV: 48, maxPvA: 18, surgeVA: 6400,  warranty: 3, kind: 'Hybrid' }],
  ['POW-HVM6.2K-48V',     'PowMr',       6200,  960000, { phase: 'Single-Phase', mpptV: 500, vocV: 500, batteryV: 48, maxPvA: 18, surgeVA: 12400, warranty: 3, kind: 'Hybrid' }],
  ['POW-HVM8.2K-48V',     'PowMr',       8200, 1180000, { phase: 'Single-Phase', mpptV: 500, vocV: 500, batteryV: 48, maxPvA: 18, surgeVA: 16400, warranty: 3, kind: 'Hybrid' }],
];

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Expands a positional row into a full catalog object. */
export const toInverter = ([model, brand, ratedW, priceNGN, o], i) => ({
  id: `inv-${slug(brand)}-${slug(model)}-${i}`,
  category: 'inverter',
  kind: 'inverter',
  name: model,
  brand,
  /** Rated continuous output — the number that sizes the inverter. */
  watts: ratedW,
  surgeVA: o.surgeVA,
  indicativePriceNGN: priceNGN,
  specs: {
    phase: o.phase,
    mpptV: o.mpptV,
    maxVocV: o.vocV,
    batteryV: o.batteryV,
    maxPvAmps: o.maxPvA,
    warrantyYears: o.warranty,
    topology: o.kind,
  },
  // An inverter does not itself draw household load; its own parasitic draw is
  // a fraction of a percent of output and is deliberately excluded from sizing.
  selfConsumptionW: 15,
});

export const INVERTERS = ROWS.map(toInverter);

export const INVERTER_BRANDS = [...new Set(INVERTERS.map((i) => i.brand))].sort();

export default INVERTERS;
