const { chromium } = require('playwright');
const [,, slug, query = ''] = process.argv;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, body: '' }));
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto(`http://localhost:4173/${slug}${query}`); await p.waitForSelector('main section');
  await p.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 15000 });
  await p.waitForTimeout(2500);
  const events = [];
  cdp.on('Tracing.dataCollected', (d) => events.push(...d.value));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack', transferMode: 'ReportEvents' });
  for (let i = 0; i < 60; i++) { if (await p.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 4)) break; await cdp.send('Input.synthesizeScrollGesture', { x: 200, y: 700, yDistance: -650, speed: 1600, gestureSourceType: 'default' }); }
  await cdp.send('Tracing.end'); await done;
  // main thread of the renderer = thread with most RunTask time named CrRendererMain
  const names = new Map(events.filter((e) => e.name === 'thread_name').map((e) => [`${e.pid}:${e.tid}`, e.args.name]));
  const main = [...names].filter(([, n]) => n === 'CrRendererMain').map(([k]) => k);
  const agg = {}; let maxBy = {};
  for (const e of events) {
    if (e.ph !== 'X' || !main.includes(`${e.pid}:${e.tid}`)) continue;
    if (!['UpdateLayoutTree', 'Layout', 'Paint', 'PrePaint', 'Layerize', 'Commit', 'FunctionCall', 'EventDispatch', 'FireAnimationFrame', 'ScrollLayer', 'UpdateLayer', 'RecalculateStyles', 'HitTest', 'ParseHTML', 'TimerFire', 'IntersectionObserverController::computeIntersections'].includes(e.name)) continue;
    agg[e.name] = (agg[e.name] || 0) + e.dur / 1000; maxBy[e.name] = Math.max(maxBy[e.name] || 0, e.dur / 1000);
  }
  const run = events.filter((e) => e.ph === 'X' && e.name === 'RunTask' && main.includes(`${e.pid}:${e.tid}`));
  const busy = run.reduce((a, e) => a + e.dur / 1000, 0);
  const frames = events.filter((e) => e.name === 'BeginFrame' && main.includes(`${e.pid}:${e.tid}`)).length;
  const over = run.filter((e) => e.dur / 1000 > 16.7).length;
  console.log(`${slug}${query}: main-thread busy ${Math.round(busy)}ms over ${frames} frames; tasks >16.7ms: ${over}`);
  console.log(`${slug}${query}:`, Object.entries(agg).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${Math.round(v)}ms (max ${Math.round(maxBy[k])})`).join(' | '));
  // forced (synchronous) layouts/style recalcs from script
  const forced = events.filter((e) => main.includes(`${e.pid}:${e.tid}`) && (e.name === 'Layout' || e.name === 'UpdateLayoutTree') && e.args?.beginData?.stackTrace?.length);
  const byFn = {}; for (const e of forced) { const f = e.args.beginData.stackTrace[0]; const k = `${e.name} ← ${f.functionName || '(anon)'}:${f.lineNumber}`; byFn[k] = (byFn[k] || 0) + e.dur / 1000; }
  console.log('  forced by script:', Object.entries(byFn).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${Math.round(v)}ms`).join(' | ') || 'none');
  await b.close();
})();
