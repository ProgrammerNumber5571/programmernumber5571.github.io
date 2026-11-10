// src/pages/SearchPage.jsx (or src/components/pages/SearchPage.jsx)
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { albums } from '../components/Albums'; // Adjust path if needed
import { Button } from '../components/ui/Button'; // Adjust path if needed
import { useLanguage } from './LanguageContext.jsx';
import { normalizeForSearch } from './searchUtils.js';

export function SearchPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'all');

  // Keeps the URL shareable: /search?genre=Pop&q=... reflects the current view
  const chooseGenre = (genre, { clearQuery = false } = {}) => {
    setSelectedGenre(genre);
    if (clearQuery) setSearchQuery('');
    const next = {};
    if (!clearQuery && searchQuery.trim()) next.q = searchQuery;
    if (genre !== 'all') next.genre = genre;
    setSearchParams(next);
  };
  const [filteredAlbums, setFilteredAlbums] = useState([]);

  // Extract unique genres from albums
  const genres = ['all', ...new Set(albums.map(album => album.genre).filter(Boolean))];

  // Genre colors (Spotify-style)
  const genreColors = {
    'Hip-Hop': '#8d67ab',
    'Rap': '#e13300',
    'Pop': '#e8115b',
    'Rock': '#dc148c',
    'Alternative': '#1e3264',
    'R&B': '#bc5900',
    'Electronic': '#608108',
    'Jazz': '#477d95',
    'Classical': '#8c1932',
    'all': '#535353'
  };

  useEffect(() => {
    filterAlbums();
  }, [searchQuery, selectedGenre]);

  const filterAlbums = () => {
    let results = albums;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = normalizeForSearch(searchQuery);
      results = results.filter(album =>
        normalizeForSearch(album.title).includes(query) ||
        album.artist?.some(a => normalizeForSearch(a).includes(query)) ||
        normalizeForSearch(album.genre).includes(query)
      );
    }

    // Filter by genre
    if (selectedGenre !== 'all') {
      results = results.filter(album => album.genre === selectedGenre);
    }

    setFilteredAlbums(results);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const next = { q: searchQuery };
    if (selectedGenre !== 'all') next.genre = selectedGenre;
    setSearchParams(next);
  };

  const getArtistName = (artist) => {
    if (Array.isArray(artist)) return artist.join(', ');
    return artist;
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Button>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-12 pr-4 py-4 rounded-full bg-card border border-border focus:border-primary focus:outline-none text-lg"
              autoFocus
            />
          </form>
        </div>

        {/* Genre Browser */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{t.navGenres}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => chooseGenre(genre)}
                className="relative h-32 rounded-lg overflow-hidden group transition-transform hover:scale-105"
                style={{ 
                  backgroundColor: genreColors[genre] || '#535353'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/40" />
                <div className="relative h-full flex items-end p-4">
                  <h3 className="text-white font-bold text-xl capitalize">
                    {genre === 'all' ? t.all : genre}
                  </h3>
                </div>
                {selectedGenre === genre && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {searchQuery ? t.resultsFor.replace('{query}', searchQuery) : t.allAlbums}
            </h2>
            <span className="text-muted-foreground">
              {filteredAlbums.length} {t.resultsWord}
            </span>
          </div>

          {filteredAlbums.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">{t.noResults}</h3>
              <p className="text-muted-foreground">
                {t.tryDifferent}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredAlbums.map((album) => (
                <Link
                  key={album.id}
                  to={`/album/${album.id}`}
                  className="group"
                >
                  {/* Album Cover */}
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                    <img decoding="async"
                      src={Array.isArray(album.image) ? album.image[0] : album.image}
                      alt={album.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {album.isNew && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                        {t.newBadge}
                      </span>
                    )}
                  </div>

                  {/* Album Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                        {album.title}
                      </h3>
                      {album.isExplicit && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-400 text-black rounded flex-shrink-0 select-none">
                          E
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {getArtistName(album.artist)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{album.year}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{album.genre}</span>
                    </div>
                    <p className="text-sm font-bold mt-1">{album.price} ₼</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Genres (if searching) */}
        {searchQuery && filteredAlbums.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">{t.similarGenres}</h2>
            <div className="flex gap-3 flex-wrap">
              {genres.filter(g => g !== 'all' && g !== selectedGenre).slice(0, 5).map((genre) => (
                <button
                  key={genre}
                  onClick={() => chooseGenre(genre, { clearQuery: true })}
                  className="px-6 py-3 rounded-full bg-card border border-border hover:border-primary transition-colors"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}