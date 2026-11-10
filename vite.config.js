import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Where the catalogue images really live, and the path this site serves them under on Vercel
// (vercel.json proxies /img/* to Cloudinary).
const CLOUDINARY = 'https://res.cloudinary.com/deroy68n9/image/upload/';
const OWN_PATH = '/img/';

// Vercel sets VERCEL=1 during its builds. Only there do image URLs go through our own domain;
// GitHub Pages and the native app builds can't proxy, so they keep the direct Cloudinary URLs.
const useOwnDomain = Boolean(process.env.VERCEL);

// On Vercel, swap the Cloudinary address for /img/ in the source before bundling, so it never
// reaches the built JavaScript or HTML.
function ownImageDomain() {
  return {
    name: 'own-image-domain',
    enforce: 'pre',
    apply: 'build',
    transform(code, id) {
      if (!useOwnDomain || !/\/src\/.*\.(jsx?|tsx?)$/.test(id) || !code.includes(CLOUDINARY)) return null;
      return { code: code.split(CLOUDINARY).join(OWN_PATH), map: null };
    },
    transformIndexHtml(html) {
      if (!useOwnDomain) return html;
      return html.replace(/\s*<link rel="preconnect" href="https:\/\/res\.cloudinary\.com"[^>]*>/, '');
    },
  };
}

export default defineConfig({
  plugins: [react(), ownImageDomain()],
  define: {
    __IMG_PROXY__: JSON.stringify(useOwnDomain),
    __IMG_PREFIX__: JSON.stringify(useOwnDomain ? OWN_PATH : CLOUDINARY),
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  server: {
    fs: {
      allow: ['..']
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks load in parallel and stay cached across deploys
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  }
});
