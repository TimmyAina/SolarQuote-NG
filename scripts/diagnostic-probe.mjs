/**
 * Full-app diagnostic probe — part 1: data integrity across every subsystem.
 *
 * Phase 1 (root cause investigation) instrumentation. The existing suites assert
 * what someone already thought to test; this looks for invariant violations they
 * do NOT cover, especially seams introduced by recent changes (parts catalogue,
 * brand registry, manufacturer grouping).
 *
 * Usage: node scripts/diagnostic-probe.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

import {
  ALL_PRODUCTS, CATALOG_SECTIONS, LOAD_PRODUCTS, TOTAL_PRODUCT_COUNT,
  CATEGORY_LABELS, powerLabel, searchableWatts,
} from '../src/data/catalog/index.js';
import { APPLIANCES } from '../src/data/catalog/appliances.js';
import { PARTS } from '../src/data/parts.js';
import { BRANDS, getBrand, brandsForKind } from '../src/data/brands.js';
import { BRAND_LOGOS, WORDMARK_ONLY } from '../src/data/brandLogos.generated.js';
import { report, add, isFinite_, findings } from './diagnostic-findings.mjs';

// ---------------------------------------------------------------- D1: catalog
{
  const ids = new Set();
  ALL_PRODUCTS.forEach((p) => {
    if (ids.has(p.id)) add('CRIT', 'catalog', `duplicate product id "${p.id}"`);
    ids.add(p.id);
  });
  if (!ALL_PRODUCTS.length) add('CRIT', 'catalog', 'catalog is empty');

  const badPrice = ALL_PRODUCTS.filter(
    (p) => !isFinite_(p.indicativePriceNGN) || p.indicativePriceNGN < 0
  );
  if (badPrice.length) {
    add('HIGH', 'catalog', `${badPrice.length} bad price(s): ${badPrice.slice(0, 3).map((p) => p.name).join(', ')}`);
  }

  // Sections must partition the catalog; anything unaccounted for is invisible.
  const counted = CATALOG_SECTIONS.reduce((s, sec) => s + sec.count, 0);
  const declared = new Set(CATALOG_SECTIONS.map((s) => s.id));
  const orphanKinds = [...new Set(ALL_PRODUCTS.map((p) => p.kind))].filter((k) => !declared.has(k));
  if (orphanKinds.length) add('CRIT', 'catalog', `unregistered kind(s): ${orphanKinds.join(', ')}`);
  if (counted !== ALL_PRODUCTS.length) {
    add('HIGH', 'catalog', `section counts sum to ${counted}, catalog holds ${ALL_PRODUCTS.length}`);
  }

  const labelFail = ALL_PRODUCTS.filter((p) => {
    try { const l = powerLabel(p); return !l || /undefined|NaN|\[object/.test(l); } catch { return true; }
  });
  if (labelFail.length) add('HIGH', 'catalog', `${labelFail.length} products render a bad power label`);

  const searchFail = ALL_PRODUCTS.filter((p) => {
    try { return !isFinite_(searchableWatts(p)); } catch { return true; }
  });
  if (searchFail.length) add('HIGH', 'catalog', `${searchFail.length} products break searchableWatts`);

  // Parts must never reach the sizing engine.
  if (LOAD_PRODUCTS.some((p) => p.kind === 'part')) add('CRIT', 'catalog', 'parts leaked into LOAD_PRODUCTS');
  if (!PARTS.every((p) => p.watts === 0)) add('CRIT', 'catalog', 'a part carries a non-zero load draw');
  if (TOTAL_PRODUCT_COUNT !== ALL_PRODUCTS.length) {
    add('HIGH', 'catalog', `TOTAL_PRODUCT_COUNT (${TOTAL_PRODUCT_COUNT}) != length (${ALL_PRODUCTS.length})`);
  }
}


// ------------------------------------------------------- D2: appliance linkage
{
  const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
  const orphans = APPLIANCES.filter((a) => !byId.has(a.id));
  if (orphans.length) {
    add('CRIT', 'linkage', `${orphans.length} appliances have no catalog product: ${orphans.slice(0, 3).map((a) => a.id).join(', ')}`);
  }
  const badCat = APPLIANCES.filter((a) => !CATEGORY_LABELS[a.category]);
  if (badCat.length) add('MED', 'linkage', `${badCat.length} appliances use an unlabelled category`);

  // Profile presets use short readable keys, resolved to real catalog ids by
  // data/presetAliases.js. Every key must resolve or the preset yields a zero
  // load and the app under-sizes the quote.
  const { PRESET_ALIASES } = await import('../src/data/presetAliases.js');
  const { PROFILE_PRESETS } = await import('../src/data/pricingDefaults.js');
  PROFILE_PRESETS.forEach((preset) => {
    Object.keys(preset.suggestedAppliances || {}).forEach((key) => {
      const id = PRESET_ALIASES[key];
      if (!id) {
        add('CRIT', 'linkage', `preset "${preset.id}" key "${key}" has no alias`);
      } else if (!byId.has(id)) {
        add('CRIT', 'linkage', `preset "${preset.id}" key "${key}" -> missing product ${id}`);
      }
    });
  });
}

// -------------------------------------------------------------- D3: brand graph
{
  const unregistered = [...new Set(ALL_PRODUCTS.map((p) => p.brand).filter(Boolean))]
    .filter((b) => getBrand(b).unregistered);
  if (unregistered.length) add('HIGH', 'brands', `unregistered brands in use: ${unregistered.join(', ')}`);
  if (BRANDS.some((b) => !/^#[0-9A-Fa-f]{6}$/.test(b.color))) add('MED', 'brands', 'a brand lacks a valid colour');

  const slugs = BRANDS.map((b) => b.slug);
  if (new Set(slugs).size !== slugs.length) add('HIGH', 'brands', 'duplicate brand slugs');

  // A logo path with no file on disk is a broken image in the shipped APK.
  const missing = BRANDS.filter((b) => b.logo && !existsSync(join('public', b.logo)));
  if (missing.length) {
    add('CRIT', 'brands', `${missing.length} brands point at a missing file: ${missing.map((b) => b.slug).join(', ')}`);
  }
  const drift = BRANDS.filter((b) => b.logo && BRAND_LOGOS[b.name] !== b.logo);
  if (drift.length) add('HIGH', 'brands', `${drift.length} brand logos disagree with the generated map`);
  const wl = BRANDS.filter((b) => !b.logo && !(WORDMARK_ONLY || []).includes(b.name));
  if (wl.length) add('MED', 'brands', `${wl.length} wordmark brands missing from the generated list`);

  // The tab bar must partition its section on whichever axis it picks.
  const { groupingFor } = await import('../src/data/brands.js');
  ['inverter', 'battery', 'panel', 'laptop', 'desktop', 'appliance', 'part'].forEach((kind) => {
    const g = groupingFor(ALL_PRODUCTS, kind);
    const total = ALL_PRODUCTS.filter((p) => p.kind === kind).length;
    const sum = g.reduce((s, b) => s + b.count, 0);
    if (sum !== total) add('HIGH', 'brands', `${kind} tabs sum to ${sum}, section has ${total}`);
    if (g.length < 1) add('HIGH', 'brands', `${kind} has no tab groups`);
    if (g.every((x) => x.isCategory) && g.length <= 1) {
      add('MED', 'brands', `${kind} would render no tab bar (single group)`);
    }
  });
}

const part1 = report('part1-data');
// Part 2 is skipped when part 1 found a critical fault: a broken data graph
// makes engine-level output meaningless, so fixing upstream comes first.
if (!part1) {
  await import('./diagnostic-engine.mjs');
  report('part2-engine');
}
process.exit(findings.some((f) => f.sev === 'CRIT') ? 1 : 0);

