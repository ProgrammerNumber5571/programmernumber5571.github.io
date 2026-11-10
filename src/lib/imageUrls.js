// Image delivery helpers.
//
// Every catalogue image lives on Cloudinary. Two build modes (set in vite.config.js):
//  - default (GitHub Pages, the native apps, dev): URLs point straight at Cloudinary.
//  - Vercel: vite.config.js rewrites the Cloudinary address in the source to this site's own /img/
//    path at build time, and vercel.json proxies /img/* to Cloudinary. The page source and the
//    browser then only ever show our own URL. __IMG_PREFIX__ is that path ('/img/') or the full
//    Cloudinary address, and __IMG_PROXY__ tells which mode is active.
//
// On top of that, f_auto,q_auto makes Cloudinary send AVIF/WebP to browsers that support them at a
// sensible quality, and c_limit,w_1400 only ever shrinks: covers and banners are often uploaded at
// 3000px+, far more than any screen here shows.

const PREFIX = __IMG_PREFIX__;
const OPTIMIZE = 'f_auto,q_auto,c_limit,w_1400/';

export function optimizeImageUrl(url) {
  if (typeof url !== 'string' || !url.startsWith(PREFIX)) return url;
  const tail = url.slice(PREFIX.length);
  if (/\.gif($|\?)/i.test(tail)) return url; // leave animated covers alone
  if (/^[^/]*\b[fq]_/.test(tail)) return url; // already has a format/quality transformation
  return `${PREFIX}${OPTIMIZE}${tail}`;
}

export const isVideoUrl = (url) => /\.(mp4|webm|mov)(\?|$)/i.test(String(url || ''));

// A still first frame for a converted video, shown while it loads (Cloudinary serves any
// animation's first frame when the same file is requested with a .jpg extension).
export const posterFor = (url) =>
  typeof url === 'string' && url.startsWith(PREFIX) && isVideoUrl(url)
    ? url.replace(/\.(mp4|webm|mov)(\?.*)?$/i, '.jpg')
    : undefined;

// Animated covers were uploaded as GIFs, which are huge (4-8 MB each) and make the browser decode and
// repaint every frame forever. Cloudinary serves the same file as an MP4 when asked for it by
// extension, at a few hundred KB, and the pages that show animated covers play it as a <video>.
const toVideo = (url) =>
  typeof url === 'string' && url.startsWith(PREFIX) && /\.gif($|\?)/i.test(url) ? url.replace(/\.gif($|\?)/i, '.mp4$1') : url;

// Applies optimizeImageUrl to every string inside a data structure (arrays and plain objects).
export function optimizeMedia(value) {
  if (typeof value === 'string') return optimizeImageUrl(value);
  if (Array.isArray(value)) return value.map(optimizeMedia);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, key === 'animatedCover' ? toVideo(inner) : optimizeMedia(inner)])
    );
  }
  return value;
}
