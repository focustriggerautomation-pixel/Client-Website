import { hasCafe } from './config/registry.ts';
import { CafePage } from './pages/CafePage.tsx';
import { IndexPage } from './pages/IndexPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

/** Two routes only: "/" (private index) and "/<slug>". */
export function App() {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '' || path === '/index.html') return <IndexPage />;
  const slug = path.slice(1).split('/')[0];
  if (path === `/${slug}` && hasCafe(slug)) return <CafePage slug={slug} />;
  return <NotFoundPage />;
}
