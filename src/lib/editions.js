// Vinyl, CD and cassette listings of the same record are separate catalogue entries
// ("DON'T BE DUMB (2LP)", "(CD)", "(Kaset)"). These helpers link them together by title
// and artist so the catalogue can show one album with its formats, and the album page
// can switch between editions.

export const FORMATS = ['vinyl', 'cd', 'cassette'];

export const FORMAT_LABELS = {
  vinyl: { az: 'Vinil', en: 'Vinyl', ru: 'Винил' },
  cd: { az: 'CD', en: 'CD', ru: 'CD' },
  cassette: { az: 'Kaset', en: 'Cassette', ru: 'Кассета' },
};

export const formatLabel = (format, language) =>
  FORMAT_LABELS[format]?.[language] || FORMAT_LABELS[format]?.en || format;

export const formatOf = (album) => (FORMATS.includes(album.format) ? album.format : 'vinyl');

// Only a trailing "(…)" / "[…]" that is purely a format marker is dropped, so "(Deluxe)" and
// "(İlk Basma Nəşr)" keep different editions of a record apart.
const FORMAT_MARKER = /\s*[([]\s*(?:\d\s*LP|LP|CD|Kaset+|Cassette|2LP\s*\+\s*CD)\s*[)\]]\s*$/i;

const normalize = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();

export const editionKey = (album) => {
  const artist = Array.isArray(album.artist) ? album.artist[0] : album.artist;
  return `${normalize(artist)}|${normalize(String(album.title).replace(FORMAT_MARKER, ''))}`;
};

const rank = (album) => FORMATS.indexOf(formatOf(album));

// [{ key, primary, editions }] in catalogue order; primary is the vinyl edition when there is one
export function groupEditions(albums) {
  const groups = new Map();
  for (const album of albums) {
    const key = editionKey(album);
    if (!groups.has(key)) groups.set(key, { key, editions: [] });
    groups.get(key).editions.push(album);
  }
  return [...groups.values()].map((g) => {
    g.editions.sort((a, b) => rank(a) - rank(b));
    return { ...g, primary: g.editions[0] };
  });
}

export const getEditions = (albums, album) =>
  albums.filter((a) => editionKey(a) === editionKey(album)).sort((a, b) => rank(a) - rank(b));
