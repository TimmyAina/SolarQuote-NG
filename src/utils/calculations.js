/**
 * Solar Engineering & BOQ Calculation Engine for Nigeria
 */
import { DEFAULT_SETTINGS } from '../data/pricingDefaults.js';

// Re-exported so UI layers can import defaults and the normaliser from one place.
export { DEFAULT_SETTINGS };

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Deep-merges persisted/partial settings over the shipped defaults, so a legacy
 * localStorage payload (or a half-written JSON blob) can never crash the engine.
 *
 * A nested object is only ever REPLACED by another plain object. Accepting a
 * scalar in that position is the bug this guards: `{ equipment: null }` used to
 * overwrite the whole equipment block with null, and the next calculate() threw
 * "Cannot read properties of null (reading 'inverters')" — a white screen on a
 * corrupt payload. Non-objects are now ignored so the defaults survive.
 */
export function normalizeSettings(raw) {
  const merge = (base, override) => {
    const out = JSON.parse(JSON.stringify(base));
    if (!isPlainObject(override)) return out;
    Object.keys(override).forEach((key) => {
      const value = override[key];
      if (isPlainObject(value) && isPlainObject(out[key])) {
        out[key] = merge(out[key], value);
      } else if (isPlainObject(out[key])) {
        // The default here is an object, so a scalar/array/null override is
        // corruption, not intent. Keep the default rather than break the engine.
        if (!isPlainObject(value)) return;
        out[key] = value;
      } else if (value !== undefined) {
        out[key] = value;
      }
    });
    return out;
  };
  return merge(DEFAULT_SETTINGS, raw);
}

