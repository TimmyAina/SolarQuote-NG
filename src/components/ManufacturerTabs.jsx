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
import { groupingFor } from '../data/brands.js';
import { Plug, Wrench, Sun, Zap, BatteryCharging, Laptop, Monitor, Lightbulb } from 'lucide-react';

const ALL_GROUPS = '__all__';

/** A glyph per category, so an unbranded tab is still identifiable. */
const CATEGORY_ICON = {
  lighting: Lightbulb, cooling: Zap, refrigeration: BatteryCharging, kitchen: Plug,
  computing: Laptop, entertainment: Monitor, security: Lightbulb, pumps: Wrench,
  part: Wrench, inverter: Zap, battery: BatteryCharging, panel: Sun,
};

export function ManufacturerTabs({ products, kind, selected, onSelect }) {
  const scroller = useRef(null);
  // Branded sections group by manufacturer; unbranded ones fall back to
  // category, so the tab bar is never empty.
  const groups = groupingFor(products, kind);
  const total = products.length;

  // Keep the active tab in view when it changes from outside (e.g. a search hit).
  useEffect(() => {
    const el = scroller.current?.querySelector('[data-active="true"]');
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selected]);

  if (groups.length <= 1) return null;

  const tabs = [
    { key: ALL_GROUPS, label: 'All', count: total, all: true },
    ...groups,
  ];
  const axis = groups[0].isCategory ? 'category' : 'manufacturer';

  return (
    <div
      ref={scroller}
      role="tablist"
      aria-label={`Filter by ${axis}`}
      className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4 scrollbar-none"
      style={{ scrollbarWidth: 'none' }}
    >
      {tabs.map((g) => {
        const active = (selected || ALL_GROUPS) === g.key;
        const Icon = CATEGORY_ICON[g.name];
        return (
          <button
            key={g.key}
            type="button"
            role="tab"
            data-active={active}
            aria-selected={active}
            onClick={() => onSelect(g.all ? null : g.name)}
            className={`shrink-0 snap-start min-h-[48px] inline-flex items-center gap-2 px-3 rounded-2xl border-2 transition-colors ${
              active
                ? 'border-accent bg-accent-soft'
                : 'border-line bg-surface hover:border-line-strong'
            }`}
          >
            {g.all ? null : g.isCategory || !g.logo ? (
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${g.color}1A`, color: g.color }}
                aria-hidden="true"
              >
                {Icon ? <Icon className="w-3.5 h-3.5" strokeWidth={2} /> : null}
              </span>
            ) : (
              <BrandMark brand={g.name} size="xs" />
            )}
            <span className="text-left leading-tight">
              <span
                className={`block text-xs font-extrabold max-w-[104px] truncate ${
                  active ? 'text-accent' : 'text-ink'
                }`}
              >
                {g.label}
              </span>
              <span className="block text-[10px] font-semibold text-ink-3">{g.count}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Sticky header naming the current group and its product count. */
export function BrandHeader({ brand, count, axis = 'manufacturer' }) {
  if (!brand) return null;
  const label = String(brand).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="flex items-center gap-3 px-4 pb-2">
      <BrandMark brand={brand} size="md" />
      <div className="min-w-0">
        <p className="text-sm font-extrabold truncate">{label}</p>
        <p className="text-[11px] text-ink-3 font-semibold">
          {count} {count === 1 ? 'product' : 'products'}
        </p>
      </div>
    </div>
  );
}

export default ManufacturerTabs;
