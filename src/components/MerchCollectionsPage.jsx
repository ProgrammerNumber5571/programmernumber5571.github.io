import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Merch, MerchCategories } from "./Merch.jsx";
import { artistProfiles } from "./ArtistProfiles.jsx";
import { useLanguage } from "./LanguageContext.jsx";

// Category names in the data are inconsistently cased ("ANTAGONIST 2.0" vs
// "Antagonist 2.0"), so all category comparisons are case-insensitive.
const sameCategory = (a, b) =>
  String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

const chip =
  "shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap";

// The shop page: a hero with the collection's name, one row of filter chips (filters, categories, sort)
// and a product grid whose first product is shown large.
export const MerchCollectionsPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [artistFilter, setArtistFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("none");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const normalizedMerch = Merch.map((item) => ({
    ...item,
    artist: Array.isArray(item.artist)
      ? item.artist
      : typeof item.artist === "string"
        ? item.artist.split("&").map((a) => a.trim())
        : [item.artist],
  }));

  const allArtists = Array.from(new Set(normalizedMerch.flatMap((item) => item.artist))).sort();
  const allYears = Array.from(new Set(normalizedMerch.map((item) => item.year))).sort((a, b) => b - a);
  const categories = (MerchCategories || []).filter((c) => normalizedMerch.some((i) => sameCategory(i.category, c.name)));

  let filteredMerch = normalizedMerch.filter((item) => {
    const yearMatch = yearFilter === "All" || item.year.toString() === yearFilter;
    const artistMatch = artistFilter === "All" || item.artist.includes(artistFilter);
    const categoryMatch = !selectedCategory || sameCategory(item.category, selectedCategory);
    return yearMatch && artistMatch && categoryMatch;
  });

  if (sortOrder === "price-low") filteredMerch = [...filteredMerch].sort((a, b) => a.price - b.price);
  else if (sortOrder === "price-high") filteredMerch = [...filteredMerch].sort((a, b) => b.price - a.price);
  else if (sortOrder === "year-new") filteredMerch = [...filteredMerch].sort((a, b) => b.year - a.year);
  else if (sortOrder === "year-old") filteredMerch = [...filteredMerch].sort((a, b) => a.year - b.year);

  const clearFilters = () => {
    setArtistFilter("All");
    setYearFilter("All");
    setSortOrder("none");
    setSelectedCategory(null);
  };

  const activeFilterCount = [artistFilter !== "All", yearFilter !== "All"].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || sortOrder !== "none" || selectedCategory;

  // hero: the chosen artist's merch banner when one is picked, otherwise a plain dark header
  const heroProfile = artistFilter !== "All" ? artistProfiles[artistFilter] : null;
  const heroImage = heroProfile?.merchBanner || heroProfile?.banner || null;
  const heroTitle = artistFilter !== "All" ? artistFilter : selectedCategory || t.merchCollection;

  const avatarFor = (item) => artistProfiles[item.artist[0]]?.profileImage;

  const ProductImage = ({ item, featured }) =>
    item.image ? (
      <img
        decoding="async"
        loading="lazy"
        src={item.image}
        alt={item.title}
        className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${featured ? "object-cover" : "object-contain p-3"}`}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <ShoppingCart className="w-12 h-12 text-muted-foreground" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background pb-16 font-sans [&_h1]:font-sans [&_h3]:font-sans">
      {/* Hero */}
      <div className="relative h-44 md:h-56 overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        {heroImage && (
          <img
            decoding="async"
            src={heroImage}
            alt=""
            className="absolute right-0 top-0 h-full w-2/3 md:w-1/2 object-contain object-right opacity-90"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="container relative mx-auto flex h-full flex-col justify-between px-6 py-5 md:py-6">
          <Link to="/" className="self-start text-sm font-medium text-white/70 hover:text-white">
            ← {t.backHome}
          </Link>
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">{heroTitle}</h1>
            <p className="mt-1 text-sm text-white/60">{filteredMerch.length} {t.productsFound}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-6">
        <div className="mt-4 rounded-2xl border border-border bg-card/50 p-3 md:p-6">
          {/* Filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              aria-expanded={showFilters}
              className={`${chip} ${showFilters || activeFilterCount ? "border-primary text-primary" : "border-border text-foreground"} bg-background/60`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t.filters}
              {activeFilterCount > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeFilterCount}</span>}
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`${chip} ${!selectedCategory ? "border-foreground bg-foreground text-background" : "border-border bg-background/60 text-muted-foreground hover:text-foreground"}`}
            >
              {t.all}
            </button>
            {categories.map((c) => {
              const active = sameCategory(selectedCategory, c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedCategory(active ? null : c.name)}
                  aria-pressed={active}
                  className={`${chip} ${active ? "border-foreground bg-foreground text-background" : "border-border bg-background/60 text-muted-foreground hover:text-foreground"}`}
                >
                  {c.name}
                </button>
              );
            })}

            <label className="relative ml-auto shrink-0">
              <span className="sr-only">{t.sortLabel}</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={`${chip} appearance-none cursor-pointer border-border bg-background/60 pr-9 text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
              >
                <option value="none">{t.sortDefault}</option>
                <option value="price-low">{t.priceLowHigh}</option>
                <option value="price-high">{t.priceHighLow}</option>
                <option value="year-new">{t.yearNewOld}</option>
                <option value="year-old">{t.yearOldNew}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </label>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-border bg-background/60 p-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">{t.artistLabel}</label>
                <select
                  value={artistFilter}
                  onChange={(e) => setArtistFilter(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="All">{t.all}</option>
                  {allArtists.map((artist) => (
                    <option key={artist} value={artist}>{artist}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.yearLabel}</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="All">{t.all}</option>
                  {allYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" /> {t.clear}
            </button>
          )}

          {/* Products */}
          {filteredMerch.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">{t.noProductsFound}</p>
              <button type="button" onClick={clearFilters} className={`${chip} mt-4 border-foreground bg-foreground text-background`}>
                {t.clearFilters}
              </button>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
              {filteredMerch.map((item, index) => {
                const featured = index === 0 && filteredMerch.length >= 3;
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/merch/${item.id}`)}
                    className={`group cursor-pointer ${featured ? "col-span-2" : ""}`}
                  >
                    <div className={`relative overflow-hidden bg-black ${featured ? "aspect-[2.08/1]" : "aspect-square"}`}>
                      <ProductImage item={item} featured={featured} />
                      {item.isNew && (
                        <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                          {t.newBadge}
                        </span>
                      )}
                    </div>
                    <div className="px-1 pt-3">
                      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {avatarFor(item) ? (
                          <img decoding="async" loading="lazy" src={avatarFor(item)} alt="" className="h-4 w-4 rounded-full object-cover" />
                        ) : (
                          <span className="h-4 w-4 rounded-full bg-muted" />
                        )}
                        <span className="truncate">{item.artist.join(" & ")}</span>
                      </div>
                      <h3 className={`uppercase leading-snug group-hover:text-primary transition-colors ${featured ? "text-lg font-semibold" : "text-xs font-medium"}`}>
                        {item.title}
                      </h3>
                      {featured && item.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                      )}
                      <p className="mt-2 text-sm font-bold">{item.price} ₼</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
