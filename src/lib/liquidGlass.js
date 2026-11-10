// Real "Liquid Glass" for the web: refraction and specular rim light, not just blur.
//
// For every glass surface (nav.fixed, .glass-panel, .lg-lens, .lg-btn) this bakes two images
// from a physical model of a convex glass bezel (surface slope -> Snell's law):
//   1. a displacement map (R = x shift, G = y shift) that feeds an SVG
//      feDisplacementMap. Used as `backdrop-filter: url(#...)` it bends the page
//      *behind* the surface, strongest at the rim, with a hint of chromatic split.
//      Only Chromium can run SVG filters inside backdrop-filter, so that is the
//      only place `html.lg-refract` is set; Safari/Firefox keep the frosted fallback.
//   2. a specular highlight, handed to CSS as `--lg-spec` (a background layer),
//      which works in every browser.
// Surfaces are found by selector, so components only need the existing class names.

const SURFACES = 'nav.fixed, .glass-panel, .lg-lens, .lg-btn';
const NS = 'http://www.w3.org/2000/svg';

const IOR = 1.5; // refractive index of the glass
const CURVE = 2.4; // bezel profile: 2 = circular, 4 = squircle (flatter top, steeper rim)
const DISPERSION = 0.035; // red/green/blue refract by slightly different amounts
const LUT_SIZE = 256;
const MAX_PIXELS = 700_000; // cap on map resolution so tall panels stay cheap
const CACHE_LIMIT = 16;
const LIGHT = { x: -Math.SQRT1_2, y: -Math.SQRT1_2 }; // light from the top-left

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v, fallback) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

function supportsRefraction() {
  const brands = navigator.userAgentData?.brands;
  const chromium = brands ? brands.some((b) => b.brand === 'Chromium') : Boolean(window.chrome);
  return chromium && CSS.supports('backdrop-filter', 'url(#lg) blur(1px)');
}

// Lateral shift (px) of what you see through a convex rim, from the outer edge
// (index 0) to where the bezel flattens out (index LUT_SIZE).
function buildLens(strength) {
  const lut = new Float32Array(LUT_SIZE + 1);
  let max = 0;
  for (let k = 0; k <= LUT_SIZE; k++) {
    const u = 1 - k / LUT_SIZE; // 1 at the rim -> 0 where the surface is flat
    const slope = Math.pow(u, CURVE - 1) * Math.pow(Math.max(1 - Math.pow(u, CURVE), 1e-6), 1 / CURVE - 1);
    const tilt = Math.atan(slope);
    const refracted = Math.asin(Math.sin(tilt) / IOR);
    lut[k] = strength * Math.tan(tilt - refracted);
    if (lut[k] > max) max = lut[k];
  }
  return { lut, max };
}

