/**
 * Product Visual
 * ---------------------------------------------------------------------------
 * Renders a product image when one is bundled, and otherwise draws a branded
 * tile from the product's own data (brand initials + category glyph + name).
 *
 * Why not hotlink photos? Retailer/manufacturer URLs break, hotlink-block, and
 * fail offline — which on a tablet in the field means a catalogue full of broken
 * image boxes. A generated tile is always present, always on-brand, zero bytes
 * of network, and can be replaced with a real photo simply by setting `image`
 * on a catalog row.
 */
import React from 'react';
import { Zap, BatteryCharging, Sun, Laptop, Monitor, Plug } from 'lucide-react';

const GLYPH = {
  inverter: Zap,
  battery: BatteryCharging,
  panel: Sun,
  laptop: Laptop,
  desktop: Monitor,
  appliance: Plug,
};

/** Stable hue per brand so the same brand always gets the same tile colour. */
function hueFor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) % 360;
  }
  return h;
}

const initials = (brand = '') =>
  brand
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export function ProductVisual({ product, size = 'md', className = '' }) {
  const Icon = GLYPH[product.kind] || Plug;
  const brand = product.brand || 'SolarQuote';
  const hue = hueFor(brand);

  if (product.image) {
    return (
      <img
        src={product.image}
        alt={`${brand} ${product.name}`}
        loading="lazy"
        className={`object-cover w-full h-full ${className}`}
      />
    );
  }

  const dim = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs';
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center gap-1.5 relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(140deg, hsl(${hue} 62% 46%), hsl(${(hue + 40) % 360} 58% 34%))`,
      }}
      role="img"
      aria-label={`${brand} ${product.name}`}
    >
      {/* soft highlight so the tile reads as a surface, not a flat swatch */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.28), transparent 60%)' }}
      />
      <Icon className={`${iconSize} text-white/95 relative`} strokeWidth={1.75} />
      <span className={`${dim} font-extrabold tracking-tight text-white relative`}>
        {initials(brand)}
      </span>
    </div>
  );
}

export default ProductVisual;
