import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { albums } from './Albums.jsx';
import { posterFor, tinyFor } from '../lib/imageUrls.js';
import { useInView, useVideoPlayback } from '../lib/useInView.js';

// Three random albums are promoted on every visit (picked once per page
// load, stable while browsing within the session). Albums with animated
// covers are preferred so the banner moves; LP/CD variants sharing the
// same artwork are deduped so one album can't take two slides.
const getCover = (album) =>
  Array.isArray(album.image) ? album.image[0] : album.image;

const isVideo = (url) => /\.(mp4|webm|mov)(\?|$)/i.test(String(url || ''));

const shuffle = (list) =>
  list
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);

const withMedia = albums.filter((a) => a.animatedCover || getCover(a));
const pool = [
  ...shuffle(withMedia.filter((a) => a.animatedCover)),
  ...shuffle(withMedia.filter((a) => !a.animatedCover)),
];

const seenArt = new Set();
const promos = pool
  .filter((album) => {
    const key = album.animatedCover || getCover(album);
    if (seenArt.has(key)) return false;
    seenArt.add(key);
    return true;
  })
  .slice(0, 3)
  .map((album) => ({
    id: album.id,
    albumId: album.id,
    media: album.animatedCover || getCover(album),
    still: getCover(album) || posterFor(album.animatedCover),
    backdrop: getCover(album) || posterFor(album.animatedCover) || album.animatedCover,
    title: album.title,
  }));

// The animated covers were uploaded as small GIFs (a few hundred px wide), which look blurry when
// stretched over a phone's 3x screen. So the sharp still cover is always drawn, and the animation is
// only laid over it when the video has enough pixels for the size it is shown at.
function PromoMedia({ promo }) {
  const [sharp, setSharp] = useState(false);
  const animated = isVideo(promo.media);
  const still = promo.still || (animated ? undefined : promo.media);

  const checkSharp = (e) => {
    const v = e.currentTarget;
    const needed = v.clientWidth * (window.devicePixelRatio || 1) * 0.75;
    setSharp(v.videoWidth >= needed);
  };

  return (
    <div className="relative z-10 h-3/4 aspect-square max-w-[85%] rounded-xl overflow-hidden shadow-2xl">
      {still && (
        <img
          decoding="async"
          src={still}
          alt={promo.title}
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}
      {animated && (
        <video
          src={promo.media}
          poster={still ? undefined : posterFor(promo.media)}
          autoPlay
          loop
          muted
          playsInline
          onLoadedMetadata={checkSharp}
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
            sharp || !still ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

export function PromoBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const [rootRef, inView] = useInView();
  useVideoPlayback(rootRef, inView);

  if (promos.length === 0) return null;

  useEffect(() => {
    if (!isPaused && inView) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % promos.length);
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, inView, promos.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promos.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promos.length) % promos.length);
  };

  // Touch: swipe left/right to change slide (only clearly horizontal swipes count,
  // so vertical page scrolling over the banner still works)
  const touchStart = useRef(null);
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (e) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) nextSlide();
      else prevSlide();
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative w-full h-[380px] sm:h-[540px] md:h-[720px] lg:h-[850px] overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="flex transition-transform duration-700 ease-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {promos.map((promo) => (
          <Link
            key={promo.id}
            to={`/album/${promo.albumId}`}
            className="min-w-full h-full relative flex items-center justify-center bg-black"
          >
            {/* Blurred static cover as the wide backdrop */}
            <div
              className="absolute inset-0 scale-125"
              style={{
                backgroundImage: `url(${tinyFor(promo.backdrop)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.55,
              }}
            />
            <PromoMedia promo={promo} />
          </Link>
        ))}
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          prevSlide();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 [@media(hover:none)]:hidden transition-opacity z-20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={(e) => {
          e.preventDefault();
          nextSlide();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 [@media(hover:none)]:hidden transition-opacity z-20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {promos.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            aria-label={`${index + 1} / ${promos.length}`}
            aria-current={index === currentSlide}
            className={`relative before:absolute before:-inset-x-1.5 before:-inset-y-4 before:content-[''] w-2 h-2 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-white w-8' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {!isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div 
            className="h-full bg-white transition-all"
            style={{
              width: `${((currentSlide + 1) / promos.length) * 100}%`,
              transition: 'width 0.3s ease-out'
            }}
          />
        </div>
      )}
    </div>
  );
}