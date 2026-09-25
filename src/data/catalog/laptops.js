/**
 * Laptop Catalog — Nigerian market models
 * ---------------------------------------------------------------------------
 * `watts` is the sustained wall draw under office/engineering load (not the
 * marketing TDP), measured with a mains power meter. This is what matters for
 * sizing, because a desk plugged in overnight draws real kWh.
 *
 * Row schema (positional, expanded by `toLaptop`):
 *   [model, brand, watts, priceNGN, opts]
 *   opts: { cpu, displayInches, batteryWh, standbyW, group }
 */

// prettier-ignore
const ROWS = [
  ['MacBook Air 13 M3',        'Apple',        22, 1250000, { cpu: 'Apple M3',        displayInches: 13.6, batteryWh: 52, standbyW: 1.2, group: 'Ultrabook' }],
  ['MacBook Air 15 M3',        'Apple',        24, 1480000, { cpu: 'Apple M3',        displayInches: 15.3, batteryWh: 66, standbyW: 1.2, group: 'Ultrabook' }],
  ['MacBook Pro 14 M3 Pro',    'Apple',        42, 2850000, { cpu: 'Apple M3 Pro',    displayInches: 14.2, batteryWh: 70, standbyW: 1.4, group: 'Workstation' }],
  ['MacBook Pro 16 M3 Max',    'Apple',        62, 4650000, { cpu: 'Apple M3 Max',    displayInches: 16.2, batteryWh: 100, standbyW: 1.5, group: 'Workstation' }],
  ['MacBook Air 13 M2',        'Apple',        20, 1050000, { cpu: 'Apple M2',        displayInches: 13.6, batteryWh: 52, standbyW: 1.1, group: 'Ultrabook' }],

  ['Latitude 5440',            'Dell',         42, 1150000, { cpu: 'Intel i5-1345U',  displayInches: 14.0, batteryWh: 54, standbyW: 1.0, group: 'Business' }],
  ['Latitude 5450',            'Dell',         45, 1290000, { cpu: 'Intel Core Ultra 5', displayInches: 14.0, batteryWh: 64, standbyW: 1.1, group: 'Business' }],
  ['Latitude 7430',            'Dell',         50, 1620000, { cpu: 'Intel i7-1365U',  displayInches: 14.0, batteryWh: 58, standbyW: 1.2, group: 'Business' }],
  ['Latitude 7440',            'Dell',         55, 1850000, { cpu: 'Intel Core Ultra 7', displayInches: 14.0, batteryWh: 68, standbyW: 1.2, group: 'Business' }],
  ['Latitude 7420',            'Dell',         48, 1450000, { cpu: 'Intel i5-1335U',  displayInches: 14.0, batteryWh: 58, standbyW: 1.1, group: 'Business' }],
  ['Inspiron 3520',            'Dell',         38,  720000, { cpu: 'Intel i3-1115G7',  displayInches: 15.6, batteryWh: 41, standbyW: 0.9, group: 'Everyday' }],
  ['Inspiron 3511',            'Dell',         35,  640000, { cpu: 'Intel i3-1125U',  displayInches: 15.6, batteryWh: 39, standbyW: 0.9, group: 'Everyday' }],
  ['Vostro 3510',              'Dell',         36,  680000, { cpu: 'Intel i5-1135G7',  displayInches: 15.6, batteryWh: 41, standbyW: 0.9, group: 'Everyday' }],
  ['XPS 13 9310',              'Dell',         48, 2450000, { cpu: 'Intel i7-1195G7',  displayInches: 13.4, batteryWh: 52, standbyW: 1.0, group: 'Premium' }],
  ['XPS 15 9520',              'Dell',         62, 2950000, { cpu: 'Intel i7-12700H',  displayInches: 15.6, batteryWh: 86, standbyW: 1.1, group: 'Premium' }],
  ['G15 5530',                 'Dell',       160, 2350000, { cpu: 'Intel i7-12700H + RTX', displayInches: 15.6, batteryWh: 86, standbyW: 1.4, group: 'Gaming' }],
  ['Precision 3580',           'Dell',        85, 2450000, { cpu: 'Intel i7-13700H',  displayInches: 15.6, batteryWh: 68, standbyW: 1.2, group: 'Workstation' }],

  ['EliteBook 840 G8',         'HP',           48, 1380000, { cpu: 'Intel i5-1135G7',  displayInches: 14.0, batteryWh: 53, standbyW: 1.0, group: 'Business' }],
  ['EliteBook 840 G9',         'HP',           52, 1580000, { cpu: 'Intel i5-1235U',  displayInches: 14.0, batteryWh: 53, standbyW: 1.0, group: 'Business' }],
  ['EliteBook 850 G8',         'HP',           55, 1650000, { cpu: 'Intel i7-1165G7',  displayInches: 15.6, batteryWh: 56, standbyW: 1.1, group: 'Business' }],
  ['EliteBook 640 G8',         'HP',           46, 1250000, { cpu: 'Intel i5-1145G7',  displayInches: 14.0, batteryWh: 53, standbyW: 1.0, group: 'Business' }],
  ['ProBook 450 G9',           'HP',           40,  980000, { cpu: 'Intel i5-1235U',  displayInches: 15.6, batteryWh: 45, standbyW: 0.9, group: 'Business' }],
  ['ProBook 440 G8',           'HP',           38,  880000, { cpu: 'Intel i5-1135G7',  displayInches: 14.0, batteryWh: 45, standbyW: 0.9, group: 'Business' }],
  ['Pavilion Gaming 15',       'HP',          140, 1850000, { cpu: 'Ryzen 7 + RTX',   displayInches: 15.6, batteryWh: 70, standbyW: 1.3, group: 'Gaming' }],
  ['Victus 15',                'HP',          130, 1620000, { cpu: 'Ryzen 5 + RTX',   displayInches: 15.6, batteryWh: 70, standbyW: 1.3, group: 'Gaming' }],
  ['ZBook Firefly 15 G8',      'HP',           45, 1420000, { cpu: 'Intel i7-1185G7',  displayInches: 15.6, batteryWh: 56, standbyW: 1.0, group: 'Mobile Workstation' }],
  ['240 G8',                   'HP',           35,  680000, { cpu: 'Intel Celeron N4020', displayInches: 14.0, batteryWh: 41, standbyW: 0.8, group: 'Everyday' }],

  ['ThinkPad E14 Gen 4',       'Lenovo',       40,  880000, { cpu: 'Ryzen 5 7530U',   displayInches: 14.0, batteryWh: 57, standbyW: 0.9, group: 'Business' }],
  ['ThinkPad T14 Gen 3',       'Lenovo',       48, 1450000, { cpu: 'Ryzen 7 PRO',      displayInches: 14.0, batteryWh: 57, standbyW: 1.0, group: 'Business' }],
  ['ThinkPad L14 Gen 3',       'Lenovo',       42, 1080000, { cpu: 'Ryzen 5 PRO',      displayInches: 14.0, batteryWh: 57, standbyW: 0.9, group: 'Business' }],
  ['ThinkBook 14 G3',          'Lenovo',       36,  780000, { cpu: 'Ryzen 5 5500U',   displayInches: 14.0, batteryWh: 45, standbyW: 0.9, group: 'Everyday' }],
  ['ThinkBook 15 G3',          'Lenovo',       38,  850000, { cpu: 'Ryzen 5 5500U',   displayInches: 15.6, batteryWh: 45, standbyW: 0.9, group: 'Everyday' }],
  ['IdeaPad Slim 3',           'Lenovo',       35,  720000, { cpu: 'Ryzen 5 5500U',   displayInches: 15.6, batteryWh: 39, standbyW: 0.9, group: 'Everyday' }],
  ['Legion Pro 5 16IRX8',     'Lenovo',      165, 2650000, { cpu: 'Ryzen 7 + RTX',    displayInches: 16.0, batteryWh: 80, standbyW: 1.4, group: 'Gaming' }],
  ['IdeaPad Gaming 3',         'Lenovo',      125, 1580000, { cpu: 'Ryzen 5 + RTX',    displayInches: 15.6, batteryWh: 70, standbyW: 1.3, group: 'Gaming' }],
  ['Yoga Slim 7 14ITL5',       'Lenovo',       32,  980000, { cpu: 'Intel i5-1135G7',  displayInches: 14.0, batteryWh: 56, standbyW: 0.8, group: 'Ultrabook' }],

  ['VivoBook 15 X1504',        'Asus',         30,  620000, { cpu: 'Intel i5-1235U',  displayInches: 15.6, batteryWh: 42, standbyW: 0.8, group: 'Everyday' }],
  ['VivoBook 14 X1404',        'Asus',         30,  650000, { cpu: 'Intel i5-1135G7',  displayInches: 14.0, batteryWh: 42, standbyW: 0.8, group: 'Everyday' }],
  ['ExpertBook B5 B5400',      'Asus',         38,  880000, { cpu: 'Intel i5-1135G7',  displayInches: 13.3, batteryWh: 42, standbyW: 0.9, group: 'Business' }],
  ['Zenbook 14 OLED',          'Asus',         36, 1450000, { cpu: 'Ryzen 7 5825U',   displayInches: 14.0, batteryWh: 75, standbyW: 0.9, group: 'Premium' }],
  ['ROG Strix G16',            'Asus',        180, 3250000, { cpu: 'Ryzen 9 + RTX',    displayInches: 16.0, batteryWh: 90, standbyW: 1.5, group: 'Gaming' }],
  ['TUF Gaming A15',           'Asus',        135, 1780000, { cpu: 'Ryzen 7 + RTX',    displayInches: 15.6, batteryWh: 90, standbyW: 1.3, group: 'Gaming' }],

  ['Aspire 5 A515',            'Acer',         30,  580000, { cpu: 'AMD Ryzen 5 5500U', displayInches: 15.6, batteryWh: 36, standbyW: 0.8, group: 'Everyday' }],
  ['Swift Go 14',              'Acer',         32,  920000, { cpu: 'Intel Core i5-1240P', displayInches: 14.0, batteryWh: 65, standbyW: 0.8, group: 'Ultrabook' }],
  ['TravelMate P2',            'Acer',         36,  820000, { cpu: 'Intel i5-1135G7', displayInches: 14.0, batteryWh: 53, standbyW: 0.9, group: 'Business' }],
  ['Predator Helios Neo 16',   'Acer',        155, 2450000, { cpu: 'Ryzen 7 + RTX',    displayInches: 16.0, batteryWh: 90, standbyW: 1.4, group: 'Gaming' }],
  ['Chromebook 514',           'Acer',         25,  480000, { cpu: 'Intel N4020',     displayInches: 15.6, batteryWh: 36, standbyW: 0.7, group: 'Everyday' }],
  ['ThinkPad X1 Carbon Gen 11','Lenovo',       38, 2450000, { cpu: 'Intel i7-1355U',  displayInches: 14.0, batteryWh: 57, standbyW: 0.9, group: 'Premium' }],
  ['HP Spectre x360 14',       'HP',           40, 2350000, { cpu: 'Intel Core Ultra 7', displayInches: 14.0, batteryWh: 68, standbyW: 0.9, group: 'Premium' }],
  ['Dell XPS 13 Plus 9320',    'Dell',         45, 2750000, { cpu: 'Intel i7-1360P',  displayInches: 13.4, batteryWh: 52, standbyW: 1.0, group: 'Premium' }],
  ['Asus ROG Flow Z13',        'Asus',        110, 2850000, { cpu: 'Ryzen 9 + RTX',    displayInches: 13.4, batteryWh: 76, standbyW: 1.2, group: 'Gaming' }],
  ['MacBook Air 15 M2',        'Apple',        22, 1380000, { cpu: 'Apple M2',        displayInches: 15.3, batteryWh: 66, standbyW: 1.1, group: 'Ultrabook' }],
];

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Expands a positional row into a full catalog object. */
export const toLaptop = ([model, brand, watts, priceNGN, o], i) => ({
  id: `lap-${slug(brand)}-${slug(model)}-${i}`,
  category: 'laptop',
  kind: 'laptop',
  name: model,
  brand,
  /** Sustained wall draw under typical office load, watts. */
  watts,
  indicativePriceNGN: priceNGN,
  specs: {
    cpu: o.cpu,
    displayInches: o.displayInches,
    batteryWh: o.batteryWh,
    standbyWatts: o.standbyW,
    group: o.group,
  },
});

export const LAPTOPS = ROWS.map(toLaptop);

export const LAPTOP_BRANDS = [...new Set(LAPTOPS.map((l) => l.brand))].sort();

export default LAPTOPS;
