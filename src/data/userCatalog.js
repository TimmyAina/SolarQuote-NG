/**
 * User Catalog â€” price overrides and self-added products
 * ---------------------------------------------------------------------------
 * Two capabilities, deliberately kept in one pure store so they compose:
 *
 *   1. PRICE OVERRIDES â€” the bundled catalog ships indicative street prices.
 *      Installers quote from their own supplier, so any product's price can be
 *      overridden. An override never mutates the shipped dataset; it is applied
 *      on read via `effectivePrice()`.
 *   2. CUSTOM PRODUCTS â€” installers stock hardware we do not list (grey imports,
 *      supplier-specific models). They can add their own inverters, batteries,
 *      panels and loads, which then behave exactly like catalog products.
 *
 * Everything here is pure: state in, new state out. No React, no storage. That
 * is what makes the money/validation rules testable in plain Node.
 *
 * Both features are gated at the `unlimited` tier (see pricingDefaults).
 */

const MAX_NAME = 60;
const MAX_BRAND = 40;
const MAX_PRICE = 1e9;
const MAX_WATTS = 5e6;
const MAX_CUSTOM_PRODUCTS = 300;

/** The kinds a user may add. Mirrors the shipped catalog's `kind` values. */
export const ADDABLE_KINDS = [
  { id: 'inverter', label: 'Inverter' },
  { id: 'battery', label: 'Battery' },
  { id: 'panel', label: 'Solar panel' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'appliance', label: 'Appliance' },
];

const toInt = (v, fallback = 0) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : fallback;
};

const clean = (v, max) =>
  String(v ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, max);

/** Stable, collision-resistant id for a user-added product. */
export function customId(kind, brand, name, seq = 0) {
  const slug = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'item';
  return `usr-${slug(kind)}-${slug(brand)}-${slug(name)}-${seq}`;
}

/** A brand-new, empty user catalog. */
export function createUserCatalog() {
  return { priceOverrides: {}, customProducts: [] };
}

const withOverride = (state, productId, price) => ({
  ...state,
  priceOverrides: { ...state.priceOverrides, [productId]: price },
});

/**
 * Overrides one product's price.
 * Rejects anything that is not a sane, strictly positive Naira amount so a
 * typo cannot silently zero out a quotation line.
 */
export function setPrice(state, productId, price) {
  if (!productId) return { ok: false, state, error: 'Missing product.' };
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, state, error: 'Enter a price above â‚¦0.' };
  }
  if (value > MAX_PRICE) {
    return { ok: false, state, error: 'That price looks too large. Check the digits.' };
  }
  return { ok: true, state: withOverride(state, productId, toInt(value)) };
}

/** Removes one override, restoring the shipped indicative price. */
export function clearPrice(state, productId) {
  if (!state.priceOverrides || !(productId in state.priceOverrides)) {
    return { ok: true, state };
  }
  const next = { ...state.priceOverrides };
  delete next[productId];
  return { ok: true, state: { ...state, priceOverrides: next } };
}

/** Drops every override at once. Custom products are left alone. */
export function resetPrices(state) {
  return { ok: true, state: { ...state, priceOverrides: {} } };
}

/** The price to actually show and charge: override if set, else the dataset's. */
export function effectivePrice(product, state) {
  const override = state?.priceOverrides?.[product?.id];
  if (Number.isFinite(override) && override > 0) return override;
  return toInt(product?.indicativePriceNGN, 0);
}

/** True when this product's price has been overridden by the user. */
export const hasOverride = (productId, state) =>
  Number.isFinite(state?.priceOverrides?.[productId]);


/**
 * Validates and normalises a user-supplied product.
 * Returns `{ ok, product, error }` so the form can show a precise message.
 */
export function normaliseCustomProduct(input, { seq = 0 } = {}) {
  const kind = ADDABLE_KINDS.some((k) => k.id === input?.kind) ? input.kind : null;
  if (!kind) return { ok: false, error: 'Choose a product type.' };

  const name = clean(input.name, MAX_NAME);
  if (name.length < 2) return { ok: false, error: 'Give the product a name.' };

  const brand = clean(input.brand, MAX_BRAND) || 'Mine';

  // Accept the form field name (priceNGN) or the canonical stored field
  // (indicativePriceNGN). Without this fallback, re-hydrating a saved catalog
  // would silently drop every product it had just written.
  const price = Number(input.priceNGN ?? input.indicativePriceNGN);
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, error: 'Enter a price above â‚¦0.' };
  }
  if (price > MAX_PRICE) return { ok: false, error: 'That price looks too large.' };

  // POWER IS THE PRIMARY DATA. Every kind needs a number that sizes correctly.
  const watts = toInt(input.watts, 0);
  if (watts <= 0 || watts > MAX_WATTS) {
    return { ok: false, error: 'Enter the power rating in watts.' };
  }

  const base = {
    id: input.id || customId(kind, brand, name, seq),
    category: kind,
    kind,
    name,
    brand,
    watts,
    indicativePriceNGN: toInt(price),
    custom: true,
    addedAt: Number.isFinite(Number(input.addedAt)) ? Number(input.addedAt) : Date.now(),
    specs: {},
  };

  if (kind === 'battery') {
    // A battery's sizing axis is stored energy, not draw.
    const energyKWh = Number(input.energyKWh);
    const volts = toInt(input.volts, 48);
    base.energyKWh =
      Number.isFinite(energyKWh) && energyKWh > 0
        ? Math.round(energyKWh * 100) / 100
        : Math.round((watts / 1000) * 100) / 100;
    base.volts = volts >= 12 && volts <= 400 ? volts : 48;
    base.specs = { chemistry: clean(input.chemistry, 30) || 'LiFePO4' };
    return { ok: true, product: base };
  }

  if (kind === 'inverter') {
    // Surge capability is what actually sizes an inverter; default to 2x when
    // the user does not know it, which is the common case for AC/compressors.
    const surge = Number(input.surgeVA);
    base.surgeVA = Number.isFinite(surge) && surge > 0 ? toInt(surge) : toInt(watts * 2);
    base.specs = {
      phase: clean(input.phase, 30) || 'Single-Phase',
      topology: clean(input.topology, 30) || 'Hybrid',
    };
    base.selfConsumptionW = 15;
    return { ok: true, product: base };
  }

  if (kind === 'panel') {
    base.specs = { cellType: clean(input.cellType, 30) || 'Mono PERC' };
    return { ok: true, product: base };
  }

  // Loads (appliance / laptop / desktop) draw `watts` directly.
  return { ok: true, product: base };
}

