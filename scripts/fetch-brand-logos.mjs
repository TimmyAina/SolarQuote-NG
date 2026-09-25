/**
 * Fetch real brand logos into public/brands/
 * ---------------------------------------------------------------------------
 * Source: Simple Icons (jsDelivr CDN) — a curated set where each brand has
 * granted permission for its mark to be used, making it the licence-cleanest
 * option available and, unlike the Wikipedia API, reliable to call repeatedly.
 *
 * COVERAGE REALITY: the catalog's laptop/consumer brands are covered. The ~30
 * solar-hardware brands (Deye, Sunsynk, Pylontech, LONGi, Victron, Growatt,
 * Sofar...) are in no open icon set and have no reusable-licence logo at all.
 * Those fall back to a generated wordmark, and dropping a real file into
 * public/brands/ later replaces it with no code change.
 *
 * Usage: node scripts/fetch-brand-logos.mjs
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { EVERY_BRANDS } from '../src/data/catalog/index.js';
import { CANDIDATE_SLUGS } from '../src/data/brandLogoSlugs.js';

const V = '16.32.0';
const BASE = `https://cdn.jsdelivr.net/npm/simple-icons@${V}/icons`;
const OUT_DIR = resolve('public/brands');
const UA = 'SolarQuoteNG/0.3 (offline solar quotation app; catalog build)';

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const manifest = [];
for (const brand of EVERY_BRANDS) {
  const candidates = CANDIDATE_SLUGS[brand] || [slug(brand)];
  let saved = null;

  for (const c of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(`${BASE}/${c}.svg`, { headers: { 'User-Agent': UA } });
      if (res.ok) {
        // eslint-disable-next-line no-await-in-loop
        const body = await res.text();
        if (body.includes('<svg')) {
          const name = `${slug(brand)}.svg`;
          writeFileSync(resolve(OUT_DIR, name), body.trim(), 'utf8');
          saved = {
            brand,
            file: `brands/${name}`,
            source: `simple-icons@${V}`,
            slug: c,
            bytes: body.length,
          };
          break;
        }
      }
    } catch { /* try the next candidate */ }
    // eslint-disable-next-line no-await-in-loop
    await sleep(120);
  }

  manifest.push(saved || { brand, file: null, source: null });
  console.log(
    `  ${saved ? 'OK  ' : 'MISS'} ${brand.padEnd(16)} ${saved ? saved.file : 'wordmark fallback'}`
  );
}

const got = manifest.filter((m) => m.file);
console.log(`\n${got.length}/${manifest.length} brands have a bundled logo.`);
console.log('wordmark fallback:', manifest.filter((m) => !m.file).map((m) => m.brand).join(', '));
writeFileSync(resolve('.tmp-logo-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('\nNow run: node scripts/apply-brand-logos.mjs');
