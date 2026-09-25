/**
 * Product Detail Sheet
 * ---------------------------------------------------------------------------
 * Bottom sheet showing one catalog item. In Professional mode it exposes the
 * full technical specification; in Simple mode it shows only the number a
 * homeowner cares about — what it draws, and what it costs to run.
 */
import React, { useEffect } from 'react';
import {
  X, Plus, Check, Lock, SlidersHorizontal, Zap, BatteryCharging, Sun, Laptop, Monitor, Plug, Wrench,
} from 'lucide-react';
import { PriceEditor } from './ProductEditor.jsx';
import { powerLabel, CATEGORY_LABELS } from '../data/catalog/index.js';
import { formatNaira } from '../utils/calculations.js';
import { ProductVisual } from './ProductVisual.jsx';

const ICONS = {
  inverter: Zap, battery: BatteryCharging, panel: Sun,
  laptop: Laptop, desktop: Monitor, appliance: Plug,
  part: Wrench,
};

/** Technical spec rows, per product kind. */
function specRows(p) {
  const s = p.specs || {};
  switch (p.kind) {
    case 'inverter':
      return [
        ['Rated output', `${(p.watts / 1000).toFixed(1)} kW`],
        ['Surge capacity', `${(p.surgeVA / 1000).toFixed(1)} kVA`],
        ['Topology', s.topology],
        ['Phase', s.phase],
        ['MPPT window', s.mpptV ? `${s.mpptV} V` : null],
        ['Max PV voltage', s.maxVocV ? `${s.maxVocV} V` : null],
        ['Max PV current', s.maxPvAmps ? `${s.maxPvAmps} A` : null],
        ['Battery voltage', s.batteryV ? `${s.batteryV} V` : null],
        ['Warranty', s.warrantyYears ? `${s.warrantyYears} years` : null],
      ];
    case 'battery':
      return [
        ['Energy', `${p.energyKWh} kWh`],
        ['Nominal voltage', `${s.nominalVoltage} V`],
        ['Max charge', `${s.maxChargeAmps} A`],
        ['Max discharge', `${s.maxDischargeAmps} A`],
        ['Max power out', `${(s.maxPowerW / 1000).toFixed(1)} kW`],
        ['Chemistry', s.chemistry],
        ['Cycle life', s.cycleLife ? `${s.cycleLife.toLocaleString()} cycles` : null],
        ['Usable depth', s.depthOfDischarge ? `${Math.round(s.depthOfDischarge * 100)}%` : null],
      ];
    case 'panel':
      return [
        ['Nameplate', `${p.watts} Wp`],
        ['Cell type', s.cellType],
        ['Efficiency', s.efficiencyPct ? `${s.efficiencyPct}%` : null],
        ['Voc', s.vocV ? `${s.vocV} V` : null],
        ['Vmp', s.vmpV ? `${s.vmpV} V` : null],
        ['Isc', s.iscAmps ? `${s.iscAmps} A` : null],
        ['Bifacial', s.bifacial ? 'Yes' : 'No'],
        ['Warranty', s.warrantyYears ? `${s.warrantyYears} years` : null],
      ];
    case 'laptop':
      return [
        ['Power draw', `${p.watts} W`],
        ['Processor', s.cpu],
        ['Screen', s.displayInches ? `${s.displayInches}"` : null],
        ['Battery', s.batteryWh ? `${s.batteryWh} Wh` : null],
        ['Standby', s.standbyWatts ? `${s.standbyWatts} W` : null],
        ['Class', s.group],
      ];
    case 'desktop':
      return [
        ['Power draw', `${p.watts} W`],
        ['Processor', s.cpu],
        ['Graphics', s.gpuWatts ? `${s.gpuWatts} W` : 'Integrated'],
        ['Form factor', s.formFactor],
        ['Display outputs', s.displayOutputs],
        ['Class', s.group],
      ];
    default:
      return [
        ['Power draw', `${p.watts} W`],
        ['Surge draw', p.surgeWatts ? `${p.surgeWatts} W` : null],
        ['Typical day', s.hoursDay ? `${s.hoursDay} hrs` : null],
        ['Typical night', s.hoursNight ? `${s.hoursNight} hrs` : null],
        ['Category', CATEGORY_LABELS[p.category]],
        ['Type', s.group],
      ];
  }
}

/** Continuous hours a day this product runs — used for the simple-mode cost. */
function typicalDailyHours(p) {
  const s = p.specs || {};
  if (typeof s.hoursDay === 'number' && typeof s.hoursNight === 'number') {
    return s.hoursDay + s.hoursNight;
  }
  if (p.kind === 'laptop' || p.kind === 'desktop') return 10;
  if (p.kind === 'inverter' || p.kind === 'battery' || p.kind === 'panel') return 0;
  return 8;
}


