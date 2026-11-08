// src/components/SearchEngine.jsx - Fixed version

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useLanguage } from './LanguageContext.jsx';
import { albums as catalogAlbums } from './Albums.jsx';
import { Merch } from './Merch.jsx';
import { normalizeForSearch } from './searchUtils.js';

export function SearchEngine({ albums }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();
  // Fall back to the full catalog — callers rarely pass their own list,
  // and an empty list made the dropdown show "no results" until Enter.
  const searchableAlbums = albums?.length ? albums : catalogAlbums;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // Navigate to dedicated search page
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setQuery(''); // Clear after navigation
    }
  };

  // Get artist name safely
  const getArtistName = (artist) => {
    if (!artist) return '';
    if (Array.isArray(artist)) return artist.join(', ');
    return String(artist);
  };

  // Quick results with safe filtering
  const quickResults = query.trim() && searchableAlbums.length > 0
    ? searchableAlbums
        .filter(album => {
          if (!album) return false;
          const searchQuery = normalizeForSearch(query);
          const title = normalizeForSearch(album.title);
          const artist = normalizeForSearch(getArtistName(album.artist));
          return title.includes(searchQuery) || artist.includes(searchQuery);
        })
        .slice(0, 5)
    : [];

  const merchResults = query.trim()
    ? Merch.filter(item => {
        const q = normalizeForSearch(query);
        return normalizeForSearch(item.title).includes(q) ||
          normalizeForSearch(getArtistName(item.artist)).includes(q);
      }).slice(0, 3)
    : [];

  const handleResultClick = (albumId) => {
    navigate(`/album/${albumId}`);
    setQuery('');
  };

  const handleViewAllResults = () => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setQuery('');
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholderShort}
            className="w-full pl-12 pr-4 py-3 rounded-full bg-background border border-border focus:border-primary focus:outline-none"
          />
        </div>
      </form>

      {/* Quick Results Dropdown */}
      {query.trim() && (quickResults.length > 0 || merchResults.length > 0) && (
        <div className="glass-panel absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {quickResults.map((album) => {
            const albumImage = Array.isArray(album.image) ? album.image[0] : album.image;
            
            return (
              <button
                key={album.id}
                onClick={() => handleResultClick(album.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
              >
                {albumImage && (
                  <img loading="lazy" decoding="async"
                    src={albumImage}
                    alt={album.title}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{album.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getArtistName(album.artist)}
                  </p>
                </div>
              </button>
            );
          })}
          
          {merchResults.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-t border-border">
                Merch
              </div>
              {merchResults.map((item) => (
                <button
                  key={`merch-${item.id}`}
                  onClick={() => { navigate(`/merch/${item.id}`); setQuery(''); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                >
                  {item.image && (
                    <img loading="lazy" decoding="async"
                      src={item.image}
                      alt={item.title}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getArtistName(item.artist)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">{item.price} ₼</span>
                </button>
              ))}
            </>
          )}

          <button
            onClick={handleViewAllResults}
            className="w-full p-3 text-sm text-primary font-medium hover:bg-muted transition-colors border-t border-border"
          >
            {t.viewAllResults}
          </button>
        </div>
      )}

      {/* No results message */}
      {query.trim() && quickResults.length === 0 && merchResults.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
          {t.noResults}
        </div>
      )}
    </div>
  );
}