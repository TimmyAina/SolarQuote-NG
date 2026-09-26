/**
 * Settings Screen
 * ---------------------------------------------------------------------------
 * Three groups:
 *   - Appearance: light / dark / system theme, and Simple vs Professional mode
 *   - Energy prices: petrol, diesel and the grid tariff, so a quote never goes
 *     stale when pump prices move
 *   - Business details: the installer identity printed on every PDF
 */
import React from 'react';
import {
  Sun, Moon, Monitor as MonitorIcon, User, Wrench, Fuel, Zap, Building2, Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { GRID_BANDS, DISCOS } from '../data/pricingDefaults.js';
import { tariffForBand } from '../utils/energyCosts.js';
import { formatNaira } from '../utils/calculations.js';

const THEMES = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'Auto', icon: MonitorIcon },
];

const MODES = [
  { id: 'simple', label: 'Simple', icon: User, blurb: 'Plain language & costs' },
  { id: 'pro', label: 'Professional', icon: Wrench, blurb: 'Full engineering detail' },
];

export function SettingsScreen({ onOpenWallet }) {
  const {
    settings, setSettings, setThemeMode, setExperienceMode, quoteCounter,
    plan, planId, balance, planDaysLeft, generationPrice,
  } = useApp();

  const patch = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  // Selecting a band re-derives the tariff and supply hours together, so the
  // two can never contradict each other.
  const applyBand = (bandId) => {
    const band = GRID_BANDS.find((b) => b.id === bandId) || GRID_BANDS[0];
    setSettings((s) => ({
      ...s,
      discoBand: band.id,
      discoTariffPerKWh: tariffForBand(band.id, s.discoId),
      gridHoursPerDay: band.hoursPerDay,
    }));
  };

  return (
    <div className="space-y-6 pb-28">
      <Section title="Plan &amp; billing" icon={Wallet}>
        <button
          type="button"
          onClick={onOpenWallet}
          className="w-full flex items-center justify-between gap-3 p-3 rounded-card border border-line bg-surface-2 hover:border-line-strong transition-colors text-left"
        >
          <div className="min-w-0">
            <p className="text-sm font-extrabold">{plan.name}</p>
            <p className="text-[11px] text-ink-3 font-semibold mt-0.5">
              {planId === 'free'
                ? `Pay ${formatNaira(generationPrice)} per quotation`
                : `${planDaysLeft} day${planDaysLeft === 1 ? '' : 's'} remaining`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-extrabold tnum text-accent">{formatNaira(balance)}</p>
            <p className="text-[10px] text-ink-3 font-bold">balance</p>
          </div>
        </button>
      </Section>

      <Section title="Appearance" icon={Sun}>
        <p className="sq-label mb-2">Theme</p>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeMode(t.id)}
                aria-pressed={settings.themeMode === t.id}
                className={`sq-btn ${settings.themeMode === t.id ? 'sq-btn-primary' : 'sq-btn-ghost'}`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <p className="sq-label mt-5 mb-2">Detail level</p>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setExperienceMode(m.id)}
                aria-pressed={settings.experienceMode === m.id}
                className={`p-3 rounded-card border-2 text-left transition-colors ${
                  settings.experienceMode === m.id
                    ? 'border-accent bg-accent-soft'
                    : 'border-line bg-surface hover:border-line-strong'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${settings.experienceMode === m.id ? 'text-accent' : 'text-ink-3'}`}
                />
                <p className="text-xs font-extrabold mt-1.5">{m.label}</p>
                <p className="text-[11px] text-ink-3 font-semibold mt-0.5">{m.blurb}</p>
              </button>
            );
          })}
        </div>
      </Section>


      <Section title="Energy Prices" icon={Fuel}>
        <p className="text-[11px] text-ink-3 font-semibold mb-3 leading-relaxed">
          These drive every running-cost figure. Update them when pump prices move.
        </p>

        <NumberField
          label="Petrol (₦ / litre)"
          value={settings.petrolPricePerLiter}
          onChange={(v) => patch('petrolPricePerLiter', v)}
        />
        <NumberField
          label="Diesel (₦ / litre)"
          value={settings.dieselPricePerLiter}
          onChange={(v) => patch('dieselPricePerLiter', v)}
        />
        <NumberField
          label="Kerosene (₦ / litre)"
          value={settings.kerosenePricePerLiter}
          onChange={(v) => patch('kerosenePricePerLiter', v)}
        />
        <NumberField
          label="Cooking gas (₦ / kg)"
          value={settings.lpgPricePerKg}
          onChange={(v) => patch('lpgPricePerKg', v)}
        />

        <p className="sq-label">Electricity distribution company</p>
        <select
            aria-label="Electricity distribution company"
          value={settings.discoId}
          onChange={(e) => patch('discoId', e.target.value)}
          className="sq-input"
        >
          {DISCOS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <p className="sq-label">Supply band</p>
        <div className="grid grid-cols-5 gap-1.5">
          {GRID_BANDS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => applyBand(b.id)}
              aria-pressed={settings.discoBand === b.id}
              className="sq-chip justify-center"
              data-active={settings.discoBand === b.id}
            >
              {b.id}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-ink-3 font-semibold">
          {GRID_BANDS.find((b) => b.id === settings.discoBand)?.note}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Tariff (₦ / kWh)"
            value={settings.discoTariffPerKWh}
            step="0.5"
            onChange={(v) => patch('discoTariffPerKWh', v)}
          />
          <NumberField
            label="Grid hours / day"
            value={settings.gridHoursPerDay}
            onChange={(v) => patch('gridHoursPerDay', v)}
          />
        </div>

        <p className="sq-label">Generator fuel</p>
        <div className="grid grid-cols-2 gap-2">
          {['diesel', 'petrol'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => patch('generatorFuelType', f)}
              aria-pressed={settings.generatorFuelType === f}
              className={`sq-btn capitalize ${settings.generatorFuelType === f ? 'sq-btn-primary' : 'sq-btn-ghost'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Your Business" icon={Building2}>
        <TextField
          label="Company name"
          value={settings.installerName}
          onChange={(v) => patch('installerName', v)}
        />
        <TextField
          label="Phone"
          value={settings.installerPhone}
          onChange={(v) => patch('installerPhone', v)}
          type="tel"
        />
        <TextField
          label="Email"
          value={settings.installerEmail}
          onChange={(v) => patch('installerEmail', v)}
          type="email"
        />
        <TextField
          label="Address"
          value={settings.installerAddress}
          onChange={(v) => patch('installerAddress', v)}
        />
      </Section>

      <Section title="Quotes" icon={Zap}>
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2">
          <div>
            <p className="text-xs font-extrabold">Next quote number</p>
            <p className="text-[11px] text-ink-3 font-semibold mt-0.5">
              Counting starts at zero
            </p>
          </div>
          <span className="text-2xl font-extrabold tnum text-accent">#{quoteCounter}</span>
        </div>
      </Section>

      <p className="text-center text-[11px] text-ink-3 font-semibold">
        SolarQuote NG · Works offline
      </p>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="sq-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-extrabold mb-4">
        <Icon className="w-4 h-4 text-accent" />
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function NumberField({ label, value, onChange, step = '1' }) {
  return (
    <label className="block">
      <span className="sq-label">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sq-input mt-1 tnum"
      />
    </label>
  );
}

function TextField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="sq-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sq-input mt-1"
      />
    </label>
  );
}

export default SettingsScreen;
