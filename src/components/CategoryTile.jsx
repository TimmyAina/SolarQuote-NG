/**
 * Category tile
 * ---------------------------------------------------------------------------
 * A solid-surface glyph for a catalogue SECTION (Inverters, Batteries, ...).
 *
 * Distinct from ProductVisual, which renders a manufacturer's identity. The
 * home screen's section cards were passing their section label into
 * ProductVisual's `brand` prop; getBrand() then missed, the fallback painted
 * the initials "IN" in the accent colour on a 12%-alpha wash, and the result
 * measured 3.2:1 — a decorative glyph should never be the unreadable part.
 *
 * A solid surface plus a full-strength glyph is legible in both themes and
 * needs no text at all, because the card already states the section name.
 */
import React from 'react';
import { Zap, BatteryCharging, Sun, Laptop, Monitor, Plug, Wrench } from 'lucide-react';

const GLYPH = {
  inverter: Zap,
  battery: BatteryCharging,
  panel: Sun,
  laptop: Laptop,
  desktop: Monitor,
  appliance: Plug,
  part: Wrench,
};

export function CategoryTile({ kind, className = '' }) {
  const Icon = GLYPH[kind] || Plug;
  return (
    <div
      className={`w-full h-full flex items-center justify-center ${className}`}
      style={{ background: 'var(--sq-accent-soft)' }}
      aria-hidden="true"
    >
      <Icon className="w-5 h-5" style={{ color: 'var(--sq-accent)' }} strokeWidth={2.25} />
    </div>
  );
}

export default CategoryTile;