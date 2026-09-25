/**
 * ManufacturerTabs
 * ---------------------------------------------------------------------------
 * The producer tab bar. Every product in a section is made by a manufacturer, so
 * browsing by "who made it" is the natural axis for an installer — they think in
 * Deye vs Sunsynk, not in "inverter, 58 items".
 *
 * Horizontally scrollable with snap, 48px minimum touch targets, and a count on
 * each tab so the installer can see where the depth is before tapping.
 */
import React, { useRef, useEffect } from 'react';
import { BrandMark } from './BrandMark.jsx';
import { brandsForKind } from '../data/brands.js';

const ALL_BRANDS = '__all__';

export function ManufacturerTabs({ products, kind, selected, onSelect }) {
  const scroller = useRef(null);
  const brands = brandsForKind(products, kind);
  const total = products.length;

  // Keep the active tab in view when it changes from outside (e.g. a search hit).
  useEffect(() => {
    const el = scroller.current?.querySelector('[data-active="true"]');
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selected]);

  if (brands.length <= 1) return null;

  const tabs = [{ name: 'All', slug: ALL_BRANDS, color: '#059669', count: total, all: true }, ...brands];

  return (
    <div
      ref={scroller}
      role="tablist"
      aria-label="Filter by manufacturer"
      className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4 scrollbar-none"
      style={{ scrollbarWidth: 'none' }}
    >
      {tabs.map((b) => {
        const active = (selected || ALL_BRANDS) === b.slug;
        return (
          <button
            key={b.slug}
            type="button"
            role="tab"
            data-active={active}
            aria-selected={active}
            onClick={() => onSelect(b.all ? null : b.name)}
            className={`shrink-0 snap-start min-h-[48px] inline-flex items-center gap-2 px-3 rounded-2xl border-2 transition-colors ${
              active
                ? 'border-accent bg-accent-soft'
                : 'border-line bg-surface hover:border-line-strong'
            }`}
          >
            {!b.all && <BrandMark brand={b.name} size="xs" />}
            <span className="text-left leading-tight">
              <span
                className={`block text-xs font-extrabold max-w-[104px] truncate ${
                  active ? 'text-accent' : 'text-ink'
                }`}
              >
                {b.name}
              </span>
              <span className="block text-[10px] font-semibold text-ink-3">{b.count}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Sticky header naming the current manufacturer and its product count. */
export function BrandHeader({ brand, count }) {
  if (!brand) return null;
  return (
    <div className="flex items-center gap-3 px-4 pb-2">
      <BrandMark brand={brand} size="md" />
      <div className="min-w-0">
        <p className="text-sm font-extrabold truncate">{brand}</p>
        <p className="text-[11px] text-ink-3 font-semibold">
          {count} {count === 1 ? 'product' : 'products'}
        </p>
      </div>
    </div>
  );
}

export default ManufacturerTabs;
