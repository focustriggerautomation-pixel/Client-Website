import { useEffect, useMemo, useRef, useState } from 'react';
import { QrCode } from '../components/QrCode.tsx';
import { loadCafe } from '../config/registry.ts';
import type { CafeConfig } from '../config/schema.ts';

/** Phone frame (CSS px): an iPhone-sized viewport plus the bezel. */
const SCREEN = { w: 390, h: 844 };
const BEZEL = 14;
/** iOS status bar: the site starts below it, as in a real phone browser. */
const STATUS_BAR = 47;

/** `?preview=mobile` is a desktop tool; on a phone or narrow window the plain site is shown instead. */
// keep in sync with the inline script in scripts/postbuild.ts (it drops the prerendered page for this view)
export const PREVIEW_MIN_WIDTH = 760;
export const wantsPhonePreview = () =>
  new URLSearchParams(window.location.search).get('preview') === 'mobile' && window.innerWidth >= PREVIEW_MIN_WIDTH;

/**
 * /<slug>?preview=mobile — the live site inside a phone frame, for screen-sharing on a call: the client sees
 * exactly what their customers will see on a phone. Includes a replay button for the intro and a QR code so they
 * can open it on their own phone right away. Other query params (e.g. ?mood=) are passed through to the site.
 */
export function PhonePreview({ slug }: { slug: string }) {
  const [cafe, setCafe] = useState<CafeConfig | null>(null);
  const [key, setKey] = useState(0);
  const [scale, setScale] = useState(1);
  const frame = useRef<HTMLIFrameElement>(null);
  const [bar, setBar] = useState({ bg: '#000', fg: '#fff' });
  // The status bar takes the page's own background colour, like Safari does.
  const onLoad = () => {
    try {
      const doc = frame.current?.contentDocument;
      if (!doc) return;
      const opaque = (c: string) => c && !/rgba\(.*,\s*0\)|transparent/.test(c);
      const bodyBg = getComputedStyle(doc.body).backgroundColor;
      const bg = opaque(bodyBg) ? bodyBg : getComputedStyle(doc.documentElement).backgroundColor;
      const [r, g, b] = (bg.match(/\d+/g) ?? ['0', '0', '0']).map(Number);
      setBar({ bg, fg: 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#000' : '#fff' });
    } catch {
      /* cross-origin: keep the default */
    }
  };

  const src = useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    q.delete('preview');
    const s = q.toString();
    return `/${slug}${s ? `?${s}` : ''}${window.location.hash}`;
  }, [slug]);
  const shareUrl = `${window.location.origin}/${slug}`;

  useEffect(() => {
    loadCafe(slug).then(({ config }) => {
      setCafe(config);
      document.title = `${config.name} — phone preview`;
    });
  }, [slug]);

  // Scale the phone down to fit short screens (laptops), never up.
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 48) / (SCREEN.h + BEZEL * 2)));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const replay = () => {
    try {
      sessionStorage.removeItem(`intro-seen:${slug}`);
    } catch {
      /* ignore */
    }
    setKey((k) => k + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement)) replay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const primary = cafe?.brand.primary ?? '#888';
  return (
    <main
      className="fixed inset-0 flex items-center justify-center gap-14 overflow-hidden bg-[#111] font-body text-[#f2f2f2]"
      style={{ backgroundImage: `radial-gradient(60% 70% at 35% 50%, ${primary}55, transparent 70%)` }}
    >
      <div
        style={{ width: (SCREEN.w + BEZEL * 2) * scale, height: (SCREEN.h + BEZEL * 2) * scale }}
        className="shrink-0"
      >
        <div
          className="relative origin-top-left rounded-[58px] bg-[#0a0a0a] shadow-[0_40px_120px_-20px_rgba(0,0,0,.8),inset_0_0_0_2px_#333]"
          style={{
            width: SCREEN.w + BEZEL * 2,
            height: SCREEN.h + BEZEL * 2,
            padding: BEZEL,
            transform: `scale(${scale})`,
          }}
        >
          <div className="overflow-hidden rounded-[44px]" style={{ background: bar.bg }}>
            <div
              aria-hidden
              className="flex items-center justify-between px-8 pt-1 text-[15px] font-semibold"
              style={{ height: STATUS_BAR, color: bar.fg }}
            >
              <span className="w-12 text-center">9:41</span>
              <span className="flex items-center gap-1.5">
                <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor">
                  <rect x="0" y="7" width="3" height="4" rx="1" />
                  <rect x="5" y="5" width="3" height="6" rx="1" />
                  <rect x="10" y="2.5" width="3" height="8.5" rx="1" />
                  <rect x="15" y="0" width="3" height="11" rx="1" />
                </svg>
                <svg width="25" height="12" viewBox="0 0 25 12" fill="none" stroke="currentColor">
                  <rect x="0.5" y="0.5" width="21" height="11" rx="3" opacity=".4" />
                  <rect x="2" y="2" width="17" height="8" rx="1.5" fill="currentColor" stroke="none" />
                  <path d="M23.5 4v4" strokeLinecap="round" opacity=".5" />
                </svg>
              </span>
            </div>
            <iframe
              key={key}
              ref={frame}
              src={src}
              onLoad={onLoad}
              title={cafe ? `${cafe.name} website on a phone` : 'Website on a phone'}
              width={SCREEN.w}
              height={SCREEN.h - STATUS_BAR}
              className="block"
            />
          </div>
          {/* the camera island */}
          <div
            aria-hidden
            className="absolute left-1/2 top-[25px] h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black"
          />
        </div>
      </div>

      <aside className="hidden w-64 shrink-0 lg:block">
        <p className="text-[13px] uppercase tracking-[0.18em] text-white/55">Phone preview</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight">{cafe?.name ?? ' '}</h1>
        <button
          type="button"
          onClick={replay}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-medium text-black hover:bg-white/85"
        >
          ↻ Replay intro <kbd className="ml-1 rounded bg-black/10 px-1.5 text-[12px]">R</kbd>
        </button>
        <div className="mt-10">
          <QrCode url={shareUrl} label={`QR code for ${shareUrl}`} className="w-44" />
          <p className="mt-3 text-[14px] leading-snug text-white/70">Scan to open it on your own phone</p>
          <a href={src} className="mt-1 block break-all text-[13px] text-white/50 underline-offset-2 hover:underline">
            {shareUrl.replace(/^https?:\/\//, '')}
          </a>
        </div>
      </aside>
    </main>
  );
}
