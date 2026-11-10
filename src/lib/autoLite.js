// Automatic "lite" mode for browsers that can't keep up with the glass effects.
//
// Backdrop blurs are cheap on a GPU but very expensive when the browser paints on the CPU (hardware
// acceleration switched off, a software renderer, a weak integrated GPU). Those browsers scroll at a
// fraction of the frame rate. So we watch the frame times while the visitor scrolls and, if most
// frames are slow, add `perf-lite` to <html> (index.css then removes every backdrop blur and uses
// solid panels instead). The verdict is remembered, so later visits start in the right mode.
//
//   ?lite=1  forces lite mode on,  ?lite=0  forces it off (and forgets the stored verdict).

const KEY = 'perfLite';
const CLASS = 'perf-lite';
const SLOW_FRAME_MS = 28;
const SAMPLE_FRAMES = 50; // judge after this many scrolling frames
const GIVE_UP_FRAMES = 400; // stop watching once the site has proven it is fast

export function initAutoLite() {
  const html = document.documentElement;
  const store = {
    get: () => {
      try {
        return localStorage.getItem(KEY);
      } catch {
        return null;
      }
    },
    set: (v) => {
      try {
        if (v === null) localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, v);
      } catch {
        /* storage unavailable: the verdict just isn't remembered */
      }
    },
  };

  const forced = new URLSearchParams(location.search).get('lite');
  if (forced === '1') {
    store.set('1');
    html.classList.add(CLASS);
    return;
  }
  if (forced === '0') store.set(null);
  else if (store.get() === '1') {
    html.classList.add(CLASS);
    return;
  }

  let frames = 0;
  let slow = 0;
  let last = 0;
  let raf = 0;
  let idle = 0;

  const tick = (t) => {
    if (last) {
      frames += 1;
      if (t - last > SLOW_FRAME_MS) slow += 1;
      if (frames >= SAMPLE_FRAMES && slow / frames >= 0.3) {
        html.classList.add(CLASS);
        store.set('1');
        stop();
        return;
      }
      if (frames >= GIVE_UP_FRAMES) {
        stop();
        return;
      }
    }
    last = t;
    raf = requestAnimationFrame(tick);
  };

  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(tick);
    clearTimeout(idle);
    idle = setTimeout(() => {
      // scrolling paused: don't count the gap before the next burst as a slow frame
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    }, 150);
  };

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(idle);
    window.removeEventListener('scroll', onScroll);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}
