const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const slug of ['nocturne-coffee', 'sunday-crumb', 'tamarind-house']) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, body: '' }));
    await p.goto('http://localhost:4173/' + slug + '?motion=off'); await p.waitForSelector('main section');
    const bad = await p.evaluate(() => {
      const parse = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b, a = 1] = m.map(Number); return { r, g, b, a: c.startsWith('rgba') || m.length === 4 ? a : 1 }; };
      // color-mix()/oklab results: let the browser resolve through a canvas
      const ctx = document.createElement('canvas').getContext('2d');
      const toRgb = (c) => { if (/^rgba?\(/.test(c)) return parse(c); const srgb = c.match(/^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.]+))?\)/); const ok = c.match(/^oklab\(([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.]+))?\)/); if (ok) { const [L, A, B] = [+ok[1], +ok[2], +ok[3]]; const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s2 = (L - 0.0894841775 * A - 1.291485548 * B) ** 3; const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s2, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s2, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s2]; const g = (v) => 255 * Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)); return { r: g(lin[0]), g: g(lin[1]), b: g(lin[2]), a: ok[4] === undefined ? 1 : +ok[4] }; } if (srgb) return { r: srgb[1] * 255, g: srgb[2] * 255, b: srgb[3] * 255, a: srgb[4] === undefined ? 1 : +srgb[4] }; ctx.fillStyle = '#000'; ctx.fillStyle = c; const v = ctx.fillStyle; if (v.startsWith('#')) { const n = parseInt(v.slice(1), 16); return { r: n >> 16, g: (n >> 8) & 255, b: n & 255, a: 1 }; } return parse(v); };
      const lum = ({ r, g, b }) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
      const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
      const bgOf = (el) => { const stack = []; for (let a = el; a; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.backgroundImage !== 'none' && !cs.backgroundImage.includes('radial-gradient')) return null; const c = toRgb(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } } let out = toRgb(getComputedStyle(document.documentElement).backgroundColor); for (const c of stack.reverse()) out = over(c, out); return out; };
      const res = [];
      for (const el of document.querySelectorAll('main *, footer *, header *')) {
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!own || !el.getClientRects().length) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        const bg = bgOf(el); if (!bg) continue;
        let fg = toRgb(cs.color); let op = 1; for (let a = el; a; a = a.parentElement) op *= +getComputedStyle(a).opacity; fg = over({ ...fg, a: fg.a * op }, bg);
        const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
        if (el.closest('[aria-hidden="true"]')) continue;
        if (ratio < (large ? 3 : 4.5)) res.push(`${ratio.toFixed(2)} ${size}px "${el.textContent.trim().slice(0, 40)}"`);
      }
      return [...new Set(res)];
    });
    console.log(slug, bad.length ? '\n  ' + bad.join('\n  ') : 'all text passes AA');
    await p.close();
  }
  await b.close();
})();
