import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VARIANT_RE } from './src/config/images.ts';
import { loadCafeFromDisk } from './scripts/lib/cafes.ts';
import { readImageManifest, renderVariant } from './scripts/lib/images.ts';
import { CafeConfigError } from './src/config/model.ts';

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
 * `import('/cafes/<slug>/config.json?cafe')` → { config, images }, where
 * `images` holds the intrinsic size of every image (for width/height + srcset).
 */
function cafeConfigModule(): Plugin {
  return {
    name: 'cafe-config-module',
    enforce: 'pre',
    load(id) {
      const m = /^(.*\/cafes\/([^/]+))\/config\.json\?cafe$/.exec(id);
      if (!m) return null;
      const [, dir, slug] = m;
      this.addWatchFile(path.join(dir, 'config.json'));
      // Validate here, in Node (zod never ships to the browser): defaults applied, or readable problems for the
      // dev error page. Production builds never get here with an invalid config (`npm run check` runs first).
      let config: unknown = null;
      let problems: string[] = [];
      try {
        config = loadCafeFromDisk(slug).config;
      } catch (e) {
        if (!(e instanceof CafeConfigError)) throw e;
        problems = e.problems;
      }
      // Emit JS explicitly: with the ?cafe query the bundler would not treat this as JSON.
      return { code: `export default ${JSON.stringify({ config, images: readImageManifest(dir), problems })};`, moduleType: 'js' };
    },
  };
}

/**
 * Dev only: serve /<slug>/images/<file> straight from /cafes/<slug>/images/<file>,
 * and render /<slug>/images/_r/<file>.<w>w.webp variants on the fly —
 * the same URLs the production build produces (scripts/postbuild.ts).
 */
function cafeImagesDevServer(): Plugin {
  const cache = new Map<string, Buffer>();
  return {
    name: 'cafe-images-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /^\/([a-z0-9-]+)\/(images\/.+)$/.exec((req.url ?? '').split('?')[0]);
        if (!m) return next();
        const [, slug, rel] = m;
        const variant = VARIANT_RE.exec(rel);
        const file = path.join(CAFES_DIR, slug, 'images', variant ? variant[1] : rel.slice('images/'.length));
        if (!file.startsWith(CAFES_DIR + path.sep) || !existsSync(file) || !statSync(file).isFile()) return next();

        if (variant) {
          const format = variant[3] as 'avif' | 'webp';
          const key = `${file}@${variant[2]}@${format}@${statSync(file).mtimeMs}`;
          const hit = cache.get(key);
          const send = (buf: Buffer) => {
            res.setHeader('Content-Type', `image/${format}`);
            res.setHeader('Cache-Control', 'no-cache');
            res.end(buf);
          };
          if (hit) return send(hit);
          renderVariant(file, Number(variant[2]), format).then((buf) => {
            cache.set(key, buf);
            send(buf);
          }, next);
          return;
        }
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
  plugins: [react(), tailwindcss(), cafeConfigModule(), cafeImagesDevServer(), staticPagesPreview()],
  server: {
    // Configs live outside src/ — allow Vite to watch and import them.
    fs: { allow: ['.'] },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
