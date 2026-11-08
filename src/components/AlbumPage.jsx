import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/Button.tsx";
import {
  ArrowLeft, ChevronLeft, ChevronRight, ShoppingCart,
  Star, MessageSquare, ListMusic, Info, Reply, Play, Pause, Video
} from "lucide-react";
import { albums } from "./Albums.jsx";
import { FavoriteButton } from './FavoritesSystem';
import { previewPlayer } from './AudioPreviewPlayer.js';
import { useSpotifyTracklist } from './useSpotifyTracklist.js';
import { useShopifyCart } from '../contexts/Shopifycartcontext';
import { useLanguage, localizeText, localizeReleaseDate, localizeDuration } from './LanguageContext.jsx';
import { toast } from 'sonner';
import { useAuth } from '../contexts/authContext';
import { loadInteractions, addInteraction, addReplyToInteraction } from './albumInteractions.js';
import { usePageTitle } from './usePageTitle.js';
import { cleanAlbumTitle } from './spotifyClient.js';

// Per-album recommendations: same artist first, then same genre, shuffled
// deterministically by album id so every album shows its own stable set,
// with LP/CD variants of the same record deduped.
const getRecommendedAlbums = (album, artistList) => {
  let seed = album.id * 7919 + 17;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const shuffle = (list) =>
    list
      .map((item) => ({ item, sort: rand() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ item }) => item);

  const others = albums.filter((a) => a.id !== album.id);
  const sameArtist = others.filter((a) => a.artist?.includes(artistList[0]));
  const sameGenre = others.filter(
    (a) => !a.artist?.includes(artistList[0]) && a.genre === album.genre
  );

  const seenTitles = new Set([cleanAlbumTitle(album.title).toLowerCase()]);
  const picks = [];
  for (const candidate of [...shuffle(sameArtist), ...shuffle(sameGenre)]) {
    const key = cleanAlbumTitle(candidate.title).toLowerCase();
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);
    picks.push(candidate);
    if (picks.length === 4) break;
  }
  return picks;
};

