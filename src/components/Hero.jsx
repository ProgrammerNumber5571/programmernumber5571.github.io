import { VinylRecord } from "./VinylRecord";
import { Button } from "./ui/Button.tsx";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { albums } from "./Albums.jsx";
import { useLanguage } from "./LanguageContext.jsx";
import { displayTitle } from "../lib/editions.js";

export const Hero = () => {
  const { t } = useLanguage();
  const featuredAlbum = albums.find(album => album.id === 36) || albums[0];

  const getCoverImage = (album) => {
    if (!album) return null;

    if (album.animatedCover) {
      return album.animatedCover;
    }

    if (Array.isArray(album.image)) {
      return album.image[0];
    }
    
    return album.image;
  };

  const coverImage = getCoverImage(featuredAlbum);
  const isVideo = coverImage && (coverImage.endsWith('.mp4') || coverImage.endsWith('.webm') || coverImage.endsWith('.mov'));

  return (
    <section className="min-h-screen flex items-center pt-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/30" />

      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* minmax(0, 1fr): without it the single mobile column grows to the widest child (the vinyl art) and pushes the text off-screen */}
        <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 min-w-0">
            <div className="space-y-4">
              <p className="text-primary font-medium tracking-widest text-sm uppercase animate-fade-in">
                {t.heroTag}
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
                {t.heroNew} <br />KEN CARSON -
                <span className="text-gradient block">XPERIMENT</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md animate-fade-in" style={{ animationDelay: "0.2s" }}>
                {t.heroDesc}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                <Link to="/album/36">{t.shopNow}</Link>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 border-muted-foreground/30 hover:bg-secondary" asChild>
                <Link to={`/album/${featuredAlbum?.id || 36}`}>
                  <Play className="w-4 h-4" />
                  {t.listenPreview}
                </Link>
              </Button>
            </div>

            <div className="flex gap-8 sm:gap-12 pt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div>
                <p className="text-3xl font-serif font-bold text-gradient">100+</p>
                <p className="text-sm text-muted-foreground">{t.statVinyl}</p>
              </div>
              <div>
                <p className="text-3xl font-serif font-bold text-gradient">50+</p>
                <p className="text-sm text-muted-foreground">{t.statRare}</p>
              </div>
              <div>
                <p className="text-3xl font-serif font-bold text-gradient">10+</p>
                <p className="text-sm text-muted-foreground">{t.statGenres}</p>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative h-96 flex items-center justify-center">
              {coverImage && (
                <div className="absolute inset-0 flex items-center justify-start pl-4">
                  <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-lg overflow-hidden shadow-xl bg-black">
                    {isVideo ? (
                      <video
                        src={coverImage}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={coverImage}
                        alt={`${displayTitle(featuredAlbum)} cover`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className={`absolute w-80 h-80 bg-gradient-to-br ${
                featuredAlbum?.sleeveColor ? `from-${featuredAlbum.sleeveColor}-500/20` : 'from-primary/20'
              } to-transparent rounded-lg transform -rotate-6`} />

              <div className="relative z-10 animate-float ml-24 sm:ml-[230px]">
                <VinylRecord
                  size="xl"
                  spinning={true}
                  vinylColor={featuredAlbum?.vinylColor || "purple"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};