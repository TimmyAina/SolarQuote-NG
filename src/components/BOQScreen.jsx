/**
 * BOQ Screen
 * ---------------------------------------------------------------------------
 * Turns the sizing result into something a client can sign, and contrasts the
 * solar running cost against what they pay for grid + generator today.
 *
 * Simple mode shows the headline number and the saving. Professional mode adds
 * the margin control, cable/breaker specification and roof loading.
 */
import React, { useState } from 'react';
import {
  Zap, BatteryCharging, Sun, Eye, EyeOff, FileDown, TrendingDown, ShieldCheck,
  Lock, Wallet, AlertCircle, User,
} from 'lucide-react';
import { formatNaira } from '../utils/calculations.js';
import { exportPDF } from '../utils/pdfExport.js';
import { generateBOQReport } from '../utils/pdfGenerator.js';
import { formatDate } from '../utils/date.js';
import { useApp } from '../context/AppContext.jsx';

const TIER_LABELS = ['Economy', 'Standard', 'Premium'];

export function BOQScreen({
  calcResult, costs, isSimple, selectedTierIndex, setSelectedTierIndex,
  installerMarkup, setInstallerMarkup, settings, quoteNumber,
  onBack, onOpenWallet,
}) {
  const { canUse, chargeGeneration, balance, planId, generationPrice } = useApp();
  const [showMargin, setShowMargin] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [billingError, setBillingError] = useState(null);
  const [client, setClient] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const tier = calcResult.tiers[selectedTierIndex];
  const hasLoad = calcResult.hasLoad;

  // Feature gates
  const allowPdf = canUse('pdf_export');
  const allowMargin = canUse('margin_control');
  const allowTier = canUse('tier_selection');
  const allowSpec = canUse('technical_spec');
  const allowRunning = canUse('running_costs');
  const isSubscriber = planId === 'limited' || planId === 'unlimited';
  const canAfford = isSubscriber || balance >= generationPrice;

  const handleExport = async () => {
    setExportError(null);
    setBillingError(null);

    if (!allowPdf) {
      setBillingError('Your plan does not include branded PDF quotations.');
      return;
    }
    // Charge first: a generation is a paid action, so it must not be free when
    // the export later fails to render.
    const charge = chargeGeneration(quoteNumber);
    if (!charge.ok) {
      setBillingError(charge.error);
      return;
    }

    setExporting(true);
    try {
      const doc = generateBOQReport({
        calcResult,
        selectedTierIndex,
        settings,
        clientName: client.name || 'Valued Client',
        clientPhone: client.phone || settings.installerPhone,
        clientAddress: client.address || 'Nigeria',
        quoteNumber,
      });
      await exportPDF(doc, `SolarQuote-${quoteNumber}`);
    } catch (err) {
      setExportError(err?.message || 'Could not create the PDF on this device.');
    } finally {
      setExporting(false);
    }
  };

  if (!hasLoad) {
    return (
      <div className="sq-card p-8 text-center pb-28">
        <p className="font-extrabold text-sm">Add some loads first</p>
        <p className="text-xs text-ink-3 font-semibold mt-1 mb-4">
          A bill of quantities needs appliances to size against.
        </p>
        <button type="button" onClick={onBack} className="sq-btn sq-btn-primary">
          Go to my loads
        </button>
      </div>
    );
  }


  const boqItems = [
    { title: 'Solar PV Array', desc: `${tier.panelWatt} W panels Â· ${tier.panelCount} units`, cost: tier.panelCost },
    { title: 'Hybrid Inverter', desc: tier.inverterBrand, cost: tier.inverterCost },
    { title: 'LiFePOâ‚„ Battery Bank', desc: `${tier.batteryBrand} Â· ${tier.batteryCycles}`, cost: tier.batteryCost },
    { title: 'Balance of System', desc: 'Cabling, breakers, surge protection, enclosures', cost: tier.bosCost + tier.protectionCost },
    { title: 'Installation & Logistics', desc: 'Certified labour and commissioning', cost: tier.installationFee },
  ];


  return (
    <div className="space-y-5 pb-28">
      {/* Quote header â€” numbering starts at zero */}
      <section className="sq-card p-4 flex items-center justify-between">
        <div>
          <p className="sq-label">Quote</p>
          <p className="text-2xl font-extrabold tnum mt-0.5">#{quoteNumber}</p>
          <p className="text-[11px] text-ink-3 font-semibold mt-0.5">{formatDate()}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
          <Zap className="w-6 h-6" />
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {[
          { icon: Zap, label: 'Inverter', value: calcResult.recommendedInverterKVA, unit: 'kW' },
          { icon: BatteryCharging, label: 'Battery', value: calcResult.recommendedBatteryKWh, unit: 'kWh' },
          { icon: Sun, label: 'Panels', value: tier.actualSolarKW, unit: 'kWp' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="sq-card p-3 text-center">
              <Icon className="w-4 h-4 text-accent mx-auto" />
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-3 mt-1.5">
                {m.label}
              </p>
              <p className="text-base font-extrabold tnum mt-0.5">
                {m.value}
                <span className="text-[11px] text-ink-3 ml-0.5">{m.unit}</span>
              </p>
            </div>
          );
        })}
      </section>

      {/* Client details — part of "create the quotation" */}
      <section className="sq-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-accent" />
          <p className="text-sm font-extrabold">Client &amp; site</p>
        </div>
        <div className="space-y-2">
          {[
            { key: 'name', label: 'Client name', placeholder: 'Alhaji S. Adeleke' },
            { key: 'phone', label: 'Phone', placeholder: '+234 800 000 0000' },
            { key: 'address', label: 'Site address', placeholder: 'Plot 14, Trans-Amadi, PH' },
          ].map((f) => (
            <label key={f.key} className="block">
              <span className="sq-label">{f.label}</span>
              <input
                type="text"
                value={client[f.key]}
                onChange={(e) => setClient((c) => ({ ...c, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="sq-input mt-1"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Running cost comparison */}
      <section className="sq-card p-4">
        <p className="sq-label">Running cost comparison</p>
        {allowRunning ? (
          <>
            <div className="mt-3 space-y-2">
              <CompareRow
            label="Grid + generator today"
            value={costs.monthlyTotal}
            tone="danger"
            note={`${formatNaira(costs.effectiveCostPerKWh)}/kWh effective`}
          />
          <CompareRow
            label="With this solar system"
            value={Math.round(calcResult.economics.fiveYearSolarCost / 60)}
            tone="ok"
            note={`Payback ~${calcResult.economics.paybackMonths} months`}
          />
        </div>

        <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-ok-soft">
          <TrendingDown className="w-4 h-4 text-ok shrink-0" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-ok">
              You keep every month
            </p>
            <p className="text-sm font-extrabold tnum text-ink mt-0.5">
              {formatNaira(
                Math.max(
                  0,
                  costs.monthlyTotal - Math.round(calcResult.economics.fiveYearSolarCost / 60)
                )
              )}
            </p>
          </div>
        </div>
          </>
        ) : (
          <LockedNote label="Running-cost comparison & payback period" />
        )}
      </section>

      {/* Tier selection */}
      <section>
        <p className="sq-label mb-2">Equipment tier</p>
        {allowTier ? (
          <div className="grid grid-cols-3 gap-2">
          {TIER_LABELS.map((label, idx) => {
            const active = selectedTierIndex === idx;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedTierIndex(idx)}
                aria-pressed={active}
                className={`p-3 rounded-card border-2 text-left transition-colors ${
                  active
                    ? 'border-accent bg-accent-soft'
                    : 'border-line bg-surface hover:border-line-strong'
                }`}
              >
                <p className="text-[11px] font-extrabold">{label}</p>
                <p className="text-xs font-extrabold tnum mt-1">
                  {formatNaira(calcResult.tiers[idx].totalCost)}
                </p>
              </button>
            );
          })}
          </div>
        ) : (
          <div className="sq-card p-4">
            <p className="text-xs font-bold text-ink-2">
              {TIER_LABELS[selectedTierIndex]} package
            </p>
            <p className="text-base font-extrabold tnum mt-1">
              {formatNaira(tier.totalCost)}
            </p>
            <div className="mt-2">
              <LockedNote label="Switching between Economy, Standard and Premium" compact />
            </div>
          </div>
        )}
      </section>

      {/* Margin section: professional mode AND an entitled plan */}
      {!isSimple && allowMargin && (
        <section className="sq-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="sq-label">Your margin (private)</span>
              <button
                type="button"
                onClick={() => setShowMargin((v) => !v)}
                aria-label={showMargin ? 'Hide margin amount' : 'Show margin amount'}
                className="text-ink-3"
              >
                {showMargin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-xs font-extrabold tnum text-accent">{installerMarkup}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="40"
            value={installerMarkup}
            onChange={(e) => setInstallerMarkup(Number(e.target.value))}
            aria-label="Installer markup percentage"
            className="w-full accent-[var(--sq-accent)] cursor-pointer"
          />
          {showMargin && (
            <p className="text-xs font-extrabold text-ok tnum mt-2">
              +{formatNaira(tier.installerProfit)} net
            </p>
          )}
        </section>
      )}

      {!isSimple && !allowMargin && (
        <section className="sq-card p-4">
          <LockedNote label="Installer margin control & profit readout" />
        </section>
      )}

      {/* Bill of quantities */}
      <section className="sq-card p-4">
        <p className="text-sm font-extrabold pb-3 border-b border-line">Bill of quantities</p>
        <div className="divide-y divide-line">
          {boqItems.map((item) => (
            <div key={item.title} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink">{item.title}</p>
                <p className="text-[11px] text-ink-3 font-semibold truncate">{item.desc}</p>
              </div>
              <span className="text-xs font-extrabold tnum shrink-0">
                {formatNaira(item.cost)}
              </span>
            </div>
          ))}
        </div>
        <div className="pt-3 mt-1 border-t border-line flex items-center justify-between">
          <span className="text-xs font-extrabold text-ink-2">Total investment</span>
          <span className="text-base font-extrabold tnum text-accent">
            {formatNaira(tier.totalCost)}
          </span>
        </div>
      </section>

      {/* Technical spec: professional mode AND an entitled plan */}
      {!isSimple && allowSpec && (
        <section className="sq-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <p className="text-sm font-extrabold">Installation specification</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['DC battery cable', calcResult.technicalSafety?.recommendedDCCable],
              ['Battery breaker', calcResult.technicalSafety?.recommendedDCBreaker],
              ['AC surge', calcResult.technicalSafety?.recommendedACSurge],
              ['DC surge', calcResult.technicalSafety?.recommendedDCSurge],
              ['Roof area', `${tier.roofSpecs?.areaM2} mÂ²`],
              ['Panel load', `${tier.roofSpecs?.weightKg} kg`],
            ].map(([k, v]) => (
              <div key={k} className="p-2.5 rounded-xl bg-surface-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-3">
                  {k}
                </p>
                <p className="text-xs font-bold tnum mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isSimple && !allowSpec && (
        <section className="sq-card p-4">
          <LockedNote label="Cable gauges, breakers, surge protection & roof loading" />
        </section>
      )}

      {exportError && (
        <p className="flex items-start gap-2 text-xs font-bold text-danger bg-danger-soft p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          {exportError}
        </p>
      )}

      {billingError && (
        <p className="flex items-start gap-2 text-xs font-bold text-danger bg-danger-soft p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          {billingError}
        </p>
      )}

      {/* Generate: one paid action on PAYG, free on a subscription */}
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="sq-btn sq-btn-primary w-full"
      >
        <FileDown className="w-4 h-4" />
        {exporting
          ? 'Preparing…'
          : isSubscriber
            ? 'Send quote to client'
            : `Generate quotation · ${formatNaira(generationPrice)}`}
      </button>

      {onOpenWallet && (!allowPdf || !canAfford) && (
        <button type="button" onClick={onOpenWallet} className="sq-btn sq-btn-ghost w-full">
          <Wallet className="w-4 h-4" />
          {allowPdf ? 'Top up to generate' : 'See plans & top up'}
        </button>
      )}

      <p className="text-[11px] text-ink-3 font-semibold text-center">
        {isSubscriber
          ? 'Included in your subscription — no charge per quotation.'
          : `Each quotation costs ${formatNaira(generationPrice)} from your wallet.`}
      </p>
    </div>
  );
}

/** Consistent "this is not on your plan" affordance. */
function LockedNote({ label, compact = false }) {
  return (
    <div className={`flex items-start gap-2.5 rounded-xl bg-warn-soft ${compact ? 'p-2' : 'p-3'}`}>
      <Lock className="w-4 h-4 text-warn shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-bold text-ink-2">{label}</p>
        <p className="text-[11px] text-ink-3 font-semibold mt-0.5">
          Not included in your plan. Upgrade to unlock.
        </p>
      </div>
    </div>
  );
}

function CompareRow({ label, value, tone, note }) {
  const color = tone === 'ok' ? 'text-ok' : 'text-danger';
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-2">
      <div className="min-w-0">
        <p className="text-xs font-bold text-ink-2">{label}</p>
        <p className="text-[11px] text-ink-3 font-semibold">{note}</p>
      </div>
      <span className={`text-sm font-extrabold tnum shrink-0 ${color}`}>
        {formatNaira(value)}
      </span>
    </div>
  );
}

export default BOQScreen;
