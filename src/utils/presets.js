/**
 * Facility preset resolution
 * ---------------------------------------------------------------------------
 * Turns a readable preset ("fans: 30, bulbs: 40") into real load entries that
 * the sizing engine can actually use.
 *
 * The critical detail: a load entry must carry its own `watts`. The sizing
 * engine reads wattage off the load object, so a preset built as a bare
 * `{ id, qty }` yields a zero load. addLoad already snapshots watts off the
 * catalog product; this module does the same thing for presets, which is why
 * it lives next to that behaviour rather than inlining `{ id, qty }` at the
 * call site again.
 */
import { ALL_PRODUCTS } from '../data/catalog/index.js';
import { PROFILE_PRESETS } from '../data/pricingDefaults.js';
import { PRESET_ALIASES, PRESET_HOURS } from '../data/presetAliases.js';

const BY_ID = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));

/** A representative daily split, so a preset is not a flat 24h guess. */
const DEFAULT_SPLIT = { hoursDay: 8, hoursNight: 8 };

/**
 * Builds the load list for a preset.
 *
 * Keys with no alias, or whose alias points at a product that no longer exists,
 * are SKIPPED rather than emitted with a zero wattage — a phantom zero-watt load
 * would quietly under-size the system, which is the exact failure this module
 * exists to prevent.
 */
export function buildPresetLoads(presetId) {
  const preset = PROFILE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return [];

  const hours = PRESET_HOURS[presetId] || DEFAULT_SPLIT;
  const loads = [];

  Object.entries(preset.suggestedAppliances || {}).forEach(([key, qty]) => {
    const productId = PRESET_ALIASES[key];
    const product = productId ? BY_ID.get(productId) : null;
    if (!product || !(product.watts > 0)) return; // unresolved: skip, never fake
    loads.push({
      id: product.id,
      name: product.name,
      watts: product.watts,
      surgeWatts: product.surgeWatts || 0,
      qty: Number(qty) || 0,
      hoursDay: hours.day,
      hoursNight: hours.night,
    });
  });

  return loads.filter((l) => l.qty > 0);
}

/** Keys in a preset that could not be resolved — surfaced for diagnostics. */
export function unresolvedPresetKeys(presetId) {
  const preset = PROFILE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return [];
  return Object.keys(preset.suggestedAppliances || {}).filter((key) => {
    const id = PRESET_ALIASES[key];
    const product = id ? BY_ID.get(id) : null;
    return !product || !(product.watts > 0);
  });
}

/** The id the app opens with. Falls back to the first preset. */
export const DEFAULT_PRESET_ID = PROFILE_PRESETS[0]?.id || 'custom';

export default buildPresetLoads;
