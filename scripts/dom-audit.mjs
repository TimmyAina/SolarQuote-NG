/**
 * DOM auditor: runs INSIDE the page and reports layout/a11y defects that a
 * screenshot alone will not reveal.
 *
 * Kept as a string because it must execute in the browser, and kept small
 * because it is re-evaluated on every screen.
 */
export const AUDIT_FN = `function audit() {
  var out = { overflow: [], tiny: [], unlabeled: [], lowContrast: [], imgNoAlt: 0,
              docW: document.documentElement.scrollWidth, winW: window.innerWidth };
  function srgb(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(c) { return 0.2126 * srgb(c[0]) + 0.7152 * srgb(c[1]) + 0.0722 * srgb(c[2]); }
  // WCAG contrast ratio between two opaque colours.
  function contrast(a, b) {
    var L1 = lum(a), L2 = lum(b);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  }
  // Parses a CSS colour to [r,g,b,a]. The alpha is kept so it can be composited.
  function parse(s) {
    if (!s) return null;
    var m = s.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    var p = m[1].split(',').map(parseFloat);
    if (p.length > 3 && p[3] === 0) return null;
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  // Composites a translucent colour over an opaque one.
  function over(fg, bg) {
    var a = fg[3];
    if (a >= 1) return [fg[0], fg[1], fg[2]];
    return [fg[0] * a + bg[0] * (1 - a),
            fg[1] * a + bg[1] * (1 - a),
            fg[2] * a + bg[2] * (1 - a)];
  }
  // A gradient's effective colour is unknowable without rasterising, so take
  // the WORST (lowest contrast) of its stops. Honest and conservative, rather
  // than reporting a false failure from an unreadable background.
  function stopsOf(el) {
    var bi = getComputedStyle(el).backgroundImage;
    if (!bi || bi === 'none' || bi.indexOf('gradient') === -1) return null;
    var out = [];
    bi.replace(/rgba?\\(([^)]+)\\)/g, function (_, body) {
      var p = body.split(',').map(parseFloat);
      if (p.length < 3) return;
      out.push([p[0], p[1], p[2], p.length > 3 ? p[3] : 1]);
    });
    return out.length ? out : null;
  }
  // Resolves the backdrop BEHIND an element's text.
  // It must skip the element's own background: a tile that paints its own
  // surface and its own label colour would otherwise be compared against
  // itself and always score 1.00, which is how brand wordmarks were reported
  // as unreadable when they are not.
  function bgOf(el) {
    var n = el.parentElement;
    while (n && n !== document.documentElement) {
      var c = parse(getComputedStyle(n).backgroundColor);
      if (c) return c;
      n = n.parentElement;
    }
    return parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255, 1];
  }
  // A tile that paints its own surface must use that surface as its backdrop.
  function ownBg(el) {
    var st = getComputedStyle(el);
    if (st.backgroundImage && st.backgroundImage !== 'none') return null;
    var c = parse(st.backgroundColor);
    return c && c[3] === 1 ? c : null;
  }
  function textOf(el) { return (el.innerText || el.textContent || '').trim(); }

  var all = document.querySelectorAll('body *');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;

    // A fixed bar is allowed to span the viewport, and anything inside a
    // horizontal scroll container (the manufacturer tab strip, carousels) is
    // SUPPOSED to extend past the fold — flagging those was pure noise.
    function inScroller(n) {
      while (n && n !== document.body) {
        var o = getComputedStyle(n).overflowX;
        if (o === 'auto' || o === 'scroll') return true;
        n = n.parentElement;
      }
      return false;
    }
    if (cs.position !== 'fixed' && cs.overflow !== 'hidden' && !inScroller(el) &&
        (r.right > window.innerWidth + 1 || r.left < -1)) {
      out.overflow.push({ tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 46),
        left: Math.round(r.left), right: Math.round(r.right),
        text: textOf(el).slice(0, 28) });
    }
    if ((el.tagName === 'BUTTON' || el.tagName === 'A') && (r.width < 44 || r.height < 44)) {
      out.tiny.push({ w: Math.round(r.width), h: Math.round(r.height), text: textOf(el).slice(0, 22) });
    }
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
      var has = (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) ||
        el.closest('label') || el.getAttribute('aria-label') ||
        el.getAttribute('aria-labelledby') || el.placeholder;
      if (!has) out.unlabeled.push({ tag: el.tagName.toLowerCase(), type: el.type });
    }
    if (el.tagName === 'IMG' && !el.alt && !el.getAttribute('aria-hidden')) out.imgNoAlt++;

    var hasText = false;
    for (var j = 0; j < el.childNodes.length; j++) {
      var n2 = el.childNodes[j];
      if (n2.nodeType === 3 && n2.textContent.trim()) { hasText = true; break; }
    }
    if (hasText && parseFloat(cs.opacity) > 0.05) {
      var fg0 = parse(cs.color);
      if (fg0) {
        // Composite translucent text over its real backdrop. When an ancestor
        // paints a gradient, use the WORST stop so the check is conservative
        // rather than silently comparing against the wrong surface.
        var parent = bgOf(el);
        var bg = parent;
        var own = ownBg(el);
        if (own) bg = own;
        var stops = stopsOf(el);
        if (!stops) {
          var n3 = el;
          while (n3 && n3 !== document.documentElement && !stops) {
            stops = stopsOf(n3);
            n3 = n3.parentElement;
          }
        }
        if (stops) {
          // Pick the stop that yields the WORST contrast against this text, not
          // simply the darkest. On a light theme the darkest is right; in dark
          // theme the LIGHTEST stop is the hostile one, and taking the darkest
          // there silently under-reports the problem.
          var fgp = over([fg0[0], fg0[1], fg0[2],
            (fg0[3] === undefined ? 1 : fg0[3]) * parseFloat(cs.opacity)], parent);
          bg = stops.map(function (s) { return over(s, parent); })
                   .sort(function (a, b) { return contrast(a, fgp) - contrast(b, fgp); })[0];
        }
        // Element-level opacity scales the text toward the backdrop.
        var a = (fg0[3] === undefined ? 1 : fg0[3]) * parseFloat(cs.opacity);
        var fg = over([fg0[0], fg0[1], fg0[2], a], bg);
        var L1 = lum(fg), L2 = lum(bg);
        var ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        var size = parseFloat(cs.fontSize);
        var bold = parseInt(cs.fontWeight, 10) >= 700;
        var need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
        if (ratio < need) {
          out.lowContrast.push({ ratio: Math.round(ratio * 100) / 100, need,
            size: Math.round(size), text: textOf(el).slice(0, 26),
            cls: String(el.className || '').slice(0, 40) });
        }
      }
    }
  }
  function dedupe(arr, key) {
    var seen = {}, out2 = [];
    for (var k = 0; k < arr.length; k++) {
      var v = key(arr[k]);
      if (!seen[v]) { seen[v] = 1; out2.push(arr[k]); }
    }
    return out2;
  }
  out.overflow = dedupe(out.overflow, function (x) { return x.cls + x.text; }).slice(0, 10);
  out.tiny = dedupe(out.tiny, function (x) { return x.text + x.w + x.h; }).slice(0, 10);
  out.unlabeled = dedupe(out.unlabeled, function (x) { return x.tag + x.type; }).slice(0, 10);
  out.lowContrast = dedupe(out.lowContrast, function (x) { return x.cls; }).slice(0, 12);
  return out;
}`;
