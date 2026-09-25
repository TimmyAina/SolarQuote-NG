import React from 'react';
import { 
  Building2, Home, Landmark, Briefcase, Plus, Trash2, 
  MapPin, ArrowRight
} from 'lucide-react';
import { COMMON_APPLIANCES, PROFILE_PRESETS, NIGERIAN_CITIES } from '../data/pricingDefaults';

export function ScreenInput({
  selectedPreset,
  setSelectedPreset,
  appliances,
  setAppliances,
  selectedCity,
  setSelectedCity,
  onProceed
}) {
  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.id);
    const updated = COMMON_APPLIANCES.map(app => {
      const presetQty = preset.suggestedAppliances[app.id] || 0;
      return {
        ...app,
        qty: presetQty,
        watts: app.defaultWatts,
        hoursDay: preset.operatingHoursDay,
        hoursNight: preset.operatingHoursNight
      };
    });
    setAppliances(updated);
  };

  const updateApplianceQty = (id, delta) => {
    setAppliances(prev => prev.map(a => {
      if (a.id === id) {
        const nextQty = Math.max(0, (a.qty || 0) + delta);
        return { ...a, qty: nextQty };
      }
      return a;
    }));
  };

  const updateApplianceField = (id, field, value) => {
    setAppliances(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, [field]: Number(value) || 0 };
      }
      return a;
    }));
  };

  const totalRunningWatts = appliances.reduce((sum, a) => sum + ((a.qty || 0) * (a.watts || 0)), 0);
  const activeAppliancesCount = appliances.reduce((sum, a) => sum + (a.qty > 0 ? a.qty : 0), 0);

  return (
    <div className="space-y-6 pb-24">
      {/* City & Location Banner */}
      <div className="bg-slate-900 border border-emerald-800/40 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Installation Region</p>
              <h3 className="text-base font-bold text-white">Solar Sun Hours Benchmark</h3>
            </div>
          </div>
          <select 
            value={selectedCity.name}
            onChange={(e) => {
              const city = NIGERIAN_CITIES.find(c => c.name === e.target.value) || NIGERIAN_CITIES[0];
              setSelectedCity(city);
            }}
            className="bg-slate-950 text-sm font-medium border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
          >
            {NIGERIAN_CITIES.map(c => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.sunHours} Sun Hrs)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Profile Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Step 1: Choose Facility Preset
          </label>
          <span className="text-xs text-amber-400 font-medium">Quick load configuration</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PROFILE_PRESETS.map(p => {
            const isSelected = selectedPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetSelect(p)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected 
                    ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sm text-slate-100">{p.name}</div>
                <div className="text-xs text-slate-400 mt-1 line-clamp-1">{p.description}</div>
                <div className="mt-2 text-[11px] text-amber-400 font-mono">
                  Day: {p.operatingHoursDay}h | Night: {p.operatingHoursNight}h
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Appliance Loads */}
      <ApplianceList 
        appliances={appliances} 
        activeCount={activeAppliancesCount}
        totalWatts={totalRunningWatts}
        updateField={updateApplianceField}
        updateQty={updateApplianceQty}
      />
      {/* Heavy Load / Inductive Surge Warning */}
      {appliances.some(a => ['ac1hp', 'ac15hp', 'ac2hp', 'pumping_machine'].includes(a.id) && (a.qty || 0) > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2.5">
          <div className="p-1 bg-amber-500/20 text-amber-400 rounded-md mt-0.5">
            ⚡
          </div>
          <div className="text-xs">
            <span className="font-bold text-amber-400">Inductive Compressor / Pump Surge Detected:</span>
            <p className="text-slate-300 mt-0.5">
              The engine automatically adds safe starting surge cushions to prevent your inverter from tripping when ACs or boreholes start up.
            </p>
          </div>
        </div>
      )}


      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-4 z-30 max-w-2xl mx-auto flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Total Peak Load</p>
          <p className="text-lg font-bold text-white font-mono">
            {(totalRunningWatts / 1000).toFixed(2)} <span className="text-xs text-amber-400">kW</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onProceed}
          disabled={totalRunningWatts === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition shadow-lg ${
            totalRunningWatts > 0
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>Calculate BOQ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


function ApplianceList({ appliances, activeCount, totalWatts, updateField, updateQty }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Step 2: Appliances & Load Count
          </label>
          <p className="text-xs text-slate-400">Adjust quantity & operating hours</p>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded-full">
          {activeCount} items | {(totalWatts / 1000).toFixed(2)} kW
        </span>
      </div>

      <div className="space-y-2.5">
        {appliances.map(app => {
          const hasQty = (app.qty || 0) > 0;
          return (
            <div 
              key={app.id} 
              className={`p-3 rounded-xl border transition-all ${
                hasQty ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/40 border-slate-800/60 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200">{app.name}</span>
                    {hasQty && (
                      <span className="text-[11px] px-1.5 py-0.2 bg-amber-500/10 text-amber-400 rounded font-mono">
                        {app.qty * app.watts}W
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>Watts:</span>
                    <input
                      type="number"
                      value={app.watts}
                      onChange={(e) => updateField(app.id, 'watts', e.target.value)}
                      className="w-14 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-slate-200 text-xs text-center font-mono"
                    />
                    <span>Day:</span>
                    <input
                      type="number"
                      value={app.hoursDay}
                      onChange={(e) => updateField(app.id, 'hoursDay', e.target.value)}
                      className="w-10 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-slate-200 text-xs text-center font-mono"
                    />
                    <span>h</span>
                  </div>
                </div>

                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => updateQty(app.id, -1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={app.qty || 0}
                    onChange={(e) => updateField(app.id, 'qty', e.target.value)}
                    className="w-10 text-center bg-transparent font-bold text-sm text-white focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => updateQty(app.id, 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
