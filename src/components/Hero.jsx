import { VinylRecord } from "./VinylRecord";
import { Button } from "./ui/Button.tsx";
import { ArrowRight, Pause, Play } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { findPreview } from "../lib/previewSource.js";
import { previewPlayer } from "./AudioPreviewPlayer.js";
import { albums } from "./Albums.jsx";
import { useLanguage } from "./LanguageContext.jsx";
import { displayTitle } from "../lib/editions.js";
import { posterFor } from "../lib/imageUrls.js";
import { useInView, useVideoPlayback } from "../lib/useInView.js";

export const Hero = () => {
  const { t } = useLanguage();
  const [sectionRef, inView] = useInView();
  useVideoPlayback(sectionRef, inView);
  const navigate = useNavigate();

  // "Listen Preview": plays a short clip of the featured album right here on the Hero.
  const audioRef = useRef(null);
  const [preview, setPreview] = useState({ status: "idle", progress: 0 }); // idle | loading | playing

  const stopPreview = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.volume = 1;
    }
    setPreview({ status: "idle", progress: 0 });
  };

  const togglePreview = async () => {
    if (preview.status === "playing") {
      stopPreview();
      return;
    }
    const album = albums.find((a) => a.id === 36) || albums[0];
    setPreview({ status: "loading", progress: 0 });
    const source = await findPreview(album);
    if (!source) {
      // nothing to play for this album: fall back to its page, where the tracklist lives
      setPreview({ status: "idle", progress: 0 });
      navigate(`/album/${album?.id || 36}`);
      return;
    }
    // only one preview at a time across the site
    previewPlayer.stop();
    const audio = audioRef.current;
    audio.src = source.url;
    audio.currentTime = source.start || 0;
    audio.volume = 1;
    try {
      await audio.play();
      setPreview({ status: "playing", progress: 0 });
    } catch {
      setPreview({ status: "idle", progress: 0 });
    }
  };

  // progress bar, soft fade over the last 1.5s, reset when the clip ends
  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const left = audio.duration - audio.currentTime;
    audio.volume = left < 1.5 ? Math.max(0, left / 1.5) : 1;
    setPreview((p) => (p.status === "playing" ? { status: "playing", progress: audio.currentTime / audio.duration } : p));
  };

  // stop when the visitor scrolls past the Hero or leaves the page
  useEffect(() => {
    if (!inView && preview.status === "playing") stopPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);
  useEffect(() => () => audioRef.current?.pause(), []);
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
    <section ref={sectionRef} className="min-h-screen flex items-center pt-20 relative overflow-hidden">
      <audio ref={audioRef} preload="none" onTimeUpdate={onTimeUpdate} onEnded={stopPreview} onError={stopPreview} />
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
              <Button
                size="lg"
                variant="outline"
                className="relative overflow-hidden gap-2 border-muted-foreground/30 hover:bg-secondary"
                onClick={togglePreview}
                disabled={preview.status === "loading"}
                aria-pressed={preview.status === "playing"}
              >
                {preview.status === "playing" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {preview.status === "playing" ? t.pausePreview : t.listenPreview}
                {preview.status === "playing" && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-primary transition-transform duration-300 ease-linear"
                    style={{ transform: `scaleX(${preview.progress})` }}
                  />
                )}
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
                        poster={posterFor(coverImage)}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img decoding="async"
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

              <div className={`relative z-10 ml-24 sm:ml-[230px] ${inView ? "animate-float" : ""}`}>
                <VinylRecord
                  size="xl"
                  spinning={inView}
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