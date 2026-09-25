/**
 * App Shell Context
 * ---------------------------------------------------------------------------
 * Owns the three cross-cutting concerns every screen needs:
 *   1. THEME         — light / dark / system, applied by toggling `.dark` on <html>
 *   2. EXPERIENCE    — 'simple' (plain language) vs 'pro' (full engineering detail)
 *   3. QUOTE COUNTER — a monotonically increasing quote number that STRICTLY
 *                      starts at 0. No seed, no offset, no "first quote is 1001".
 *
 * Settings persist to localStorage; a corrupt or partial payload is merged over
 * the shipped defaults rather than trusted, so a bad write can never brick the app.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { DEFAULT_SETTINGS, normalizeSettings } from '../utils/calculations.js';
import {
  createWallet,
  effectivePlan,
  daysRemaining,
  debitGeneration,
  subscribe,
  cancelSubscription,
  topUp,
  reconcile,
} from '../utils/wallet.js';
import { planAllowsFeature, lockedFeatures, PLANS, GENERATION_PRICE } from '../data/pricingDefaults.js';
import {
  createUserCatalog,
  hydrateUserCatalog,
  setPrice as setProductPrice,
  clearPrice as clearProductPrice,
  resetPrices as resetAllPrices,
  addCustomProduct as addCustomProductPure,
  updateCustomProduct as updateCustomProductPure,
  removeCustomProduct as removeCustomProductPure,
  resetUserCatalog as resetUserCatalogPure,
} from '../data/userCatalog.js';

const AppContext = createContext(null);

const STORAGE_KEY = 'solarquote_settings_v3';
const COUNTER_KEY = 'solarquote_quote_counter_v3';
const WALLET_KEY = 'solarquote_wallet_v3';
const USER_CATALOG_KEY = 'solarquote_user_catalog_v3';

/** First launch returns 0 — the counter is never seeded above zero. */
const readCounter = () => {
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (raw === null) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
};

const readSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeSettings(raw ? JSON.parse(raw) : DEFAULT_SETTINGS);
  } catch {
    return normalizeSettings(DEFAULT_SETTINGS);
  }
};

/** A corrupt wallet payload must never brick the app — fall back to empty. */
const readWallet = () => {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) return createWallet();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createWallet();
    const base = createWallet();
    // Reconcile on read so an expired plan never shows as active.
    return reconcile({
      ...base,
      ...parsed,
      balance: Number.isFinite(Number(parsed.balance)) ? Number(parsed.balance) : 0,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
    });
  } catch {
    return createWallet();
  }
};

