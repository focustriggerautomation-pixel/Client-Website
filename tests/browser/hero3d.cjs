/**
 * Hero 3D: forced fallbacks, lazy loading, pausing and DPR cap.
 * Usage: node tests/browser/hero3d.cjs [baseUrl]   (needs `npm run preview` and Playwright)
 */
const { chromium } = require('playwright');
const B = process.argv[2] || 'http://localhost:4173';
const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m);
const GL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

async function open(b, url, { init, ctx: ctxOpts = {} } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, ...ctxOpts });
  const p = await ctx.newPage();
  const chunks = [];
  const errors = [];
  p.on('request', (r) => /\/assets\/Scene-.*\.js$/.test(r.url()) && chunks.push(Date.now()));
  p.on('pageerror', (e) => errors.push(e.message));
  await p.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, body: '' }));
  if (init) await p.addInitScript(init);
  await p.addInitScript(() => {
    window.__long = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(e.startTime))).observe({ type: 'longtask', buffered: true });
  });
  await p.goto(B + url);
  await p.waitForSelector('main section');
  return { ctx, p, chunks, errors };
}
const settle = (p) =>
  p.waitForFunction(() => !['loading', undefined].includes(document.querySelector('[data-hero3d]')?.dataset.hero3d), null, { timeout: 30000 });
const state = (p) => p.evaluate(() => document.querySelector('[data-hero3d]')?.dataset.hero3d);
const fallbackShown = (p) =>
  p.evaluate(() => {
    const s = document.querySelector('[data-hero3d]');
    return !!s.querySelector('svg') && getComputedStyle(s.firstElementChild).opacity === '1' && !s.querySelector('canvas');
  });

(async () => {
  const b = await chromium.launch({ args: GL_ARGS });

  // 1–4: fallbacks decided before anything downloads
  const cases = [
    ['?hero3d=fallback', 'fallback:forced', null],
    ['', 'fallback:low-cpu', () => Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 })],
    ['', 'fallback:low-memory', () => Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 })],
    [
      '',
      'fallback:no-webgl',
      () => {
        const g = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (t, ...a) {
          return /webgl/.test(t) ? null : g.call(this, t, ...a);
        };
      },
    ],
  ];
  for (const [q, want, init] of cases) {
    const { ctx, p, chunks, errors } = await open(b, '/nocturne-coffee' + q, { init });
    await p.waitForTimeout(4000);
    const s = await state(p);
    ok(
      s === want && (await fallbackShown(p)) && chunks.length === 0 && !errors.length,
      `${want}: illustration shown, 3D chunk never downloaded (state=${s}, chunk requests=${chunks.length})`,
    );
    await ctx.close();
  }

  // 5: reduced motion → static illustration, no running animations, no 3D
  {
    const { ctx, p, chunks } = await open(b, '/sunday-crumb', { ctx: { reducedMotion: 'reduce' } });
    await p.waitForTimeout(3000);
    const anims = await p.evaluate(() => document.querySelector('[data-hero3d] svg').getAnimations({ subtree: true }).length);
    ok(
      (await state(p)) === 'fallback:reduced-motion' && anims === 0 && chunks.length === 0,
      `reduced motion: static illustration (${anims} running animations), no 3D chunk`,
    );
    await ctx.close();
  }

  // 6: lazy loading + natural low-fps fallback (software WebGL here is slow once composited)
  {
    const { ctx, p, chunks, errors } = await open(b, '/tamarind-house');
    const t0 = Date.now();
    const h1Visible = await p.evaluate(() => {
      const h = document.querySelector('#top h1');
      return !!h && h.textContent.length > 0;
    });
    await settle(p);
    const s = await state(p);
    void t0;
    // In the page's own clock: when did the hero first paint, when did the 3D chunk start downloading, when did 3D mount?
    const tl = await p.evaluate(() => ({
      fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? -1),
      chunk: Math.round(performance.getEntriesByType('resource').find((e) => /\/assets\/Scene-/.test(e.name))?.startTime ?? -1),
    }));
    ok(
      h1Visible && tl.fcp > 0 && tl.chunk > tl.fcp && chunks.length === 1,
      `lazy: hero painted at ${tl.fcp}ms, 3D chunk fetched from ${tl.chunk}ms (after first paint, in idle time)`,
    );
    ok(
      s === 'fallback:low-fps' || /^3d/.test(s),
      `automatic path settles (state=${s}${s === 'fallback:low-fps' ? ' — software WebGL measured below 30fps' : ''})`,
    );
    if (s === 'fallback:low-fps') ok((await fallbackShown(p)) && !errors.length, 'low-fps: canvas removed, illustration kept');
    await ctx.close();
  }

  // 7: forced 3D renders, pauses off-screen / hidden tab, DPR capped on phones
  {
    const { ctx, p, errors } = await open(b, '/nocturne-coffee?hero3d=3d', { ctx: { deviceScaleFactor: 3, isMobile: true, hasTouch: true } });
    await settle(p);
    ok((await state(p)) === '3d', 'forced 3D renders (?hero3d=3d)');
    const dpr = await p.evaluate(() => {
      const c = document.querySelector('[data-hero3d] canvas');
      return +(c.width / c.clientWidth).toFixed(2);
    });
    ok(dpr <= 1.5, `DPR capped on a 3× phone: canvas renders at ${dpr}×`);
    const rate = async () => {
      await p.evaluate(() => (window.__long = []));
      await p.waitForTimeout(2000);
      return p.evaluate(() => window.__long.length);
    };
    const onScreen = await rate();
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
    await p.waitForTimeout(600);
    const offScreen = await rate();
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(600);
    await p.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const hidden = await rate();
    ok(
      onScreen > 3 && offScreen <= 1 && hidden <= 1,
      `rendering pauses: render-bound long tasks per 2s — on screen ${onScreen}, scrolled away ${offScreen}, tab hidden ${hidden}`,
    );
    ok(!errors.length, 'no page errors ' + errors.join('; '));
    await ctx.close();
  }
  await b.close();
})();
