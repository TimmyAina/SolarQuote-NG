/**
 * Nigerian Energy Price Reference Data
 * ---------------------------------------------------------------------------
 * Sourced for the 2026 pricing cycle and made user-editable in Settings so a
 * quote never goes stale when pump prices or NERC tariffs move.
 *
 * SOURCES
 *  - Fuel: NNPC / Dangote ex-depot pricing as reported to FuelTracker.ng
 *          (PMS nationwide pump price band ₦1,100 – ₦1,400/litre).
 *  - Grid: NERC Multi-Year Tariff Order (MYTO) Band A–E service-reflective
 *          rates, as published by BillsGuide.ng (verified April 2026) and
 *          cross-checked against VoltFlow's 2026 Nigeria tariff review.
 *
 * NOTE: These are EDITABLE DEFAULTS, not live feeds. Petrol and diesel move
 * weekly in Nigeria; the Settings screen lets an installer correct any figure
 * and the whole running-cost engine re-derives from it.
 */

/** Liquid fuel pump prices, NGN per litre. */
export const FUEL_PRICES = {
  petrol: 1200, // PMS — nationwide band midpoint (₦1,100 – ₦1,400)
  diesel: 1350, // AGO — diesel genset fuel
  kerosene: 900, // DPK
  lpgKg: 1200, // cooking gas, per kg
  cylinderKg: 12.5, // standard 12.5kg cooking gas cylinder
};

/**
 * NERC service-reflective tariff bands.
 * `hoursPerDay` is the minimum daily supply a customer receives on that band.
 */
export const GRID_BANDS = [
  { id: 'A', label: 'Band A', hoursPerDay: 20, tariffPerKWh: 209.5, note: '20+ hrs supply' },
  { id: 'B', label: 'Band B', hoursPerDay: 18, tariffPerKWh: 63, note: '16–20 hrs supply' },
  { id: 'C', label: 'Band C', hoursPerDay: 14, tariffPerKWh: 50, note: '12–16 hrs supply' },
  { id: 'D', label: 'Band D', hoursPerDay: 10, tariffPerKWh: 45, note: '8–12 hrs supply' },
  { id: 'E', label: 'Band E', hoursPerDay: 6, tariffPerKWh: 40, note: 'below 8 hrs supply' },
];

/**
 * The 11 DisCos. Band A is the national cost-reflective rate, except Enugu
 * (EEDC) which is regulated lower. Non-Band-A bands are uniform nationwide.
 */
export const DISCOS = [
  { id: 'AEDC', name: 'Abuja Electricity (AEDC)', states: 'FCT, Niger, Nasarawa, Kogi', bandATariff: 209.5 },
  { id: 'BEDC', name: 'Benin Electricity (BEDC)', states: 'Edo, Delta, Ondo', bandATariff: 209.5 },
  { id: 'EKEDC', name: 'Eko Electricity (EKEDC)', states: 'Lagos Island, VI, Lekki, Ikoyi', bandATariff: 209.5 },
  { id: 'EEDC', name: 'Enugu Electricity (EEDC)', states: 'Enugu, Anambra, Abia', bandATariff: 160.0 },
  { id: 'IBEDC', name: 'Ibadan Electricity (IBEDC)', states: 'Oyo, Ogun, Osun', bandATariff: 209.5 },
  { id: 'IKEDC', name: 'Ikeja Electric (IKEDC)', states: 'Lagos mainland, Surulere, Alimosho', bandATariff: 209.5 },
  { id: 'JED', name: 'Jos Electricity (JED)', states: 'Plateau, Bauchi, Gombe', bandATariff: 209.5 },
  { id: 'KAEDCO', name: 'Kaduna Electric (KAEDCO)', states: 'Kaduna, Kebbi, Sokoto', bandATariff: 209.5 },
  { id: 'KEDCO', name: 'Kano Electric (KEDCO)', states: 'Kano, Katsina, Jigawa', bandATariff: 209.5 },
  { id: 'PHED', name: 'Port Harcourt (PHED)', states: 'Rivers, Akwa Ibom, Bayelsa', bandATariff: 209.5 },
  { id: 'YEDC', name: 'Yola Electricity (YEDC)', states: 'Adamawa, Taraba, Borno', bandATariff: 209.5 },
];

/**
 * Realistic all-in running cost bands for a Nigerian household, expressed in
 * NGN per kWh actually consumed. Grid tariff alone understates the truth
 * because most homes must run a generator for the hours the grid misses.
 */