/** A corrupt saved catalog must never brick the app — fall back to empty. */
const readUserCatalog = () => {
  try {
    const raw = localStorage.getItem(USER_CATALOG_KEY);
    if (!raw) return createUserCatalog();
    return hydrateUserCatalog(raw);
  } catch {
    return createUserCatalog();
  }
};

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(readSettings);
  const [quoteCounter, setQuoteCounter] = useState(readCounter);
  const [wallet, setWallet] = useState(readWallet);
  const [userCatalog, setUserCatalog] = useState(readUserCatalog);
  // Ref mirrors keep the money/catalog callbacks referentially stable while
  // still reading the freshest state.
  const walletRef = useRef(wallet);
  const userCatalogRef = useRef(userCatalog);
  userCatalogRef.current = userCatalog;
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Settings persistence failed', e);
    }
  }, [settings]);

  // Persisted separately so resetting settings can never rewind the counter.
  useEffect(() => {
    try {
      localStorage.setItem(COUNTER_KEY, String(quoteCounter));
    } catch (e) {
      console.warn('Counter persistence failed', e);
    }
  }, [quoteCounter]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemPrefersDark(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange); // Safari <14
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const isDark =
    settings.themeMode === 'dark' ||
    (settings.themeMode === 'system' && systemPrefersDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDark]);

  const isSimple = settings.experienceMode === 'simple';

  const setThemeMode = useCallback((themeMode) => {
    setSettings((s) => ({ ...s, themeMode }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((s) => ({
      ...s,
      themeMode: isDark ? 'light' : 'dark',
    }));
    // `isDark` is read from the render closure; recomputing keeps the toggle
    // correct even when the stored preference is 'system'.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  const setExperienceMode = useCallback((experienceMode) => {
    setSettings((s) => ({ ...s, experienceMode }));
  }, []);

  /** Completes first-run onboarding and stores the chosen mode. */
  /**
   * Finishes onboarding. The plan chosen on the welcome screen is applied
   * immediately for the two subscription tiers; Pay-As-You-Go simply unlocks
   * the paid features and leaves the wallet empty for the user to top up.
   */
  const completeOnboarding = useCallback((experienceMode, planIdArg = 'payg') => {
    setSettings((s) => ({ ...s, experienceMode, onboarded: true }));
    if (planIdArg === 'limited' || planIdArg === 'unlimited') {
      setWallet((w) => ({ ...w, planId: planIdArg, planExpiresAt: Date.now() + 30 * 864e5 }));
    } else {
      setWallet((w) => (w.planId === 'free' ? w : { ...w, planId: 'free', planExpiresAt: 0 }));
    }
  }, []);

  /**
   * Returns the number the NEXT quote carries, then advances.
   * The very first quote issued is #0.
   */
  const issueQuoteNumber = useCallback(() => {
    const n = quoteCounter;
    setQuoteCounter((c) => c + 1);
    return n;
  }, [quoteCounter]);

  // ---- Wallet / billing -------------------------------------------------
  // The provider functions in utils/wallet.js are pure; here we only apply the
  // result to React state and persist it.

  /** Drops an expired plan back to free. Safe to call on every launch. */
  useEffect(() => {
    setWallet((w) => reconcile(w));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
    } catch (e) {
      console.warn('Wallet persistence failed', e);
    }
  }, [wallet]);

  const planId = effectivePlan(wallet);

  /** Adds funds. Returns the provider result so the UI can show errors. */
  const addFunds = useCallback(
    (amount) => {
      // Compute against the current wallet rather than inside the updater:
      // an updater must stay pure, and we need the result synchronously.
      const result = topUp(walletRef.current, amount);
      if (result.ok) setWallet(result.wallet);
      return result;
    },
    []
  );

  /**
   * Charges one generation. Callers must handle `ok: false` (insufficient
   * funds) by showing a top-up prompt — the wallet is never driven negative.
   */
  const chargeGeneration = useCallback((quoteNumber = null) => {
    const result = debitGeneration(walletRef.current, { quoteNumber });
    if (result.ok) setWallet(result.wallet);
    return result;
  }, []);

  const activatePlan = useCallback((planIdArg) => {
    const result = subscribe(walletRef.current, planIdArg);
    if (result.ok) setWallet(result.wallet);
    return result;
  }, []);

  const cancelPlan = useCallback(() => {
    setWallet((w) => cancelSubscription(w).wallet);
  }, []);

  /** Whether the current plan unlocks a feature. */
  const canUse = useCallback((featureId) => planAllowsFeature(planId, featureId), [planId]);

  // ---- User catalog: price overrides + self-added products -------------
  // Logic lives in data/userCatalog.js (pure). Here we only apply results.

  useEffect(() => {
    try {
      localStorage.setItem(USER_CATALOG_KEY, JSON.stringify(userCatalog));
    } catch (e) {
      console.warn('User catalog persistence failed', e);
    }
  }, [userCatalog]);

  const applyCatalog = useCallback((result) => {
    if (result.ok) setUserCatalog(result.state);
    return result;
  }, []);

  const setProductPriceFor = useCallback(
    (productId, price) => applyCatalog(setProductPrice(userCatalogRef.current, productId, price)),
    [applyCatalog]
  );

  const clearProductPriceFor = useCallback(
    (productId) => applyCatalog(clearProductPrice(userCatalogRef.current, productId)),
    [applyCatalog]
  );

  const resetAllProductPrices = useCallback(
    () => applyCatalog(resetAllPrices(userCatalogRef.current)),
    [applyCatalog]
  );

  const addCustomProduct = useCallback(
    (input) => applyCatalog(addCustomProductPure(userCatalogRef.current, input)),
    [applyCatalog]
  );

  const editCustomProduct = useCallback(
    (productId, input) => applyCatalog(updateCustomProductPure(userCatalogRef.current, productId, input)),
    [applyCatalog]
  );

  const deleteCustomProduct = useCallback(
    (productId) => applyCatalog(removeCustomProductPure(userCatalogRef.current, productId)),
    [applyCatalog]
  );

  const resetUserCatalog = useCallback(
    () => applyCatalog(resetUserCatalogPure()),
    [applyCatalog]
  );

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      isDark,
      isSimple,
      themeMode: settings.themeMode,
      experienceMode: settings.experienceMode,
      setThemeMode,
      toggleTheme,
      setExperienceMode,
      completeOnboarding,
      quoteCounter,
      issueQuoteNumber,

      // Wallet / billing surface
      wallet,
      planId,
      balance: wallet.balance,
      transactions: wallet.transactions,
      planExpiresAt: wallet.planExpiresAt,
      planDaysLeft: daysRemaining(wallet),
      plan: PLANS[planId],
      locked: lockedFeatures(planId),
      generationPrice: GENERATION_PRICE,
      canUse,
      addFunds,
      chargeGeneration,
      activatePlan,
      cancelPlan,

      // User catalog surface
      userCatalog,
      priceOverrides: userCatalog.priceOverrides,
      customProducts: userCatalog.customProducts,
      setProductPrice: setProductPriceFor,
      clearProductPrice: clearProductPriceFor,
      resetAllProductPrices,
      addCustomProduct,
      editCustomProduct,
      deleteCustomProduct,
      resetUserCatalog,
    }),
    [
      settings,
      isDark,
      isSimple,
      setThemeMode,
      toggleTheme,
      setExperienceMode,
      completeOnboarding,
      quoteCounter,
      issueQuoteNumber,
      wallet,
      planId,
      canUse,
      addFunds,
      chargeGeneration,
      activatePlan,
      cancelPlan,
      setProductPriceFor,
      clearProductPriceFor,
      resetAllProductPrices,
      addCustomProduct,
      editCustomProduct,
      deleteCustomProduct,
      resetUserCatalog,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export default AppContext;
