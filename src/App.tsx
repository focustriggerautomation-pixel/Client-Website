import { useLayoutEffect } from 'react';
import { hasCafe, type LoadedCafe } from './config/registry.ts';
import { CafePage } from './pages/CafePage.tsx';
import { IndexPage } from './pages/IndexPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

/** Two routes only: "/" (private index) and "/<slug>". */
export function App({ initial }: { initial?: LoadedCafe } = {}) {
  // The prerendered shell's CSS (hidden splash name, no-JS splash timeout) stops applying once React has
  // committed — in a layout effect, i.e. after the real intro has set its own start state, before paint.
  useLayoutEffect(() => document.getElementById('root')?.removeAttribute('data-shell'));
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '' || path === '/index.html') return <IndexPage />;
  const slug = path.slice(1).split('/')[0];
  if (path === `/${slug}` && hasCafe(slug))
    return <CafePage slug={slug} initial={initial?.config.slug === slug ? initial : undefined} />;
  return <NotFoundPage />;
}