/** Appends a validated custom product, or updates a same name+brand+kind. */
export function addCustomProduct(state, input) {
  const res = normaliseCustomProduct(input, { seq: (state.customProducts?.length || 0) + 1 });
  if (!res.ok) return { ok: false, state, error: res.error };

  const list = state.customProducts || [];

  // Re-adding the same name+brand+kind updates rather than duplicating.
  const dup = list.findIndex(
    (p) => p.kind === res.product.kind && p.name === res.product.name && p.brand === res.product.brand
  );
  if (dup >= 0) {
    const copy = list.slice();
    copy[dup] = { ...res.product, id: list[dup].id, addedAt: list[dup].addedAt };
    return { ok: true, state: { ...state, customProducts: copy }, product: copy[dup], updated: true };
  }
  if (list.length >= MAX_CUSTOM_PRODUCTS) {
    return { ok: false, state, error: `You can keep up to ${MAX_CUSTOM_PRODUCTS} of your own products.` };
  }
  return {
    ok: true,
    state: { ...state, customProducts: [res.product, ...list] },
    product: res.product,
  };
}

/** Edits an existing custom product, keeping its id and created date. */
export function updateCustomProduct(state, productId, input) {
  const list = state.customProducts || [];
  const idx = list.findIndex((p) => p.id === productId);
  if (idx < 0) return { ok: false, state, error: 'Product not found.' };

  const res = normaliseCustomProduct({ ...input, id: productId, addedAt: list[idx].addedAt });
  if (!res.ok) return { ok: false, state, error: res.error };

  const copy = list.slice();
  copy[idx] = res.product;
  return { ok: true, state: { ...state, customProducts: copy }, product: res.product };
}

/** Removes a custom product and any price override attached to it. */
export function removeCustomProduct(state, productId) {
  const list = state.customProducts || [];
  const next = { ...state, customProducts: list.filter((p) => p.id !== productId) };
  if (productId in (state.priceOverrides || {})) {
    const overrides = { ...state.priceOverrides };
    delete overrides[productId];
    next.priceOverrides = overrides;
  }
  return { ok: true, state: next };
}

/** Wipes everything the user added. */
export function resetUserCatalog() {
  return { ok: true, state: createUserCatalog() };
}

/**
 * Applies overrides to a product list. `effectivePrice` reads the override map
 * directly, so this is only needed where a merged array is handed to code that
 * reads `indicativePriceNGN` directly.
 */
export function withEffectivePrices(products, state) {
  return products.map((p) => ({ ...p, indicativePriceNGN: effectivePrice(p, state) }));
}

/**
 * Parses stored JSON defensively â€” a corrupt payload must never brick the app.
 * Anything that fails validation is dropped rather than surfaced.
 */
export function hydrateUserCatalog(raw) {
  const empty = createUserCatalog();
  if (!raw) return empty;
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return empty;
  }
  if (!parsed || typeof parsed !== 'object') return empty;

  const overrides = {};
  if (parsed.priceOverrides && typeof parsed.priceOverrides === 'object') {
    Object.entries(parsed.priceOverrides).forEach(([k, v]) => {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0 && n <= MAX_PRICE) overrides[k] = toInt(n);
    });
  }

  const customProducts = (Array.isArray(parsed.customProducts) ? parsed.customProducts : [])
    .map((p, i) => normaliseCustomProduct({ ...p, addedAt: p?.addedAt }, { seq: i + 1 }))
    .filter((r) => r.ok)
    .map((r) => r.product);

  return { priceOverrides: overrides, customProducts };
}

export default {
  createUserCatalog,
  hydrateUserCatalog,
  setPrice,
  clearPrice,
  resetPrices,
  effectivePrice,
  hasOverride,
  normaliseCustomProduct,
  addCustomProduct,
  updateCustomProduct,
  removeCustomProduct,
  resetUserCatalog,
  withEffectivePrices,
  customId,
  ADDABLE_KINDS,
};

