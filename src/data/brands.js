/**
 * Brand Registry
 * ---------------------------------------------------------------------------
 * One entry per manufacturer in the catalog, and the single source of truth for:
 *   - the logo asset path (when a real one was bundled),
 *   - the official brand colour, used for the wordmark fallback and the accent
 *     on grouped product cards,
 *   - origin and category grouping for the manufacturer tab bar.
 *
 * `logo` is deliberately nullable. Logos are trademarked artwork and only a
 * subset is available under a reusable licence, so any brand without a bundled
 * asset falls back to a generated wordmark built from `name` + `color`. That
 * keeps the UI complete and offline-capable without inventing artwork.
 *
 * To add a real logo later: drop the file in `public/brands/` and re-run
 * `scripts/fetch-brand-logos.mjs` + `scripts/apply-brand-logos.mjs`.
 */
import { BRAND_LOGOS, WORDMARK_ONLY } from './brandLogos.generated.js';

/** @typedef {'inverter'|'battery'|'panel'|'laptop'|'desktop'|'appliance'} BrandKind */

const BRAND_ROWS = [
  // Inverters & hybrid
  { name: 'Deye', color: '#0B5FA5', origin: 'China', kind: 'inverter' },
  { name: 'Sunsynk', color: '#0E7C7B', origin: 'China', kind: 'inverter' },
  { name: 'Growatt', color: '#0057B8', origin: 'China', kind: 'inverter' },
  { name: 'Victron', color: '#005B9A', origin: 'Netherlands', kind: 'inverter' },
  { name: 'Sofar', color: '#1B5FA8', origin: 'China', kind: 'inverter' },
  { name: 'Megarevo', color: '#0F766E', origin: 'China', kind: 'inverter' },
  { name: 'Must', color: '#C2410C', origin: 'China', kind: 'inverter' },
  { name: 'PowMr', color: '#1D4ED8', origin: 'China', kind: 'inverter' },
  { name: 'Seraphim', color: '#B45309', origin: 'China', kind: 'inverter' },

  // Batteries & storage
  { name: 'Pylontech', color: '#0F766E', origin: 'China', kind: 'battery' },
  { name: 'Dyness', color: '#1E40AF', origin: 'China', kind: 'battery' },
  { name: 'Felicity', color: '#047857', origin: 'China', kind: 'battery' },
  { name: 'Luxpower', color: '#0E7490', origin: 'China', kind: 'battery' },
  { name: 'Revov', color: '#4338CA', origin: 'China', kind: 'battery' },
  { name: 'Shoto', color: '#0D9488', origin: 'China', kind: 'battery' },
  { name: 'Soltaro', color: '#0891B2', origin: 'China', kind: 'battery' },
  { name: 'Freedom Won', color: '#166534', origin: 'South Africa', kind: 'battery' },
  { name: 'Aolithium', color: '#1D4ED8', origin: 'China', kind: 'battery' },
  { name: 'Bluesun', color: '#0E7490', origin: 'China', kind: 'battery' },
  { name: 'Hubble', color: '#1D4ED8', origin: 'China', kind: 'battery' },

  // Solar panels
  { name: 'LONGi', color: '#0A6ED1', origin: 'China', kind: 'panel' },
  { name: 'Jinko Solar', color: '#E11D48', origin: 'China', kind: 'panel' },
  { name: 'Trina Solar', color: '#0EA5E9', origin: 'China', kind: 'panel' },
  { name: 'Canadian Solar', color: '#1D4ED8', origin: 'Canada', kind: 'panel' },
  { name: 'Risen', color: '#F59E0B', origin: 'China', kind: 'panel' },
  { name: 'First Solar', color: '#111827', origin: 'USA', kind: 'panel' },
  { name: 'Maxeon', color: '#DC2626', origin: 'USA/France', kind: 'panel' },
  { name: 'SunPower', color: '#1D4ED8', origin: 'USA', kind: 'panel' },
  { name: 'MPP Solar', color: '#0D9488', origin: 'Taiwan', kind: 'panel' },

  // Laptops & desktops
  { name: 'Apple', color: '#111827', origin: 'USA', kind: 'laptop' },
  { name: 'Dell', color: '#007DB8', origin: 'USA', kind: 'laptop' },
  { name: 'HP', color: '#0096D6', origin: 'USA', kind: 'laptop' },
  { name: 'HPE', color: '#E11D48', origin: 'USA', kind: 'desktop' },
  { name: 'Lenovo', color: '#E2231A', origin: 'China', kind: 'laptop' },
  { name: 'Acer', color: '#1F2937', origin: 'Taiwan', kind: 'laptop' },
  { name: 'Asus', color: '#00539B', origin: 'Taiwan', kind: 'laptop' },
  { name: 'Tesla', color: '#CC0000', origin: 'USA', kind: 'battery' },

  // Generic / tier placeholders
  { name: 'C&D', color: '#0F766E', origin: 'China', kind: 'battery' },
  { name: 'Generic', color: '#64748B', origin: '—', kind: 'appliance' },
  { name: 'Tier-1', color: '#475569', origin: '—', kind: 'panel' },
];

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** All brands, keyed by their catalog name (case-sensitive, as the data uses). */
export const BRANDS = BRAND_ROWS.map((b) => ({
  ...b,
  slug: slug(b.name),
  // Resolved from the generated lookup; null means "render a wordmark instead".
  logo: BRAND_LOGOS[b.name] || null,
  wordmarkOnly: (WORDMARK_ONLY || []).includes(b.name),
}));

const BY_NAME = new Map(BRANDS.map((b) => [b.name, b]));

/**
 * Look up a brand, tolerating case differences. Unknown brands get a stable
 * generated entry rather than undefined, so a new product never breaks a tile.
 */
export function getBrand(name) {
  if (!name) return null;
  if (BY_NAME.has(name)) return BY_NAME.get(name);
  const lower = String(name).toLowerCase();
  for (const b of BRANDS) {
    if (b.name.toLowerCase() === lower) return b;
  }
  return {
    name: String(name),
    slug: slug(name),
    color: '#64748B',
    origin: '—',
    kind: 'appliance',
    logo: null,
    unregistered: true,
  };
}

/** Brands that actually make the products of a given kind, with counts. */
export function brandsForKind(products, kind) {
  const counts = new Map();
  products
    .filter((p) => !kind || p.kind === kind)
    .forEach((p) => {
      if (!p.brand) return;
      counts.set(p.brand, (counts.get(p.brand) || 0) + 1);
    });
  return [...counts.entries()]
    .map(([name, count]) => ({ ...getBrand(name), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export default BRANDS;