export function ProductDetail({
  product, isSimple, currentQty = 0, onClose, onAddLoad, onLockedAdd,
  canEdit = false, isOverridden = false, onSetPrice, onResetPrice, onEditProduct,
}) {
  const [editingPrice, setEditingPrice] = useState(false);
  // Lock background scroll while the sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Escape to close — expected behaviour for a modal surface
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const Icon = ICONS[product.kind] || Plug;
  const isLoad = product.kind !== 'panel' && product.kind !== 'battery';
  const hours = typicalDailyHours(product);
  const dailyKWh = isLoad ? (product.watts * hours) / 1000 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close product details"
        onClick={onClose}
        className="absolute inset-0 bg-scrim"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${product.brand} ${product.name}`}
        className="relative w-full max-w-2xl bg-surface rounded-t-3xl shadow-lift sq-rise max-h-[88vh] flex flex-col"
      >
        <div className="relative h-32 w-full shrink-0 rounded-t-3xl overflow-hidden">
          <ProductVisual product={product} size="lg" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-11 h-11 rounded-full bg-scrim text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-accent">
            {product.brand} · {CATEGORY_LABELS[product.category] || product.category}
          </p>
          <h2 className="text-lg font-extrabold tracking-tight mt-1 leading-tight">
            {product.name}
          </h2>

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-ink-3" />
              <span className="text-xl font-extrabold tnum">{powerLabel(product)}</span>
            </div>
            {product.indicativePriceNGN > 0 && (
              <button
                type="button"
                onClick={() => setEditingPrice((v) => !v)}
                aria-expanded={editingPrice}
                className="flex items-center gap-1.5 text-sm font-bold text-ink-2 tnum"
              >
                {formatNaira(product.indicativePriceNGN)}
                {canEdit && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent">
                    {isOverridden ? 'yours' : 'edit'}
                  </span>
                )}
              </button>
            )}
          </div>

          {isSimple ? (
            <div className="mt-4 sq-card p-4 bg-surface-2 border-0">
              <p className="sq-label">What it costs to run</p>
              {isLoad && dailyKWh > 0 ? (
                <>
                  <p className="text-2xl font-extrabold tnum mt-1.5">
                    {dailyKWh.toFixed(2)} <span className="text-sm">kWh / day</span>
                  </p>
                  <p className="text-xs text-ink-3 font-semibold mt-1">
                    Based on ~{hours} hours of use per day
                  </p>
                </>
              ) : (
                <p className="text-sm text-ink-2 font-semibold mt-1.5">
                  {product.kind === 'panel'
                    ? 'Produces power — it is part of the system, not a running cost.'
                    : 'Stores power for later use.'}
                </p>
              )}
            </div>
          ) : (
            <SpecGrid rows={specRows(product)} />
          )}

          <p className="text-[11px] text-ink-3 font-semibold mt-4 leading-relaxed">
            {product.custom
              ? 'This is one of your own products. Your price is used wherever it appears in a quote.'
              : 'Prices are indicative 2026 street rates and change with the market. Confirm with your supplier before ordering. Power figures are measured or manufacturer-rated values used for sizing.'}
          </p>

          {canEdit && product.custom && onEditProduct && (
            <button
              type="button"
              onClick={() => onEditProduct(product)}
              className="sq-btn sq-btn-ghost w-full mt-3"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Edit this product
            </button>
          )}
        </div>

        {canEdit && editingPrice && onSetPrice && (
          <PriceEditor
            price={product.indicativePriceNGN}
            onSave={(v) => onSetPrice(product.id, v)}
            onReset={() => onResetPrice(product.id)}
            onClose={() => setEditingPrice(false)}
          />
        )}

        {isLoad && (onAddLoad || onLockedAdd) && (
          <div className="p-4 sq-safe-b border-t border-line shrink-0 space-y-2">
            {onAddLoad ? (
              <button
                type="button"
                onClick={() => { onAddLoad(product); onClose(); }}
                className="sq-btn sq-btn-primary w-full"
              >
                {currentQty > 0 ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {currentQty > 0
                  ? `Add another (${currentQty} in quote)`
                  : 'Add to my quote'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { onLockedAdd(); onClose(); }}
                  className="sq-btn sq-btn-ghost w-full"
                >
                  <Lock className="w-4 h-4" />
                  Upgrade to add this to a quote
                </button>
                <p className="text-[11px] text-ink-3 font-semibold text-center">
                  Browsing the catalog is free. Adding hardware to a quotation is a
                  paid feature.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Two-column key/value grid; null values are skipped. */
function SpecGrid({ rows }) {
  const visible = rows.filter(([, v]) => v !== null && v !== undefined && v !== '');
  return (
    <dl className="mt-4 grid grid-cols-2 gap-2">
      {visible.map(([k, v]) => (
        <div key={k} className="p-2.5 rounded-xl bg-surface-2">
          <dt className="text-[10px] font-extrabold uppercase tracking-wider text-ink-3">
            {k}
          </dt>
          <dd className="text-xs font-bold text-ink mt-0.5 tnum break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default ProductDetail;
