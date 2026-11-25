import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const CAFES_DIR = path.resolve(import.meta.dirname, 'cafes');

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
};

/**
 * Dev only: serve /<slug>/images/<file> straight from /cafes/<slug>/images/<file>,
 * matching the URLs the production build produces (scripts/postbuild.ts copies them).
 */
function cafeImagesDevServer(): Plugin {
  return {
    name: 'cafe-images-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /^\/([a-z0-9-]+)\/images\/([A-Za-z0-9._-]+)$/.exec((req.url ?? '').split('?')[0]);
        if (!m) return next();
        const file = path.join(CAFES_DIR, m[1], 'images', m[2]);
        if (!file.startsWith(CAFES_DIR + path.sep) || !existsSync(file) || !statSync(file).isFile()) return next();
        res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        createReadStream(file).pipe(res);
      });
    },
  };
}

/**
 * `vite preview` only: behave like Vercel — /<slug> serves dist/<slug>/index.html,
 * unknown paths get dist/404.html with a 404 status (instead of the SPA fallback).
 */
function staticPagesPreview(): Plugin {
  return {
    name: 'static-pages-preview',
    configurePreviewServer(server) {
      const dist = path.resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '/').split('?')[0];
        if (url === '/' || path.extname(url)) return next();
        const page = path.join(dist, url.replace(/\/+$/, ''), 'index.html');
        const notFound = path.join(dist, '404.html');
        const file = page.startsWith(dist + path.sep) && existsSync(page) ? page : existsSync(notFound) ? notFound : null;
        if (!file) return next();
        res.statusCode = file === notFound ? 404 : 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), cafeImagesDevServer(), staticPagesPreview()],
  server: {
    // Configs live outside src/ — allow Vite to watch and import them.
    fs: { allow: ['.'] },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