/** Clamps a numeric input, falling back when the value is not a finite number. */
const clampNumber = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export function calculateSolarSystem(params = {}) {
  const {
    appliances,
    sunHours = 4.8,
    settings,
    installerMarkupPercent = 15
  } = params;

  const cfg = normalizeSettings(settings);
  const list = Array.isArray(appliances) ? appliances : [];

  let totalPeakWatts = 0;
  let dailyKWhDay = 0;
  let dailyKWhNight = 0;
  let hasInductiveLoad = false;
  let inductiveSurgeWatts = 0;

  list.forEach(item => {
    // Non-negative quantities/wattages and max 24 h combined per day.
    const qty = clampNumber(item && item.qty, 0, 100000, 0);
    const watts = clampNumber(item && item.watts, 0, 100000, 0);
    const rawHDay = clampNumber(item && item.hoursDay, 0, 24, 0);
    const rawHNight = clampNumber(item && item.hoursNight, 0, 24, 0);
    // If the caller sets both day and night such that day + night > 24, scale down proportionally to 24h max.
    const sumHours = rawHDay + rawHNight;
    const hourScale = sumHours > 24 ? 24 / sumHours : 1;
    const hDay = rawHDay * hourScale;
    const hNight = rawHNight * hourScale;
    const id = (item && item.id) || '';

    const itemTotalWatts = qty * watts;
    totalPeakWatts += itemTotalWatts;

    const isInductive = ['ac1hp', 'ac15hp', 'ac2hp', 'pumping_machine', 'freezer', 'fridge'].includes(id);
    if (isInductive && qty > 0) {
      hasInductiveLoad = true;
      if (id.includes('ac') || id === 'pumping_machine') {
        inductiveSurgeWatts += watts * 2.5;
      }
    }

    dailyKWhDay += (itemTotalWatts * hDay) / 1000;
    dailyKWhNight += (itemTotalWatts * hNight) / 1000;
  });

  const hasLoad = totalPeakWatts > 0;
  const totalDailyKWh = dailyKWhDay + dailyKWhNight;

  // Inverter Sizing (kVA) with inductive surge headroom
  const baseSurge = clampNumber(cfg.safetySurgeFactor, 1.05, 2, 1.25);
  const surgeFactor = hasInductiveLoad ? Math.max(1.35, baseSurge) : baseSurge;
  const rawInverterKVA = (totalPeakWatts * surgeFactor) / 1000;
  const standardInverters = [1.5, 3.0, 5.0, 6.0, 8.0, 10.0, 12.0, 15.0, 20.0, 30.0];
  let recommendedInverterKVA = standardInverters.find(k => k >= rawInverterKVA) || (Math.ceil(rawInverterKVA / 5) * 5);

  // Battery Storage Sizing (kWh)
  const dod = clampNumber(cfg.batteryDoD, 0.3, 0.95, 0.85);
  const batteryEfficiency = 0.92;
  const requiredBatteryKWh = dailyKWhNight > 0 
    ? (dailyKWhNight / (dod * batteryEfficiency))
    : (totalDailyKWh * 0.35 / (dod * batteryEfficiency));

  let recommendedBatteryKWh = Math.ceil(requiredBatteryKWh / 2.5) * 2.5;
  if (recommendedBatteryKWh < 2.5) recommendedBatteryKWh = 2.5;

  // Solar Array Sizing (kWp)
  const lossFactor = clampNumber(cfg.systemLossFactor, 1.0, 2.0, 1.28);
  const safeSunHours = clampNumber(sunHours, 2.5, 7.5, clampNumber(cfg.sunHours, 2.5, 7.5, 4.8));
  const rawSolarKW = (totalDailyKWh * lossFactor) / safeSunHours;
  const recommendedSolarKW = Math.max(0.6, Math.ceil(rawSolarKW * 10) / 10);

  // DC Cable & Isolator Safety specs
  const nominalDC_Amps = Math.round((recommendedInverterKVA * 1000) / 48);
  let recommendedDCCable = "16mm² Pure Copper Flex";
  let recommendedDCBreaker = "80A 2-Pole DC Isolator";
  if (nominalDC_Amps > 200) {
    recommendedDCCable = "50mm² Pure Copper Flex";
    recommendedDCBreaker = "250A Molded Case DC Breaker";
  } else if (nominalDC_Amps > 140) {
    recommendedDCCable = "35mm² Pure Copper Flex";
    recommendedDCBreaker = "175A 2-Pole DC Isolator";
  } else if (nominalDC_Amps > 80) {
    recommendedDCCable = "25mm² Pure Copper Flex";
    recommendedDCBreaker = "125A 2-Pole DC Isolator";
  }

  // 5. Generate 3 Tiers with Markup, Milestones & Roof Footprint
  const tiers = ['economy', 'standard', 'premium'].map(tierKey => {
    const invData = cfg.equipment.inverters[tierKey];
    const battData = cfg.equipment.batteries[tierKey];
    const panelData = cfg.equipment.panels[tierKey];

    const panelWatt = clampNumber(panelData.wattRating, 100, 1200, DEFAULT_SETTINGS.equipment.panels[tierKey].wattRating);
    const panelCount = Math.max(2, Math.ceil((recommendedSolarKW * 1000) / panelWatt));
    const actualSolarKW = (panelCount * panelWatt) / 1000;

    const inverterCost = Math.round(recommendedInverterKVA * clampNumber(invData.costPerKVA, 0, 1e9, DEFAULT_SETTINGS.equipment.inverters[tierKey].costPerKVA));
    const batteryCost = Math.round(recommendedBatteryKWh * clampNumber(battData.costPerKWh, 0, 1e9, DEFAULT_SETTINGS.equipment.batteries[tierKey].costPerKWh));
    const panelCost = Math.round(panelCount * clampNumber(panelData.panelPrice, 0, 1e9, DEFAULT_SETTINGS.equipment.panels[tierKey].panelPrice));
    const bosCost = Math.round(recommendedInverterKVA * clampNumber(cfg.equipment.bosPerKVA, 0, 10000000, 55000));
    const protectionCost = clampNumber(cfg.equipment.protectionBox, 0, 10000000, 85000);

    const wholesaleSubtotal = inverterCost + batteryCost + panelCost + bosCost + protectionCost;
    const safeMarkup = clampNumber(installerMarkupPercent, 0, 200, 15);
    const markupMultiplier = 1 + (safeMarkup / 100);
    const installationFee = Math.round(wholesaleSubtotal * clampNumber(cfg.installationPercent, 0, 1, 0.15));
    const installerProfit = Math.round(wholesaleSubtotal * (safeMarkup / 100)) + Math.round(installationFee * 0.4);
    const totalCost = Math.round(wholesaleSubtotal * markupMultiplier) + installationFee;

    // Payment Milestones (70% - 20% - 10%)
    const milestone1 = Math.round(totalCost * 0.70);
    const milestone2 = Math.round(totalCost * 0.20);
    const milestone3 = totalCost - milestone1 - milestone2;

    const totalRoofAreaM2 = Math.round(panelCount * 2.55 * 10) / 10;
    const totalPanelWeightKg = Math.round(panelCount * 32);

    return {
      tierKey,
      name: tierKey === 'economy' ? 'Economy Tier' : tierKey === 'standard' ? 'Standard Pro Tier' : 'Premium Luxury Tier',
      tag: tierKey === 'economy' ? 'Affordable & Reliable' : tierKey === 'standard' ? 'Most Popular Choice' : 'Maximum Durability',
      inverterBrand: invData.brand,
      inverterCost,
      batteryBrand: battData.brand,
      batteryCost,
      batteryCycles: battData.cycles,
      panelBrand: panelData.brand,
      panelCost,
      panelWatt,
      panelCount,
      actualSolarKW,
      bosCost,
      protectionCost,
      installationFee,
      wholesaleSubtotal,
      installerProfit,
      totalCost,
      milestones: { phase1: milestone1, phase2: milestone2, phase3: milestone3 },
      roofSpecs: { areaM2: totalRoofAreaM2, weightKg: totalPanelWeightKg },
      warranty: invData.warranty
    };
  });

  // 6. Savings & 5-Year Lifecycle Comparison (Generator vs Solar)
  // With no load on the quote there is nothing to avoid or pay back, so every
  // economic figure must be zero rather than a fabricated generator saving.
  const fuelLiterCost = clampNumber(cfg.petrolPricePerLiter, 0, 100000, 1150);
  const genKVA = Math.max(3.5, recommendedInverterKVA);
  const genFuelPerHourBaseline = clampNumber(cfg.genFuelConsumptionPerHour, 0.1, 20, 1.8);
  const genLitersPerHour = Math.max(1.2, Math.round(genKVA * (genFuelPerHourBaseline / 5) * 10) / 10);
  const genHoursForLoad = totalDailyKWh / (genKVA * 0.75);
  const baselineGenHours = clampNumber(cfg.genRunningHoursPerDay, 0, 24, 7);
  const genHoursPerDay = hasLoad ? Math.min(20, Math.max(baselineGenHours, genHoursForLoad)) : 0;
  const dailyFuelCost = genHoursPerDay * genLitersPerHour * fuelLiterCost;
  const monthlyFuelCost = dailyFuelCost * 30;

  const monthlyGridKWh = totalDailyKWh * 30;
  const monthlyGridCost = monthlyGridKWh * clampNumber(cfg.discoTariffPerKWh, 0, 100000, 209.5);
  const estimatedMonthlySavings = hasLoad ? Math.round(monthlyFuelCost * 0.75 + monthlyGridCost * 0.4) : 0;

  // 5-Year cumulative costs
  const fiveYearGenFuel = monthlyFuelCost * 60;
  const annualGenMaintenance = hasLoad ? Math.max(150000, Math.round(genKVA * 45000)) : 0;
  const fiveYearGenMaintenance = annualGenMaintenance * 5;
  const fiveYearTotalGenCost = fiveYearGenFuel + fiveYearGenMaintenance;

  const standardTotalCost = tiers[1].totalCost;
  const annualSolarUpkeep = 80000;
  const fiveYearSolarCost = standardTotalCost + (annualSolarUpkeep * 5);
  const fiveYearNetSavings = Math.max(0, fiveYearTotalGenCost - fiveYearSolarCost);

  const paybackMonths = hasLoad && estimatedMonthlySavings > 0
    ? Math.round((standardTotalCost / estimatedMonthlySavings) * 10) / 10
    : 0;

  return {
    totalPeakWatts,
    dailyKWhDay: Math.round(dailyKWhDay * 10) / 10,
    dailyKWhNight: Math.round(dailyKWhNight * 10) / 10,
    totalDailyKWh: Math.round(totalDailyKWh * 10) / 10,
    hasInductiveLoad,
    inductiveSurgeWatts,
    recommendedInverterKVA,
    recommendedBatteryKWh,
    recommendedSolarKW,
    technicalSafety: {
      dcAmps: nominalDC_Amps,
      recommendedDCCable,
      recommendedDCBreaker,
      recommendedACSurge: "Type 2 AC SPD (40kA)",
      recommendedDCSurge: "600V DC SPD"
    },
    tiers,
    economics: {
      monthlySavings: estimatedMonthlySavings,
      monthlyFuelAvoided: Math.round(monthlyFuelCost),
      paybackMonths,
      fiveYearGenCost: fiveYearTotalGenCost,
      fiveYearSolarCost,
      fiveYearNetSavings
    },
    sunHours: safeSunHours,
    hasLoad
  };
}

export function formatNaira(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return '₦0';
  return '₦' + Math.round(n).toLocaleString('en-NG');
}
