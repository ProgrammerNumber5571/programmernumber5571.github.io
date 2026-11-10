// Finds a short audio clip to play for an album, trying in order:
//   1. album.previewAudio  - a clip hosted by us (string URL, or { url, start } in seconds). Most reliable.
//   2. Apple's free iTunes Search API (30s clips, no key needed) - only if the album is in their catalogue.
//   3. Spotify via the existing client (needs the Spotify app owner to have an active Premium plan).
// Returns { url, start } or null when nothing is available.

import { fetchAlbumDataForCatalogAlbum } from '../components/spotifyClient.js';

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ') // "(2LP)", "[Deluxe]"
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const cacheKey = (album) => `previewSrc:${album.id}`;

function readCache(album) {
  try {
    const raw = sessionStorage.getItem(cacheKey(album));
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(album, value) {
  try {
    sessionStorage.setItem(cacheKey(album), JSON.stringify(value));
  } catch {
    /* storage unavailable: lookups just repeat */
  }
}

async function fromItunes(album) {
  const artist = Array.isArray(album.artist) ? album.artist[0] : album.artist;
  const title = norm(album.title);
  if (!artist || !title) return null;
  const res = await fetch(
    `https://itunes.apple.com/search?entity=song&limit=50&term=${encodeURIComponent(`${artist} ${title}`)}`
  );
  if (!res.ok) return null;
  const { results = [] } = await res.json();
  const hit = results.find(
    (r) => r.previewUrl && norm(r.collectionName) === title && norm(r.artistName).includes(norm(artist))
  );
  return hit ? { url: hit.previewUrl, start: 0 } : null;
}

async function fromSpotify(album) {
  const data = await fetchAlbumDataForCatalogAlbum(album);
  const track = data?.tracklist?.find((t) => t.preview);
  return track ? { url: track.preview, start: 0 } : null;
}

export async function findPreview(album) {
  if (!album) return null;

  const own = album.previewAudio;
  if (own) return typeof own === 'string' ? { url: own, start: 0 } : { start: 0, ...own };

  const cached = readCache(album);
  if (cached !== undefined) return cached;

  let found = null;
  for (const source of [fromItunes, fromSpotify]) {
    try {
      found = await source(album);
    } catch {
      found = null; // network/CORS/API failure: try the next source
    }
    if (found) break;
  }
  writeCache(album, found);
  return found;
}