export const EFFECTIVE_COST_BANDS = {
  gridOnly: { low: 40, high: 209.5, label: 'Grid only' },
  hybrid: { low: 180, high: 500, label: 'Grid + generator' },
  generatorOnly: { low: 300, high: 700, label: 'Generator only' },
};

/** Default generator fuel burn per kVA per hour, in litres (diesel). */
export const GENERATOR_FUEL_PER_KVA_HOUR = 0.24;

export const CURRENCY = '₦';

export const DEFAULT_SETTINGS = {
  installerName: "SolarQuote Technologies Ltd",
  installerPhone: "+234 803 123 4567",
  installerEmail: "quotes@solarquoteng.com",
  installerAddress: "Plot 14 Trans-Amadi, Port Harcourt / Ikeja, Lagos",
  installerTagline: "Certified Renewable Energy & Electrical Engineering",
  installerLogo: null, // base64 PNG data URL set from the PDF screen (stored in localStorage)

  // ---- App experience preferences (set on the welcome screen) ----
  themeMode: 'system', // 'light' | 'dark' | 'system'
  experienceMode: 'pro', // 'simple' | 'pro' — set during first-run onboarding
  onboarded: false, // flips true once the welcome screen is completed

  // ---- Energy prices: editable in Settings (see energyPrices.js header) ----
  petrolPricePerLiter: 1200,
  dieselPricePerLiter: 1350,
  kerosenePricePerLiter: 900,
  lpgPricePerKg: 1200,
  discoTariffPerKWh: 209.5, // Band A default; installer picks their own band
  discoBand: 'A',
  discoId: 'IKEDC',
  gridHoursPerDay: 20, // supply hours the customer actually receives
  generatorHoursPerDay: 7, // hours the genset must cover the grid shortfall
  generatorFuelType: 'diesel', // 'diesel' | 'petrol'

  // Market Benchmarks retained for generator comparison (NGN)
  genFuelConsumptionPerHour: 1.8, // 5kVA - 7.5kVA generator ~1.8L/hr
  
  // Engineering Factors
  sunHours: 4.8, // Nigeria Average Peak Sun Hours
  batteryDoD: 0.85, // 85% Depth of Discharge for LiFePO4
  systemLossFactor: 1.28, // 28% total balance of system derating
  safetySurgeFactor: 1.25, // 25% surge headroom for inverter
  installationPercent: 0.15, // 15% installation, logistics & certified cabling
  
  // Equipment Unit Pricing Database (Selling Price to Clients in NGN)
  equipment: {
    inverters: {
      economy: { brand: "Felicity / Must Hybrid", costPerKVA: 180000, warranty: "18 Months Warranty" },
      standard: { brand: "Deye / Sunsynk Hybrid IP65", costPerKVA: 260000, warranty: "5 Years Warranty" },
      premium: { brand: "Victron Energy MultiPlus-II / Quattro", costPerKVA: 420000, warranty: "5-10 Years Global Warranty" }
    },
    batteries: {
      economy: { brand: "Felicity Solar LiFePO4 48V", costPerKWh: 260000, cycles: "3,000+ Cycles (8+ yrs)" },
      standard: { brand: "Pylontech / Dyness LiFePO4 48V", costPerKWh: 330000, cycles: "6,000+ Cycles (15 yrs)" },
      premium: { brand: "Victron / Freedom Won LiFePO4 48V", costPerKWh: 480000, cycles: "8,000+ Cycles (20 yrs)" }
    },
    panels: {
      economy: { brand: "Tier-1 Mono 550W", wattRating: 550, costPerWatt: 420, panelPrice: 231000 },
      standard: { brand: "Jinko / Longi 600W Bifacial", wattRating: 600, costPerWatt: 460, panelPrice: 276000 },
      premium: { brand: "Canadian Solar / Maxeon 700W N-Type", wattRating: 700, costPerWatt: 520, panelPrice: 364000 }
    },
    bosPerKVA: 55000,
    protectionBox: 85000
  }
};

