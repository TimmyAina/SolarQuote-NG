import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { formatNaira } from '../utils/calculations';

export function ScreenBOQ({
  calcResult,
  selectedTierIndex,
  setSelectedTierIndex,
  installerMarkup,
  setInstallerMarkup,
  onBack,
  onProceedToPDF
}) {
  const [showSecretProfit, setShowSecretProfit] = useState(false);
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

      {/* Secret Margin Slider */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-amber-400 uppercase">Installer Profit (Private)</span>
            <button type="button" onClick={() => setShowSecretProfit(!showSecretProfit)} className="text-slate-400">
              {showSecretProfit ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <span className="text-xs font-mono font-bold text-white bg-amber-500/20 px-2 py-0.5 rounded">
            {installerMarkup}% Markup
          </span>
        </div>
        <input
          type="range" min="5" max="40" value={installerMarkup}
          onChange={(e) => setInstallerMarkup(Number(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />
        {showSecretProfit && (
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Your Net Margin:</span>
            <span className="text-emerald-400 font-bold font-mono">+{formatNaira(activeTier.installerProfit)}</span>
          </div>
        )}
      </div>

      {/* 5-Year Lifecycle */}
      <div className="bg-emerald-950/60 border border-emerald-600/40 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-400 uppercase">5-Year Lifecycle</span>
          <span className="text-xs font-mono text-amber-400">Payback ~{calcResult.economics?.paybackMonths} Mo</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-rose-950/40 border border-rose-900/60 p-2 rounded-xl">
            <span className="text-rose-400 block mb-0.5 font-semibold">5-Yr Fuel & Gen:</span>
            <p className="text-sm font-bold text-white font-mono">{formatNaira(calcResult.economics?.fiveYearGenCost)}</p>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-800/60 p-2 rounded-xl">
            <span className="text-emerald-400 block mb-0.5 font-semibold">5-Yr Solar Total:</span>
            <p className="text-sm font-bold text-white font-mono">{formatNaira(calcResult.economics?.fiveYearSolarCost)}</p>
          </div>
        </div>
      </div>

      {/* 3 Quality Tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {calcResult.tiers.map((t, idx) => {
          const isSelected = selectedTierIndex === idx;
          return (
            <button
              key={t.tierKey}
              type="button"
              onClick={() => setSelectedTierIndex(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isSelected ? 'bg-amber-500/10 border-amber-500 shadow-md' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-amber-400">{t.name}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="text-base font-bold text-white font-mono mt-1">{formatNaira(t.totalCost)}</div>
              <p className="text-xs text-slate-400 mt-0.5">{t.tag}</p>
            </button>
          );
        })}
      </div>

      <TechAndBOQ activeTier={activeTier} calcResult={calcResult} />

      <BottomBOQNav onBack={onBack} onProceed={onProceedToPDF} />
    </div>
  );
}

function TechAndBOQ({ activeTier, calcResult }) {
  const items = [
    { title: `${calcResult.recommendedInverterKVA}kVA Hybrid Inverter`, desc: activeTier.inverterBrand, cost: activeTier.inverterCost },
    { title: `${calcResult.recommendedBatteryKWh}kWh LiFePO4 Lithium Bank`, desc: activeTier.batteryBrand, cost: activeTier.batteryCost },
    { title: `${activeTier.panelCount}x Solar Panels (${activeTier.actualSolarKW}kWp)`, desc: activeTier.panelBrand, cost: activeTier.panelCost },
    { title: 'BOS Racks, Isolators & Copper Cabling', desc: `${calcResult.technicalSafety?.recommendedDCCable}, Trunking & MC4s`, cost: activeTier.bosCost },
    { title: 'Safety Distribution Box & Surge Arrester', desc: `${calcResult.technicalSafety?.recommendedDCBreaker}, SPD & Changeover`, cost: activeTier.protectionCost },
    { title: 'Certified Installation & Earth Rod', desc: 'Workmanship, testing & 1-year free audit', cost: activeTier.installationFee }
  ];

  return (
    <div className="space-y-4">
      {/* Safety & Roof Specs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
          Safety Specs & Roof Requirement
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">DC Battery Cable:</span>
            <span className="font-mono text-slate-200">{calcResult.technicalSafety?.recommendedDCCable}</span>
          </div>
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Battery DC Breaker:</span>
            <span className="font-mono text-slate-200">{calcResult.technicalSafety?.recommendedDCBreaker}</span>
          </div>
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Roof Area Needed:</span>
            <span className="font-mono text-slate-200">~{activeTier.roofSpecs?.areaM2} m² (South @ 15°)</span>
          </div>
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Panel Dead Load:</span>
            <span className="font-mono text-slate-200">~{activeTier.roofSpecs?.weightKg} kg</span>
          </div>
        </div>
      </div>

      {/* BOQ Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h4 className="font-bold text-sm text-slate-200">Itemized BOQ</h4>
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
          <span className="text-base text-amber-400 font-mono">{formatNaira(activeTier.totalCost)}</span>
        </div>
      </div>
    </div>
  );
}

function BottomBOQNav({ onBack, onProceed }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-4 z-30 max-w-2xl mx-auto flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-sm font-semibold"
      >
        <span>Back</span>
      </button>
      <button
        type="button"
        onClick={onProceed}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg"
      >
        <span>Client Quote & PDF</span>
      </button>
    </div>
  );
}
