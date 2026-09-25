/**
 * Catalog Screen
 * ---------------------------------------------------------------------------
 * Browsable, searchable reference across all six product families. Tapping a
 * product opens a detail sheet; loads can be added straight into the quote.
 *
 * Two rendering modes:
 *  - simple: power-first, no spec tables
 *  - pro:    adds the full specification grid and technical fields
 */
import React, { useMemo, useState } from 'react';
import {
  Search, X, SlidersHorizontal, Zap, BatteryCharging,
  Sun, Laptop, Monitor, Plug, Wrench, Plus, Lock,
} from 'lucide-react';
import {
  CATALOG_SECTIONS, searchCatalog, powerLabel, mergeUserCatalog, applyPriceOverrides,
  TOTAL_PRODUCT_COUNT,
} from '../data/catalog/index.js';
import { ProductVisual } from './ProductVisual.jsx';
import { ProductDetail } from './ProductDetail.jsx';
import { ProductEditor } from './ProductEditor.jsx';
import { ManufacturerTabs } from './ManufacturerTabs.jsx';
import { BrandMark } from './BrandMark.jsx';
import { useApp } from '../context/AppContext.jsx';

const ICONS = {
  inverter: Zap, battery: BatteryCharging, panel: Sun,
  laptop: Laptop, desktop: Monitor, appliance: Plug,
  part: Wrench,
};

const ALL = 'all';

