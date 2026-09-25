/**
 * Loads Screen
 * ---------------------------------------------------------------------------
 * The list of things a site runs. Two entry routes:
 *   - pick a facility preset for a fast, sane starting point
 *   - browse the 395-item catalog and add exact models
 *
 * Simple mode shows counts and running watts. Professional mode adds editable
 * wattages, day/night hours and surge figures.
 */
import React, { useMemo } from 'react';
import {
  MapPin, Plus, Trash2, Building2, Home, Landmark, Briefcase, Grid3X3,
  Zap, TrendingUp, ArrowRight,
} from 'lucide-react';
import { PROFILE_PRESETS, NIGERIAN_CITIES } from '../data/pricingDefaults.js';
import { ALL_PRODUCTS } from '../data/catalog/index.js';

const PRESET_ICONS = {
  school: Building2,
  home_3bed: Home,
  office: Briefcase,
  custom: Grid3X3,
};

/** Resolves a load id to its catalog record for name/brand display. */
const PRODUCT_BY_ID = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));

export function LoadsScreen({
  appliances, setAppliances, selectedPreset, applyPreset,
  selectedCity, setSelectedCity, isSimple, calcResult, onBrowse, onContinue,
}) {
  // Merge load lines with their catalog records so the UI always shows the
  // real product name and brand, not a bare id.
  const rows = useMemo(
    () =>
      appliances
        .map((a) => ({ ...a, product: PRODUCT_BY_ID.get(a.id) }))
        .filter((a) => a.qty > 0 || a.product),
    [appliances]
  );

  const totalWatts = rows.reduce((s, a) => s + (a.qty || 0) * (a.watts || 0), 0);
  const totalCount = rows.reduce((s, a) => s + (a.qty || 0), 0);
  const hasLoad = totalWatts > 0;

  const setQty = (id, qty) =>
    setAppliances((prev) =>
      qty <= 0
        ? prev.filter((a) => a.id !== id)
        : prev.map((a) => (a.id === id ? { ...a, qty } : a))
    );

  const setField = (id, field, value) =>
    setAppliances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: Number(value) || 0 } : a))
    );

  return (
    <div className="space-y-5 pb-28">
      {/* Region */}
      <section className="sq-card p-4">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="sq-label">Installation region</p>
            <select
              value={selectedCity.name}
              onChange={(e) => {
                const city = NIGERIAN_CITIES.find((c) => c.name === e.target.value);
                if (city) setSelectedCity(city);
              }}
              className="w-full bg-transparent text-sm font-extrabold mt-0.5 outline-none"
            >
              {NIGERIAN_CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} — {c.sunHours} sun hrs
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Presets */}
      <section>
        <p className="sq-label mb-2">Start from a template</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PROFILE_PRESETS.map((p) => {
            const Icon = PRESET_ICONS[p.id] || Grid3X3;
            const active = selectedPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                aria-pressed={active}
                className={`p-3 rounded-card border-2 text-left transition-colors ${
                  active
                    ? 'border-accent bg-accent-soft'
                    : 'border-line bg-surface hover:border-line-strong'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-accent' : 'text-ink-3'}`} />
                <p className="text-[11px] font-extrabold mt-1.5 leading-tight">{p.name}</p>
                <p className="text-[10px] text-ink-3 font-semibold mt-0.5 line-clamp-2">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>


      {/* Live totals */}
      <section className="sq-card p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-extrabold tnum">{(totalWatts / 1000).toFixed(2)} kW</p>
            <p className="text-[11px] text-ink-3 font-semibold">
              {totalCount} item{totalCount === 1 ? '' : 's'} · {calcResult.totalDailyKWh} kWh/day
            </p>
          </div>
        </div>
        <button type="button" onClick={onBrowse} className="sq-btn sq-btn-ghost shrink-0">
          <Plus className="w-4 h-4" />
          Add items
        </button>
      </section>

      {rows.length === 0 ? (
        <section className="sq-card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-2 text-ink-3 mx-auto flex items-center justify-center mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <p className="font-extrabold text-sm">Nothing added yet</p>
          <p className="text-xs text-ink-3 font-semibold mt-1 mb-4">
            Pick a template above, or browse the catalog.
          </p>
          <button type="button" onClick={onBrowse} className="sq-btn sq-btn-primary">
            <Grid3X3 className="w-4 h-4" />
            Browse catalog
          </button>
        </section>
      ) : (
        <section className="space-y-2">
          {rows.map((a) => (
            <LoadRow
              key={a.id}
              item={a}
              isSimple={isSimple}
              onQty={(q) => setQty(a.id, q)}
              onField={(f, v) => setField(a.id, f, v)}
            />
          ))}
        </section>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={!hasLoad}
        className="sq-btn sq-btn-primary w-full"
      >
        Continue to BOQ
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function LoadRow({ item, isSimple, onQty, onField }) {
  const p = item.product;
  const name = p?.name || item.name || item.id;
  const watts = p?.watts ?? item.watts ?? 0;

  return (
    <div className="sq-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {p?.brand && (
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-accent">
              {p.brand}
            </p>
          )}
          <p className="text-xs font-bold text-ink leading-tight">{name}</p>
          <p className="text-[11px] text-ink-3 font-semibold mt-0.5 tnum">
            {watts} W each
            {item.surgeWatts ? ` · ${item.surgeWatts} W surge` : ''}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onQty((item.qty || 0) - 1)}
            aria-label={`Remove one ${name}`}
            className="w-9 h-9 rounded-lg border border-line bg-surface-2 text-ink-2 flex items-center justify-center"
          >
            {item.qty <= 1 ? <Trash2 className="w-3.5 h-3.5" /> : '−'}
          </button>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={item.qty || 0}
            onChange={(e) => onQty(Number(e.target.value))}
            aria-label={`Quantity of ${name}`}
            className="w-12 h-9 rounded-lg border border-line bg-surface text-center text-xs font-extrabold tnum outline-none"
          />
          <button
            type="button"
            onClick={() => onQty((item.qty || 0) + 1)}
            aria-label={`Add one ${name}`}
            className="w-9 h-9 rounded-lg bg-accent text-accent-fg flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Pro mode: editable engineering inputs */}
      {!isSimple && (
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-line">
          {[
            { label: 'Watts', field: 'watts' },
            { label: 'Day hrs', field: 'hoursDay' },
            { label: 'Night hrs', field: 'hoursNight' },
          ].map((f) => (
            <label key={f.field} className="block">
              <span className="sq-label">{f.label}</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={item[f.field] ?? 0}
                onChange={(e) => onField(f.field, e.target.value)}
                className="w-full h-9 mt-1 px-2 rounded-lg border border-line bg-surface-2 text-xs font-bold tnum outline-none"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default LoadsScreen;
