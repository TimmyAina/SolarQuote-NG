import React, { useState, useMemo, useCallback } from 'react';
import { Sun, Moon, ArrowLeft, User, Wrench } from 'lucide-react';

import { AppProvider, useApp } from './context/AppContext.jsx';
import { calculateSolarSystem } from './utils/calculations.js';
import { calculateRunningCosts } from './utils/energyCosts.js';
import { PROFILE_PRESETS, NIGERIAN_CITIES } from './data/pricingDefaults.js';

import { WelcomeScreen } from './components/WelcomeScreen.jsx';
import { BottomTabs } from './components/BottomTabs.jsx';
import { HomeScreen } from './components/HomeScreen.jsx';
import { CatalogScreen } from './components/CatalogScreen.jsx';
import { SettingsScreen } from './components/SettingsScreen.jsx';
import { LoadsScreen } from './components/LoadsScreen.jsx';
import { BOQScreen } from './components/BOQScreen.jsx';
import { WalletScreen } from './components/WalletScreen.jsx';

const TITLES = {
  home: 'Dashboard',
  catalog: 'Product catalog',
  quote: 'Your loads',
  boq: 'Bill of quantities',
  wallet: 'Wallet & plan',
  settings: 'Settings',
};

function Shell() {
  const {
    settings, isDark, isSimple, themeMode, canUse,
    completeOnboarding, toggleTheme, setExperienceMode, quoteCounter,
  } = useApp();

  const [tab, setTab] = useState('home');
  const [catalogSection, setCatalogSection] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('school');
  const [selectedCity, setSelectedCity] = useState(NIGERIAN_CITIES[0]);
  const [selectedTierIndex, setSelectedTierIndex] = useState(1);
  const [installerMarkup, setInstallerMarkup] = useState(15);

  const [appliances, setAppliances] = useState(() =>
    // suggestedAppliances is a { id: qty } map, not an array.
    Object.entries(PROFILE_PRESETS[0].suggestedAppliances).map(([id, qty]) => ({ id, qty }))
  );

  const calcResult = useMemo(
    () =>
      calculateSolarSystem({
        appliances,
        sunHours: selectedCity.sunHours,
        settings,
        installerMarkupPercent: installerMarkup,
      }),
    [appliances, selectedCity.sunHours, settings, installerMarkup]
  );

  const costs = useMemo(
    () =>
      calculateRunningCosts({
        dailyKWh: calcResult.totalDailyKWh,
        genKVA: Math.max(3.5, calcResult.recommendedInverterKVA),
        settings,
        supplyMode: settings.gridHoursPerDay >= 18 ? 'grid' : 'hybrid',
      }),
    [calcResult.totalDailyKWh, calcResult.recommendedInverterKVA, settings]
  );

  const navigate = useCallback((next, section) => {
    setTab(next);
    if (section) setCatalogSection(section);
    window.scrollTo({ top: 0 });
  }, []);

  /** Adds a catalog product to the quote as a load line, or bumps its count. */
  const addLoad = useCallback((product) => {
    // Parts are inventory the job consumes, not electrical load. Adding one to
    // the load list would feed watts: 0 into the sizing engine and silently
    // change nothing, so it is refused explicitly rather than mis-added.
    if (product.kind === 'part') return false;
    setAppliances((prev) => {
      if (prev.some((a) => a.id === product.id)) {
        return prev.map((a) =>
          a.id === product.id ? { ...a, qty: (a.qty || 0) + 1 } : a
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          watts: product.watts,
          surgeWatts: product.surgeWatts || 0,
          qty: 1,
          hoursDay: product.specs?.hoursDay ?? 8,
          hoursNight: product.specs?.hoursNight ?? 0,
          brand: product.brand,
        },
      ];
    });
  }, []);

  const applyPreset = useCallback((presetId) => {
    const preset = PROFILE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    // suggestedAppliances is a { id: qty } map, not an array.
    setAppliances(
      Object.entries(preset.suggestedAppliances).map(([id, qty]) => ({ id, qty }))
    );
  }, []);

  // Adding catalog hardware to a quote is a paid capability.
  const canUseCatalogAdd = canUse('catalog_add');
  const onLockedAdd = useCallback(() => navigate('wallet'), [navigate]);

  if (!settings.onboarded) {
    return <WelcomeScreen onComplete={completeOnboarding} />;
  }

  const themeLabel = themeMode === 'system' ? 'Auto' : isDark ? 'Dark' : 'Light';

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur-md border-b border-line sq-safe-t">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {tab !== 'home' && (
              <button
                type="button"
                onClick={() => navigate('home')}
                aria-label="Back to dashboard"
                className="w-9 h-9 rounded-xl border border-line bg-surface text-ink-2 flex items-center justify-center shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-accent text-accent-fg flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold tracking-tight leading-none truncate">
                SolarQuote <span className="text-accent">NG</span>
              </h1>
              <p className="text-[11px] text-ink-3 font-semibold mt-0.5 truncate">
                {TITLES[tab]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setExperienceMode(isSimple ? 'pro' : 'simple')}
              aria-label={isSimple ? 'Switch to professional mode' : 'Switch to simple mode'}
              title={isSimple ? 'Professional mode' : 'Simple mode'}
              className="w-9 h-9 rounded-xl border border-line bg-surface text-ink-2 flex items-center justify-center"
            >
              {isSimple ? <User className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Theme: ${themeLabel}. Tap to change.`}
              title={`Theme: ${themeLabel}`}
              className="w-9 h-9 rounded-xl border border-line bg-surface text-ink-2 flex items-center justify-center"
            >
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        {tab === 'home' && (
          <HomeScreen
            costs={costs}
            calcResult={calcResult}
            isSimple={isSimple}
            quoteNumber={quoteCounter}
            onNavigate={navigate}
          />
        )}

        {tab === 'catalog' && (
          <CatalogScreen
            isSimple={isSimple}
            onAddLoad={canUseCatalogAdd ? addLoad : null}
            onLockedAdd={onLockedAdd}
            currentLoads={appliances}
            initialSection={catalogSection}
          />
        )}

        {tab === 'quote' && (
          <LoadsScreen
            appliances={appliances}
            setAppliances={setAppliances}
            selectedPreset={selectedPreset}
            applyPreset={applyPreset}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            isSimple={isSimple}
            calcResult={calcResult}
            onBrowse={() => navigate('catalog')}
            onContinue={() => navigate('boq')}
          />
        )}

        {tab === 'boq' && (
          <BOQScreen
            calcResult={calcResult}
            costs={costs}
            isSimple={isSimple}
            selectedTierIndex={selectedTierIndex}
            setSelectedTierIndex={setSelectedTierIndex}
            installerMarkup={installerMarkup}
            setInstallerMarkup={setInstallerMarkup}
            settings={settings}
            quoteNumber={quoteCounter}
            onBack={() => navigate('quote')}
            onOpenWallet={() => navigate('wallet')}
          />
        )}

        {tab === 'wallet' && <WalletScreen />}

        {tab === 'settings' && <SettingsScreen onOpenWallet={() => navigate('wallet')} />}
      </main>

      <BottomTabs active={tab} onChange={(t) => navigate(t)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}


