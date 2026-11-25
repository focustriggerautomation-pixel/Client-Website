const { chromium } = require('playwright');
const [,, base, out, filter] = process.argv;
const cafes = ['nocturne-coffee', 'sunday-crumb', 'tamarind-house'];
const widths = [375, 768, 1440];
(async () => {
  const b = await chromium.launch();
  for (const slug of cafes) for (const w of widths) {
    if (filter && !`${slug}@${w}`.includes(filter)) continue;
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const errors = [];
    p.on('console', (m) => m.type() === 'error' && !/google|maps|ERR_|gstatic/i.test(m.text()) && errors.push(m.text()));
    p.on('pageerror', (e) => errors.push(e.message));
    await p.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<body style="margin:0;background:#cfd8cf;font:14px sans-serif;display:grid;place-items:center;height:100vh">Map</body>' }));
    await p.goto(`${base}/${slug}`, { waitUntil: 'load' });
    await p.waitForSelector('main section');
    await p.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 5000 });
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); });
    await p.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 15000 }).catch(() => console.log('  (images still loading)'));
    await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const wide = [...document.querySelectorAll('body *')].filter((el) => {
        const b = el.getBoundingClientRect();
        if (!b.width) return false;
        let a = el; while (a) { const cs = getComputedStyle(a); if (a !== el && /(auto|scroll|hidden|clip)/.test(cs.overflowX)) return false; a = a.parentElement; }
        return b.right > vw + 1 || b.left < -1;
      }).slice(0, 6).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
      const imgs = [...document.images];
      return {
        overflowX: document.documentElement.scrollWidth > vw,
        wide,
        broken: imgs.filter((i) => i.complete && !i.naturalWidth).map((i) => i.src),
        noDims: imgs.filter((i) => !i.getAttribute('width')).map((i) => i.src.split('/').pop()),
        lazy: imgs.filter((i) => i.loading === 'lazy').length + '/' + imgs.length,
        sections: [...document.querySelectorAll('main > section, footer')].map((s) => s.id || s.tagName.toLowerCase()).join(','),
        today: document.querySelector('[aria-current="date"]')?.textContent,
        height: document.body.scrollHeight,
      };
    });
    // Every section must end fully visible after scrolling through (no element stuck at opacity 0).
    const hidden = await p.evaluate(async () => {
      const out = [];
      for (const s of [...document.querySelectorAll('main > section, footer')]) {
        window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY);
        await new Promise((r) => setTimeout(r, 1000));
        for (const el of s.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,blockquote,img,a,button,address')) {
          if (!el.getClientRects().length) continue;
          // anim = opacity left by the animation layer (GSAP writes inline styles); total = everything incl. design classes.
          let anim = 1, total = 1;
          for (let a = el; a && a !== document.body; a = a.parentElement) {
            if (a.style.opacity !== '') {
              // compare with the element's own designed opacity (e.g. an opacity-85 photo is not "hidden")
              const inline = a.style.opacity; a.style.opacity = ''; const designed = +getComputedStyle(a).opacity; a.style.opacity = inline;
              anim *= Math.min(1, +inline / (designed || 1));
            }
            total *= +getComputedStyle(a).opacity;
          }
          const o = Math.min(anim, total < 0.05 ? total : 1);
          if (o < 0.99) out.push(`${s.id || 'footer'}: ${el.tagName} "${(el.textContent || el.alt || '').trim().slice(0, 30)}" opacity ${o.toFixed(2)}`);
        }
      }
      window.scrollTo(0, 0);
      return [...new Set(out)];
    });
    console.log(`${slug}@${w}`, JSON.stringify({ ...r, hidden: hidden.length ? hidden : 'none', errors }));
    await p.screenshot({ path: `${out}/${slug}-${w}.png`, fullPage: true });
    await ctx.close();
  }
  await b.close();
})();
