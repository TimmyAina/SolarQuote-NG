/**
 * Product Editor â€” add or edit one of your own products
 * ---------------------------------------------------------------------------
 * A single form for both create and edit. Fields change with the product kind,
 * because the sizing axis differs: a battery is specified in kWh, an inverter in
 * rated watts plus surge, a panel in watts, and a load in draw watts.
 *
 * Validation mirrors data/userCatalog.js so the form can show a precise message
 * instead of silently dropping the product.
 */
import React, { useState } from 'react';
import { X, Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import { ADDABLE_KINDS } from '../data/userCatalog.js';
import { formatNaira } from '../utils/calculations.js';

/** Which extra fields each kind needs, with sane hints. */
const FIELDS = {
  inverter: [
    { key: 'watts', label: 'Rated output (W)', type: 'number', hint: 'Continuous output, e.g. 6000' },
    { key: 'surgeVA', label: 'Surge capacity (VA)', type: 'number', hint: 'Leave blank for 2Ã— rated' },
    { key: 'phase', label: 'Phase', type: 'text', hint: 'Single-Phase / Three-Phase' },
    { key: 'topology', label: 'Topology', type: 'text', hint: 'Hybrid / Off-grid / String' },
  ],
  battery: [
    { key: 'energyKWh', label: 'Storage (kWh)', type: 'number', hint: 'e.g. 10.5' },
    { key: 'volts', label: 'Bus voltage (V)', type: 'number', hint: 'Usually 48' },
    { key: 'chemistry', label: 'Chemistry', type: 'text', hint: 'LiFePO4 / NMC / Lead-Acid' },
  ],
  panel: [
    { key: 'watts', label: 'Panel output (W)', type: 'number', hint: 'e.g. 450' },
    { key: 'cellType', label: 'Cell type', type: 'text', hint: 'Mono PERC / N-Type' },
  ],
  laptop: [{ key: 'watts', label: 'Wall draw (W)', type: 'number', hint: 'Measured at the plug' }],
  desktop: [{ key: 'watts', label: 'Wall draw (W)', type: 'number', hint: 'Measured at the plug' }],
  appliance: [{ key: 'watts', label: 'Power draw (W)', type: 'number', hint: 'Nameplate rating' }],
};

const BLANK = {
  kind: 'inverter', name: '', brand: '', priceNGN: '',
  watts: '', surgeVA: '', phase: '', topology: '',
  energyKWh: '', volts: '48', chemistry: 'LiFePO4', cellType: 'Mono PERC',
};

export function ProductEditor({ product, onSave, onDelete, onClose }) {
  const editing = Boolean(product?.custom);
  const [form, setForm] = useState(() =>
    product
      ? {
          ...BLANK,
          ...product,
          priceNGN: product.indicativePriceNGN ?? '',
          energyKWh: product.energyKWh ?? '',
          surgeVA: product.surgeVA ?? '',
        }
      : BLANK
  );
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = () => {
    setError(null);
    const res = onSave(form);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    // Let the confirmation register before the sheet closes.
    setTimeout(onClose, 550);
  };

  const fields = FIELDS[form.kind] || FIELDS.appliance;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/50" />

      <div className="relative w-full sm:max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl shadow-card flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-line shrink-0">
          <p className="text-sm font-extrabold">
            {editing ? 'Edit your product' : 'Add your own product'}
          </p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-3">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div>
            <span className="sq-label">Type</span>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {ADDABLE_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, kind: k.id }))}
                  aria-pressed={form.kind === k.id}
                  className={`sq-btn text-[11px] ${form.kind === k.id ? 'sq-btn-primary' : 'sq-btn-ghost'}`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="sq-label">Model / name</span>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. SunPower 6K Hybrid"
              className="sq-input mt-1"
            />
          </label>

          <label className="block">
            <span className="sq-label">Brand</span>
            <input
              type="text"
              value={form.brand}
              onChange={set('brand')}
              placeholder="e.g. SunPower"
              className="sq-input mt-1"
            />
          </label>

          <label className="block">
            <span className="sq-label">Your price (â‚¦)</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={form.priceNGN}
              onChange={set('priceNGN')}
              placeholder="e.g. 1450000"
              className="sq-input tnum mt-1"
            />
          </label>

          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="sq-label">{f.label}</span>
              <input
                type={f.type}
                inputMode={f.type === 'number' ? 'numeric' : 'text'}
                value={form[f.key] ?? ''}
                onChange={set(f.key)}
                placeholder={f.hint}
                className="sq-input tnum mt-1"
              />
            </label>
          ))}
        </div>

        {error && (
          <p className="mx-4 mb-2 flex items-start gap-2 text-xs font-bold text-danger bg-danger-soft p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            {error}
          </p>
        )}

        <div className="p-4 border-t border-line shrink-0 flex gap-2 sq-safe-b">
          {editing && (
            <button
              type="button"
              onClick={() => { onDelete(product.id); onClose(); }}
              className="sq-btn sq-btn-ghost shrink-0"
              aria-label="Delete product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={submit} className="sq-btn sq-btn-primary flex-1">
            {saved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {saved ? 'Saved' : editing ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Small inline price editor used on the product detail sheet. */
export function PriceEditor({ price, onSave, onReset, onClose }) {
  const [value, setValue] = useState(String(price ?? ''));
  const [error, setError] = useState(null);

  const submit = () => {
    setError(null);
    const res = onSave(Number(value));
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onClose();
  };

  return (
    <div className="p-4 border-t border-line shrink-0 space-y-2">
      <p className="sq-label">Your price for this product</p>
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Override price in naira"
          className="sq-input tnum"
        />
        <button type="button" onClick={submit} className="sq-btn sq-btn-primary shrink-0">
          <Check className="w-4 h-4" />
          Save
        </button>
      </div>
      {error && <p className="text-[11px] font-bold text-danger">{error}</p>}
      <button
        type="button"
        onClick={() => { onReset(); onClose(); }}
        className="text-[11px] font-bold text-ink-3 underline"
      >
        Reset to catalog price
      </button>
      <p className="text-[11px] text-ink-3 font-semibold">
        Currently {formatNaira(price)} â€” overrides apply to every quote.
      </p>
    </div>
  );
}

export default ProductEditor;