const getArtistList = (album) => {
  if (!album) return [];
  if (Array.isArray(album.artists)) return album.artists.filter(Boolean);
  if (Array.isArray(album.artist)) return album.artist.filter(Boolean);
  if (typeof album.artist === "string") {
    return album.artist.split("&").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};



const FeaturesList = ({ features }) => {
  if (!features) return null;

  const featureArtists = features.split(/,|&/).map(name => name.trim());

  return (
    <span className="text-sm text-muted-foreground">
      {featureArtists.map((artist, idx) => {
        const slug = artist.toLowerCase()
          .replace(/,/g, '')
          .replace(/\$/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '');

        return (
          <span key={idx}>
            <Link
              to={`/artist/${slug}`}
              className="hover:text-primary hover:underline transition-colors"
            >
              {artist}
            </Link>
            {idx < featureArtists.length - 1 && (
              features.includes('&') && idx === featureArtists.length - 2 ? ' & ' : ', '
            )}
          </span>
        );
      })}
    </span>
  );
};

const AlbumPage = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const { addToCart, loading: cartLoading } = useShopifyCart();
  const album = albums.find((a) => a.id === parseInt(albumId || "", 10));
  usePageTitle(album?.title);

  // iOS 26 Apple Music-style backdrop: the cover itself, heavily blurred,
  // glowing behind the top of the page and dissolving into the background
  const coverForTint = Array.isArray(album?.image) ? album.image[0] : album?.image;

  const { data: spotifyData, loading: spotifyLoading } = useSpotifyTracklist(album);

  const [imageError, setImageError] = useState(false);
  const [showAnimated, setShowAnimated] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const scrollContainerRef = useRef(null);

  const [interactions, setInteractions] = useState([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!album?.id) return;
    let cancelled = false;
    loadInteractions(album.id)
      .then(items => { if (!cancelled) setInteractions(items); })
      .catch(err => console.error('Could not load reviews from Firestore:', err));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album?.id]);

  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const audioRef = useRef(null);
  const [hoveredTrack, setHoveredTrack] = useState(null);
  const [expandedSpotifyTrack, setExpandedSpotifyTrack] = useState(null);
  const [musicVideoUrl, setMusicVideoUrl] = useState(null);
  const [showMusicVideo, setShowMusicVideo] = useState(false);
  const [variantError, setVariantError] = useState(false);

  if (!album) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">{t.notFound}</h1>
          <Link to="/" className="text-primary hover:underline">← {t.backHome}</Link>
        </div>
      </div>
    );
  }

  const tracklist = spotifyData?.tracklist || album?.tracklist || [];
  const releaseDate = spotifyData?.releaseDate || album?.releaseDate;
  const duration = spotifyData?.duration || album?.duration;
  const label = spotifyData?.label || album?.label;

  const artistList = getArtistList(album);
  const staticCovers = Array.isArray(album.image) ? album.image : album.image ? [album.image] : [];

  const galleryImages = [
    ...(album.animatedCover
      ? [{ url: showAnimated ? album.animatedCover : staticCovers[0], type: "cover" }]
      : staticCovers.length ? [{ url: staticCovers[0], type: "cover" }] : []),
    ...staticCovers.slice(album.animatedCover ? 1 : 1).map(url => ({ url, type: "cover" })),
    ...(album.vinylImages || []).map(url => ({ url, type: "vinyl" })),
    ...(Array.isArray(album.tracklistImage)
      ? album.tracklistImage.map((url) => ({ url, type: "tracklist" }))
      : album.tracklistImage ? [{ url: album.tracklistImage, type: "tracklist" }] : []),
    ...(Array.isArray(album.featuresImage)
      ? album.featuresImage.map((url) => ({ url, type: "features" }))
      : album.featuresImage ? [{ url: album.featuresImage, type: "features" }] : []),
  ];

  const currentImage = galleryImages[selectedImage]?.url;

  // Optimistic: the item appears immediately; Firestore persistence runs in
  // the background (its promise can hang indefinitely when the DB is
  // unreachable, so the UI must never wait on it).
  const handleAddReview = () => {
    if (!reviewComment.trim()) return;
    const tempId = `local-${Date.now()}`;
    const item = {
      type: 'review', user: currentUser?.displayName || "Alıcı", rating,
      comment: reviewComment, date: new Date().toLocaleDateString(),
      replies: [], createdAt: Date.now()
    };
    setInteractions(prev => [{ ...item, id: tempId }, ...prev]);
    setReviewComment("");
    addInteraction(album.id, item)
      .then(docId => setInteractions(prev => prev.map(i => i.id === tempId ? { ...i, id: docId } : i)))
      .catch(err => console.warn('Review kept locally only (Firestore unavailable):', err));
  };

  const handleAddQuestion = () => {
    if (!questionText.trim()) return;
    const tempId = `local-${Date.now()}`;
    const item = {
      type: 'question', user: currentUser?.displayName || "İstifadəçi",
      text: questionText, replies: [], date: new Date().toLocaleDateString(),
      createdAt: Date.now()
    };
    setInteractions(prev => [{ ...item, id: tempId }, ...prev]);
    setQuestionText("");
    addInteraction(album.id, item)
      .then(docId => setInteractions(prev => prev.map(i => i.id === tempId ? { ...i, id: docId } : i)))
      .catch(err => console.warn('Question kept locally only (Firestore unavailable):', err));
  };

  const handleAddReply = async (parentId) => {
    if (!replyText.trim()) return;
    const reply = {
      id: Date.now(), user: currentUser?.displayName || "İstifadəçi",
      text: replyText, date: new Date().toLocaleDateString()
    };
    setInteractions(prev => prev.map(item => item.id === parentId ? {
      ...item, replies: [...(item.replies || []), reply]
    } : item));
    setReplyText("");
    setReplyingTo(null);
    // Persist only for items that made it to Firestore (real doc ids);
    // locally-kept items have ids prefixed with "local-"
    if (typeof parentId === 'string' && !parentId.startsWith('local-')) {
      addReplyToInteraction(album.id, parentId, reply)
        .catch(err => console.warn('Reply kept locally only (Firestore unavailable):', err));
    }
  };

  const handlePlayPause = (discIndex, trackIndex, audioUrl) => {
    if (!audioUrl) return;
    const isSameTrack = currentlyPlaying?.discIndex === discIndex && currentlyPlaying?.trackIndex === trackIndex;
    if (isSameTrack) {
      if (audioRef.current) audioRef.current.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(err => console.error("Audio playback error:", err));
      }
      setCurrentlyPlaying({ discIndex, trackIndex });
    }
  };

  const handleSpotifyToggle = (discIndex, trackIndex) => {
    const trackKey = `${discIndex}-${trackIndex}`;
    setExpandedSpotifyTrack(expandedSpotifyTrack === trackKey ? null : trackKey);
  };

  const isTrackPlaying = (discIndex, trackIndex) => {
    return currentlyPlaying?.discIndex === discIndex && currentlyPlaying?.trackIndex === trackIndex;
  };

  const isSpotifyExpanded = (discIndex, trackIndex) => {
    return expandedSpotifyTrack === `${discIndex}-${trackIndex}`;
  };

  const handleTrackHover = (discIndex, trackIndex, audioUrl, previewUrl, isPreviewClip) => {
    if (isTrackPlaying(discIndex, trackIndex)) return;
    const trackKey = `${discIndex}-${trackIndex}`;
    setHoveredTrack(trackKey);
    const urlToPlay = previewUrl || audioUrl;
    // Spotify preview clips are 30s files — start them from the beginning
    if (urlToPlay) previewPlayer.playPreview(urlToPlay, isPreviewClip ? 0 : 30, 10);
  };

  const handleTrackLeave = () => {
    setHoveredTrack(null);
    previewPlayer.stop();
  };

  const handleMusicVideoClick = (videoUrl) => {
    setMusicVideoUrl(videoUrl);
    setShowMusicVideo(true);
  };

  const closeMusicVideo = () => {
    setShowMusicVideo(false);
    setMusicVideoUrl(null);
  };

  const handleAddToCart = async () => {
    if (album.variants && album.variants.length > 0 && !selectedVariant) {
      setVariantError(true);

      const variantSection = document.getElementById('variant-section');
      if (variantSection) {
        variantSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      return;
    }

    setVariantError(false);

    const shopifyVariantId =
      album.shopifyVariantId ||
      album.variants?.find(v => v.id === selectedVariant)?.shopifyVariantId;

    if (!shopifyVariantId) {
      toast.error(t.productUnavailable);
      return;
    }

    const result = await addToCart(shopifyVariantId, quantity);

    if (result.success) {
      toast.success(t.addedToCart);
    } else {
      toast.error(t.errorTryAgain);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {coverForTint && (
        <div className="absolute inset-x-0 top-0 h-[560px] overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-0 scale-125"
            style={{
              backgroundImage: `url(${coverForTint})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(90px) saturate(1.5)',
              opacity: 0.5,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/45 to-background" />
        </div>
      )}
      <div className="container mx-auto px-6 py-12 pb-28 md:pb-12 relative">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t.back}
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-2xl mb-6 group bg-card border border-border">
            {currentImage && !imageError ? (
              <img
                src={currentImage}
                alt={album.title}
                className="w-full h-full object-contain transition-opacity duration-500"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">{t.imageNotLoaded}</div>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-mono z-20">
              {selectedImage + 1} / {galleryImages.length}
            </div>

            {selectedImage > 0 && (
              <button onClick={() => setSelectedImage(s => s - 1)} className="lg-btn lg-btn-clear absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-10"><ChevronLeft /></button>
            )}
            {selectedImage < galleryImages.length - 1 && (
              <button onClick={() => setSelectedImage(s => s + 1)} className="lg-btn lg-btn-clear absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-10"><ChevronRight /></button>
            )}

            {album.animatedCover && selectedImage === 0 && (
              <button onClick={() => setShowAnimated(!showAnimated)} className="lg-btn lg-btn-clear absolute top-4 right-4 bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black/80 transition-all z-20">
                {showAnimated ? `📹 ${t.animated}` : `🖼️ ${t.static}`}
              </button>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="relative bg-card backdrop-blur-sm p-6 rounded-lg border border-border shadow-lg mb-8">
              <p className="text-sm font-medium text-foreground mb-4">{t.images} ({selectedImage + 1}/{galleryImages.length})</p>
              <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: "thin" }}>
                {galleryImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => { setSelectedImage(index); setImageError(false); }}
                    className={`flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden border-3 transition-all ${selectedImage === index ? "border-primary shadow-xl scale-105 ring-2 ring-primary/50" : "border-border hover:border-primary/50"}`}
                  >
                    <img loading="lazy" decoding="async" src={img.url} alt={`${img.type} ${index + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-10 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-5xl font-spotify font-black tracking-tight">{album.title}</h1>
              {album.isExplicit && (
                <span className="bg-gray-400 text-black border px-2 py-1 rounded text-xs font-bold self-center select-none">E</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-2xl">
              {artistList.map((artist, idx) => {
                const slug = String(artist).toLowerCase().replace(/,/g, '').replace(/\$/g, '').replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                return (
                  <span key={idx}>
                    {artist === "Various Artists" ? (
                      <span className="cursor-default select-none">{artist}</span>
                    ) : (
                      <Link to={`/artist/${slug}`} className="hover:text-primary hover:underline transition-colors">{artist}</Link>
                    )}
                    {idx < artistList.length - 1 && <span className="mx-2">&</span>}
                  </span>
                );
              })}
            </div>
            {(() => {
              const ratedReviews = interactions.filter(i => i.type === 'review' && i.rating);
              if (ratedReviews.length === 0) return null;
              const avg = ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length;
              return (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${avg >= s - 0.5 ? "fill-yellow-500 text-yellow-500" : "text-muted"}`} />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">{avg.toFixed(1)} ({ratedReviews.length})</span>
                </div>
              );
            })()}
          </div>

          <div className="flex border-b border-border mb-8 overflow-x-auto">
            {[
              { id: "description", label: t.description, icon: <Info className="w-4 h-4" /> },
              { id: "tracklist", label: t.tracklist, icon: <ListMusic className="w-4 h-4" /> },
              { id: "interactions", label: t.reviews, icon: <MessageSquare className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[300px] mb-12">
            {activeTab === "description" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="px-3 py-1 bg-secondary rounded-lg">{album.genre}</span>
                  <span>•</span>
                  <span>{album.year}</span>
                  {album.vinylColor && (<><span>•</span><span>{t.vinylColors?.[String(album.vinylColor).toLowerCase()] || album.vinylColor} {t.vinylWord}</span></>)}
                </div>

                {album.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t.description}</h3>
                    <p className="text-muted-foreground">{localizeText(album.description, language)}</p>
                  </div>
                )}

                {album.variants && album.variants.length > 0 && (
                  <div id="variant-section" className="border-t border-border pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">{t.selectDesign}</h3>
                      {variantError && (
                        <span className="text-sm text-red-500 font-medium animate-pulse">
                          {t.selectDesignWarning}
                        </span>
                      )}
                    </div>
                    <div className={`grid grid-cols-4 gap-3 ${variantError ? 'ring-2 ring-red-500 rounded-lg p-2' : ''}`}>
                      {album.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => {
                            setSelectedVariant(variant.id);
                            setVariantError(false);
                            const variantImageIndex = galleryImages.findIndex(img => img.url === variant.image);
                            if (variantImageIndex !== -1) setSelectedImage(variantImageIndex);
                          }}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedVariant === variant.id ? "border-primary ring-2 ring-primary/50" : "border-border hover:border-primary/50"}`}
                        >
                          <img loading="lazy" decoding="async" src={variant.image} alt={variant.name} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-1 text-center">
                            <p className="text-xs text-white font-medium truncate">{variant.name}</p>
                          </div>
                          {selectedVariant === variant.id && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {selectedVariant && (
                      <p className="mt-3 text-sm text-primary font-medium">
                        ✓ {t.selected}: {album.variants.find(v => v.id === selectedVariant)?.name}
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold mb-3">{t.quantity}</h3>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="lg-btn lg-btn-clear w-10 h-10 rounded-lg border-2 border-border hover:border-primary transition flex items-center justify-center">
                      <span className="text-xl font-bold">-</span>
                    </button>
                    <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(4, q + 1))} disabled={quantity >= 4} className="lg-btn lg-btn-clear w-10 h-10 rounded-lg border-2 border-border hover:border-primary transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed">
                      <span className="text-xl font-bold">+</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{t.quantityLimitNote}</p>
                </div>
              </div>
            )}

            {activeTab === "tracklist" && (
              <div className="space-y-6">
                {spotifyLoading && <p className="text-center text-muted-foreground">{t.tracklistLoading}</p>}
                {!spotifyLoading && !album.discs && tracklist.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">{t.tracklistUnavailable}</p>
                )}

                <audio ref={audioRef} onEnded={() => setCurrentlyPlaying(null)} />

                {album.discs ? (
                  album.discs.map((disc, discIndex) => (
                    <div key={discIndex} className="space-y-2">
                      <h3 className="text-lg font-bold text-primary mt-6 mb-3">
                        {disc.title || `Disc ${discIndex + 1}`}
                      </h3>
                      {disc.tracks?.map((track, trackIndex) => {
                        const isTrackExplicit = typeof track === 'object' ? (track.explicit || track.isExplicit) : false;
                        const trackTitle = typeof track === 'object' ? (track.title || track.name) : track;
                        const trackFeatures = typeof track === 'object' ? track.features : null;
                        const audioUrl = typeof track === 'object' ? track.audio : null;
                        const spotifyEmbed = typeof track === 'object' ? track.spotifyEmbed : null;
                        const musicVideo = typeof track === 'object' ? track.musicVideo : null;
                        const playing = isTrackPlaying(discIndex, trackIndex);
                        const spotifyExpanded = isSpotifyExpanded(discIndex, trackIndex);

                        return (
                          <div key={trackIndex}>
                            <div
                              className="flex justify-between items-center p-4 rounded-xl hover:bg-muted/50 transition-colors group select-none"
                              onMouseEnter={() => handleTrackHover(discIndex, trackIndex, audioUrl, track.preview, track.isPreviewClip)}
                              onMouseLeave={handleTrackLeave}
                            >
                              <div className="flex items-center gap-4">
                                <span className="font-mono text-muted-foreground w-6">{trackIndex + 1}</span>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-sans font-normal text-base ${playing || spotifyExpanded ? 'text-primary' : ''}`}>{trackTitle}</span>
                                    {isTrackExplicit && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-400 text-black border border-border rounded select-none">E</span>}
                                  </div>
                                  {trackFeatures && <FeaturesList features={trackFeatures} />}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {musicVideo && (
                                  <a
                                    href={musicVideo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-all group/video"
                                    title="Watch Music Video"
                                  >
                                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M21.593 7.203a2.506 2.506 0 0 0-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 0 0-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.23.857.905 1.534 1.763 1.765 1.582.43 7.83.437 7.83.437s6.265.007 7.831-.403a2.515 2.515 0 0 0 1.767-1.763c.414-1.565.417-4.812.417-4.812s.02-3.265-.407-4.831zM9.996 15.005l.005-6 5.207 3.005-5.212 2.995z" />
                                    </svg>
                                  </a>
                                )}
                                {(audioUrl || spotifyEmbed) && (
                                  <button
                                    onClick={() => {
                                      if (audioUrl) {
                                        handlePlayPause(discIndex, trackIndex, audioUrl);
                                      } else if (spotifyEmbed) {
                                        handleSpotifyToggle(discIndex, trackIndex);
                                      }
                                    }}
                                    className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all"
                                  >
                                    {playing || spotifyExpanded ? (
                                      <Pause className="w-4 h-4 text-primary" />
                                    ) : (
                                      <Play className="w-4 h-4 text-primary ml-0.5" />
                                    )}
                                  </button>
                                )}
                                <span className="text-sm font-mono text-muted-foreground">{track.duration || "--:--"}</span>
                              </div>
                            </div>

                            {spotifyEmbed && spotifyExpanded && (
                              <div className="px-4 pb-4">
                                <iframe
                                  key={`${discIndex}-${trackIndex}-${Date.now()}`}
                                  style={{ borderRadius: '12px' }}
                                  src={`${spotifyEmbed}?autoplay=1`}
                                  width="100%"
                                  height="152"
                                  frameBorder="0"
                                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                  loading="eager"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="space-y-1">
                    {tracklist?.map((track, trackIndex) => {
                      const isTrackExplicit = typeof track === 'object' ? (track.explicit || track.isExplicit) : false;
                      const trackTitle = typeof track === 'object' ? (track.title || track.name) : track;
                      const trackFeatures = typeof track === 'object' ? track.features : null;
                      const audioUrl = typeof track === 'object' ? track.audio : null;
                      const spotifyEmbed = typeof track === 'object' ? track.spotifyEmbed : null;
                      const musicVideo = typeof track === 'object' ? track.musicVideo : null;
                      const playing = isTrackPlaying(0, trackIndex);
                      const spotifyExpanded = isSpotifyExpanded(0, trackIndex);

                      return (
                        <div key={trackIndex}>
                          <div
                            className="flex justify-between items-center p-4 rounded-xl hover:bg-muted/50 transition-colors group select-none"
                            onMouseEnter={() => handleTrackHover(0, trackIndex, audioUrl, track.preview, track.isPreviewClip)}
                            onMouseLeave={handleTrackLeave}
                          >
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-muted-foreground w-6">{trackIndex + 1}</span>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className={`font-sans font-normal text-base ${playing || spotifyExpanded ? 'text-primary' : ''}`}>{trackTitle}</span>
                                  {isTrackExplicit && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-400 text-black border border-border rounded select-none">E</span>}
                                </div>
                                {trackFeatures && <FeaturesList features={trackFeatures} />}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {musicVideo && (
                                <a
                                  href={musicVideo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-all"
                                  title="Watch Music Video"
                                >
                                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21.593 7.203a2.506 2.506 0 0 0-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 0 0-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.23.857.905 1.534 1.763 1.765 1.582.43 7.83.437 7.83.437s6.265.007 7.831-.403a2.515 2.515 0 0 0 1.767-1.763c.414-1.565.417-4.812.417-4.812s.02-3.265-.407-4.831zM9.996 15.005l.005-6 5.207 3.005-5.212 2.995z" />
                                  </svg>
                                </a>
                              )}
                              {(audioUrl || spotifyEmbed) && (
                                <button
                                  onClick={() => {
                                    if (audioUrl) {
                                      handlePlayPause(0, trackIndex, audioUrl);
                                    } else if (spotifyEmbed) {
                                      handleSpotifyToggle(0, trackIndex);
                                    }
                                  }}
                                  className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all"
                                >
                                  {playing || spotifyExpanded ? (
                                    <Pause className="w-4 h-4 text-primary" />
                                  ) : (
                                    <Play className="w-4 h-4 text-primary ml-0.5" />
                                  )}
                                </button>
                              )}
                              <span className="text-sm font-mono text-muted-foreground">{track.duration || "--:--"}</span>
                            </div>
                          </div>

                          {spotifyEmbed && spotifyExpanded && (
                            <div className="px-4 pb-4">
                              <iframe
                                key={`spotify-player-${trackIndex}`}
                                style={{ borderRadius: '12px' }}
                                src={`${spotifyEmbed}?autoplay=1`}
                                width="100%"
                                height="152"
                                frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="eager"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-6 mt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground text-left select-none">
                    {releaseDate && <span>{localizeReleaseDate(releaseDate, language)}</span>}
                    {releaseDate && duration && <span className="mx-2">•</span>}
                    {duration && <span>{localizeDuration(duration, language)}</span>}
                    {(releaseDate || duration) && label && <br />}
                    {label && <span>© {album.year} {label}</span>}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "interactions" && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
                    <h3 className="font-bold">{t.leaveReview}</h3>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-5 h-5 cursor-pointer ${(hoverRating || rating) >= s ? "fill-yellow-500 text-yellow-500" : "text-muted"}`} onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} />
                      ))}
                    </div>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder={t.writeReview} className="w-full p-3 rounded-xl bg-background border border-border text-sm h-20 resize-none" />
                    <Button onClick={handleAddReview} className="w-full font-bold">{t.submitReview}</Button>
                  </div>
                  <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
                    <h3 className="font-bold">{t.askQuestion}</h3>
                    <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder={t.writeQuestion} className="w-full p-3 rounded-xl bg-background border border-border text-sm h-20 resize-none" />
                    <Button variant="secondary" onClick={handleAddQuestion} className="w-full font-bold">{t.submitQuestion}</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {interactions.map((item) => (
                    <div key={item.id} className="p-5 rounded-xl border border-border bg-card/40">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-bold uppercase tracking-tighter text-primary">{item.type}</span>
                        <span className="text-muted-foreground">{item.date}</span>
                      </div>

                      {item.type === 'review' ? (
                        <div className="space-y-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < item.rating ? "fill-yellow-500 text-yellow-500" : "text-muted"}`} />
                            ))}
                          </div>
                          <p className="italic text-muted-foreground">"{item.comment}"</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="font-medium">{item.text}</p>
                          {item.replies?.map(r => (
                            <div key={r.id} className="ml-6 border-l-2 border-primary/20 pl-4 text-sm">
                              <span className="font-bold text-primary">{r.user}:</span> {r.text}
                            </div>
                          ))}
                          {replyingTo === item.id ? (
                            <div className="flex gap-2 mt-2">
                              <input value={replyText} onChange={(e) => setReplyText(e.target.value)} className="flex-1 bg-background border rounded-lg px-3 text-sm" placeholder={t.replyPlaceholder} />
                              <Button size="sm" onClick={() => handleAddReply(item.id)}>{t.send}</Button>
                            </div>
                          ) : (
                            <button onClick={() => setReplyingTo(item.id)} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"><Reply className="w-3 h-3" /> {t.reply}</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-8">
            <div className="text-center sm:text-left">
              <p className="text-4xl font-serif font-bold">{(album.price * quantity).toFixed(2)} ₼</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <FavoriteButton albumId={album.id} size="large" />
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="h-14 font-bold px-8 shadow-xl shadow-primary/20 bg-primary text-primary-foreground"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {cartLoading ? t.adding : t.addToCart}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile: price + add-to-cart stay visible while scrolling */}
          <div className="glass-panel md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-xl font-serif font-bold">{(album.price * quantity).toFixed(2)} ₼</p>
            <Button
              onClick={handleAddToCart}
              disabled={cartLoading}
              className="font-bold px-6 bg-primary text-primary-foreground"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {cartLoading ? t.adding : t.addToCart}
            </Button>
          </div>

          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="text-2xl font-bold mb-6">{t.recommendedProducts}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {getRecommendedAlbums(album, artistList)
                .map((recommendedAlbum) => {
                  const recommendedArtists = Array.isArray(recommendedAlbum.artist)
                    ? recommendedAlbum.artist
                    : [recommendedAlbum.artist];

                  return (
                    <Link
                      key={recommendedAlbum.id}
                      to={`/album/${recommendedAlbum.id}`}
                      className="group"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                        <img loading="lazy" decoding="async"
                          src={Array.isArray(recommendedAlbum.image)
                            ? recommendedAlbum.image[0]
                            : recommendedAlbum.image
                          }
                          alt={recommendedAlbum.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {recommendedAlbum.isNew && (
                          <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                            {t.newBadge}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                            {recommendedAlbum.title}
                          </h3>
                          {recommendedAlbum.isExplicit && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-400 text-black rounded flex-shrink-0 select-none">
                              E
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {recommendedArtists.join(', ')}
                        </p>
                        <p className="text-sm font-bold mt-1">{recommendedAlbum.price} ₼</p>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumPage;