import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { albums } from './Albums.jsx';
import { FavoriteButton, useFavorites } from './FavoritesSystem';
import { useLanguage } from './LanguageContext.jsx';
import { Button } from './ui/Button.tsx';
import { usePageTitle } from './usePageTitle.js';

const getCoverImage = (album) =>
  Array.isArray(album.image) ? album.image[0] : album.image;

const getArtistNames = (artist) => {
  if (Array.isArray(artist)) return artist.filter(Boolean).join(', ');
  return artist ? String(artist) : '';
};

export const FavoritesPage = () => {
  const { favorites, isLoading } = useFavorites();
  const { t } = useLanguage();
  usePageTitle(t.favoritesTitle);
  const [sortOrder, setSortOrder] = useState('none');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  let favoriteAlbums = albums.filter((album) => favorites.includes(album.id));

  if (sortOrder === 'price-low') {
    favoriteAlbums = [...favoriteAlbums].sort((a, b) => a.price - b.price);
  } else if (sortOrder === 'price-high') {
    favoriteAlbums = [...favoriteAlbums].sort((a, b) => b.price - a.price);
  } else if (sortOrder === 'year-new') {
    favoriteAlbums = [...favoriteAlbums].sort((a, b) => b.year - a.year);
  } else if (sortOrder === 'year-old') {
    favoriteAlbums = [...favoriteAlbums].sort((a, b) => a.year - b.year);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <Link to="/" className="text-primary hover:underline mb-4 inline-block">
          ← {t.backHome}
        </Link>

        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 flex items-center gap-4">
              {t.favoritesTitle}
              <Heart className="w-10 h-10 text-primary fill-primary" />
            </h1>
            <p className="text-muted-foreground text-lg">
              {favoriteAlbums.length} {t.albumsWord}
            </p>
          </div>

          {favoriteAlbums.length > 1 && (
            <div>
              <label className="text-muted-foreground font-medium mr-2">
                {t.sortLabel}:
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="border border-border rounded px-3 py-2 bg-card text-foreground"
              >
                <option value="none">{t.sortDefault}</option>
                <option value="price-low">{t.priceLowHigh}</option>
                <option value="price-high">{t.priceHighLow}</option>
                <option value="year-new">{t.yearNewOld}</option>
                <option value="year-old">{t.yearOldNew}</option>
              </select>
            </div>
          )}
        </div>

        {favoriteAlbums.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-24 h-24 mx-auto mb-6 text-muted-foreground opacity-50" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold mb-2">{t.noFavoritesYet}</h2>
            <p className="text-muted-foreground mb-8">
              {t.addFavoritesHint}
            </p>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              <Link to="/collections">{t.viewAllCollection}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {favoriteAlbums.map((album) => {
              const cover = getCoverImage(album);
              return (
                <Link key={album.id} to={`/album/${album.id}`} className="group">
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-card border border-border shadow-lg group-hover:shadow-xl transition-shadow">
                    {cover ? (
                      <img decoding="async"
                        src={cover}
                        alt={album.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <Heart className="w-16 h-16 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                    )}
                    {album.isNew && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                        {t.newBadge}
                      </span>
                    )}
                    <div className="absolute top-2 right-2">
                      <FavoriteButton albumId={album.id} size="small" />
                    </div>
                  </div>

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
                      {getArtistNames(album.artist)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{album.year}</span>
                      {album.genre && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{album.genre}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-bold mt-1">{album.price} ₼</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
