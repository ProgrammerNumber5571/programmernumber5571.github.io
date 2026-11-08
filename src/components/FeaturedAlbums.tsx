import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { VinylRecord } from "./VinylRecord.tsx";
import { CDDisc } from "./CDDisc.tsx";
import { CassetteTape } from "./CassetteTape.tsx";
import { Button } from "./ui/Button.tsx";
import { ShoppingCart } from "lucide-react";
import { FavoriteButton } from './FavoritesSystem';
import { albums as rawAlbums } from "./Albums.jsx";
import { useLanguage } from "./LanguageContext.jsx";
import { useShopifyCart } from "../contexts/Shopifycartcontext";
import { toast } from "sonner";

type VinylColor =
  | "black"
  | "red"
  | "blue"
  | "purple"
  | "green"
  | "orange"
  | "pink"
  | "clear"
  | "yellow"
  | "white"
  | "brown";

type CassetteColor =
  | "black"
  | "red"
  | "blue"
  | "purple"
  | "green"
  | "orange"
  | "pink"
  | "clear"
  | "yellow"
  | "white";

interface Album {
  id: number;
  title: string;
  artist: string[];
  price: number;
  genre: string;
  year: number;
  isNew?: boolean;
  isExplicit?: boolean;
  image?: string;
  format?: "vinyl" | "cd" | "cassette";
  vinylColor?: VinylColor;
  cassetteColor?: CassetteColor;
  sleeveColor?: string;
  accentColor?: string;
  description?: string;
  shopifyVariantId?: string;
}

const normalizeAlbums = (albums: any[]): Album[] =>
  albums.map((a) => {
    let normalizedFormat: "vinyl" | "cd" | "cassette" | undefined;
    if (a.format === "vinyl") normalizedFormat = "vinyl";
    else if (a.format === "cd") normalizedFormat = "cd";
    else if (a.format === "cassette" || a.format === "cassetteTape") normalizedFormat = "cassette";
    else normalizedFormat = undefined;
    let artistArray: string[] = [];
    if (Array.isArray(a.artist)) {
      artistArray = a.artist.filter(Boolean).map(String);
    } else if (Array.isArray(a.artists)) {
      artistArray = a.artists.filter(Boolean).map(String);
    } else if (typeof a.artist === "string") {
      artistArray = a.artist.split("&").map((s: string) => s.trim()).filter(Boolean);
    } else if (typeof a.artists === "string") {
      artistArray = a.artists.split("&").map((s: string) => s.trim()).filter(Boolean);
    }

    return {
      ...a,
      format: normalizedFormat,
      artist: artistArray,
    };
  });

const getSleeveColorClass = (color?: string) => {
  const colorMap: Record<string, string> = {
    red: "from-red-500/20 to-transparent",
    blue: "from-blue-500/20 to-transparent",
    purple: "from-purple-500/20 to-transparent",
    green: "from-green-500/20 to-transparent",
    orange: "from-orange-500/20 to-transparent",
    pink: "from-pink-500/20 to-transparent",
    yellow: "from-yellow-500/20 to-transparent",
    brown: "from-amber-700/20 to-transparent",
    gray: "from-gray-500/20 to-transparent",
    default: "from-primary/20 to-transparent",
  };
  return colorMap[color || "default"] || colorMap.default;
};

const getAccentColors = (color?: string) => {
  const colorMap: Record<string, { border: string; text: string }> = {
    red: { border: "border-red-500/50", text: "group-hover:text-red-500" },
    blue: { border: "border-blue-500/50", text: "group-hover:text-blue-500" },
    purple: { border: "border-purple-500/50", text: "group-hover:text-purple-500" },
    green: { border: "border-green-500/50", text: "group-hover:text-green-500" },
    orange: { border: "border-orange-500/50", text: "group-hover:text-orange-500" },
    pink: { border: "border-pink-500/50", text: "group-hover:text-pink-500" },
    yellow: { border: "border-yellow-500/50", text: "group-hover:text-yellow-500" },
    amber: { border: "border-amber-600/50", text: "group-hover:text-amber-600" },
    gray: { border: "border-gray-500/50", text: "group-hover:text-gray-500" },
    default: { border: "border-primary/50", text: "group-hover:text-primary" },
  };
  return colorMap[color || "default"] || colorMap.default;
};

