import React from 'react';
import { RotateCcw } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../data/pricingDefaults';

export function ScreenAdmin({ settings, setSettings, onBack }) {
  const handleChange = (path, value) => {
    setSettings(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let cur = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  const handleReset = () => {
    if (confirm("Reset all prices and installer details to defaults?")) {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Database & Pricing Admin</h2>
          <p className="text-xs text-slate-400">Configure equipment rates & company info</p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Installer Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider">Company Profile</h3>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Company Name</label>
          <input
            type="text"
            value={settings.installerName}
            onChange={(e) => handleChange('installerName', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">WhatsApp / Phone</label>
            <input
              type="text"
              value={settings.installerPhone}
              onChange={(e) => handleChange('installerPhone', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Email</label>
            <input
              type="text"
              value={settings.installerEmail}
              onChange={(e) => handleChange('installerEmail', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Address</label>
          <input
            type="text"
            value={settings.installerAddress}
            onChange={(e) => handleChange('installerAddress', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      {/* Pricing Matrix */}
      <AdminPricingCard settings={settings} handleChange={handleChange} />

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-4 z-30 max-w-2xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg text-center"
        >
          Save & Return to Calculator
        </button>
      </div>
    </div>
  );
}


function AdminPricingCard({ settings, handleChange }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
      <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider">Equipment Pricing Database</h3>
      
      {/* Inverter Rates */}
      <div className="pt-2 border-t border-slate-800">
        <label className="text-xs font-semibold text-slate-300 block mb-1">Inverter Cost per kVA (NGN)</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-[10px] text-slate-400">Economy:</span>
            <input
              type="number"
              value={settings.equipment.inverters.economy.costPerKVA}
              onChange={(e) => handleChange('equipment.inverters.economy.costPerKVA', Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Standard:</span>
            <input
              type="number"
              value={settings.equipment.inverters.standard.costPerKVA}
              onChange={(e) => handleChange('equipment.inverters.standard.costPerKVA', Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Premium:</span>
            <input
              type="number"
              value={settings.equipment.inverters.premium.costPerKVA}
              onChange={(e) => handleChange('equipment.inverters.premium.costPerKVA', Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* Battery Rates */}
      <div className="pt-2 border-t border-slate-800">
        <label className="text-xs font-semibold text-slate-300 block mb-1">Battery Cost per kWh (NGN)</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-[10px] text-slate-400">Economy:</span>
            <input
              type="number"
              value={settings.equipment.batteries.economy.costPerKWh}
              onChange={(e) => handleChange('equipment.batteries.economy.costPerKWh', Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Standard:</span>
            <input
              type="number"
              value={settings.equipment.batteries.standard.costPerKWh}
              onChange={(e) => handleChange('equipment.batteries.standard.costPerKWh', Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Premium:</span>
            <input
              type="number"
              value={settings.equipment.batteries.premium.costPerKWh}
              onChange={(e) => handleChange('equipment.batteries.premium.costPerKWh', Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
