import React, { useState, useEffect } from 'react';
import { Sun, Settings as SettingsIcon } from 'lucide-react';
import { DEFAULT_SETTINGS, COMMON_APPLIANCES, PROFILE_PRESETS, NIGERIAN_CITIES } from './data/pricingDefaults';
import { calculateSolarSystem, normalizeSettings } from './utils/calculations';
import { ScreenInput } from './components/ScreenInput';
import { ScreenBOQ } from './components/ScreenBOQ';
import { ScreenPDF } from './components/ScreenPDF';
import { ScreenAdmin } from './components/ScreenAdmin';

export default function App() {
  const [activeTab, setActiveTab] = useState('input');
  const [selectedPreset, setSelectedPreset] = useState('school');
  const [selectedCity, setSelectedCity] = useState(NIGERIAN_CITIES[0]);
  const [selectedTierIndex, setSelectedTierIndex] = useState(1);
  const [installerMarkup, setInstallerMarkup] = useState(15);
  
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('solarquote_settings');
      // Old app versions / partial writes must never break the engine.
      return normalizeSettings(saved ? JSON.parse(saved) : DEFAULT_SETTINGS);
    } catch {
      return normalizeSettings(DEFAULT_SETTINGS);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('solarquote_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [settings]);

  const [appliances, setAppliances] = useState(() => {
    const schoolPreset = PROFILE_PRESETS[0];
    return COMMON_APPLIANCES.map(app => ({
      ...app,
      qty: schoolPreset.suggestedAppliances[app.id] || 0,
      watts: app.defaultWatts,
      hoursDay: schoolPreset.operatingHoursDay,
      hoursNight: schoolPreset.operatingHoursNight
    }));
  });

  const calcResult = calculateSolarSystem({
    appliances,
    sunHours: selectedCity.sunHours,
    backupHoursNight: 8,
    settings,
    installerMarkupPercent: installerMarkup
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-xl mx-auto shadow-2xl border-x border-slate-900/60">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <Sun className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold tracking-tight text-white leading-none">
                SolarQuote <span className="text-amber-400">NG</span>
              </h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Electrician BOQ Engine</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'admin' ? 'input' : 'admin')}
          className={`p-2 rounded-xl border transition ${
            activeTab === 'admin'
              ? 'bg-amber-500 text-slate-950 border-amber-400'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
          }`}
          title="Installer Settings & Price Database"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </header>

      {/* Tabs */}
      <nav className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs font-semibold">
        {['input', 'boq', 'pdf'].map((tab, idx) => {
          const names = ['1. Appliances', '2. Sizing & BOQ', '3. Branded PDF'];
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-center rounded-lg transition ${
                activeTab === tab ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {names[idx]}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <main className="flex-1 p-4">
        {activeTab === 'input' && (
          <ScreenInput
            selectedPreset={selectedPreset}
            setSelectedPreset={setSelectedPreset}
            appliances={appliances}
            setAppliances={setAppliances}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            onProceed={() => setActiveTab('boq')}
          />
        )}

        {activeTab === 'boq' && (
          <ScreenBOQ
            calcResult={calcResult}
            selectedTierIndex={selectedTierIndex}
            setSelectedTierIndex={setSelectedTierIndex}
            installerMarkup={installerMarkup}
            setInstallerMarkup={setInstallerMarkup}
            onBack={() => setActiveTab('input')}
            onProceedToPDF={() => setActiveTab('pdf')}
          />
        )}

        {activeTab === 'pdf' && (
          <ScreenPDF
            calcResult={calcResult}
            selectedTierIndex={selectedTierIndex}
            settings={settings}
            setSettings={setSettings}
            appliances={appliances}
            onBack={() => setActiveTab('boq')}
          />
        )}

        {activeTab === 'admin' && (
          <ScreenAdmin
            settings={settings}
            setSettings={setSettings}
            onBack={() => setActiveTab('input')}
          />
        )}
      </main>
    </div>
  );
}
