/**
 * Product Visual
 * ---------------------------------------------------------------------------
 * Renders a product image when one is bundled, and otherwise builds a tile from
 * the product's own data: the manufacturer's REAL logo when one exists, else the
 * brand's own colour with its name, plus a category glyph.
 *
 * Why not hotlink photos? Retailer/manufacturer URLs break, hotlink-block, and
 * fail offline — which on a tablet in the field means a catalogue full of broken
 * image boxes. A generated tile is always present, always on-brand, zero bytes
 * of network, and can be replaced with a real photo simply by setting `image`
 * on a catalog row.
 *
 * Why the brand registry? An earlier version hashed the brand NAME into an
 * arbitrary hue and painted a single letter, which meant every Deye product
 * looked identical and none of them matched the emerald design system — while
 * the manufacturer tabs right above showed the real logos. The tabs and the
 * cards now share one source of truth.
 */
import React from 'react';
import { Zap, BatteryCharging, Sun, Laptop, Monitor, Plug, Wrench } from 'lucide-react';
import { getBrand } from '../data/brands.js';

const GLYPH = {
  inverter: Zap,
  battery: BatteryCharging,
  panel: Sun,
  laptop: Laptop,
  desktop: Monitor,
  appliance: Plug,
  part: Wrench,
};

/** Up to two letters from the meaningful words of a brand name. */
function initialsFor(name = '') {
  const words = String(name)
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * @param showBrand  Render the brand initials inside the tile. True by default
 *   because most call sites (product sheet, home highlights) have no adjacent
 *   brand badge. The catalogue grid sets it to false: the card already overlays
 *   a <BrandMark> badge, and showing "DE" twice on one card read as a glitch.
 */
export function ProductVisual({ product, size = 'md', className = '', showBrand = true }) {
  const Icon = GLYPH[product.kind] || Plug;
  const brandName = product.brand || 'SolarQuote';
  const brand = getBrand(brandName);
  // The brand's real colour, not a hash of its name, so the tile belongs to the
  // same palette as the rest of the app.
  const tint = brand?.color || 'var(--sq-accent)';

  if (product.image) {
    return (
      <img
        src={product.image}
        alt={`${brandName} ${product.name}`}
        loading="lazy"
        className={`object-cover w-full h-full ${className}`}
      />
    );
  }

  const dim = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs';
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  const pad = size === 'sm' ? 'p-2' : size === 'lg' ? 'p-5' : 'p-3';

  // A real bundled logo gets a clean tile, so it is recognisable at a glance.
  if (brand?.logo) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${className}`}
        style={{ background: `linear-gradient(135deg, ${tint}14, ${tint}2E)` }}
      >
        <img
          src={brand.logo}
          alt={`${brandName} logo`}
          loading="lazy"
          className={`object-contain ${size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-16 h-16' : 'w-9 h-9'}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${pad} ${className}`}
      style={{
        // A light wash of the brand colour. Deliberately a *surface*, not a
        // foreground: the brand hue is painted at full opacity below so the
        // initials stay legible. Previously the tile used the brand colour as the
        // text colour at 80% opacity, which measured 3.73:1 on the dark theme —
        // below the 4.5:1 floor for small text.
        background: `linear-gradient(135deg, ${tint}26, ${tint}4D)`,
        color: tint,
      }}
    >
      <Icon className={iconSize} strokeWidth={1.75} aria-hidden="true" />
      {showBrand && (
        <span
          className={`absolute bottom-2 right-2 font-extrabold leading-none ${dim}`}
          style={{ color: tint, opacity: 1 }}
          aria-hidden="true"
        >
          {initialsFor(brandName)}
        </span>
      )}
    </div>
  );
}

export default ProductVisual;
