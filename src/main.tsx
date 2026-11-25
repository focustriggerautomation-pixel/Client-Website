import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { loadCafe, type LoadedCafe } from './config/registry.ts';
import { CLIENT_ONLY } from './pages/CafeView.tsx';
import 'lenis/dist/lenis.css';
import './index.css';

type ShellWindow = Window & {
  __heroAlreadyVisible?: boolean;
  __shellIntroUntil?: number;
  __shellIntroEnds?: number;
};
const w = window as ShellWindow;
const root = document.getElementById('root')!;
// Inside the ?preview=mobile phone frame: phone-style (hidden) scrollbars.
if (window.top !== window.self) document.documentElement.classList.add('framed');
// A prebuilt cafe page ships its first screen as HTML (src/prerender.tsx). Its intro + hero entrance play as
// CSS from the first paint (scripts/lib/shellIntro.ts), or the hero is shown static; the app must not replay them.
const shell = root.hasAttribute('data-shell');
w.__heroAlreadyVisible = shell;
const slug = location.pathname.split('/')[1];
if (shell && w.__shellIntroUntil) {
  try {
    sessionStorage.setItem(`intro-seen:${slug}`, '1');
  } catch {
    /* ignore */
  }
}

const app = (initial?: LoadedCafe) => (
  <StrictMode>
    <App initial={initial} />
  </StrictMode>
);

async function start() {
  if (!shell) {
    createRoot(root).render(app());
    return;
  }
  // Hydrate: React adopts the prerendered DOM instead of replacing it (no flash, and the browser's
  // "largest paint" stays the first one). It waits for the CSS intro so nothing restarts mid-animation.
  const [data] = await Promise.all([
    loadCafe(slug),
    new Promise((r) => setTimeout(r, Math.max(0, (w.__shellIntroUntil ?? 0) - performance.now()))),
  ]);
  document.getElementById('shell-intro')?.remove();
  // the slowest entrance (e.g. the hero photo's settle) may still be running: drop its CSS only once it ends
  setTimeout(
    () => document.documentElement.classList.remove('shell-intro'),
    Math.max(0, (w.__shellIntroEnds ?? 0) - performance.now()),
  );
  hydrateRoot(root, app(data), {
    // Sections below the hero are rendered in the browser on purpose (see Deferred in CafePage).
    onRecoverableError: (error, info) => {
      const digest = (error as { digest?: string })?.digest ?? (info as { digest?: string })?.digest;
      if (digest !== CLIENT_ONLY) console.error(error);
    },
  });
}

void start();
