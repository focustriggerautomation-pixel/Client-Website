const { chromium } = require('playwright');
const [,, slug, mode = 'mobile', query = ''] = process.argv;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext(mode === 'mobile'
    ? { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36' }
    : { viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<body style="margin:0;background:#cfd8cf"></body>' }));
  await p.addInitScript(() => {
    window.__frames = []; window.__long = []; window.__intro = {};
    const loop = (t) => { window.__frames.push([t, window.scrollY]); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push([e.startTime, e.duration, window.scrollY]))).observe({ type: 'longtask', buffered: true }); } catch {}
    new MutationObserver(() => {
      const el = document.querySelector('[data-intro]');
      if (el && !window.__intro.shown) window.__intro.shown = performance.now();
      if (!el && window.__intro.shown && !window.__intro.gone) window.__intro.gone = performance.now();
    }).observe(document, { childList: true, subtree: true });
  });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto(`http://localhost:4173/${slug}${query}`);
  await p.waitForSelector('main section', { timeout: 30000 });
  await p.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 15000 });
  await p.waitForTimeout(2500); // hero timeline
  // 3D hero: wait until it has loaded and decided (3D or fallback), so scroll is measured on its own
  await p.waitForFunction(() => { const s = document.querySelector('[data-hero3d]'); return !s || s.dataset.hero3d !== 'loading'; }, null, { timeout: 30000 }).catch(() => {});
  const h3d = await p.evaluate(() => document.querySelector('[data-hero3d]')?.dataset.hero3d ?? 'none');
  const stats = (frames, long) => {
    const d = []; for (let i = 1; i < frames.length; i++) d.push(frames[i][0] - frames[i - 1][0]);
    const s = [...d].sort((a, b) => a - b);
    return { frames: d.length, jank25: d.filter((x) => x > 25).length, jank50: d.filter((x) => x > 50).length, p95: +(s[Math.floor(s.length * 0.95)] || 0).toFixed(1), worst: +(s[s.length - 1] || 0).toFixed(1), longTasks: long.length, longMax: Math.round(Math.max(0, ...long.map((l) => l[1]))) };
  };
  const intro = await p.evaluate(() => ({ introMs: window.__intro.shown ? Math.round(window.__intro.gone - window.__intro.shown) : null }));
  const load = await p.evaluate(() => ({ frames: window.__frames, long: window.__long }));
  console.log(`${slug} ${mode}${query} | intro+hero+3d-setup (hero3d=${h3d})`, JSON.stringify({ ...intro, ...stats(load.frames, load.long) }));

  // Scroll the whole page with real scroll gestures (touch on mobile, wheel on desktop → Lenis).
  await p.evaluate(() => { window.__frames = []; window.__long = []; });
  for (let i = 0; i < 80; i++) {
    const done = await p.evaluate(() => window.scrollY + innerHeight >= document.documentElement.scrollHeight - 4);
    if (done) break;
    if (mode === 'mobile') await cdp.send('Input.synthesizeScrollGesture', { x: 200, y: 700, yDistance: -650, speed: 1600, gestureSourceType: 'default' });
    else { await p.mouse.move(700, 500); for (let k = 0; k < 6; k++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(16); } await p.waitForTimeout(120); }
  }
  await p.waitForTimeout(800);
  const run = await p.evaluate(() => {
    const secs = [...document.querySelectorAll('main > section, footer')].map((s) => ({ id: s.id || 'footer', top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight }));
    // a pinned section's spacer extends its scroll range
    document.querySelectorAll('.pin-spacer').forEach((sp) => { const sec = sp.closest('section'); const x = secs.find((s) => s.id === sec?.id); if (x) x.h = Math.max(x.h, sp.getBoundingClientRect().bottom + scrollY - x.top); });
    return { frames: window.__frames, long: window.__long, secs, mid: innerHeight / 2 };
  });
  console.log(`${slug} ${mode}${query} | full scroll`, JSON.stringify(stats(run.frames, run.long)));
  const by = {};
  for (let i = 1; i < run.frames.length; i++) {
    const dt = run.frames[i][0] - run.frames[i - 1][0]; const y = run.frames[i][1] + run.mid;
    const sec = run.secs.filter((s) => y >= s.top).pop()?.id ?? 'top';
    (by[sec] ??= { frames: 0, jank25: 0, worst: 0 }); by[sec].frames++; if (dt > 25) by[sec].jank25++; by[sec].worst = Math.max(by[sec].worst, Math.round(dt));
  }
  console.log('   per section:', Object.entries(by).map(([k, v]) => `${k} ${v.jank25}/${v.frames} worst ${v.worst}ms`).join(' | '));
  await b.close();
})();
