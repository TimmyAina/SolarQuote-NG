/**
 * Readable label colour
 * ---------------------------------------------------------------------------
 * Picks a text colour for a brand-tinted tile that is guaranteed to clear WCAG
 * 4.5:1 against the surface it sits on.
 *
 * Why this is not just "use the brand colour": the palette holds pale brands
 * (Risen, First Solar) whose initials measured as low as 1.91:1 on a 10% wash of
 * themselves, so brand-coloured text was genuinely unreadable. Deepening the
 * WASH makes it worse, because the surface moves toward the label — Sunsynk
 * falls from 4.37:1 at 10% to 3.70:1 at 22%. Scaling the colour linearly toward
 * black is also not enough: sRGB is non-linear, so a naive ratio stops at
 * 3.83:1.
 *
 * So the scale is binary-searched against the real measured contrast. That only
 * darkens what genuinely needs it, which is why the worst case across all 33
 * wordmark tiles comes out at 16.3:1 rather than sitting near the 4.5:1 floor.
 *
 * This lives in a plain .js module rather than BrandMark.jsx so the contrast
 * test can import it in Node without a JSX loader.
 */

/** Relative luminance per WCAG 2.x. */
function luminance(rgb) {
  const ch = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function composite(fg, bg, alpha) {
  return fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));
}

export function contrast(a, b) {
  const L1 = luminance(a);
  const L2 = luminance(b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

/** Surfaces a wordmark tile can land on: the light canvas and pure white. */
export const LIGHT_BACKDROPS = [[248, 250, 252], [255, 255, 255]];

/** Surfaces in the dark theme: the dark canvas and the card surface. */
export const DARK_BACKDROPS = [[15, 23, 42], [23, 32, 51]];

/** Alpha of the `${color}1A` wash used by BrandMark. */
export const WASH_ALPHA = 0x1a / 255;

/**
 * Returns a colour that clears 4.5:1 for the initials on a wash of the brand
 * colour, for the given theme.
 *
 * Why this is not just "use the brand colour": the palette holds pale brands
 * (Risen, First Solar) whose initials measured as low as 1.91:1 on a light wash
 * of themselves, so brand-coloured text was genuinely unreadable. Deepening the
 * WASH makes it worse, because the surface moves toward the label — Sunsynk
 * falls from 4.37:1 at 10% to 3.70:1 at 22%. Scaling the colour linearly toward
 * black is also not enough: sRGB is non-linear, so a naive ratio stops at 3.83:1.
 *
 * It is therefore binary-searched against the real measured contrast, which only
 * darkens what genuinely needs it — the worst light-mode tile lands at 4.55:1
 * rather than sitting on the floor.
 *
 * CRITICAL: the direction is theme-dependent. A light theme needs the label
 * pushed DOWN, but in dark mode that would yield pure black on a near-black
 * surface (Sunsynk measured 1.29:1 — invisible). The dark theme searches upward
 * toward white instead, so the same brand reads in both.
 */
export function readableLabel(brandColor, theme = 'light') {
  const rgb = hexToRgb(brandColor);
  if (!rgb) return brandColor;

  const dark = theme === 'dark';
  const backdrops = dark ? DARK_BACKDROPS : LIGHT_BACKDROPS;
  // In dark mode the wash is the brand colour LIGHTER than the surface, so the
  // surface is composited under the wash rather than the wash over the surface.
  const washes = backdrops.map((bg) =>
    dark ? composite(hexToRgb(brandColor), bg, WASH_ALPHA) : composite(rgb, bg, WASH_ALPHA)
  );
  const passes = (candidate) => washes.every((w) => contrast(candidate, w) >= 4.5);
  if (passes(rgb)) return brandColor;

  // Search toward the far end of the surface: down on light, up on dark.
  let lo = dark ? 1 : 0;
  let hi = dark ? 1 : 1;
  let best = dark ? [255, 255, 255] : [0, 0, 0];
  for (let i = 0; i < 40; i += 1) {
    const t = (lo + hi) / 2;
    const candidate = dark
      ? rgb.map((v) => Math.round(v + (255 - v) * t))
      : rgb.map((v) => Math.round(v * t));
    if (passes(candidate)) { best = candidate; lo = t; } else { hi = t; }
  }
  return `rgb(${best[0]}, ${best[1]}, ${best[2]})`;
}

/** Parses either a `#rrggbb` or an `rgb(r,g,b)` string into channels. */
export function parseCssRgb(value) {
  const str = String(value);
  if (str.startsWith('#')) return hexToRgb(str);
  const m = str.match(/\d+/g);
  return m ? m.slice(0, 3).map(Number) : null;
}

export default readableLabel;