export const FeaturedAlbums = () => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToCart } = useShopifyCart();

  // Adds directly when the album is linked to Shopify; otherwise opens the
  // product page where variants and quantity can be chosen.
  const handleCardAddToCart = async (album: Album) => {
    if (album.shopifyVariantId) {
      const result = await addToCart(album.shopifyVariantId, 1);
      if (result.success) toast.success(t.addedToCart);
      else toast.error(t.errorTryAgain);
    } else {
      navigate(`/album/${album.id}`);
    }
  };
  // New releases lead the homepage regardless of catalog order
  const featuredAlbums: Album[] = [...normalizeAlbums(rawAlbums)]
    .sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
    .slice(0, 6);

  return (
    <section id="new" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <p className="text-primary font-medium tracking-widest text-sm uppercase mb-2">
              {t.newThisWeek}
            </p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold">
              {t.featuredRecords}
            </h2>
          </div>
          <Button
            variant="outline"
            className="self-start md:self-auto border-muted-foreground/30 hover:bg-secondary"
            asChild
          >
            <Link to="/collections">{t.viewAllCollection}</Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredAlbums.map((album) => {
            const accentColors = getAccentColors(album.accentColor);
            return (
              <div
                key={album.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/album/${album.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(`/album/${album.id}`);
                }}
                onMouseEnter={() => setHoveredId(album.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative bg-card rounded-xl p-6 border transition-all duration-300 cursor-pointer ${accentColors.border} hover:shadow-lg`}
              >
                {album.isNew && (
                  <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full z-10">
                    {t.newBadge}
                  </span>
                )}

                <div className="relative h-48 flex items-center justify-center mb-6">
                  {album.image && (
                    <div className="absolute inset-0 flex items-center justify-start pl-4">
                      <div className="w-40 h-40 rounded-lg overflow-hidden shadow-xl">
                        <img loading="lazy" decoding="async"
                          src={Array.isArray(album.image) ? album.image[0] : album.image}
                          alt={`${album.title} cover`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div
                    className={`absolute w-40 h-40 bg-gradient-to-br ${getSleeveColorClass(
                      album.sleeveColor
                    )} rounded-lg transform -rotate-6`}
                  />

                  <div
                    className={`relative transition-transform duration-500 ease-out ${hoveredId === album.id ? "translate-x-16" : "translate-x-0"
                      }`}
                    style={{ marginLeft: "20px" }}
                  >
                    {album.format === "cd" ? (
                      <CDDisc size="md" spinning={hoveredId === album.id} />
                    ) : album.format === "cassette" ? (
                      <CassetteTape
                        size="md"
                        spinning={hoveredId === album.id}
                        cassetteColor={album.cassetteColor || "black"}
                      />
                    ) : (
                      <VinylRecord
                        size="md"
                        spinning={hoveredId === album.id}
                        vinylColor={album.vinylColor || "black"}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-serif text-xl hover:underline font-bold transition-colors ${accentColors.text}`}>
                          {album.title}
                        </h3>
                        {album.isExplicit && (
                          <span className="bg-gray-400 text-black border px-2 py-1 rounded text-xs font-bold self-center select-none">E</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {album.artist.map((artistName, idx) => {
                          const slug = String(artistName)
                            .toLowerCase()
                            .replace(/,/g, '')
                            .replace(/\$/g, '')
                            .replace(/\s+/g, "-")
                            .replace(/[^\w-]/g, "");
                          return (
                            <span key={`${album.id}-artist-${idx}`} className="flex items-center">
                              {artistName === "Various Artists" ? (
                                <span className="text-muted-foreground select-none">{artistName}</span>
                              ) : (
                                <Link
                                  to={`/artist/${slug}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-muted-foreground hover:underline transition-colors"
                                >
                                  {artistName}
                                </Link>
                              )}
                              {idx < album.artist.length - 1 && (
                                <span className="text-muted-foreground mx-1">&</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-secondary rounded">{album.genre}</span>
                    <span>•</span>
                    <span>{album.year}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <p className="text-2xl font-serif font-bold">{album.price} ₼</p>
                    <Button
                      size="sm"
                      className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardAddToCart(album);
                      }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {t.addToCart}
                    </Button>
                    <div className="absolute top-1 left-1 z-10">
                      <FavoriteButton albumId={album.id} size="medium" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
