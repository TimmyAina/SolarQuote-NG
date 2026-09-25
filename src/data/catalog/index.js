/**
 * Unified Product Catalog
 * ---------------------------------------------------------------------------
 * Aggregates every dataset behind one searchable index used by the Catalog tab.
 *
 * Design notes:
 *  - POWER is the searchable, comparable axis. `watts` means different things
 *    per kind (consumption for loads, nameplate output for panels, rated output
 *    for inverters), so `searchableWatts()` + `powerLabel()` normalise the
 *    display without lying about the value.
 *  - Images: each entry carries an optional `image`. Where no bundled photo is
 *    available the UI renders a branded SVG tile built from the brand name and
 *    category, so the catalog never shows a broken-image box or needs the
 *    network. Real manufacturer/retailer photos can be dropped in later by
 *    setting `image` without any code change.
 *  - USER DATA: the shipped lists below are immutable. The user's own products
 *    and their price overrides are layered on at read time by
 *    `mergeUserCatalog()`, so an override can never mutate a shipped row.
 */
import { INVERTERS, INVERTER_BRANDS } from './inverters.js';
import { BATTERIES, BATTERY_BRANDS } from './batteries.js';
import { LAPTOPS, LAPTOP_BRANDS } from './laptops.js';
import { DESKTOPS, DESKTOP_BRANDS } from './desktops.js';
import { PANELS, PANEL_BRANDS } from './panels.js';
import { APPLIANCES, APPLIANCE_CATEGORIES } from './appliances.js';
import { effectivePrice } from '../userCatalog.js';

/** The six top-level catalog sections, in the order installers browse them. */
export const CATALOG_SECTIONS = [
  {
    id: 'inverter',
    label: 'Inverters',
    shortLabel: 'Inverters',
    icon: 'Zap',
    blurb: 'Hybrid, off-grid and grid-tie inverters with true surge ratings.',
    count: INVERTERS.length,
  },
  {
    id: 'battery',
    label: 'Batteries',
    shortLabel: 'Batteries',
    icon: 'BatteryCharging',
    blurb: '48V LiFePO4 racks and wall modules with real max discharge current.',
    count: BATTERIES.length,
  },
  {
    id: 'panel',
    label: 'Solar Panels',
    shortLabel: 'Panels',
    icon: 'Sun',
    blurb: 'Mono PERC, N-Type and thin-film modules in the local market.',
    count: PANELS.length,
  },
  {
    id: 'laptop',
    label: 'Laptops',
    shortLabel: 'Laptops',
    icon: 'Laptop',
    blurb: 'Business, student and gaming machines with measured wall draw.',
    count: LAPTOPS.length,
  },
  {
    id: 'desktop',
    label: 'Desktops',
    shortLabel: 'Desktops',
    icon: 'Monitor',
    blurb: 'Office, workstation, server and gaming towers and all-in-ones.',
    count: DESKTOPS.length,
  },
  {
    id: 'appliance',
    label: 'Appliances',
    shortLabel: 'Appliances',
    icon: 'Plug',
    blurb: 'Everyday household, commercial and medical load you quote daily.',
    count: APPLIANCES.length,
  },
];

/** Section metadata with the user's own products counted in. */
export function sectionsWithUserCounts(userCatalog) {
  const custom = userCatalog?.customProducts || [];
  return CATALOG_SECTIONS.map((s) => ({
    ...s,
    count: s.count + custom.filter((p) => p.kind === s.id).length,
    customCount: custom.filter((p) => p.kind === s.id).length,
  }));
}

/**
 * Layers the user's own products and price overrides onto the shipped catalog.
 * Returns a NEW array; the shipped datasets are never mutated.
 */
export function mergeUserCatalog(userCatalog) {
  const custom = userCatalog?.customProducts || [];
  if (!custom.length) return ALL_PRODUCTS;
  // User products first so they are easy to find; overrides are applied on read.
  return [...custom, ...ALL_PRODUCTS];
}

/** Applies price overrides to a merged list for display. */
export function applyPriceOverrides(products, userCatalog) {
  if (!userCatalog || !Object.keys(userCatalog.priceOverrides || {}).length) return products;
  return products.map((p) => ({ ...p, indicativePriceNGN: effectivePrice(p, userCatalog) }));
}

export const ALL_PRODUCTS = [
  ...INVERTERS,
  ...BATTERIES,
  ...PANELS,
  ...LAPTOPS,
  ...DESKTOPS,
  ...APPLIANCES,
];

export const ALL_BRANDS = [
  ...INVERTER_BRANDS,
  ...BATTERY_BRANDS,
  ...PANEL_BRANDS,
  ...LAPTOP_BRANDS,
  ...DESKTOP_BRANDS,
].sort((a, b) => a.localeCompare(b));

/** Every distinct brand across all datasets, including appliances. */
export const EVERY_BRANDS = [
  ...new Set(ALL_PRODUCTS.map((p) => p.brand).filter(Boolean)),
].sort((a, b) => a.localeCompare(b));

export const TOTAL_PRODUCT_COUNT = ALL_PRODUCTS.length;

/** Products that consume power, i.e. everything except panels and batteries. */
export const LOAD_PRODUCTS = ALL_PRODUCTS.filter(
  (p) => p.kind !== 'panel' && p.kind !== 'battery'
);

/** Normalised wattage for search/sort; batteries use their discharge power. */
export function searchableWatts(p) {
  if (p.kind === 'battery') return p.specs?.maxPowerW || 0;
  return p.watts || 0;
}

/** Human-readable power figure, honest about what the number represents. */
export function powerLabel(p) {
  if (p.kind === 'battery') {
    return `${p.energyKWh} kWh`;
  }
  if (p.kind === 'panel') {
    return `${p.watts} Wp`;
  }
  if (p.kind === 'inverter') {
    return `${(p.watts / 1000).toFixed(1).replace(/\.0$/, '')} kW`;
  }
  return `${p.watts} W`;
}

/** Short unit suffix used next to the number. */
export function powerUnit(p) {
  if (p.kind === 'battery') return 'storage';
  if (p.kind === 'panel') return 'output';
  if (p.kind === 'inverter') return 'rated';
  return 'draw';
}

export const CATEGORY_LABELS = {
  ...Object.fromEntries(APPLIANCE_CATEGORIES.map((c) => [c.id, c.label])),
  inverter: 'Inverters',
  battery: 'Batteries',
  panel: 'Solar Panels',
  laptop: 'Laptops',
  desktop: 'Desktops',
  appliance: 'Appliances',
};

/**
 * Case-insensitive search across name, brand, category label and a few specs.
 *
 * `products` defaults to the shipped catalog; the UI passes
 * `mergeUserCatalog(userCatalog)` so the user's own products are searchable too.
 * `sections` restricts results to the given kind ids when provided.
 */
export function searchCatalog(
  query,
  { sections = null, brand = null, products = ALL_PRODUCTS } = {}
) {
  const q = String(query || '').trim().toLowerCase();

  return products.filter((p) => {
    if (sections && sections.length && !sections.includes(p.kind)) return false;
    if (brand && p.brand !== brand) return false;
    if (!q) return true;

    const haystack = [
      p.name,
      p.brand,
      CATEGORY_LABELS[p.category] || p.category,
      p.specs?.group,
      p.specs?.cpu,
      p.specs?.cellType,
      p.specs?.chemistry,
      p.specs?.formFactor,
      p.specs?.topology,
      p.specs?.phase,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}

export { INVERTERS, BATTERIES, PANELS, LAPTOPS, DESKTOPS, APPLIANCES };
export { APPLIANCE_CATEGORIES };
