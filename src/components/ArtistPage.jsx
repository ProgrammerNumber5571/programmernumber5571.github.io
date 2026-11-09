import { useParams } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { albums } from "./Albums.jsx";
import { artistProfiles } from "./ArtistProfiles.jsx";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { VinylRecord } from "./VinylRecord.tsx";
import { CDDisc } from "./CDDisc.tsx";
import { CassetteTape } from "./CassetteTape.tsx";
import { Button } from "./ui/Button.tsx";
import { useLanguage, localizeText, localizeReleaseDate } from "./LanguageContext.jsx";
import { usePageTitle } from "./usePageTitle.js";
import { displayTitle, groupEditions } from "../lib/editions.js";
import { useCoverPalette } from "../lib/coverPalette.js";

const getAccentColor = (color) => {
  const colorMap = {
    red: '#ef4444',
    blue: '#3b82f6',
    purple: '#a855f7',
    green: '#22c55e',
    orange: '#f97316',
    pink: '#ec4899',
    yellow: '#eab308',
    gray: '#9ca3af',
    grey: '#9ca3af',
  };
  return colorMap[color?.toLowerCase()];
};

const ArtistPage = () => {
  const { artistName } = useParams();
  const { t, language } = useLanguage();
  const [hoveredId, setHoveredId] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [infoClosing, setInfoClosing] = useState(false);
  // the popup animates out before it is unmounted (animation classes in index.css)
  const closeInfo = () => {
    setInfoClosing(true);
    setTimeout(() => { setShowInfo(false); setInfoClosing(false); }, 220);
  };

  useEffect(() => {
    if (!showInfo) return;
    const onKeyDown = (e) => { if (e.key === "Escape") closeInfo(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showInfo]);
  const [hoveredAlbumId, setHoveredAlbumId] = useState(null);
  const [bannerError, setBannerError] = useState(false);
  const [profileError, setProfileError] = useState(false);

  const normalizedAlbums = albums.map(album => {
    let artistArray = [];

    if (Array.isArray(album.artist)) {
      artistArray = album.artist.filter(Boolean).map(a => String(a).trim());
    } else if (typeof album.artist === 'string') {
      artistArray = album.artist.split(/[&,]/).map(a => a.trim()).filter(Boolean);
    } else {
      artistArray = [String(album.artist)];
    }

    return {
      ...album,
      artist: artistArray
    };
  });

  const artistAlbums = normalizedAlbums.filter(album => {
    const artistNames = album.artist.map(a =>
      String(a)
        .toLowerCase()
        .replace(/,/g, '')
        .replace(/\$/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '')
    );
    return artistNames.includes(artistName);
  });

  let displayArtist = "Artist";
  for (const album of artistAlbums) {
    for (const artistInAlbum of album.artist) {
      const slug = String(artistInAlbum)
        .toLowerCase()
        .replace(/,/g, '')
        .replace(/\$/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      if (slug === artistName) {
        displayArtist = artistInAlbum;
        break;
      }
    }
    if (displayArtist !== "Artist") break;
  }

  const artist = displayArtist;
  usePageTitle(artist !== "Artist" ? artist : null);
  const artistProfile = artistProfiles[artist] || {};

  const urlParams = new URLSearchParams(window.location.search);
  const bannerFromUrl = urlParams.get('banner');
  const profileFromUrl = urlParams.get('profile');

  const artistBanner = bannerFromUrl || artistProfile.banner;
  const artistProfileImage = profileFromUrl || artistProfile.profileImage;
  // the page takes on the banner's colours (see lib/coverPalette.js), like the album page does with its cover
  const palette = useCoverPalette(artistBanner);

  if (artistAlbums.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{t.artistNotFound}</h1>
          <Link to="/" className="text-primary hover:underline">
            ← {t.backHome}
          </Link>
        </div>
      </div>
    );
  }

  // one entry per record: its vinyl/CD/cassette editions share a single album page
  const sortedAlbums = groupEditions(artistAlbums).map((g) => g.primary).sort((a, b) => b.year - a.year);
  const latestAlbum = sortedAlbums[0];

  return (
    <div className="min-h-screen bg-background text-foreground artist-page relative isolate">
      {palette && (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none cover-backdrop" aria-hidden="true">
          <div className="absolute inset-0 [.light_&]:hidden" style={{ backgroundColor: palette.base }} />
          <div
            className="absolute inset-x-0 top-0 h-[1100px] [.light_&]:opacity-40"
            style={{
              backgroundImage: [
                `radial-gradient(55% 42% at 14% 40%, ${palette.blobs[0]}, transparent 72%)`,
                `radial-gradient(48% 38% at 84% 34%, ${palette.blobs[1]}, transparent 72%)`,
                `radial-gradient(75% 50% at 52% 62%, ${palette.blobs[2]}, transparent 78%)`,
              ].join(', '),
              WebkitMaskImage: 'linear-gradient(to bottom, #000 55%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, #000 55%, transparent 100%)',
            }}
          />
        </div>
      )}
      <div className="relative">
        <div
          className="absolute inset-0 h-[500px] overflow-hidden"
          style={palette ? {
            // dissolve the banner into the page's colours instead of ending on a hard edge
            WebkitMaskImage: 'linear-gradient(to bottom, #000 50%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, #000 50%, transparent 100%)',
          } : undefined}
        >
          {artistBanner && !bannerError ? (
            <>
              <img
                src={artistBanner}
                alt={`${artist} banner`}
                className="w-full h-full object-cover"
                onError={() => setBannerError(true)}
              />
              {/* the banner fades into the page: its own colour in dark theme, the plain background in light */}
              <div className={`absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background ${palette ? "hidden [.light_&]:block" : ""}`} />
              {palette && (
                <div
                  className="absolute inset-0 [.light_&]:hidden"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, color-mix(in srgb, ${palette.base} 30%, transparent), color-mix(in srgb, ${palette.base} 60%, transparent))`,
                  }}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-muted via-card to-background" />
          )}
        </div>

        <div className="absolute top-6 left-6 z-20">
          <Link to="/">
            <Button
              variant="ghost"
              className="backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Button>
          </Link>
        </div>

        <div className="relative pt-64 sm:pt-80 pb-8 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 sm:gap-6">
              {artistProfileImage && !profileError && (
                <div className="relative vinyl-record-container shrink-0">
                  <img
                    src={artistProfileImage}
                    alt={artist}
                    className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-background shadow-2xl"
                    onError={() => setProfileError(true)}
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-2 drop-shadow-lg">
                    {artist}
                  </h1>
                  <button
                    onClick={() => setShowInfo(true)}
                    className="lg-btn lg-btn-lib lg-btn-clear mt-3 w-11 h-11 rounded-full bg-secondary/70 text-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors flex-shrink-0"
                    aria-label={t.description}
                    aria-haspopup="dialog"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {latestAlbum && (
        <div className="px-4 sm:px-8 py-8 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">{t.latestRelease}</h2>
          <Link
            to={`/album/${latestAlbum.id}`}
            className="block group"
            onMouseEnter={() => setHoveredAlbumId(latestAlbum.id)}
            onMouseLeave={() => setHoveredAlbumId(null)}
          >
            <div className="flex items-center gap-4 sm:gap-6 p-2 sm:p-4 rounded-lg hover:bg-muted/50 transition-all">
              <div className="relative w-28 h-28 sm:w-40 sm:h-40 flex-shrink-0">
                {latestAlbum.image ? (
                  <img loading="lazy" decoding="async"
                    src={Array.isArray(latestAlbum.image) ? latestAlbum.image[0] : latestAlbum.image}
                    alt={latestAlbum.title}
                    className="w-full h-full object-cover rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="w-full h-full bg-card rounded-lg flex items-center justify-center">
                    {latestAlbum.format === "cd" ? (
                      <CDDisc size="sm" spinning={hoveredAlbumId === latestAlbum.id} />
                    ) : latestAlbum.format === "cassette" ? (
                      <CassetteTape
                        size="sm"
                        spinning={hoveredAlbumId === latestAlbum.id}
                        cassetteColor={latestAlbum.cassetteColor || "black"}
                      />
                    ) : (
                      <VinylRecord
                        size="sm"
                        spinning={hoveredAlbumId === latestAlbum.id}
                        vinylColor={latestAlbum.vinylColor || "black"}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">
                  {latestAlbum.year}
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <h3
                    className={`text-xl sm:text-2xl font-bold text-foreground transition-all ${hoveredAlbumId === latestAlbum.id ? 'underline' : ''}`}
                    style={{
                      color: hoveredAlbumId === latestAlbum.id
                        ? getAccentColor(latestAlbum.accentColor)
                        : undefined
                    }}
                  >
                    {displayTitle(latestAlbum)}
                  </h3>
                  {latestAlbum.isExplicit && (
                    <span className="text-sm font-bold px-2.5 py-1 bg-gray-400 text-black border border-border rounded flex-shrink-0 select-none">
                      E
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      <div className="px-4 sm:px-8 py-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">{t.discography}</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {sortedAlbums.map((album) => (
            <Link
              key={album.id}
              to={`/album/${album.id}`}
              className="group relative min-w-0"
              onMouseEnter={() => setHoveredId(album.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {album.isNew && (
                <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full z-10">
                  {t.newBadge}
                </span>
              )}

              <div className="relative h-40 flex items-center justify-center mb-4 vinyl-record-container">
                {album.image ? (
                  <div className="absolute inset-0 flex items-center justify-start pl-2">
                    <div className="w-40 h-40 rounded-lg overflow-hidden shadow-xl">
                      <img loading="lazy" decoding="async"
                        src={Array.isArray(album.image) ? album.image[0] : album.image}
                        alt={`${displayTitle(album)} cover`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : null}
                <div
                  className={`relative transition-transform duration-500 ease-out ${
                    hoveredId === album.id ? "translate-x-12" : "translate-x-0"
                  }`}
                  style={{ marginLeft: "10px" }}
                >
                  {album.format === "cd" ? (
                    <CDDisc size="sm" spinning={hoveredId === album.id} />
                  ) : album.format === "cassette" ? (
                    <CassetteTape
                      size="sm"
                      spinning={hoveredId === album.id}
                      cassetteColor={album.cassetteColor || "black"}
                    />
                  ) : (
                    <VinylRecord
                      size="sm"
                      spinning={hoveredId === album.id}
                      vinylColor={album.vinylColor || "black"}
                    />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`min-w-0 break-words font-serif text-lg sm:text-xl font-bold text-foreground transition-all ${hoveredId === album.id ? 'underline' : ''}`}
                    style={{
                      color: hoveredId === album.id
                        ? getAccentColor(album.accentColor)
                        : undefined
                    }}
                  >
                    {displayTitle(album)}
                  </h3>
                  {album.isExplicit && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-gray-400 text-black border border-border rounded flex-shrink-0 select-none">
                      E
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{album.year}</p>
                <p className="text-sm text-muted-foreground mt-1">{album.price} ₼</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showInfo && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 ${infoClosing ? "details-out" : "details-in"}`}
          onClick={closeInfo}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={artist}
            onClick={(e) => e.stopPropagation()}
            className={`glass-panel relative bg-background border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${palette ? "[.light_&]:text-foreground text-white [&_.text-muted-foreground]:text-white/70 [.light_&_.text-muted-foreground]:!text-muted-foreground [&_.bg-secondary]:bg-white/15" : ""}`}
          >
            {palette && (
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none [.light_&]:opacity-40"
                style={{
                  backgroundColor: palette.base,
                  backgroundImage: `radial-gradient(90% 80% at 0% 0%, ${palette.blobs[0]}, transparent 70%), radial-gradient(80% 70% at 100% 25%, ${palette.blobs[1]}, transparent 70%), radial-gradient(90% 80% at 40% 110%, ${palette.blobs[2]}, transparent 70%)`,
                }}
              />
            )}
            <div className="relative p-8">
              <div className="flex items-center gap-4 mb-6">
                {artistProfileImage && !profileError && (
                  <img
                    src={artistProfileImage}
                    alt={artist}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold">{artist}</h2>
                  <span className="inline-block mt-1 px-3 py-1 bg-secondary rounded-full text-xs text-muted-foreground">
                    {artistAlbums[0]?.genre || t.music}
                  </span>
                </div>
              </div>

              <div className="flex gap-10 mb-6">
                <div>
                  <p className="text-2xl font-serif font-bold">{artistAlbums.length}</p>
                  <p className="text-xs text-muted-foreground">{t.albumsWord}</p>
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold">{latestAlbum?.year}</p>
                  <p className="text-xs text-muted-foreground">{t.latestRelease}</p>
                </div>
              </div>

              {(artistProfile.birthDate || artistProfile.country) && (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 text-sm">
                  {artistProfile.birthDate && (
                    <div>
                      <dt className="text-xs text-muted-foreground">{t.bornLabel}</dt>
                      <dd className="font-medium">{localizeReleaseDate(artistProfile.birthDate, language)}</dd>
                    </div>
                  )}
                  {artistProfile.country && (
                    <div>
                      <dt className="text-xs text-muted-foreground">{t.countryLabel}</dt>
                      <dd className="font-medium">{localizeText(artistProfile.country, language)}</dd>
                    </div>
                  )}
                </dl>
              )}

              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {t.description}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {artistProfile.description
                  ? localizeText(artistProfile.description, language)
                  : t.artistNoDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="h-20" />
    </div>
  );
};

export default ArtistPage;