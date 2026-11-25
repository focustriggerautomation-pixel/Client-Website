import { useLayoutEffect } from 'react';
import { hasCafe, type LoadedCafe } from './config/registry.ts';
import { CafePage } from './pages/CafePage.tsx';
import { IndexPage } from './pages/IndexPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { PhonePreview, wantsPhonePreview } from './pages/PhonePreview.tsx';

/** Two routes only: "/" (private index) and "/<slug>" (+ "?preview=mobile": the phone-frame view on desktop). */
export function App({ initial }: { initial?: LoadedCafe } = {}) {
  // Marks the prerendered first screen as taken over by the app (tests and tooling key off it).
  useLayoutEffect(() => document.getElementById('root')?.removeAttribute('data-shell'));
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '' || path === '/index.html') return <IndexPage />;
  const slug = path.slice(1).split('/')[0];
  if (path === `/${slug}` && hasCafe(slug) && wantsPhonePreview()) return <PhonePreview slug={slug} />;
  if (path === `/${slug}` && hasCafe(slug))
    return <CafePage slug={slug} initial={initial?.config.slug === slug ? initial : undefined} />;
  return <NotFoundPage />;
}
