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
  function parse(s) {
    if (!s) return null;
    var m = s.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    var p = m[1].split(',').map(parseFloat);
    if (p.length > 3 && p[3] === 0) return null;
    return [p[0], p[1], p[2]];
  }
  function bgOf(el) {
    var n = el;
    while (n && n !== document.documentElement) {
      var c = parse(getComputedStyle(n).backgroundColor);
      if (c) return c;
      n = n.parentElement;
    }
    return parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255];
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
    if (hasText && parseFloat(cs.opacity) > 0.5) {
      var fg = parse(cs.color);
      if (fg) {
        var L1 = lum(fg), L2 = lum(bgOf(el));
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
