import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/Button.tsx";
import { ArrowLeft, ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import { Merch } from "./Merch.jsx";
import { useLanguage, localizeText } from "./LanguageContext.jsx";
import { useShopifyCart } from "../contexts/Shopifycartcontext";
import { toast } from "sonner";
import { usePageTitle } from "./usePageTitle.js";

export const MerchPage = () => {
  const { merchId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { addToCart, loading: cartLoading } = useShopifyCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageError, setImageError] = useState(false);

  const item = Merch.find((m) => m.id === parseInt(merchId || "", 10));
  usePageTitle(item?.title);

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">{t.productNotFound}</h1>
          <Link to="/merch" className="text-primary hover:underline">
            {t.backToMerch}
          </Link>
        </div>
      </div>
    );
  }
  const artistList = Array.isArray(item.artist)
    ? item.artist
    : typeof item.artist === 'string'
      ? item.artist.split('&').map(a => a.trim())
      : [item.artist];
  const galleryImages = [
    item.image,
    ...(item.additionalImages || [])
  ].filter(Boolean);

  const currentImage = galleryImages[selectedImage];

  const incrementQuantity = () => setQuantity(q => Math.min(4, q + 1));
  const decrementQuantity = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  const handleAddToCart = async () => {
    if (!item.shopifyVariantId) {
      toast.error(t.productUnavailable);
      return;
    }
    const result = await addToCart(item.shopifyVariantId, quantity);
    if (result.success) toast.success(t.addedToCart);
    else toast.error(t.errorTryAgain);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.back}
        </Button>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div>
            <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-2xl mb-6 bg-card border border-border">
              {currentImage && !imageError ? (
                <img decoding="async"
                  src={currentImage}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <ShoppingCart className="w-20 h-20 text-muted-foreground" />
                </div>
              )}

              {item.isNew && (
                <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-full">
                  {t.newBadge}
                </span>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {galleryImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(index);
                      setImageError(false);
                    }}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                        ? "border-primary shadow-lg scale-105"
                        : "border-border hover:border-primary/50"
                      }`}
                  >
                    <img decoding="async"
                      src={img}
                      alt={`${item.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">
                {item.title}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                {artistList.map((artist, index) => {
                  const slug = String(artist)
                    .toLowerCase()
                    .replace(/,/g, '')
                    .replace(/\$/g, '')
                    .replace(/\s+/g, "-")
                    .replace(/[^\w-]/g, "");
                  return (
                    <span key={`artist-${index}`} className="flex items-center">
                      <Link
                        to={`/artist/${slug}`}
                        className="text-xl text-muted-foreground hover:text-primary hover:underline transition-colors"
                      >
                        {artist}
                      </Link>
                      {index < artistList.length - 1 && (
                        <span className="text-xl text-muted-foreground mx-2">&</span>
                      )}
                    </span>
                  );
                })}
              </div>

              <p className="text-muted-foreground">{item.year}</p>
            </div>

            <div className="border-y border-border py-6">
              <p className="text-4xl font-serif font-bold">{item.price} ₼</p>
            </div>
            {item.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.description}</h3>
                <p className="text-muted-foreground">{localizeText(item.description, language)}</p>
              </div>
            )}
            {item.size && item.size.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">{t.selectSize}</h3>
                {item.size && item.size.length > 0 && !selectedSize && (
              <span className="text-me text-red-500 font-medium animate-pulse">
                {t.selectSizeWarning}
              </span>
            )}
                <div className="flex flex-wrap gap-3">
                  {item.size.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 border-2 rounded-lg font-medium transition-all ${selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {item.color && (
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.colorLabel}</h3>
                <p className="text-muted-foreground">{item.color}</p>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold mb-3">{t.quantity}</h3>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-semibold w-12 text-center">
                  {quantity}
                </span>
                <Button variant="outline" size="icon" onClick={incrementQuantity} disabled={quantity >= 4}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{t.quantityLimitNote}</p>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{t.total}</span>
                <span className="text-3xl font-serif font-bold">
                  {(item.price * quantity).toFixed(0)} ₼
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={handleAddToCart}
                disabled={cartLoading || (item.size && item.size.length > 0 && !selectedSize)}
              >
                <ShoppingCart className="w-5 h-5" />
                {t.addToCart}
              </Button>
              <Button variant="outline" size="icon" className="shrink-0">
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-3">{t.productDetails}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t.categoryLabel}</span>
                  <span className="font-medium text-foreground">
                    {item.category || "Merch"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t.releaseYear}</span>
                  <span className="font-medium text-foreground">{item.year}</span>
                </div>
                {item.material && (
                  <div className="flex justify-between">
                    <span>{t.materialLabel}</span>
                    <span className="font-medium text-foreground">{item.material}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-20">
          <h2 className="text-3xl font-serif font-bold mb-8">{t.similarProducts}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Merch.filter(m =>
              m.id !== item.id &&
              m.artist.some(a => artistList.includes(a))
            )
              .slice(0, 5)
              .map(relatedItem => (
                <Link
                  key={relatedItem.id}
                  to={`/merch/${relatedItem.id}`}
                  className="group"
                >
                  <div className="aspect-square bg-card rounded-lg overflow-hidden border border-border mb-3 group-hover:shadow-lg transition-shadow">
                    {relatedItem.image ? (
                      <img loading="lazy" decoding="async"
                        src={relatedItem.image}
                        alt={relatedItem.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ShoppingCart className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm truncate group-hover:text-primary transition">
                    {relatedItem.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{relatedItem.price} ₼</p>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};