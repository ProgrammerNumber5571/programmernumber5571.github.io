// Picks up new deploys on browsers that cached an old copy of the site.
//
// GitHub Pages lets browsers reuse index.html for 10 minutes without asking (Cache-Control:
// max-age=600), and iOS Safari happily keeps showing the previous build after a deploy. Every build
// therefore publishes /version.json with its build id; here we fetch it (bypassing the cache) and, if
// it differs from the build that is running, reload once so the visitor lands on the new version.
//
// Checks run when the app opens and when the visitor comes back to the tab after a while. A
// sessionStorage flag stops it from ever reloading twice for the same version (no reload loops).

const FLAG = 'updateReloadedFor';
const AWAY_BEFORE_RECHECK_MS = 30 * 1000;

async function latestBuildId() {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.id === 'string' ? data.id : null;
  } catch {
    return null; // offline or no version file: stay on the current build
  }
}

async function check() {
  const latest = await latestBuildId();
  if (!latest || latest === __BUILD_ID__) return;
  try {
    if (sessionStorage.getItem(FLAG) === latest) return; // already tried for this version
    sessionStorage.setItem(FLAG, latest);
  } catch {
    return; // can't remember the attempt, so don't risk a reload loop
  }
  location.reload();
}

export function initUpdateCheck() {
  if (import.meta.env.DEV) return;
  check();

  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
    } else if (hiddenAt && Date.now() - hiddenAt > AWAY_BEFORE_RECHECK_MS) {
      hiddenAt = 0;
      check();
    }
  });
}