export const COMMON_APPLIANCES = [
  { id: 'fans', name: 'Ceiling / Standing Fans', defaultWatts: 75, icon: 'Fan' },
  { id: 'bulbs', name: 'LED Energy Bulbs', defaultWatts: 15, icon: 'Lightbulb' },
  { id: 'ac1hp', name: '1.0 HP Inverter AC', defaultWatts: 900, icon: 'Wind' },
  { id: 'ac15hp', name: '1.5 HP Inverter AC', defaultWatts: 1400, icon: 'Wind' },
  { id: 'ac2hp', name: '2.0 HP Inverter AC', defaultWatts: 1900, icon: 'Wind' },
  { id: 'freezer', name: 'Deep Freezer (Chest)', defaultWatts: 250, icon: 'Refrigerator' },
  { id: 'fridge', name: 'Double-Door Refrigerator', defaultWatts: 180, icon: 'Refrigerator' },
  { id: 'tv', name: 'Smart TV + Soundbar', defaultWatts: 120, icon: 'Tv' },
  { id: 'pumping_machine', name: 'Water Pumping Machine (1HP)', defaultWatts: 1100, icon: 'Droplets' },
  { id: 'computers', name: 'Desktop PC / Laptops', defaultWatts: 150, icon: 'Monitor' },
  { id: 'cctv_wifi', name: 'CCTV Cameras + WiFi Router', defaultWatts: 60, icon: 'Wifi' },
  { id: 'microwave', name: 'Microwave Oven (Short use)', defaultWatts: 1200, icon: 'Zap' }
];

/**
 * Pricing Plans & Feature Gates
 * ---------------------------------------------------------------------------
 * Commercial model:
 *   - PAYG       : ₦500 per full generation (create the quotation, then produce
 *                  the branded PDF). Wallet-funded.
 *   - LIMITED    : ₦10,000 / month. Unlimited PDF renders, but the commercially
 *                  important features (hardware selection, margin control,
 *                  running-cost engine, technical spec, branded export) are off.
 *   - UNLIMITED  : ₦25,000 / month. Everything, unlimited.
 *
 * The ₦300 "PDF render only" charge was scrapped: a generation is one action.
 */

/** A single chargeable action, debited from the wallet. */
export const GENERATION_PRICE = 500;

/** Wallet top-up presets (NGN). Any positive amount is accepted. */
export const TOPUP_PRESETS = [1000, 2000, 5000, 10000];

/** Subscription length in days. */
export const SUBSCRIPTION_DAYS = 30;

/**
 * Feature catalogue.
 *
 * `tier` is the MINIMUM plan rank required to use the feature, so the gate is a
 * simple numeric comparison and higher plans inherit lower-tier access.
 *
 * Note the deliberate design choice for `limited`: at rank 2 it sits ABOVE
 * `payg` (1) but BELOW `unlimited` (3). Every commercially important feature is
 * therefore gated at `unlimited`, which is what makes the ₦10k plan genuinely
 * lighter than the ₦25k one — a subscription is not just a bigger wallet.
 */
export const FEATURES = [
  {
    id: 'catalog_add',
    label: 'Add catalog hardware to quote',
    description: 'Pick the exact inverter, battery and panel models for the job',
    tier: 'unlimited',
    core: true,
  },
  {
    id: 'margin_control',
    label: 'Installer margin control',
    description: 'Private markup slider and profit readout',
    tier: 'unlimited',
    core: true,
  },
  {
    id: 'running_costs',
    label: 'Running-cost engine',
    description: 'Grid vs generator vs solar comparison and payback period',
    tier: 'unlimited',
    core: true,
  },
  {
    id: 'tier_selection',
    label: 'Equipment tier selection',
    description: 'Switch between Economy, Standard and Premium packages',
    tier: 'unlimited',
    core: true,
  },
  {
    id: 'technical_spec',
    label: 'Technical safety specification',
    description: 'Cable gauges, breakers, surge protection and roof loading',
    tier: 'unlimited',
    core: true,
  },
  {
    id: 'custom_catalog',
    label: 'Your own products & prices',
    description: 'Add your own inverters and hardware, and override any catalog price',
    tier: 'unlimited',
    core: false,
  },
  {
    id: 'price_editor',
    label: 'Energy price & business editor',
    description: 'Adjust fuel prices, NERC tariff band and your company details',
    tier: 'unlimited',
    core: false,
  },
  {
    id: 'pdf_export',
    label: 'Branded PDF quotation',
    description: 'Client-ready BOQ with your logo, signature and share sheet',
    tier: 'payg',
    core: true,
  },
  {
    id: 'load_input',
    label: 'Appliance list & presets',
    description: 'Enter what the site runs, or start from a facility template',
    tier: 'free',
    core: true,
  },
  {
    id: 'sizing',
    label: 'System sizing',
    description: 'Inverter, battery bank and solar array recommendations',
    tier: 'free',
    core: true,
  },
  {
    id: 'catalog_browse',
    label: 'Product catalog',
    description: 'Browse and search 395 products with images and specifications',
    tier: 'free',
    core: true,
  },
  {
    id: 'appearance',
    label: 'Light & dark themes',
    description: 'Theme preference and Simple / Professional detail level',
    tier: 'free',
    core: true,
  },
];

