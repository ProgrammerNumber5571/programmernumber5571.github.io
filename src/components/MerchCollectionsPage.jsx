import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/Button.tsx";
import { ShoppingCart, Heart, Filter, X, ChevronRight, ArrowLeft } from "lucide-react";
import { Merch, MerchCategories } from "./Merch.jsx";
import { artistProfiles } from "./ArtistProfiles.jsx";
import { useLanguage } from "./LanguageContext.jsx";

// Category names in the data are inconsistently cased ("ANTAGONIST 2.0" vs
// "Antagonist 2.0"), so all category comparisons are case-insensitive.
const sameCategory = (a, b) =>
  String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

export const MerchCollectionsPage = () => {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState(null);
  const [artistFilter, setArtistFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("none");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

  const normalizedMerch = Merch.map(item => ({
    ...item,
    artist: Array.isArray(item.artist) 
      ? item.artist 
      : typeof item.artist === 'string' 
        ? item.artist.split('&').map(a => a.trim())
        : [item.artist]
  }));

  const allArtists = Array.from(
    new Set(normalizedMerch.flatMap(item => item.artist))
  ).sort();
  
  const allYears = Array.from(
    new Set(normalizedMerch.map(item => item.year))
  ).sort((a, b) => b - a);

  const artistCollections = allArtists.map(artist => {
    const artistMerch = normalizedMerch.filter(item => item.artist.includes(artist));
    const artistProfile = artistProfiles[artist] || {};
    
    return {
      artist,
      itemCount: artistMerch.length,
      image: artistProfile.profileImage || artistMerch[0]?.image,
      banner: artistProfile.merchBanner || artistProfile.banner,
      merch: artistMerch
    };
  }).filter(collection => collection.itemCount > 0);

  let filteredMerch = normalizedMerch.filter((item) => {
    const yearMatch = yearFilter === "All" || item.year.toString() === yearFilter;
    const artistMatch = artistFilter === "All" || item.artist.includes(artistFilter);
    const categoryMatch = !selectedCategory || sameCategory(item.category, selectedCategory);
    return yearMatch && artistMatch && categoryMatch;
  });

  if (sortOrder === "price-low") {
    filteredMerch = [...filteredMerch].sort((a, b) => a.price - b.price);
  } else if (sortOrder === "price-high") {
    filteredMerch = [...filteredMerch].sort((a, b) => b.price - a.price);
  } else if (sortOrder === "year-new") {
    filteredMerch = [...filteredMerch].sort((a, b) => b.year - a.year);
  } else if (sortOrder === "year-old") {
    filteredMerch = [...filteredMerch].sort((a, b) => a.year - b.year);
  }

  const clearFilters = () => {
    setArtistFilter("All");
    setYearFilter("All");
    setSortOrder("none");
  };

  const hasActiveFilters = artistFilter !== "All" || yearFilter !== "All" || sortOrder !== "none";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-12">
          <Link to="/" className="text-primary hover:underline mb-4 inline-block">
            ← {t.backHome}
          </Link>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
            {t.merchCollection}
          </h1>
          <p className="text-muted-foreground text-lg">
            {viewMode === "categories"
              ? `${(MerchCategories || []).filter(c => normalizedMerch.some(i => sameCategory(i.category, c.name))).length} ${t.categoriesWord}`
              : viewMode === "subcategories"
              ? `${selectedCategory} - ${artistCollections.filter(c => normalizedMerch.some(m => m.artist.includes(c.artist) && sameCategory(m.category, selectedCategory))).length} ${t.artistsWord}`
              : `${filteredMerch.length} ${t.productsFound}`}
          </p>
        </div>

        {selectedCategory && viewMode === "subcategories" && (
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedCategory(null);
              setViewMode("categories");
            }}
            className="mb-8 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToCategories}
          </Button>
        )}

        {viewMode === "categories" && MerchCategories && (
          <div className="space-y-12">
            {MerchCategories.map((category) => {
              const categoryMerch = normalizedMerch.filter(item => sameCategory(item.category, category.name));
              if (categoryMerch.length === 0) return null;

              return (
                <div
                  key={category.name}
                  className="relative h-72 md:h-96 rounded-2xl overflow-hidden cursor-pointer group border border-border hover:border-primary/60 shadow-lg hover:shadow-2xl transition-all duration-300"
                  onClick={() => {
                    setSelectedCategory(category.name);
                    setViewMode("subcategories");
                  }}
                >
                  {category.banner ? (
                    <div className="absolute inset-0 bg-black">
                      <img decoding="async"
                        src={category.banner}
                        alt={category.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
                  )}

                  {/* Overlay text sits on a dark gradient, so white is safe in both themes */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-lg">
                        {category.name}
                      </h2>
                      <p className="text-white/70 font-semibold mt-1">
                        {categoryMerch.length} {t.productsWord}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="gap-2 self-start sm:self-auto shadow-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory(category.name);
                        setViewMode("subcategories");
                      }}
                    >
                      {t.viewCollection}
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "subcategories" && selectedCategory && (
          <div className="space-y-12">
            {artistCollections
              .filter(collection => normalizedMerch.some(m => m.artist.includes(collection.artist) && sameCategory(m.category, selectedCategory)))
              .map((collection) => {
              return (
                <div key={collection.artist} className="space-y-6">
                  <div
                    className="relative h-64 md:h-80 rounded-2xl overflow-hidden cursor-pointer group border border-border hover:border-primary/60 shadow-lg hover:shadow-2xl transition-all duration-300"
                    onClick={() => {
                      setArtistFilter(collection.artist);
                      setViewMode("all");
                    }}
                  >
                    {collection.banner || collection.image ? (
                      <div className="absolute inset-0 bg-black">
                        <img loading="lazy" decoding="async"
                          src={collection.banner || collection.image}
                          alt={collection.artist}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-lg">
                          {collection.artist}
                        </h2>
                        <p className="text-white/70 font-semibold mt-1">
                          {collection.merch.filter(m => sameCategory(m.category, selectedCategory)).length} {t.productsWord}
                        </p>
                      </div>
                      <Button
                        size="lg"
                        className="gap-2 self-start sm:self-auto shadow-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          setArtistFilter(collection.artist);
                          setViewMode("all");
                        }}
                      >
                        {t.viewCollection}
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {collection.merch.filter(m => sameCategory(m.category, selectedCategory)).slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="group cursor-pointer bg-card border border-border rounded-xl p-3 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                        onClick={() => navigate(`/merch/${item.id}`)}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-black">
                          {item.image ? (
                            <img loading="lazy" decoding="async"
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm font-bold text-primary">{item.price} ₼</p>
                      </div>
                    ))}
                    
                    {collection.merch.filter(m => sameCategory(m.category, selectedCategory)).length > 5 && (
                      <div
                        className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer flex items-center justify-center bg-card/50"
                        onClick={() => {
                          setArtistFilter(collection.artist);
                          setViewMode("all");
                        }}
                      >
                        <div className="text-center p-4">
                          <ChevronRight className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-semibold">
                            +{collection.merch.filter(m => sameCategory(m.category, selectedCategory)).length - 5} {t.moreWord}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "all" && (
          <>
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {t.filters} {hasActiveFilters && `(${[artistFilter !== "All", yearFilter !== "All", sortOrder !== "none"].filter(Boolean).length})`}
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                    {t.clear}
                  </Button>
                )}

                <div className="flex flex-wrap gap-2">
                  {artistFilter !== "All" && (
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
                      {artistFilter}
                      <button onClick={() => setArtistFilter("All")} className="hover:text-primary/80">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {yearFilter !== "All" && (
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
                      {yearFilter}
                      <button onClick={() => setYearFilter("All")} className="hover:text-primary/80">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>

              {showFilters && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t.artistLabel}</label>
                      <select
                        value={artistFilter}
                        onChange={(e) => setArtistFilter(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="All">{t.all}</option>
                        {allArtists.map((artist) => (
                          <option key={artist} value={artist}>
                            {artist}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">{t.yearLabel}</label>
                      <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="All">{t.all}</option>
                        {allYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">{t.sortLabel}</label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="none">{t.sortDefault}</option>
                        <option value="price-low">{t.priceLowHigh}</option>
                        <option value="price-high">{t.priceHighLow}</option>
                        <option value="year-new">{t.yearNewOld}</option>
                        <option value="year-old">{t.yearOldNew}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {filteredMerch.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">{t.noProductsFound}</p>
                <Button onClick={clearFilters} className="mt-4">
                  {t.clearFilters}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredMerch.map((item) => (
                  <div
                    key={item.id}
                    className="group cursor-pointer"
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => navigate(`/merch/${item.id}`)}
                  >
                    <div className="bg-card border border-border rounded-xl p-3 group-hover:border-primary/50 group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                      <div className="relative mb-3 aspect-square bg-black rounded-lg overflow-hidden">
                        {item.image ? (
                          <img decoding="async"
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}

                        {item.isNew && (
                          <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow">
                            {t.newBadge}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-foreground group-hover:text-primary transition truncate mb-1">
                        {item.title}
                      </h3>

                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {item.artist.join(" & ")}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">{item.year}</p>
                        <p className="font-bold text-primary">{item.price} ₼</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};