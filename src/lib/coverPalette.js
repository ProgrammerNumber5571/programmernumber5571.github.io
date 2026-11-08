// Pulls a small colour palette out of cover art so a page can be tinted to match it
// (the Apple Music look: a mesh of the artwork's colours fading into the page).
// Needs the image to be CORS-readable; Cloudinary is. Anything else resolves to null.

import { useEffect, useState } from 'react';

const SIZE = 32; // the cover is sampled at 32x32, plenty for a palette
const BINS = 12; // hue buckets of 30 degrees
const cache = new Map();

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

const hsl = (h, s, l) => `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;

function loadPixels(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = SIZE;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        resolve(ctx.getImageData(0, 0, SIZE, SIZE).data);
      } catch (error) {
        reject(error); // tainted canvas
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

function buildPalette(pixels) {
  const bins = Array.from({ length: BINS }, () => ({ weight: 0, h: 0, s: 0, count: 0 }));
  let avgR = 0;
  let avgG = 0;
  let avgB = 0;
  let n = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const [h, s, l] = rgbToHsl(pixels[i], pixels[i + 1], pixels[i + 2]);
    avgR += pixels[i];
    avgG += pixels[i + 1];
    avgB += pixels[i + 2];
    n++;
    // vivid, mid-tone pixels define the artwork's colour; near-black/white/grey ones don't
    const weight = s * (1 - Math.abs(2 * l - 1)) ** 0.6;
    if (weight < 0.02) continue;
    const bin = bins[Math.floor(h / (360 / BINS)) % BINS];
    bin.weight += weight;
    bin.h += h * weight;
    bin.s += s * weight;
    bin.count++;
  }
  if (!n) return null;

  const ranked = bins.filter((b) => b.weight > 0).sort((a, b) => b.weight - a.weight);
  const total = ranked.reduce((sum, b) => sum + b.weight, 0);

  // Essentially monochrome artwork: a neutral palette from its average tone
  if (!ranked.length || total / n < 0.04) {
    const [, , l] = rgbToHsl(avgR / n, avgG / n, avgB / n);
    const tone = clamp(l, 0.12, 0.6);
    return {
      base: hsl(220, 0.06, 0.1),
      blobs: [hsl(220, 0.07, tone * 0.55 + 0.1), hsl(220, 0.05, tone * 0.45 + 0.08), hsl(220, 0.06, tone * 0.35 + 0.08)],
    };
  }

  const colors = ranked.slice(0, 3).map((b) => ({ h: b.h / b.weight, s: b.s / b.weight }));
  // Fewer than three distinct hues: fill in with shifted versions of the leading one
  while (colors.length < 3) {
    const lead = colors[0];
    colors.push({ h: (lead.h + (colors.length === 1 ? 28 : -28) + 360) % 360, s: lead.s });
  }

  const [a, b, c] = colors;
  return {
    base: hsl(a.h, clamp(a.s, 0.35, 0.7), 0.12),
    blobs: [
      hsl(a.h, clamp(a.s + 0.1, 0.5, 0.85), 0.36),
      hsl(b.h, clamp(b.s + 0.05, 0.45, 0.8), 0.44),
      hsl(c.h, clamp(c.s, 0.4, 0.75), 0.3),
    ],
  };
}

export function getCoverPalette(url) {
  if (!url) return Promise.resolve(null);
  if (!cache.has(url)) {
    cache.set(
      url,
      loadPixels(url)
        .then(buildPalette)
        .catch(() => null)
    );
  }
  return cache.get(url);
}

export function useCoverPalette(url) {
  // undefined while loading, null if the colours couldn't be read
  const [palette, setPalette] = useState(undefined);
  useEffect(() => {
    let cancelled = false;
    setPalette(undefined);
    getCoverPalette(url).then((result) => {
      if (!cancelled) setPalette(result);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return palette;
}
