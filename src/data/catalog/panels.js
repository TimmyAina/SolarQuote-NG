/**
 * Solar PV Panel Catalog — modules available in the Nigerian market
 * ---------------------------------------------------------------------------
 * A panel GENERATES power rather than consuming it, so `watts` here is rated
 * nameplate output (Wp). The engine uses it to size array count against the
 * load: panels needed = system kW / panel watts.
 *
 * Row schema (positional, expanded by `toPanel`):
 *   [model, brand, wattage, priceNGN, opts]
 *   opts: { type, vocV, vmpV, iscA, efficiencyPct, warrantyYears, bifacial }
 */

// prettier-ignore
const ROWS = [
  ['Hi-MO 6 LR5-72HTH',     'LONGi',        580,  285000, { type: 'Mono PERC', vocV: 41.8, vmpV: 31.2, iscA: 13.9, efficiencyPct: 22.4, warrantyYears: 25, bifacial: false }],
  ['Hi-MO 7 LR5-72HTH',     'LONGi',        605,  298000, { type: 'N-Type', vocV: 38.5, vmpV: 33.0, iscA: 15.7, efficiencyPct: 23.2, warrantyYears: 30, bifacial: false }],
  ['Hi-MO 8 LR5-54HTH',     'LONGi',        550,  268000, { type: 'Mono PERC', vocV: 41.4, vmpV: 31.2, iscA: 13.3, efficiencyPct: 21.6, warrantyYears: 25, bifacial: false }],
  ['Hi-MO 6 LR5-54HTH',     'LONGi',        425,  212000, { type: 'Mono PERC', vocV: 41.4, vmpV: 31.0, iscA: 10.5, efficiencyPct: 21.3, warrantyYears: 25, bifacial: false }],

  ['JKM550N-72HL4',         'Jinko Solar',   550,  272000, { type: 'N-Type', vocV: 37.6, vmpV: 31.4, iscA: 14.6, efficiencyPct: 22.4, warrantyYears: 30, bifacial: true }],
  ['JKM600N-72HL4',         'Jinko Solar',   600,  298000, { type: 'N-Type', vocV: 37.8, vmpV: 31.6, iscA: 15.9, efficiencyPct: 23.1, warrantyYears: 30, bifacial: true }],
  ['JKM455N-54HL4',         'Jinko Solar',   455,  218000, { type: 'N-Type', vocV: 37.6, vmpV: 31.4, iscA: 11.6, efficiencyPct: 22.2, warrantyYears: 30, bifacial: true }],
  ['JKM580N-72HL5',         'Jinko Solar',   580,  290000, { type: 'N-Type', vocV: 55.0, vmpV: 42.2, iscA: 13.8, efficiencyPct: 22.5, warrantyYears: 30, bifacial: true }],

  ['HiKu7 CS3N-72MS',       'Canadian Solar',580,  288000, { type: 'Mono PERC', vocV: 41.4, vmpV: 31.2, iscA: 14.0, efficiencyPct: 22.3, warrantyYears: 25, bifacial: true }],
  ['HiKu6 CS3W-72MS',       'Canadian Solar',545,  268000, { type: 'Mono PERC', vocV: 41.4, vmpV: 31.0, iscA: 13.2, efficiencyPct: 21.0, warrantyYears: 25, bifacial: true }],
  ['HiKu7 CS3L-62MS',       'Canadian Solar',580,  292000, { type: 'Mono PERC', vocV: 49.8, vmpV: 37.4, iscA: 14.7, efficiencyPct: 22.1, warrantyYears: 25, bifacial: true }],
  ['TopBiHiKu6 CS3W-620MS', 'Canadian Solar',620,  305000, { type: 'Mono PERC', vocV: 41.6, vmpV: 31.4, iscA: 14.9, efficiencyPct: 22.5, warrantyYears: 25, bifacial: true }],

  ['Maxeon 6 AC-A600',      'Maxeon',       600,  318000, { type: 'Mono PERC', vocV: 40.1, vmpV: 30.0, iscA: 15.0, efficiencyPct: 22.8, warrantyYears: 25, bifacial: true }],
  ['Maxeon 3 AC-A425',      'Maxeon',       425,  225000, { type: 'Mono PERC', vocV: 37.5, vmpV: 30.0, iscA: 11.4, efficiencyPct: 21.7, warrantyYears: 25, bifacial: true }],
  ['Maxeon 6 AC-A550',      'Maxeon',       550,  298000, { type: 'Mono PERC', vocV: 38.2, vmpV: 29.4, iscA: 14.4, efficiencyPct: 22.4, warrantyYears: 25, bifacial: true }],

  ['Tiger Neo N-type 580W',  'Trina Solar',   580,  286000, { type: 'N-Type', vocV: 37.5, vmpV: 31.5, iscA: 15.4, efficiencyPct: 22.5, warrantyYears: 25, bifacial: true }],
  ['Vertex S+ 670W',        'Trina Solar',   670,  325000, { type: 'N-Type', vocV: 38.5, vmpV: 33.5, iscA: 17.4, efficiencyPct: 23.3, warrantyYears: 30, bifacial: true }],
  ['Tiger Neo 440W',        'Trina Solar',   440,  212000, { type: 'N-Type', vocV: 37.4, vmpV: 31.4, iscA: 11.7, efficiencyPct: 22.0, warrantyYears: 25, bifacial: true }],

  ['TOPCon 580W 72-cell',    'Risen',         580,  280000, { type: 'N-Type', vocV: 38.2, vmpV: 32.0, iscA: 15.2, efficiencyPct: 22.5, warrantyYears: 25, bifacial: false }],
  ['TOPCon 620W 72-cell',    'Risen',         620,  300000, { type: 'N-Type', vocV: 38.5, vmpV: 32.2, iscA: 16.1, efficiencyPct: 23.0, warrantyYears: 25, bifacial: false }],
  ['Poly 335W 72-cell',      'Risen',         335,  148000, { type: 'Poly', vocV: 45.6, vmpV: 35.0, iscA: 8.8, efficiencyPct: 17.0, warrantyYears: 25, bifacial: false }],

  ['FPL-S-580',             'First Solar',   580,  288000, { type: 'Thin Film CdTe', vocV: 221.0, vmpV: 186.0, iscA: 3.4, efficiencyPct: 19.3, warrantyYears: 25, bifacial: false }],
  ['FPL-S-585',             'First Solar',   585,  292000, { type: 'Thin Film CdTe', vocV: 221.0, vmpV: 186.0, iscA: 3.4, efficiencyPct: 19.4, warrantyYears: 25, bifacial: false }],

  ['Half-Cut 550W 144-cell', 'Seraphim',      550,  272000, { type: 'Mono PERC', vocV: 41.8, vmpV: 31.4, iscA: 13.2, efficiencyPct: 22.1, warrantyYears: 25, bifacial: false }],
  ['Seraphim 600W 144-cell', 'Seraphim',      600,  296000, { type: 'Mono PERC', vocV: 41.5, vmpV: 31.6, iscA: 14.5, efficiencyPct: 22.6, warrantyYears: 25, bifacial: false }],
  ['SunPower Maxeon 6 440W', 'SunPower',      440,  232000, { type: 'Mono PERC', vocV: 40.4, vmpV: 30.4, iscA: 11.6, efficiencyPct: 22.2, warrantyYears: 25, bifacial: false }],

  ['Tier-1 Mono 450W',       'Tier-1',        450,  198000, { type: 'Mono PERC', vocV: 37.6, vmpV: 30.4, iscA: 12.0, efficiencyPct: 20.4, warrantyYears: 12, bifacial: false }],
  ['Tier-1 Mono 550W',       'Tier-1',        550,  248000, { type: 'Mono PERC', vocV: 41.2, vmpV: 31.2, iscA: 13.4, efficiencyPct: 21.5, warrantyYears: 12, bifacial: false }],
  ['Tier-1 Poly 450W',       'Tier-1',        450,  182000, { type: 'Poly', vocV: 45.2, vmpV: 34.8, iscA: 10.0, efficiencyPct: 17.4, warrantyYears: 12, bifacial: false }],
  ['Hi-MO 5 LR5-72HTH',     'LONGi',        560,  278000, { type: 'Mono PERC', vocV: 41.6, vmpV: 31.2, iscA: 13.6, efficiencyPct: 21.6, warrantyYears: 25, bifacial: false }],
  ['Hi-MO 4 LR5-72HTH',     'LONGi',        540,  264000, { type: 'Mono PERC', vocV: 41.4, vmpV: 31.0, iscA: 13.1, efficiencyPct: 20.8, warrantyYears: 25, bifacial: false }],
  ['Hi-MO 6 LR5-54HTH',     'LONGi',        440,  218000, { type: 'Mono PERC', vocV: 37.2, vmpV: 29.4, iscA: 11.8, efficiencyPct: 21.9, warrantyYears: 25, bifacial: false }],
  ['Hi-MO 9 LR5-72HTH',     'LONGi',        630,  312000, { type: 'N-Type', vocV: 38.6, vmpV: 33.2, iscA: 16.3, efficiencyPct: 23.8, warrantyYears: 30, bifacial: false }],

  ['JKM530N-72HL4',         'Jinko Solar',   530,  264000, { type: 'N-Type', vocV: 37.6, vmpV: 31.2, iscA: 14.1, efficiencyPct: 21.6, warrantyYears: 30, bifacial: true }],
  ['JKM545N-72HL4',         'Jinko Solar',   545,  270000, { type: 'N-Type', vocV: 37.7, vmpV: 31.3, iscA: 14.5, efficiencyPct: 22.1, warrantyYears: 30, bifacial: true }],
  ['JKM570N-72HL4',         'Jinko Solar',   570,  284000, { type: 'N-Type', vocV: 37.7, vmpV: 31.5, iscA: 15.1, efficiencyPct: 22.8, warrantyYears: 30, bifacial: true }],
  ['JKM410N-54HL4',         'Jinko Solar',   410,  198000, { type: 'N-Type', vocV: 37.5, vmpV: 31.2, iscA: 10.9, efficiencyPct: 21.4, warrantyYears: 30, bifacial: true }],
  ['JKM430N-54HL4',         'Jinko Solar',   430,  208000, { type: 'N-Type', vocV: 37.5, vmpV: 31.3, iscA: 11.4, efficiencyPct: 22.0, warrantyYears: 30, bifacial: true }],

  ['HiKu5 CS3P-72MS',       'Canadian Solar',520,  252000, { type: 'Mono PERC', vocV: 41.4, vmpV: 31.0, iscA: 12.6, efficiencyPct: 20.1, warrantyYears: 25, bifacial: false }],
  ['HiKu5 CS3P-72MS(B)',    'Canadian Solar',530,  262000, { type: 'Mono PERC', vocV: 41.4, vmpV: 31.1, iscA: 12.8, efficiencyPct: 20.4, warrantyYears: 25, bifacial: true }],
  ['HiKu6 CS3W-630MS',      'Canadian Solar',630,  310000, { type: 'Mono PERC', vocV: 41.7, vmpV: 31.5, iscA: 15.1, efficiencyPct: 22.6, warrantyYears: 25, bifacial: true }],
  ['HiKu7 CS3N-65MS',       'Canadian Solar',650,  318000, { type: 'Mono PERC', vocV: 45.2, vmpV: 34.0, iscA: 14.4, efficiencyPct: 22.0, warrantyYears: 25, bifacial: true }],

  ['Maxeon 3 AC-A540',      'Maxeon',       540,  292000, { type: 'Mono PERC', vocV: 38.1, vmpV: 29.3, iscA: 14.2, efficiencyPct: 22.0, warrantyYears: 25, bifacial: true }],
  ['Maxeon 6 AC-A475',      'Maxeon',       475,  262000, { type: 'Mono PERC', vocV: 38.3, vmpV: 30.0, iscA: 12.4, efficiencyPct: 22.2, warrantyYears: 25, bifacial: true }],

  ['Vertex S+ 675W',        'Trina Solar',   675,  328000, { type: 'N-Type', vocV: 38.6, vmpV: 33.6, iscA: 17.5, efficiencyPct: 23.4, warrantyYears: 30, bifacial: true }],
  ['Vertex S+ 445W',        'Trina Solar',   445,  214000, { type: 'N-Type', vocV: 37.4, vmpV: 31.4, iscA: 11.8, efficiencyPct: 22.1, warrantyYears: 25, bifacial: true }],
  ['Tiger Neo 470W',        'Trina Solar',   470,  226000, { type: 'N-Type', vocV: 37.4, vmpV: 31.5, iscA: 12.5, efficiencyPct: 22.3, warrantyYears: 25, bifacial: true }],

  ['TOPCon 550W 72-cell',    'Risen',         550,  268000, { type: 'N-Type', vocV: 38.0, vmpV: 31.8, iscA: 14.5, efficiencyPct: 21.9, warrantyYears: 25, bifacial: false }],
  ['TOPCon 600W 72-cell',    'Risen',         600,  292000, { type: 'N-Type', vocV: 38.4, vmpV: 32.0, iscA: 15.6, efficiencyPct: 22.6, warrantyYears: 25, bifacial: false }],
  ['Poly 330W 72-cell',      'Risen',         330,  146000, { type: 'Poly', vocV: 45.4, vmpV: 34.6, iscA: 8.7, efficiencyPct: 16.8, warrantyYears: 25, bifacial: false }],

  ['Half-Cut 445W 144-cell', 'Seraphim',      445,  212000, { type: 'Mono PERC', vocV: 41.6, vmpV: 31.2, iscA: 10.7, efficiencyPct: 20.9, warrantyYears: 25, bifacial: false }],
  ['Seraphim 450W 144-cell', 'Seraphim',      450,  215000, { type: 'Mono PERC', vocV: 41.6, vmpV: 31.2, iscA: 10.8, efficiencyPct: 21.1, warrantyYears: 25, bifacial: false }],

  ['SunPower Maxeon 6 480W', 'SunPower',      480,  258000, { type: 'Mono PERC', vocV: 40.3, vmpV: 30.1, iscA: 12.0, efficiencyPct: 22.4, warrantyYears: 25, bifacial: false }],
  ['SunPower Maxeon 3 425W', 'SunPower',      425,  232000, { type: 'Mono PERC', vocV: 37.4, vmpV: 29.9, iscA: 11.4, efficiencyPct: 21.5, warrantyYears: 25, bifacial: false }],

  ['Tier-1 N-Type 580W',     'Tier-1',        580,  272000, { type: 'N-Type', vocV: 37.8, vmpV: 31.6, iscA: 15.3, efficiencyPct: 22.4, warrantyYears: 12, bifacial: true }],
  ['Tier-1 N-Type 550W',     'Tier-1',        550,  258000, { type: 'N-Type', vocV: 37.9, vmpV: 31.5, iscA: 14.6, efficiencyPct: 22.0, warrantyYears: 12, bifacial: true }],
  ['Tier-1 N-Type 450W',     'Tier-1',        450,  210000, { type: 'N-Type', vocV: 37.7, vmpV: 31.2, iscA: 12.0, efficiencyPct: 21.2, warrantyYears: 12, bifacial: true }],
  ['Tier-1 Mono 400W',       'Tier-1',        400,  178000, { type: 'Mono PERC', vocV: 37.4, vmpV: 30.2, iscA: 10.6, efficiencyPct: 19.8, warrantyYears: 12, bifacial: false }],
  ['Tier-1 Poly 335W',       'Tier-1',        335,  142000, { type: 'Poly', vocV: 45.0, vmpV: 34.6, iscA: 7.4, efficiencyPct: 16.4, warrantyYears: 12, bifacial: false }],
];

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Expands a positional row into a full catalog object. */
export const toPanel = ([model, brand, wattage, priceNGN, o], i) => ({
  id: `pnl-${slug(brand)}-${slug(model)}-${i}`,
  category: 'panel',
  kind: 'panel',
  name: model,
  brand,
  /** Rated nameplate output in watts peak — generation, not consumption. */
  watts: wattage,
  indicativePriceNGN: priceNGN,
  specs: {
    cellType: o.type,
    vocV: o.vocV,
    vmpV: o.vmpV,
    iscAmps: o.iscA,
    efficiencyPct: o.efficiencyPct,
    warrantyYears: o.warrantyYears,
    bifacial: o.bifacial,
  },
});

export const PANELS = ROWS.map(toPanel);

export const PANEL_BRANDS = [...new Set(PANELS.map((p) => p.brand))].sort();

export default PANELS;