function toURL(imageData) {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext('2d').putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

function buildMaps(w, h, radius, bezel, strength, dpr, gain) {
  const scale = Math.min(Math.min(dpr, 2), Math.sqrt(MAX_PIXELS / (w * h)));
  const iw = Math.max(1, Math.round(w * scale));
  const ih = Math.max(1, Math.round(h * scale));
  const disp = new ImageData(iw, ih);
  const spec = new ImageData(iw, ih);
  const dd = disp.data;
  const sd = spec.data;
  const { lut, max } = buildLens(strength);

  const hx = w / 2;
  const hy = h / 2;
  const bx = hx - radius;
  const by = hy - radius;
  const reach = Math.max(bezel, 6);

  for (let j = 0; j < ih; j++) {
    const y = (j + 0.5) / scale - hy;
    const ay = Math.abs(y);
    for (let i = 0; i < iw; i++) {
      const x = (i + 0.5) / scale - hx;
      const ax = Math.abs(x);
      const o = (j * iw + i) * 4;

      dd[o] = dd[o + 1] = dd[o + 2] = 128; // neutral = no shift
      dd[o + 3] = 255;
      sd[o] = sd[o + 1] = sd[o + 2] = 255; // white; alpha carries the highlight

      // Signed distance to the rounded rectangle, plus the outward normal.
      const qx = ax - bx;
      const qy = ay - by;
      let sdf;
      let nx;
      let ny;
      if (qx > 0 && qy > 0) {
        const len = Math.hypot(qx, qy);
        sdf = len - radius;
        nx = qx / len;
        ny = qy / len;
      } else if (qx > qy) {
        sdf = qx - radius;
        nx = 1;
        ny = 0;
      } else {
        sdf = qy - radius;
        nx = 0;
        ny = 1;
      }
      const d = -sdf; // distance in from the edge
      if (d < 0 || d >= reach) continue;

      const ox = x < 0 ? -nx : nx;
      const oy = y < 0 ? -ny : ny;

      if (d < bezel && max > 0) {
        const f = (d / bezel) * LUT_SIZE;
        const k = Math.min(LUT_SIZE - 1, f | 0);
        const shift = lut[k] + (lut[k + 1] - lut[k]) * (f - k);
        const m = (shift / max) * 127.5;
        dd[o] = 127.5 - ox * m; // sample from further in
        dd[o + 1] = 127.5 - oy * m;
      }

      const facing = ox * LIGHT.x + oy * LIGHT.y;
      const lit = facing > 0 ? Math.pow(facing, 0.8) : 0;
      const back = facing < 0 ? Math.pow(-facing, 0.8) : 0;
      const weight = Math.min(1, 0.2 + 0.8 * lit + 0.55 * back);
      const rim = 0.9 * Math.exp(-(d * d) / 1.7) + 0.26 * Math.exp(-d / (0.3 * bezel + 1));
      sd[o + 3] = Math.min(255, rim * weight * gain * 255);
    }
  }

  return { dispURL: toURL(disp), specURL: toURL(spec), shift: max };
}

const mapCache = new Map();
function getMaps(key, build) {
  let hit = mapCache.get(key);
  if (hit) {
    mapCache.delete(key);
  } else {
    hit = build();
    if (mapCache.size >= CACHE_LIMIT) mapCache.delete(mapCache.keys().next().value);
  }
  mapCache.set(key, hit);
  return hit;
}

function svg(tag, attrs) {
  const node = document.createElementNS(NS, tag);
  for (const name in attrs) node.setAttribute(name, attrs[name]);
  return node;
}

const CHANNELS = [
  ['r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'],
  ['g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0'],
  ['b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0'],
];

function buildFilter(id, w, h, dispURL, shift) {
  const filter = svg('filter', {
    id,
    x: 0,
    y: 0,
    width: w,
    height: h,
    filterUnits: 'userSpaceOnUse',
    'color-interpolation-filters': 'sRGB', // keep the map's 128 = "no shift" intact
  });
  filter.appendChild(
    svg('feImage', { href: dispURL, x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'map' })
  );
  CHANNELS.forEach(([name, matrix], i) => {
    filter.appendChild(
      svg('feDisplacementMap', {
        in: 'SourceGraphic',
        in2: 'map',
        scale: 2 * shift * (1 - i * DISPERSION),
        xChannelSelector: 'R',
        yChannelSelector: 'G',
        result: `d${name}`,
      })
    );
    filter.appendChild(svg('feColorMatrix', { in: `d${name}`, type: 'matrix', values: matrix, result: name }));
  });
  filter.appendChild(svg('feBlend', { in: 'r', in2: 'g', mode: 'screen', result: 'rg' }));
  filter.appendChild(svg('feBlend', { in: 'rg', in2: 'b', mode: 'screen' }));
  return filter;
}

function cornerRadius(style, w, h) {
  const corners = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'];
  const total = corners.reduce((sum, c) => {
    const raw = style[c];
    return sum + (raw.includes('%') ? (parseFloat(raw) / 100) * Math.min(w, h) : parseFloat(raw) || 0);
  }, 0);
  return clamp(total / 4, 0, Math.min(w, h) / 2);
}

let activeInit = null;

export function initLiquidGlass() {
  activeInit?.destroy();

  const html = document.documentElement;
  const refract = supportsRefraction();
  if (refract) html.classList.add('lg-refract');

  const host = svg('svg', { 'aria-hidden': 'true', width: 0, height: 0 });
  host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  const defs = svg('defs', {});
  host.appendChild(defs);
  document.body.appendChild(host);

  const registry = new Map();
  let counter = 0;
  const enabled = () => html.classList.contains('liquid-glass');

  function refresh(entry) {
    const { el } = entry;
    if (!enabled() || !el.isConnected) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w < 12 || h < 12) return;

    const dpr = window.devicePixelRatio || 1;
    const radius = cornerRadius(getComputedStyle(el), w, h);
    const bezel = clamp(num(el.dataset.lgBezel, Math.min(w, h) * 0.24), 8, 26);
    const strength = num(el.dataset.lgStrength, bezel * 1.5);
    const gain = el.classList.contains('lg-btn') ? 0.4 : 1; // buttons get a subtler rim
    const key = [w, h, radius.toFixed(1), bezel.toFixed(1), strength.toFixed(1), dpr, gain].join('|');
    if (key === entry.key) return;

    const maps = getMaps(key, () => buildMaps(w, h, radius, bezel, strength, dpr, gain));
    let filter = null;
    if (!entry.specOnly) {
      const id = `lg-${++counter}`;
      filter = buildFilter(id, w, h, maps.dispURL, maps.shift);
      defs.appendChild(filter);
      if (refract) el.style.setProperty('--lg-filter', `url(#${id})`);
    }
    el.style.setProperty('--lg-spec', `url("${maps.specURL}")`);

    const previous = entry.filter;
    entry.filter = filter;
    entry.key = key;
    if (previous) setTimeout(() => previous.remove(), 300); // new one is live; drop the old
  }

  function release(entry) {
    entry.observer.disconnect();
    clearTimeout(entry.timer);
    entry.filter?.remove();
    entry.el.style.removeProperty('--lg-filter');
    entry.el.style.removeProperty('--lg-spec');
    registry.delete(entry.el);
  }

  function register(el) {
    // A surface nested inside another one can't see the page through it, so only
    // outermost surfaces get a lens (nested ones keep the CSS-only treatment).
    // Buttons are the exception: nested or ghost ones still get the rim highlight
    // ("specOnly"), they just don't refract.
    // .lg-btn-lib buttons draw their glass purely in CSS (see index.css); building a displacement
    // map and an SVG filter for each of them here would be unused work, and with dozens of
    // buttons on a page it made scrolling noticeably heavier.
    if (el.classList.contains('lg-btn-lib')) return;
    const nested = Boolean(el.parentElement?.closest(SURFACES));
    const isButton = el.classList.contains('lg-btn');
    if (registry.has(el) || (nested && !isButton)) return;
    const specOnly = nested || el.classList.contains('lg-btn-ghost');
    const entry = { el, specOnly, key: '', filter: null, timer: 0, observer: null };
    entry.observer = new ResizeObserver(() => {
      clearTimeout(entry.timer);
      entry.timer = setTimeout(() => refresh(entry), entry.key ? 120 : 0);
    });
    registry.set(el, entry);
    entry.observer.observe(el, { box: 'border-box' });
    refresh(entry); // synchronously, so the first painted frame is already refracted
  }

  function scan(node) {
    if (node.nodeType !== 1) return;
    if (node.matches(SURFACES)) register(node);
    node.querySelectorAll(SURFACES).forEach(register);
  }

  const domObserver = new MutationObserver((records) => {
    for (const record of records) record.addedNodes.forEach(scan);
    registry.forEach((entry) => {
      if (!entry.el.isConnected) release(entry);
    });
  });
  domObserver.observe(document.body, { childList: true, subtree: true });

  // Re-measure when the Settings toggle turns glass back on.
  let wasEnabled = enabled();
  const classObserver = new MutationObserver(() => {
    const now = enabled();
    if (now && !wasEnabled) registry.forEach(refresh);
    wasEnabled = now;
  });
  classObserver.observe(html, { attributes: true, attributeFilter: ['class'] });

  // A soft sheen follows the pointer across whichever surface it is over.
  let sheenTarget = null;
  let sheenFrame = 0;
  let lastMove = null;
  const onPointerMove = (event) => {
    if (event.pointerType === 'touch') return;
    lastMove = event;
    if (sheenFrame) return;
    sheenFrame = requestAnimationFrame(() => {
      sheenFrame = 0;
      const target = lastMove.target instanceof Element ? lastMove.target.closest(SURFACES) : null;
      if (sheenTarget && sheenTarget !== target) {
        sheenTarget.style.removeProperty('--lg-mx');
        sheenTarget.style.removeProperty('--lg-my');
      }
      sheenTarget = target;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--lg-mx', `${lastMove.clientX - rect.left}px`);
      target.style.setProperty('--lg-my', `${lastMove.clientY - rect.top}px`);
    });
  };
  document.addEventListener('pointermove', onPointerMove, { passive: true });

  let lastDpr = window.devicePixelRatio;
  const onResize = () => {
    if (window.devicePixelRatio === lastDpr) return;
    lastDpr = window.devicePixelRatio;
    registry.forEach(refresh);
  };
  window.addEventListener('resize', onResize);

  scan(document.body);

  activeInit = {
    destroy() {
      domObserver.disconnect();
      classObserver.disconnect();
      document.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      registry.forEach(release);
      host.remove();
      html.classList.remove('lg-refract');
      activeInit = null;
    },
  };
  return activeInit.destroy;
}

if (import.meta.hot) import.meta.hot.dispose(() => activeInit?.destroy());