export function CatalogScreen({ isSimple, onAddLoad, onLockedAdd, currentLoads = [] }) {
  const {
    userCatalog, canUse, setProductPrice, clearProductPrice,
    addCustomProduct, editCustomProduct, deleteCustomProduct,
  } = useApp();

  const [query, setQuery] = useState('');
  const [section, setSection] = useState(ALL);
  const [brand, setBrand] = useState(null);
  const [showBrands, setShowBrands] = useState(false);
  const [detail, setDetail] = useState(null);
  const [editorFor, setEditorFor] = useState(null); // null | 'new' | product

  const canEditCatalog = canUse('custom_catalog');

  // The user's own products join the shipped catalog, and their price overrides
  // are applied on read so a shipped row is never mutated.
  const products = useMemo(
    () => applyPriceOverrides(mergeUserCatalog(userCatalog), userCatalog),
    [userCatalog]
  );

  const results = useMemo(
    () => searchCatalog(query, { sections: section === ALL ? null : [section], products }),
    [query, section, products]
  );

  const brandOptions = useMemo(() => {
    const set = new Set();
    results.forEach((p) => p.brand && set.add(p.brand));
    return [...set].sort();
  }, [results]);

  const filtered = useMemo(
    () => (brand ? results.filter((p) => p.brand === brand) : results),
    [results, brand]
  );

  const activeFilterCount = (section !== ALL ? 1 : 0) + (brand ? 1 : 0);

  // Manufacturer tabs count the section's own products, not the search results,
  // so the numbers stay stable while the installer types a query.
  const sectionProducts = useMemo(
    () => products.filter((p) => section === ALL || p.kind === section),
    [products, section]
  );

  return (
    <div className="pb-28">
      <CatalogFilters
        query={query}
        setQuery={setQuery}
        section={section}
        setSection={(s) => { setSection(s); setBrand(null); }}
        brand={brand}
        setBrand={setBrand}
        showBrands={showBrands}
        setShowBrands={setShowBrands}
        brandOptions={brandOptions}
        resultCount={filtered.length}
        activeFilterCount={activeFilterCount}
      />

      {/* Producer tabs: group a section by who makes the product */}
      <div className="px-4 pb-3">
        <ManufacturerTabs
          products={sectionProducts}
          kind={section === ALL ? null : section}
          selected={brand}
          onSelect={setBrand}
        />
      </div>

      {/* Add your own hardware — a paid capability */}
      <div className="px-4 pb-3">
        {canEditCatalog ? (
          <button
            type="button"
            onClick={() => setEditorFor('new')}
            className="sq-btn sq-btn-ghost w-full"
          >
            <Plus className="w-4 h-4" />
            Add your own product
          </button>
        ) : (
          <button
            type="button"
            onClick={onLockedAdd}
            className="sq-btn sq-btn-ghost w-full"
          >
            <Lock className="w-4 h-4 shrink-0" />
            {/* Short enough to stay on one line; the old wording wrapped to two
                lines and left the padlock stranded at the far left. */}
            <span className="truncate">Add your own products - upgrade</span>
          </button>
        )}
        {userCatalog.customProducts.length > 0 && (
          <p className="text-[11px] text-ink-3 font-semibold text-center mt-2">
            {userCatalog.customProducts.length} of your own product
            {userCatalog.customProducts.length === 1 ? '' : 's'} ·{' '}
            {Object.keys(userCatalog.priceOverrides || {}).length} price override
            {Object.keys(userCatalog.priceOverrides || {}).length === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <ProductGrid
          products={filtered.slice(0, 300)}
          total={filtered.length}
          onSelect={setDetail}
        />
      )}

      {detail && (
        <ProductDetail
          product={detail}
          isSimple={isSimple}
          currentQty={currentLoads.find((l) => l.id === detail.id)?.qty || 0}
          onClose={() => setDetail(null)}
          onAddLoad={onAddLoad}
          onLockedAdd={onLockedAdd}
          canEdit={canEditCatalog}
          isOverridden={Boolean(userCatalog.priceOverrides?.[detail.id])}
          onSetPrice={setProductPrice}
          onResetPrice={clearProductPrice}
          onEditProduct={(p) => { setDetail(null); setEditorFor(p); }}
        />
      )}

      {editorFor && (
        <ProductEditor
          product={editorFor === 'new' ? null : editorFor}
          onSave={(form) =>
            editorFor === 'new'
              ? addCustomProduct(form)
              : editCustomProduct(editorFor.id, form)
          }
          onDelete={deleteCustomProduct}
          onClose={() => setEditorFor(null)}
        />
      )}
    </div>
  );
}

/** Sticky search bar + section chips + brand filter. */
function CatalogFilters({
  query, setQuery, section, setSection, brand, setBrand,
  showBrands, setShowBrands, brandOptions, resultCount, activeFilterCount,
}) {
  return (
    <div className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-md sq-safe-t pb-3 -mx-4 px-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${TOTAL_PRODUCT_COUNT} products, brands or specs…`}
          aria-label="Search the product catalog"
          className="sq-input pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-ink-3 hover:bg-surface-2"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          type="button"
          className="sq-chip"
          data-active={section === ALL}
          onClick={() => { setSection(ALL); setBrand(null); }}
        >
          All <span className="opacity-70 tnum">{TOTAL_PRODUCT_COUNT}</span>
        </button>
        {CATALOG_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="sq-chip"
            data-active={section === s.id}
            onClick={() => { setSection(s.id); setBrand(null); }}
          >
            {s.shortLabel} <span className="opacity-70 tnum">{s.count}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => setShowBrands((v) => !v)}
          aria-expanded={showBrands}
          className="sq-chip"
          data-active={showBrands || Boolean(brand)}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {brand || `${brandOptions.length} brands`}
        </button>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => { setSection(ALL); setBrand(null); }}
            className="sq-chip"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
        <span className="ml-auto text-xs font-bold text-ink-3 tnum">
          {resultCount} result{resultCount === 1 ? '' : 's'}
        </span>
      </div>

      {showBrands && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 -mx-1 px-1 sq-rise">
          {brandOptions.map((b) => (
            <button
              key={b}
              type="button"
              className="sq-chip"
              data-active={brand === b}
              onClick={() => setBrand(brand === b ? null : b)}
            >
              {b}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface-2 text-ink-3 mx-auto flex items-center justify-center mb-3">
        <Search className="w-6 h-6" />
      </div>
      <p className="font-extrabold text-sm">No products match “{query}”</p>
      <p className="text-xs text-ink-3 mt-1.5">
        Try a brand name, a wattage, or a category like “freezer”.
      </p>
    </div>
  );
}

function ProductGrid({ products, onSelect, total }) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-1">
        {products.map((p) => {
          const Icon = ICONS[p.kind] || Plug;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className="sq-card overflow-hidden text-left hover:shadow-lift transition-shadow active:scale-[0.99] relative"
            >
              <div className="h-24 w-full">
                {/* The card overlays its own <BrandMark> badge, so the tile must not
                  repeat the brand initials as well. */}
              <ProductVisual product={p} showBrand={false} />
              </div>
              {/* Manufacturer mark, so the producer is identifiable on the card */}
              <span className="absolute top-1.5 left-1.5">
                <BrandMark brand={p.brand} size="xs" className="shadow-sm ring-1 ring-black/5" />
              </span>
              {p.custom && (
                <span className="absolute top-1.5 right-1.5 text-[9px] font-extrabold uppercase tracking-wide text-white bg-accent px-1.5 py-0.5 rounded-md">
                  Yours
                </span>
              )}
              <div className="p-2.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-accent truncate">
                  {p.brand}
                </p>
                <p className="text-xs font-bold text-ink leading-tight mt-0.5 line-clamp-2">
                  {p.name}
                </p>
                <div className="mt-2 flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold tnum text-ink">
                    {powerLabel(p)}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {total > 300 && (
        <p className="text-center text-xs text-ink-3 font-semibold mt-4">
          Showing the first 300 of {total}. Narrow your search to see more.
        </p>
      )}
    </>
  );
}

export default CatalogScreen;