/** Plan definitions. `rank` gives a total order so gates can compare simply. */
export const PLANS = {
  free: {
    id: 'free',
    rank: 0,
    name: 'Free',
    price: 0,
    period: null,
    tagline: 'Sizing only — no client documents',
    description:
      'Add appliances, browse the catalog and see what system size you need. No PDFs, no margin control.',
  },
  payg: {
    id: 'payg',
    rank: 1,
    name: 'Pay As You Go',
    price: GENERATION_PRICE,
    period: 'per quotation',
    tagline: `₦${GENERATION_PRICE} per full generation`,
    description:
      'Every feature unlocked. Pay only when you generate a client quotation. Fund the wallet and draw down as you quote.',
    walletBased: true,
  },
  limited: {
    id: 'limited',
    rank: 2,
    name: 'Limited',
    price: 10000,
    period: 'per month',
    tagline: 'Unlimited PDFs, fewer tools',
    description:
      'Unlimited PDF renders for the whole team, but the commercially important features — hardware selection, margin control and the running-cost engine — are not available.',
    days: SUBSCRIPTION_DAYS,
  },
  unlimited: {
    id: 'unlimited',
    rank: 3,
    name: 'Unlimited',
    price: 25000,
    period: 'per month',
    tagline: 'Everything, no limits',
    description:
      'Every feature, unlimited generations, for installers who quote every day.',
    days: SUBSCRIPTION_DAYS,
  },
};

export const PLAN_ORDER = ['free', 'payg', 'limited', 'unlimited'];

/** The plans a user can actually select (free is the implicit starting point). */
export const SELECTABLE_PLANS = ['payg', 'limited', 'unlimited'];

/**
 * Whether a plan can use a feature. Comparison is by rank, so `unlimited`
 * inherits everything `limited` and `payg` can do.
 */
export function planAllowsFeature(planId, featureId) {
  const plan = PLANS[planId] || PLANS.free;
  const feature = FEATURES.find((f) => f.id === featureId);
  if (!feature) return true; // unknown features must never hard-block
  return plan.rank >= PLANS[feature.tier].rank;
}

/** Features a plan cannot use — used to render upgrade prompts. */
export function lockedFeatures(planId) {
  return FEATURES.filter((f) => !planAllowsFeature(planId, f.id));
}

export default PLANS;

export const PROFILE_PRESETS = [
  {
    id: 'school',
    name: 'School / Training Center',
    description: 'Daytime operation (8:00 AM – 4:00 PM)',
    operatingHoursDay: 8,
    operatingHoursNight: 0,
    suggestedAppliances: { fans: 30, bulbs: 40, ac15hp: 2, computers: 25, cctv_wifi: 1, pumping_machine: 1 }
  },
  {
    id: 'home_3bed',
    name: '3-4 Bed Residence',
    description: '24/7 Comfort: Essential lights, fans, fridge & AC backup',
    operatingHoursDay: 12,
    operatingHoursNight: 10,
    suggestedAppliances: { fans: 6, bulbs: 16, ac15hp: 2, freezer: 1, fridge: 1, tv: 2, pumping_machine: 1, cctv_wifi: 1 }
  },
  {
    id: 'office',
    name: 'Corporate Office',
    description: 'Work hours (8:30 AM – 5:30 PM) continuous servers & ACs',
    operatingHoursDay: 9,
    operatingHoursNight: 2,
    suggestedAppliances: { fans: 10, bulbs: 30, ac15hp: 4, computers: 15, fridge: 1, cctv_wifi: 1 }
  },
  {
    id: 'custom',
    name: 'Custom Count',
    description: 'Customize appliance list from scratch',
    operatingHoursDay: 8,
    operatingHoursNight: 8,
    suggestedAppliances: { fans: 4, bulbs: 10, tv: 1, fridge: 1 }
  }
];

export const NIGERIAN_CITIES = [
  { name: 'Port Harcourt (Rivers)', sunHours: 4.3 },
  { name: 'Lagos Island / Mainland', sunHours: 4.8 },
  { name: 'Abuja (FCT)', sunHours: 5.3 },
  { name: 'Ibadan (Oyo)', sunHours: 4.9 },
  { name: 'Benin City (Edo)', sunHours: 4.4 },
  { name: 'Warri / Asaba (Delta)', sunHours: 4.4 },
  { name: 'Enugu (Enugu)', sunHours: 4.7 },
  { name: 'Owerri (Imo)', sunHours: 4.5 },
  { name: 'Kano (Kano)', sunHours: 5.8 },
  { name: 'Kaduna (Kaduna)', sunHours: 5.5 }
];
