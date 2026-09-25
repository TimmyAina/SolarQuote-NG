/**
 * Product Condition & Spares
 * ---------------------------------------------------------------------------
 * Nigerian installers routinely quote three grades of goods, and the grade
 * changes the price far more than any supplier discount does. This module owns
 * the condition model and a starter catalogue of the electrical parts and
 * consumables a solar job needs but which are not "products with a wattage
 * rating" â€” cable, MC4 connectors, breakers, glands, and so on.
 *
 * Two distinct ideas, deliberately kept apart:
 *   - `condition` applies to any product (new / refurbished / used) and carries a
 *     default discount so a used unit is never quoted at full price.
 *   - a `part` is inventory consumed by the job rather than sized by it. Parts
 *     are priced per unit and never contribute to the load total (isPart()).
 */

export const CONDITIONS = [
  { id: 'new', label: 'New', short: 'New', discountPercent: 0 },
  { id: 'refurbished', label: 'Refurbished', short: 'Refurb', discountPercent: 25 },
  { id: 'used', label: 'Used', short: 'Used', discountPercent: 45 },
];

const BY_ID = new Map(CONDITIONS.map((c) => [c.id, c]));

export const getCondition = (id) => BY_ID.get(id) || BY_ID.get('new');

/** Applies the condition discount to a base price. */
export function priceForCondition(basePriceNGN, conditionId) {
  const base = Number(basePriceNGN);
  if (!Number.isFinite(base) || base <= 0) return 0;
  const c = getCondition(conditionId);
  return Math.max(0, Math.round(base * (1 - c.discountPercent / 100)));
}

// prettier-ignore
const PART_ROWS = [
  // DC cable, sold by the metre
  ['4mmÂ² single-core solar cable (red)',  'Cables',       'per metre',  1850, '4mm'],
  ['6mmÂ² single-core solar cable (red)',  'Cables',       'per metre',  2650, '6mm'],
  ['10mmÂ² single-core solar cable (red)', 'Cables',       'per metre',  4200, '10mm'],
  ['16mmÂ² battery cable (flex)',          'Cables',       'per metre',  9800, '16mm'],
  ['25mmÂ² battery cable (flex)',          'Cables',       'per metre', 15400, '25mm'],
  ['35mmÂ² battery cable (flex)',          'Cables',       'per metre', 21500, '35mm'],
  ['50mmÂ² battery cable (flex)',          'Cables',       'per metre', 30800, '50mm'],
  ['2.5mmÂ² AC cable (single)',            'Cables',       'per metre',  1100, '2.5mm'],
  ['4mmÂ² AC cable (single)',              'Cables',       'per metre',  1700, '4mm'],

  // DC protection
  ['16A 550V DC fuse + holder',           'DC Protection', 'each',      3200, '16A'],
  ['32A 550V DC fuse + holder',           'DC Protection', 'each',      4600, '32A'],
  ['63A 550V DC fuse + holder',           'DC Protection', 'each',      7400, '63A'],
  ['80A DC isolator switch',              'DC Protection', 'each',     18500, '80A'],
  ['125A DC isolator switch',             'DC Protection', 'each',     24000, '125A'],
  ['250A DC moulded-case breaker',        'DC Protection', 'each',     62000, '250A'],
  ['DC SPD type 2 (1000V)',                'DC Protection', 'each',     34000, '1000V'],

  // AC protection & distribution
  ['63A single-phase AC isolator',        'AC Protection', 'each',     14500, '63A'],
  ['100A three-phase AC isolator',        'AC Protection', 'each',     28500, '100A'],
  ['32A single-phase MCB',                'AC Protection', 'each',      2400, '32A'],
  ['63A single-phase MCB',                'AC Protection', 'each',      3200, '63A'],
  ['100A three-phase MCCB',               'AC Protection', 'each',     34000, '100A'],
  ['30mA RCD / RCCB 2P',                  'AC Protection', 'each',     12500, '30mA'],
  ['AC SPD type 2',                        'AC Protection', 'each',     31000, 'AC'],
  ['Surge protection board (assembled)',  'AC Protection', 'each',     85000, 'board'],

  // Connectors, glands & terminations
  ['MC4 connector pair (IP68)',           'Connectors',   'pair',      1450, 'MC4'],
  ['MC4 Y-branch connector',             'Connectors',   'each',      3200, 'MC4'],
  ['MC4 crimping tool',                   'Connectors',   'each',     18500, 'tool'],
  ['Cable gland M20 (pack of 10)',        'Connectors',   'pack',      2800, 'M20'],
  ['Cable gland M25 (pack of 10)',        'Connectors',   'pack',      3400, 'M25'],
  ['Ring lug 25mmÂ² (pair)',               'Connectors',   'pair',      2600, '25mm'],
  ['Battery inter-connect lead',          'Connectors',   'each',      9800, 'lead'],

  // Mounting, racking & consumables
  ['Aluminium mounting rail (2m)',        'Mounting',     'each',     18500, 'rail'],
  ['Roof hook set (pair)',                'Mounting',     'pair',     12000, 'hook'],
  ['Panel end clamp',                     'Mounting',     'each',      1200, 'clamp'],
  ['Panel mid clamp',                     'Mounting',     'each',       900, 'clamp'],
  ['Roof sealant / bitumen tape (roll)',  'Mounting',     'roll',      8500, 'tape'],
  ['Earth rod 1.2m + clamp + lug',        'Mounting',     'set',      14500, 'earth'],
  ['Earth pit (pre-cast)',                'Mounting',     'each',     11000, 'pit'],
  ['Cable tie 200mm (pack of 100)',       'Consumables',  'pack',       900, '200mm'],
  ['Ducting / trunking 40x40 (2m)',       'Consumables',  'length',    2600, '40x40'],
  ['Spiral wrap 12mm (5m)',               'Consumables',  'roll',      1200, '12mm'],
  ['Insulating tape (roll)',              'Consumables',  'roll',       800, 'tape'],
  ['Label kit (100 markers)',             'Consumables',  'pack',      6500, 'label'],
];

const slug = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

export const PART_CATEGORIES = [...new Set(PART_ROWS.map((r) => r[1]))];

/** Starter spare-parts catalogue, shaped like any other catalog product. */
export const PARTS = PART_ROWS.map(([name, category, unit, price, gauge], i) => ({
  id: `part-${slug(name)}-${i}`,
  kind: 'part',
  category: 'part',
  subCategory: category,
  name,
  brand: 'Generic',
  // A part is consumed by the job, not sized by it: no meaningful load draw, so
  // `watts` is 0 and the sizing engine must skip it. See isPart().
  watts: 0,
  unit,
  gauge,
  indicativePriceNGN: price,
  // Parts commonly exist in grades, so they default to allowing conditions.
  allowCondition: true,
  spec: `${category} Â· ${unit}`,
}));

export const isPart = (product) => product?.kind === 'part';

/** Parts grouped by sub-category, with counts. */
export function partGroups() {
  return PART_CATEGORIES.map((c) => ({
    id: slug(c),
    label: c,
    count: PARTS.filter((p) => p.subCategory === c).length,
  }));
}

export default PARTS;
