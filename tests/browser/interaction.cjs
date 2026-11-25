const { chromium } = require('playwright');
const B = 'http://localhost:4173';
(async () => {
  const b = await chromium.launch();
  const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m);
  const p = await b.newPage({ viewport: { width: 375, height: 800 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, body: '' }));

  // Mobile menu
  await p.goto(B + '/tamarind-house'); await p.waitForSelector('main section');
  await p.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 5000 });
  ok(!(await p.isVisible('header a[href^="tel:"]')), 'header CTA hidden at 375px');
  ok(!(await p.$('a[aria-label$="on WhatsApp"].fixed')), 'floating WhatsApp hidden on hero');
  await p.click('button[aria-controls="mobile-menu"]');
  ok(await p.isVisible('#mobile-menu'), 'mobile menu opens');
  ok((await p.getAttribute('button[aria-controls="mobile-menu"]', 'aria-expanded')) === 'true', 'aria-expanded=true');
  ok((await p.evaluate(() => document.body.style.overflow)) === 'hidden', 'body scroll locked');
  await p.keyboard.press('Escape');
  ok(!(await p.isVisible('#mobile-menu')), 'Escape closes menu');
  await p.click('button[aria-controls="mobile-menu"]');
  await p.click('#mobile-menu a[href="#menu"]');
  // Lenis scrolls smoothly to the anchor: wait until it settles.
  await p.waitForFunction(() => { const t = document.getElementById('menu').getBoundingClientRect().top; const ok = window.__lastTop === t; window.__lastTop = t; return ok; }, null, { polling: 250, timeout: 5000 });
  const top = await p.evaluate(() => document.getElementById('menu').getBoundingClientRect().top);
  ok(!(await p.isVisible('#mobile-menu')) && top >= 0 && top < 120, `menu link closes panel and scrolls to #menu (top=${Math.round(top)})`);
  ok(await p.isVisible('a.fixed[aria-label$="on WhatsApp"]'), 'floating WhatsApp visible after scrolling');

  // Warm tabs
  const tab0 = p.locator('[role=tab]').first();
  await tab0.focus(); await p.keyboard.press('ArrowRight');
  const sel = await p.$$eval('[role=tab]', (t) => t.map((x) => x.getAttribute('aria-selected')));
  ok(sel[1] === 'true', 'ArrowRight selects next tab');
  ok((await p.textContent('[role=tabpanel]')).includes('Sunday family thali'), 'panel shows Meals items');
  ok(await p.evaluate(() => document.activeElement.getAttribute('role') === 'tab' && document.activeElement.textContent === 'Meals'), 'focus moves with selection');
  await p.keyboard.press('End');
  ok((await p.textContent('[role=tabpanel]')).includes('Elaneer payasam'), 'End jumps to last tab');

  // ?mood override applies to every section
  for (const [slug, mood, marker] of [['sunday-crumb', 'dark-premium', 'The menu'], ['tamarind-house', 'bright-cafe', 'What’s good today'], ['nocturne-coffee', 'warm-restaurant', 'Our menu']]) {
    const q = await b.newPage({ viewport: { width: 1440, height: 900 } });
    q.on('pageerror', (e) => errs.push(e.message));
    await q.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, body: '' }));
    await q.goto(`${B}/${slug}?mood=${mood}`); await q.waitForSelector('main section');
    await q.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 5000 });
    const m = await q.evaluate(() => document.documentElement.dataset.mood);
    // nocturne overrides its menu heading in config, so identify the warm variant by its category tabs instead
    const variantOk = slug === 'nocturne-coffee' ? !!(await q.$('#menu [role=tablist]')) && (await q.textContent('#menu h2')) === 'Tonight’s menu' : (await q.textContent('#menu h2')) === marker;
    ok(m === mood && variantOk, `${slug}?mood=${mood} → ${mood} menu variant`);
    await q.screenshot({ path: `${process.argv[2]}/override-${slug}.png` });
    await q.close();
  }
  // ── Phase 3 additions
  for (const [slug, kind] of [['nocturne-coffee', 'fly'], ['sunday-crumb', 'strip']]) {
    const q = await b.newPage({ viewport: { width: 1440, height: 900 } });
    q.on('pageerror', (e) => errs.push(e.message));
    await q.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, body: '' }));
    await q.goto(`${B}/${slug}`); await q.waitForSelector('main section');
    await q.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 5000 });
    if (slug === 'nocturne-coffee') ok((await q.textContent('#menu h2')) === 'Tonight’s menu', 'headings override renders (nocturne menu title)');
    ok((await q.getAttribute('#gallery [data-stage]', 'data-stage')) === kind, `${slug}: gallery runs as "${kind}" sequence`);
    // header hides on scroll down, returns on scroll up
    await q.evaluate(() => window.scrollTo(0, 1600)); await q.waitForTimeout(900);
    const hiddenY = await q.evaluate(() => document.querySelector('[data-header]').getBoundingClientRect().bottom);
    await q.mouse.wheel(0, -300);
    // let Lenis finish its smoothed scroll (dark-premium's heavy inertia takes ~2s) before jumping programmatically
    await q.waitForFunction(() => { const y = scrollY; const ok = window.__ly === y; window.__ly = y; return ok; }, null, { polling: 300, timeout: 6000 });
    const shownY = await q.evaluate(() => document.querySelector('[data-header]').getBoundingClientRect().top);
    ok(hiddenY <= 0 && shownY >= -1, `${slug}: header hides on scroll down, returns on scroll up`);
    // open the lightbox from inside the pinned sequence
    await q.evaluate(() => { const g = document.getElementById('gallery'); window.scrollTo(0, g.getBoundingClientRect().top + scrollY + g.offsetHeight * 0.3); });
    await q.waitForTimeout(1200);
    // tap where the photo is on screen (element.click() would scroll it "into view" and move the pinned sequence)
    const pt = await q.evaluate(() => { for (const b of document.querySelectorAll('[data-gallery-index]')) { const r = b.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; if (r.width > 40 && x > 0 && x < innerWidth && y > 0 && y < innerHeight && b.contains(document.elementFromPoint(x, y))) return { x, y }; } return null; });
    if (pt) await q.mouse.click(pt.x, pt.y);
    else console.log('   (debug) no tappable photo; scrollY', await q.evaluate(() => [scrollY, document.getElementById('gallery').getBoundingClientRect().top]));
    await q.waitForTimeout(700);
    ok(await q.isVisible('[role=dialog]'), `${slug}: tapping a photo in the ${kind} sequence opens the lightbox`);
    await q.keyboard.press('ArrowRight'); await q.waitForTimeout(300);
    const label = await q.getAttribute('[role=dialog]', 'aria-label');
    await q.keyboard.press('Escape'); await q.waitForTimeout(500);
    ok(!(await q.$('[role=dialog]')) && /Photo \d+ of \d+/.test(label || ''), `${slug}: lightbox navigates and closes (${label})`);
    await q.close();
  }
  ok(!errs.length, 'no page errors ' + errs.join('; '));
  await b.close();
})();
