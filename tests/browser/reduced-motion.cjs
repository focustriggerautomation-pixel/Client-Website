const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m);
  for (const slug of ['nocturne-coffee', 'sunday-crumb', 'tamarind-house']) {
    const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, body: '' }));
    await p.goto('http://localhost:4173/' + slug); await p.waitForSelector('main section');
    ok(!(await p.$('[data-intro]')), `${slug}: no intro`);
    ok(!(await p.evaluate(() => document.documentElement.classList.contains('lenis'))), `${slug}: no smooth scroll`);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => ({
      stage: !!document.querySelector('[data-stage]'),
      pins: document.querySelectorAll('.pin-spacer').length,
      transforms: [...document.querySelectorAll('[data-parallax],[data-tilt]')].filter((e) => e.style.transform && e.style.transform !== 'none' && !/translate\(0px, 0px\)|translate3d\(0px, 0px, 0px\)/.test(e.style.transform)).length,
      hidden: [...document.querySelectorAll('main *, footer *')].filter((e) => { if (e.style.opacity === '') return false; const i = e.style.opacity; e.style.opacity = ''; const d = +getComputedStyle(e).opacity; e.style.opacity = i; return +i < d - 0.01; }).length,
    }));
    ok(!r.stage && r.pins === 0, `${slug}: gallery stays a static grid, no pinning`);
    ok(r.transforms === 0, `${slug}: no parallax/tilt transforms (${r.transforms})`);
    ok(r.hidden === 0, `${slug}: everything visible after scrolling (${r.hidden} hidden)`);
    // Lightbox still works, with a plain fade.
    await p.click('[data-gallery-index="1"]');
    ok(await p.isVisible('[role=dialog]'), `${slug}: lightbox opens`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    ok(!(await p.$('[role=dialog]')), `${slug}: lightbox closes`);
    ok(!errs.length, `${slug}: no errors ${errs.join(';')}`);
    await ctx.close();
  }
  await b.close();
})();
