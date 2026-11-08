// Shared SVG displacement filter for the liquid-glass buttons (same technique as
// liquid-glass.pro / @tinymomentum/liquid-glass-react, which itself crashes on React 18).
// Mounted once in App.jsx; the glass itself is drawn by index.css on `.lg-btn-lib`.
export function GlassFilter() {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }} focusable="false">
      <defs>
        <filter id="lg-lib-distortion" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves={2} seed={92} result="noise" />
          <feGaussianBlur in="noise" stdDeviation={2} result="blurred" />
          <feDisplacementMap in="SourceGraphic" in2="blurred" scale={14} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
