/**
 * Home Dashboard
 * ---------------------------------------------------------------------------
 * The answer to "what does power cost me?" in one screen: today's running cost
 * broken into grid vs generator, with the solar alternative next to it.
 *
 * Simple mode leads with money and hours; Professional mode adds the full
 * engineering sizing read-out.
 */
import React from 'react';
import {
  Sun, Wallet, TrendingDown, Fuel, Bolt, ArrowRight, Plus,
} from 'lucide-react';
import { formatNaira } from '../utils/calculations.js';
import { CategoryTile } from './CategoryTile.jsx';
import { ProductVisual } from './ProductVisual.jsx';
import { CATALOG_SECTIONS } from '../data/catalog/index.js';

export function HomeScreen({ costs, calcResult, quoteNumber, onNavigate }) {
  const hasLoad = calcResult.hasLoad;

  return (
    <div className="space-y-5 pb-28">
      {/* Running cost hero */}
      <section className="sq-card overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-accent" />
            <p className="sq-label">What your power costs today</p>
          </div>

          {hasLoad ? (
            <>
              <p className="text-4xl font-extrabold tracking-tight tnum mt-2 leading-none">
                {formatNaira(costs.monthlyTotal)}
              </p>
              <p className="text-xs text-ink-3 font-semibold mt-1.5">
                per month · {costs.dailyKWh} kWh/day
              </p>

              {/* Where the energy comes from */}
              <div className="flex h-2.5 rounded-full overflow-hidden mt-4 bg-surface-2">
                <div className="bg-accent" style={{ width: `${costs.gridShare * 100}%` }} />
                <div className="bg-sun flex-1" />
              </div>
              <div className="flex justify-between mt-2 text-[11px] font-bold">
                <span className="text-accent tnum">
                  Grid {Math.round(costs.gridShare * 100)}% · {formatNaira(costs.monthlyGridCost)}
                </span>
                <span className="text-sun tnum">
                  Gen {Math.round(costs.genShare * 100)}% · {formatNaira(costs.monthlyGenCost)}
                </span>
              </div>

              {/* The counter-intuitive insight, stated plainly */}
              <div className="mt-4 p-3 rounded-xl bg-warn-soft">
                <div className="flex items-start gap-2.5">
                  <Bolt className="w-4 h-4 text-warn shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-extrabold text-warn uppercase tracking-wider">
                      Why this matters
                    </p>
                    <p className="text-xs text-ink-2 font-semibold mt-1 leading-relaxed">
                      You actually pay {formatNaira(costs.effectiveCostPerKWh)} per kWh, not
                      the {formatNaira(costs.tariffPerKWh)} grid rate — the generator covers
                      the hours the grid misses.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-2 text-ink-3 mx-auto flex items-center justify-center mb-3">
                <Plus className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-sm">No appliances added yet</p>
              <p className="text-xs text-ink-3 font-semibold mt-1">
                Add what this site runs to see its running cost.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className="sq-btn sq-btn-primary mt-4"
              >
                Browse the catalog
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>


      {/* System sizing */}
      {hasLoad && (
        <section className="sq-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-accent" />
            <p className="sq-label">System you need</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Inverter', value: calcResult.recommendedInverterKVA, unit: 'kW' },
              { label: 'Battery', value: calcResult.recommendedBatteryKWh, unit: 'kWh' },
              { label: 'Panels', value: calcResult.tiers[1].actualSolarKW, unit: 'kWp' },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-xl bg-surface-2 text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-3">
                  {m.label}
                </p>
                <p className="text-base font-extrabold tnum mt-1">
                  {m.value}
                  <span className="text-[11px] text-ink-3 ml-0.5">{m.unit}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 p-3 rounded-xl bg-ok-soft">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-ok" />
              <span className="text-xs font-bold text-ink-2">With solar</span>
            </div>
            <span className="text-sm font-extrabold text-ok tnum">
              {formatNaira(Math.round(calcResult.economics.fiveYearSolarCost / 60))} / mo
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('boq')}
            className="sq-btn sq-btn-ghost w-full mt-3"
          >
            View full BOQ
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      )}

      {/* Fuel & tariff reference */}
      <section className="sq-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Fuel className="w-4 h-4 text-accent" />
          <p className="sq-label">Energy prices in use</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Fuel', value: costs.fuelPricePerLitre, unit: '/litre' },
            { label: 'Grid tariff', value: costs.tariffPerKWh, unit: '/kWh' },
          ].map((m) => (
            <div key={m.label} className="p-3 rounded-xl bg-surface-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-3">
                {m.label}
              </p>
              <p className="text-base font-extrabold tnum mt-1">
                {formatNaira(m.value)}
                <span className="text-[11px] text-ink-3 ml-0.5">{m.unit}</span>
              </p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-ink-3 font-semibold mt-2">
          Update these any time in Settings.
        </p>
      </section>

      {/* Quote number — strictly zero-based */}
      <section className="sq-card p-4 flex items-center justify-between gap-3">
        <div>
          <p className="sq-label">Quote number</p>
          <p className="text-2xl font-extrabold tnum mt-1">#{quoteNumber}</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('boq')}
          className="sq-btn sq-btn-primary shrink-0"
        >
          Build quote
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Category shortcuts */}
      <section>
        <p className="sq-label mb-2">Browse by category</p>
        <div className="grid grid-cols-3 gap-2">
          {CATALOG_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onNavigate('catalog', s.id)}
              className="sq-card p-3 text-left hover:shadow-lift transition-shadow"
            >
              <div className="h-12 rounded-lg overflow-hidden mb-2">
                {/* This is a CATEGORY tile, not a manufacturer one. It used to
                    pass the section label as `brand`, so getBrand() missed and
                    the fallback painted the initials "IN" in the accent colour
                    on a 12%-alpha wash — 3.2:1, under the 4.5:1 floor. A
                    category glyph on a solid surface is both correct and
                    legible. */}
                <CategoryTile kind={s.id} />
              </div>
              <p className="text-[11px] font-extrabold leading-tight">{s.shortLabel}</p>
              <p className="text-[10px] text-ink-3 font-bold tnum">{s.count} items</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomeScreen;
