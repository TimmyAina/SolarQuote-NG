/**
 * Nigerian Running-Cost Engine
 * ---------------------------------------------------------------------------
 * Answers the question a client actually asks: "what does power cost me today,
 * and what will it cost me with solar?"
 *
 * Grid tariff alone badly understates the truth in Nigeria, because most homes
 * rely on a generator for the hours the grid misses. This module therefore
 * models the three real supply situations, using editable fuel and tariff
 * figures from Settings (see data/pricingDefaults.js for the sourced defaults).
 */
import { GRID_BANDS, GENERATOR_FUEL_PER_KVA_HOUR } from '../data/pricingDefaults.js';

const clamp = (v, min, max, fb) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fb;
  return Math.min(max, Math.max(min, n));
};

/** Fuel price per litre for the generator's configured fuel type. */
function fuelPricePerLitre(cfg) {
  return cfg.generatorFuelType === 'petrol'
    ? clamp(cfg.petrolPricePerLiter, 0, 100000, 1200)
    : clamp(cfg.dieselPricePerLiter, 0, 100000, 1350);
}

/**
 * Cost of running a generator to cover a given energy need.
 *
 * @param {number} kWh        energy the genset must produce
 * @param {number} genKVA     genset rating
 * @param {number} litresPerHour fuel burn at that rating
 * @param {number} pricePerLitre current pump price
 */
export function generatorCost(kWh, genKVA, litresPerHour, pricePerLitre) {
  // A genset delivers roughly 75% of its nameplate rating as usable energy.
  const usableKWhPerHour = Math.max(0.5, genKVA * 0.75);
  const hours = kWh > 0 ? kWh / usableKWhPerHour : 0;
  return {
    hours: Math.round(hours * 10) / 10,
    litres: Math.round(hours * litresPerHour * 10) / 10,
    cost: Math.round(hours * litresPerHour * pricePerLitre),
  };
}

/**
 * Full running-cost comparison for a load.
 *
 * @param {object} params
 * @param {number} params.dailyKWh     total daily energy the site consumes
 * @param {number} params.genKVA       generator rating to model
 * @param {object} params.settings     normalised app settings
 * @param {string} params.supplyMode   'grid' | 'hybrid' | 'generator'
 */
export function calculateRunningCosts({
  dailyKWh = 0,
  genKVA = 5,
  settings = {},
  supplyMode = 'hybrid',
} = {}) {
  const cfg = settings;
  const kWh = Math.max(0, Number(dailyKWh) || 0);
  const daysPerMonth = 30;

  const tariff = clamp(cfg.discoTariffPerKWh, 0, 100000, 209.5);
  const fuelPrice = fuelPricePerLitre(cfg);
  const litresPerHour = Math.max(
    1.0,
    Math.round(genKVA * GENERATOR_FUEL_PER_KVA_HOUR * 10) / 10
  );

  // Grid hours the customer actually receives, and the remainder the genset
  // must cover. On a low band the grid delivers fewer hours, so more load falls
  // to the generator — which is exactly why Band D/E homes often spend more.
  const gridHours = clamp(cfg.gridHoursPerDay, 0, 24, 20);
  const loadHours = kWh > 0 ? 24 : 0; // assume a full daily energy budget
  const gridShare = loadHours > 0 ? Math.min(1, gridHours / loadHours) : 0;
  const genShare = 1 - gridShare;

  const gridKWh = kWh * gridShare;
  const genKWh = kWh * genShare;

  const gridCost = Math.round(gridKWh * tariff);
  const gen = generatorCost(genKWh, genKVA, litresPerHour, fuelPrice);

  const monthlyGridCost = gridCost * daysPerMonth;
  const monthlyGenCost = gen.cost * daysPerMonth;
  const monthlyTotal = monthlyGridCost + monthlyGenCost;

  // A band that delivers few hours forces heavy generator use, which is the
  // counter-intuitive truth the UI surfaces to clients.
  const allGridCost = Math.round(kWh * tariff * daysPerMonth);
  const allGenCost = generatorCost(kWh, genKVA, litresPerHour, fuelPrice).cost * daysPerMonth;

  const effectiveCostPerKWh = kWh > 0 ? Math.round(monthlyTotal / (kWh * daysPerMonth)) : 0;

  return {
    supplyMode,
    dailyKWh: Math.round(kWh * 10) / 10,
    monthlyKWh: Math.round(kWh * daysPerMonth * 10) / 10,
    tariffPerKWh: tariff,
    fuelPricePerLitre: fuelPrice,
    genKVA,
    genLitresPerHour: litresPerHour,
    gridHoursPerDay: gridHours,

    // Where the energy comes from
    gridKWh: Math.round(gridKWh * 10) / 10,
    genKWh: Math.round(genKWh * 10) / 10,
    gridShare: Math.round(gridShare * 100) / 100,
    genShare: Math.round(genShare * 100) / 100,

    // Monthly money
    monthlyGridCost,
    monthlyGenCost,
    monthlyTotal,
    effectiveCostPerKWh,

    // Reference points for the comparison UI
    gridOnlyMonthly: allGridCost,
    generatorOnlyMonthly: allGenCost,
    annualTotal: monthlyTotal * 12,
    // 5-year projection at today's prices, no escalation (deliberately honest).
    fiveYearTotal: monthlyTotal * 60,

    // The generator sub-result, so the UI can show hours and litres burned.
    gen,
  };
}

/** Formats a band object for display, falling back to Band A. */
export function resolveBand(bandId) {
  return GRID_BANDS.find((b) => b.id === bandId) || GRID_BANDS[0];
}

/**
 * The retail price of one kWh from the grid, given a band.
 * EEDC Band A is regulated at a lower national rate.
 */
export function tariffForBand(bandId, discoId) {
  const band = resolveBand(bandId);
  if (band.id === 'A' && discoId === 'EEDC') return 160;
  return band.tariffPerKWh;
}
