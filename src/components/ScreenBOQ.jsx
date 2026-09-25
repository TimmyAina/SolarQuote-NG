import React from 'react';
import { Zap, BatteryCharging, Sun, TrendingDown, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { formatNaira } from '../utils/calculations';

export function ScreenBOQ({
  calcResult,
  selectedTierIndex,
  setSelectedTierIndex,
  onBack,
  onProceedToPDF
}) {
  const activeTier = calcResult.tiers[selectedTierIndex];

  return (
    <div className="space-y-6 pb-28">
      {/* Sizing Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Inverter</p>
          <p className="text-base font-bold text-white font-mono mt-0.5">
            {calcResult.recommendedInverterKVA} <span className="text-xs text-amber-400">kVA</span>
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Lithium</p>
          <p className="text-base font-bold text-white font-mono mt-0.5">
            {calcResult.recommendedBatteryKWh} <span className="text-xs text-emerald-400">kWh</span>
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Solar PV</p>
          <p className="text-base font-bold text-white font-mono mt-0.5">
            {activeTier.actualSolarKW} <span className="text-xs text-sky-400">kWp</span>
          </p>
        </div>
      </div>

      {/* Savings Highlight */}
      <div className="bg-emerald-950/60 border border-emerald-600/40 rounded-2xl p-4 shadow-lg">
        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          Monthly Power Cost Avoided
        </p>
        <h3 className="text-xl font-bold text-white font-mono mt-0.5">
          {formatNaira(calcResult.monthlySavings)} <span className="text-xs text-slate-400 font-sans">/ month</span>
        </h3>
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-emerald-800/40 text-xs">
          <div>
            <span className="text-slate-400">Est. Payback:</span>
            <p className="text-white font-bold font-mono">~{calcResult.paybackMonths} Months</p>
          </div>
          <div>
            <span className="text-slate-400">Gen Fuel Avoided:</span>
            <p className="text-amber-400 font-bold font-mono">{formatNaira(calcResult.monthlyFuelAvoided)}/mo</p>
          </div>
        </div>
      </div>

      {/* 3 Tier Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {calcResult.tiers.map((t, idx) => {
          const isSelected = selectedTierIndex === idx;
          return (
            <button
              key={t.tierKey}
              type="button"
              onClick={() => setSelectedTierIndex(idx)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">{t.name}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1">
                {formatNaira(t.totalCost)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{t.tag}</p>
            </button>
          );
        })}
      </div>

      {/* Itemized BOQ Breakdown */}
      <BOQTable tier={activeTier} calcResult={calcResult} />

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-4 z-30 max-w-2xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={onProceedToPDF}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <span>Generate Branded PDF</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function BOQTable({ tier, calcResult }) {
  const items = [
    { title: `${calcResult.recommendedInverterKVA}kVA Hybrid Inverter`, desc: tier.inverterBrand, cost: tier.inverterCost },
    { title: `${calcResult.recommendedBatteryKWh}kWh LiFePO4 Lithium Bank`, desc: tier.batteryBrand, cost: tier.batteryCost },
    { title: `${tier.panelCount}x Solar Panels (${tier.actualSolarKW}kWp)`, desc: tier.panelBrand, cost: tier.panelCost },
    { title: 'BOS Racks, Isolators & Copper Cabling', desc: '16mm/25mm Flex Cables, Breakers & Trunking', cost: tier.bosCost },
    { title: 'Safety Distribution Box & Surge Arrester', desc: 'SPD, changeover switch & DB casing', cost: tier.protectionCost },
    { title: 'Certified Installation & Earth Rod', desc: 'Workmanship, testing & 1-year free audit', cost: tier.installationFee }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h4 className="font-bold text-sm text-slate-200">Itemized Bill of Quantities (BOQ)</h4>
        <span className="text-xs font-mono text-slate-400">Total 6 Components</span>
      </div>
      <div className="divide-y divide-slate-800/60 mt-1">
        {items.map((item, idx) => (
          <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-200">{item.title}</p>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
            <span className="text-sm font-mono font-semibold text-white whitespace-nowrap">
              {formatNaira(item.cost)}
            </span>
          </div>
        ))}
      </div>
      <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between font-bold">
        <span className="text-sm text-slate-300">Total Investment:</span>
        <span className="text-base text-amber-400 font-mono">{formatNaira(tier.totalCost)}</span>
      </div>
    </div>
  );
}
