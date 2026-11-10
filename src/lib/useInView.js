import { useEffect, useRef, useState } from 'react';

// True while the element is on screen (with a small margin). Used to stop videos and endless CSS
// animations that nobody can see, so they don't keep repainting while the page is scrolled past them.
export function useInView(margin = '100px') {
  const ref = useRef(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return [ref, inView];
}

// Plays or pauses every <video> inside the element to match `playing`.
export function useVideoPlayback(ref, playing) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll('video').forEach((v) => {
      if (playing) v.play().catch(() => {});
      else v.pause();
    });
  }, [ref, playing]);
}
