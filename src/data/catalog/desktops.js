/**
 * Desktop PC Catalog — Nigerian market models (tower, AIO, mini and rack)
 * ---------------------------------------------------------------------------
 * Unlike a laptop, a desktop has no battery buffer: a 450 W workstation left
 * running overnight will drain a small solar bank. `watts` is the sustained
 * average wall draw at typical office load, so the sizing engine stays honest.
 *
 * Row schema (positional, expanded by `toDesktop`):
 *   [model, brand, watts, priceNGN, opts]
 *   opts: { formFactor, cpu, gpuW, displays, group }
 */

// prettier-ignore
const ROWS = [
  ['OptiPlex 3000 SFF',       'Dell',        110,  680000, { formFactor: 'SFF', cpu: 'Intel i3-1215U',       gpuW: 0,   displays: 1, group: 'Office' }],
  ['OptiPlex 3000 Tower',     'Dell',        115,  720000, { formFactor: 'Tower', cpu: 'Intel i5-12400',   gpuW: 0,   displays: 1, group: 'Office' }],
  ['OptiPlex 3070 SFF',       'Dell',        130,  850000, { formFactor: 'SFF', cpu: 'Intel i5-12400',     gpuW: 0,   displays: 1, group: 'Office' }],
  ['OptiPlex 3080 SFF',       'Dell',        145,  980000, { formFactor: 'SFF', cpu: 'Intel i5-12400',     gpuW: 0,   displays: 2, group: 'Office' }],
  ['OptiPlex 7010 SFF',       'Dell',        165, 1250000, { formFactor: 'SFF', cpu: 'Intel i7-12700',     gpuW: 0,   displays: 2, group: 'Business' }],
  ['OptiPlex 7010 Tower',     'Dell',        180, 1380000, { formFactor: 'Tower', cpu: 'Intel i7-12700',   gpuW: 0,   displays: 2, group: 'Business' }],
  ['ProDesk 400 G9',          'Dell',        105,  720000, { formFactor: 'Micro', cpu: 'Intel i3-1215U',   gpuW: 0,   displays: 1, group: 'Office' }],
  ['OptiPlex 7011 AIO',       'Dell',        170, 1650000, { formFactor: 'AIO', cpu: 'Intel i7-12700',    gpuW: 0,   displays: 1, group: 'Business' }],
  ['Precision 3660 Tower',    'Dell',        420, 2850000, { formFactor: 'Tower', cpu: 'Xeon W3-1235 + RTX', gpuW: 150, displays: 2, group: 'Workstation' }],
  ['Alienware Aurora 13',     'Dell',        480, 4200000, { formFactor: 'AIO', cpu: 'Ryzen 9 + RTX',        gpuW: 220, displays: 1, group: 'Gaming' }],
  ['G5 5090',                 'Dell',        650, 4800000, { formFactor: 'Tower', cpu: 'Core i9 + RTX 5090', gpuW: 350, displays: 1, group: 'Gaming' }],
  ['Vostro 3710 SFF',         'Dell',        120,  820000, { formFactor: 'SFF', cpu: 'Intel i5-12400',     gpuW: 0,   displays: 1, group: 'Office' }],

  ['EliteDesk 800 G8',         'HP',          125,  880000, { formFactor: 'SFF', cpu: 'Intel i5-12400',     gpuW: 0,   displays: 2, group: 'Office' }],
  ['EliteDesk 800 G9',         'HP',          140,  980000, { formFactor: 'SFF', cpu: 'Intel i5-12500',     gpuW: 0,   displays: 2, group: 'Office' }],
  ['ProDesk 400 G9',          'HP',          100,  690000, { formFactor: 'Micro', cpu: 'Intel i3-1215U',  gpuW: 0,   displays: 1, group: 'Office' }],
  ['HP 260 G9',               'HP',           95,  640000, { formFactor: 'SFF', cpu: 'Intel i3-1215U',     gpuW: 0,   displays: 1, group: 'Office' }],
  ['EliteDesk 405 G9',         'HP',          155, 1150000, { formFactor: 'SFF', cpu: 'Intel i7-12700',     gpuW: 0,   displays: 2, group: 'Business' }],
  ['Z2 Tower G9',              'HP',          190, 1580000, { formFactor: 'Tower', cpu: 'Intel i7-13700',   gpuW: 0,   displays: 2, group: 'Business' }],
  ['HP 640 G9',               'HP',          130,  950000, { formFactor: 'SFF', cpu: 'Intel i5-12400',     gpuW: 0,   displays: 2, group: 'Office' }],
  ['Omen 40L',                 'HP',          500, 3800000, { formFactor: 'Tower', cpu: 'Ryzen 7 + RTX',      gpuW: 230, displays: 2, group: 'Gaming' }],
  ['Victus by HP 16L',         'HP',          420, 2650000, { formFactor: 'Tower', cpu: 'Ryzen 5 + RTX',      gpuW: 200, displays: 1, group: 'Gaming' }],
  ['Z2 Mini G9',               'HP',          130, 1420000, { formFactor: 'Mini', cpu: 'Intel i7-13700',    gpuW: 0,   displays: 2, group: 'Business' }],
  ['EliteOne 800 G9',          'HP',          165, 1580000, { formFactor: 'AIO', cpu: 'Intel i7-12500',    gpuW: 0,   displays: 1, group: 'Business' }],

  ['ThinkCentre M920 Tower',   'Lenovo',      150, 1050000, { formFactor: 'Tower', cpu: 'Intel i5-12400',   gpuW: 0,   displays: 2, group: 'Office' }],
  ['ThinkCentre M920 SFF',     'Lenovo',      135,  980000, { formFactor: 'SFF', cpu: 'Intel i5-12400',     gpuW: 0,   displays: 2, group: 'Office' }],
  ['ThinkCentre M70q',         'Lenovo',      120,  920000, { formFactor: 'Tiny', cpu: 'Intel i5-12400',    gpuW: 0,   displays: 2, group: 'Office' }],
  ['ThinkCentre M920q',        'Lenovo',      155, 1350000, { formFactor: 'Tiny', cpu: 'Intel i7-12700',    gpuW: 0,   displays: 3, group: 'Business' }],
  ['ThinkCentre Neo 50q',      'Lenovo',      110,  850000, { formFactor: 'Tiny', cpu: 'Intel i5-12400',    gpuW: 0,   displays: 2, group: 'Office' }],
  ['ThinkStation P3 Tower',    'Lenovo',      340, 2650000, { formFactor: 'Tower', cpu: 'i7 + RTX A2000',   gpuW: 120, displays: 2, group: 'Workstation' }],
  ['ThinkCentre AIO i5',       'Lenovo',      145, 1280000, { formFactor: 'AIO', cpu: 'Intel i5-12400',     gpuW: 0,   displays: 1, group: 'Business' }],
  ['Legion T5',                'Lenovo',      460, 2900000, { formFactor: 'Tower', cpu: 'Ryzen 7 + RTX',      gpuW: 210, displays: 2, group: 'Gaming' }],
  ['IdeaCentre Desk 3',        'Lenovo',       95,  640000, { formFactor: 'SFF', cpu: 'Intel i3-1215U',     gpuW: 0,   displays: 1, group: 'Office' }],

  ['ExpertCenter D5 Tower',    'Asus',        140,  920000, { formFactor: 'Tower', cpu: 'Intel i5-12400',   gpuW: 0,   displays: 2, group: 'Office' }],
  ['ExpertCenter D500 SFF',    'Asus',        125,  850000, { formFactor: 'SFF', cpu: 'Intel i5-12400',     gpuW: 0,   displays: 2, group: 'Office' }],
  ['Asus ExpertCenter D700',   'Asus',        175, 1250000, { formFactor: 'Tower', cpu: 'Intel i7-12700',   gpuW: 0,   displays: 2, group: 'Business' }],
  ['Asus ProArt Station',      'Asus',        400, 2950000, { formFactor: 'Tower', cpu: 'Ryzen 9 + RTX',     gpuW: 180, displays: 2, group: 'Workstation' }],
  ['ROG Strix G13',            'Asus',        520, 3600000, { formFactor: 'Tower', cpu: 'Ryzen 9 + RTX',     gpuW: 250, displays: 2, group: 'Gaming' }],
  ['Asus ExpertCenter D500T',  'Asus',        118,  800000, { formFactor: 'Tower', cpu: 'Intel i5-12400',   gpuW: 0,   displays: 2, group: 'Office' }],
  ['Asus Vivo A542',           'Asus',         90,  590000, { formFactor: 'SFF', cpu: 'Intel i3-1215U',     gpuW: 0,   displays: 1, group: 'Office' }],

  ['Acer Veriton M2680G',      'Acer',        120,  780000, { formFactor: 'SFF', cpu: 'Intel i5-12400',     gpuW: 0,   displays: 2, group: 'Office' }],
  ['Acer Veriton X2680G',      'Acer',        145,  950000, { formFactor: 'Tower', cpu: 'Intel i7-12700',   gpuW: 0,   displays: 2, group: 'Business' }],
  ['Acer Predator Orion 3000', 'Acer',        470, 3050000, { formFactor: 'Tower', cpu: 'Ryzen 7 + RTX',     gpuW: 215, displays: 2, group: 'Gaming' }],
  ['Acer Aspire TC A715',      'Acer',         95,  620000, { formFactor: 'Tower', cpu: 'Intel i3-1215U',   gpuW: 0,   displays: 1, group: 'Office' }],
  ['Acer Envision X2570G',     'Acer',        380, 2850000, { formFactor: 'Tower', cpu: 'i7 + RTX 4000',    gpuW: 160, displays: 2, group: 'Workstation' }],
  ['Acer Aspire A515 AIO',     'Acer',        130, 1050000, { formFactor: 'AIO', cpu: 'Intel i5-1235U',     gpuW: 0,   displays: 1, group: 'Office' }],

  ['iMac 24 M3',               'Apple',        95, 2450000, { formFactor: 'AIO', cpu: 'Apple M3',          gpuW: 0,   displays: 1, group: 'Premium' }],
  ['iMac 24 M1',               'Apple',        85, 1850000, { formFactor: 'AIO', cpu: 'Apple M1',          gpuW: 0,   displays: 1, group: 'Premium' }],
  ['Mac mini M2',              'Apple',        32, 1250000, { formFactor: 'Mini', cpu: 'Apple M2',         gpuW: 0,   displays: 2, group: 'Office' }],
  ['Mac mini M2 Pro',          'Apple',        65, 2250000, { formFactor: 'Mini', cpu: 'Apple M2 Pro',     gpuW: 0,   displays: 2, group: 'Workstation' }],
  ['Mac Studio M1 Ultra',      'Apple',       365, 6900000, { formFactor: 'Tower', cpu: 'Apple M1 Ultra',   gpuW: 0,   displays: 2, group: 'Workstation' }],
  ['Mac Pro 2023',             'Apple',       650, 9500000, { formFactor: 'Tower', cpu: 'Apple M2 Ultra',   gpuW: 0,   displays: 2, group: 'Workstation' }],

  ['PowerEdge T350',           'Dell',        210, 2350000, { formFactor: 'Rack', cpu: 'Xeon E-2374G',      gpuW: 0,   displays: 0, group: 'Server' }],
  ['ProLiant ML350 Gen11',     'HPE',         260, 2850000, { formFactor: 'Rack', cpu: 'Xeon Silver 4310',  gpuW: 0,   displays: 0, group: 'Server' }],
  ['Generic Office PC i3',     'Generic',      90,  380000, { formFactor: 'SFF', cpu: 'Intel i3-10105U',   gpuW: 0,   displays: 1, group: 'Office' }],
  ['Generic Office PC i5',     'Generic',     130,  520000, { formFactor: 'SFF', cpu: 'Intel i5-10400',    gpuW: 0,   displays: 1, group: 'Office' }],
];

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Expands a positional row into a full catalog object. */
export const toDesktop = ([model, brand, watts, priceNGN, o], i) => ({
  id: `dkp-${slug(brand)}-${slug(model)}-${i}`,
  category: 'desktop',
  kind: 'desktop',
  name: model,
  brand,
  /** Sustained average wall draw at typical office load, watts. */
  watts,
  indicativePriceNGN: priceNGN,
  specs: {
    formFactor: o.formFactor,
    cpu: o.cpu,
    gpuWatts: o.gpuW,
    displayOutputs: o.displays,
    group: o.group,
  },
});

export const DESKTOPS = ROWS.map(toDesktop);

export const DESKTOP_BRANDS = [...new Set(DESKTOPS.map((d) => d.brand))].sort();

export default DESKTOPS;
