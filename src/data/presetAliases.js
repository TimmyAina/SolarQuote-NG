/**
 * Facility preset alias map
 * ---------------------------------------------------------------------------
 * PROFILE_PRESETS in pricingDefaults.js is deliberately written with short,
 * human-readable keys ("fans", "bulbs", "ac15hp") so the facility templates stay
 * legible and editable.
 *
 * Those keys are NOT catalog ids. The catalog generates long slugs like
 * `app-lighting-led-bulb-18w-cool-day-`, so the short keys resolved to nothing
 * and every preset produced a ZERO load. This map is the single place that
 * translates a preset key into a real product id.
 *
 * Kept separate from the presets so the data stays readable and the mapping is
 * independently testable. scripts/catalog-check.mjs asserts every key here
 * resolves to a real product and that every preset produces a non-zero load.
 */
export const PRESET_ALIASES = {
  // Cooling
  fans: 'app-cooling-ceiling-fan-standard-',
  ac15hp: 'app-cooling-1-5-hp-split-inverter-ac',

  // Lighting
  bulbs: 'app-lighting-led-bulb-18w-cool-day-',

  // Computing
  computers: 'app-computing-desktop-pc-office-',

  // Security and connectivity
  cctv_wifi: 'app-security-cctv-kit-8-cameras-nvr-',

  // Water
  pumping_machine: 'app-pumps-water-pumping-machine-1-5hp',

  // Refrigeration
  freezer: 'app-refrigeration-chest-freezer-300l',
  fridge: 'app-refrigeration-double-door-fridge-350l',

  // Entertainment
  tv: 'app-entertainment-43-smart-tv',
};

/** The operating profile a preset implies, used for day/night split. */
export const PRESET_HOURS = {
  school: { day: 8, night: 0 },
  home_3bed: { day: 12, night: 10 },
  office: { day: 9, night: 2 },
  custom: { day: 8, night: 8 },
};

export default PRESET_ALIASES;
