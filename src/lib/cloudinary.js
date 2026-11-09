// Cloudinary serves originals as-is unless asked otherwise. Adding f_auto,q_auto
// makes it send AVIF/WebP to browsers that support them at a sensible quality,
// which typically cuts image weight by more than half with no visible change.

const UPLOAD = '/image/upload/';

export function optimizeImageUrl(url) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes(UPLOAD)) return url;
  if (/\.gif($|\?)/i.test(url)) return url; // leave animated covers alone
  const [head, tail] = url.split(UPLOAD);
  if (/^[^/]*\b[fq]_/.test(tail)) return url; // already has a format/quality transformation
  // c_limit,w_1400 only ever shrinks: covers and banners are often uploaded at 3000px+,
  // far more than any screen here shows, and this keeps each request a fraction of the size.
  return `${head}${UPLOAD}f_auto,q_auto,c_limit,w_1400/${tail}`;
}

// Applies optimizeImageUrl to every string inside a data structure (arrays and plain objects).
export function optimizeMedia(value) {
  if (typeof value === 'string') return optimizeImageUrl(value);
  if (Array.isArray(value)) return value.map(optimizeMedia);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, optimizeMedia(inner)]));
  }
  return value;
}
