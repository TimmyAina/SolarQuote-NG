/**
 * Wire the fetched logo manifest into a generated lookup used by src/data/brands.js.
 *
 * Run after scripts/fetch-brand-logos.mjs. Writes
 * src/data/brandLogos.generated.js, a plain brand-name -> asset-path map.
 *
 * A generated file is used rather than rewriting brand rows in place because the
 * rows are hand-maintained; injecting into them with a regex is fragile and
 * would fight any future edit.
 *
 * Usage: node scripts/apply-brand-logos.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MANIFEST = resolve('.tmp-logo-manifest.json');
const OUT = resolve('src/data/brandLogos.generated.js');

if (!existsSync(MANIFEST)) {
  console.error('No .tmp-logo-manifest.json. Run scripts/fetch-brand-logos.mjs first.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const withLogo = manifest.filter((m) => m.file);

const body = `/**
 * Brand logo paths — GENERATED, do not edit by hand.
 * ---------------------------------------------------------------------------
 * Written by scripts/apply-brand-logos.mjs from the output of
 * scripts/fetch-brand-logos.mjs (Simple Icons, a curated set in which each brand
 * has granted permission for its mark to be used).
 *
 * Only ${withLogo.length} of ${manifest.length} catalog brands have artwork available under a
 * reusable licence. The remainder are solar-hardware brands that exist in no
 * open icon set; those brands render a generated wordmark instead.
 *
 * To add a logo: drop the file into public/brands/ and re-run both scripts.
 */
export const BRAND_LOGOS = {
${withLogo.map((m) => `  ${JSON.stringify(m.brand)}: ${JSON.stringify(m.file)},`).join('\n')}
};

/** Brands that still render a wordmark because no asset is bundled. */
export const WORDMARK_ONLY = [
${manifest
  .filter((m) => !m.file)
  .map((m) => `  ${JSON.stringify(m.brand)},`)
  .join('\n')}
];

export default BRAND_LOGOS;
`;

writeFileSync(OUT, body, 'utf8');
console.log(`Wrote ${OUT}`);
console.log(`${withLogo.length} brands with artwork, ${manifest.length - withLogo.length} on wordmark fallback.`);
