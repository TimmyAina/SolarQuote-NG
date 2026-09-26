/**
 * BrandMark
 * ---------------------------------------------------------------------------
 * Renders a manufacturer's identity: the bundled real logo when one exists,
 * otherwise a generated wordmark built from the brand's own name and official
 * colour.
 *
 * Why a fallback at all? Logos are trademarked artwork and only a subset is
 * available under a reusable licence. Rather than ship a broken-image box for
 * the other brands, we draw the brand name in its real colour. The result is
 * consistent, legible at 24px, needs no network, and costs zero bytes.
 *
 * The mark is transparent-background and monochrome-friendly: many real logos
 * are black artwork that would vanish on a dark surface, so the wrapper tints
 * the logo in light mode and leaves it alone in dark.
 */
import React from 'react';
import { getBrand } from '../data/brands.js';
import { useApp } from '../context/AppContext.jsx';
import { readableLabel } from '../utils/contrast.js';

const SIZES = {
  xs: { box: 'w-6 h-6', text: 'text-[8px]', pad: 'p-1' },
  sm: { box: 'w-8 h-8', text: 'text-[9px]', pad: 'p-1.5' },
  md: { box: 'w-11 h-11', text: 'text-[10px]', pad: 'p-2' },
  lg: { box: 'w-16 h-16', text: 'text-xs', pad: 'p-2.5' },
};

/** Up to two letters, taken from the meaningful words of the name. */
function initialsFor(name = '') {
  const words = String(name)
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** A short label that fits: full name, or the first word for long names. */
function labelFor(name = '', maxChars = 10) {
  const clean = String(name).trim();
  if (clean.length <= maxChars) return clean;
  return clean.split(/\s+/)[0].slice(0, maxChars);
}

export function BrandMark({ brand, size = 'md', className = '', showName = false }) {

  const b = getBrand(brand);
  if (!b) return null;

  const s = SIZES[size] || SIZES.md;
  const name = b.name;
  // The wash is identical in both themes, so the label must be solved per theme:
  // pushing it toward black is right on a light canvas and catastrophic on a
  // dark one, where it produced pure black on near-black (1.29:1, invisible).
  const isDark = useApp().isDark;

  if (b.logo) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${s.box} ${className}`}
        role="img"
        aria-label={name}
      >
        <img
          src={b.logo}
          alt=""
          loading="lazy"
          className={`w-full h-full object-contain ${s.pad}`}
          // Real logos are often pure-black artwork; on a light surface we tint
          // them to the brand colour so they read as part of the design system.
          style={{ color: b.color }}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-xl font-extrabold leading-none ${s.box} ${s.text} ${className}`}
      // The fill is a 10% wash of the brand colour, so the wash keeps the brand
      // identity. The LABEL is not the raw brand colour: a pale brand (Risen)
      // measured 1.91:1 on its own wash. labelOnWash() darkens only as far as
      // needed to clear 4.5:1, so the brand still reads as the brand.
      style={{
        background: `${b.color}1A`,
        color: readableLabel(b.color, isDark ? 'dark' : 'light'),
        boxShadow: `inset 0 0 0 1px ${b.color}33`,
      }}
      role="img"
      aria-label={name}
    >
      {initialsFor(name)}
    </span>
  );
}

/** The wordmark shown on the manufacturer tab and brand header rows. */
export function BrandWordmark({ brand, size = 'md', className = '', count }) {
  const b = getBrand(brand);
  if (!b) return null;
  const s = SIZES[size] || SIZES.md;
  const text = size === 'xs' ? 'text-[10px]' : size === 'lg' ? 'text-base' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BrandMark brand={b.name} size={size} />
      <span className="min-w-0">
        <span className={`block font-extrabold truncate ${text}`}>{labelFor(b.name, 16)}</span>
        {count !== undefined && (
          <span className="block text-[10px] text-ink-3 font-semibold">{count} items</span>
        )}
      </span>
    </span>
  );
}

export default BrandMark;
