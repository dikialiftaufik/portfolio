// Renders public/og-image.png (1200x630) for link previews (WhatsApp, LinkedIn, X).
// Usage: node scripts/generate-og-image.mjs   (needs `npm run e2e:install` once)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(root, 'node_modules', '@fontsource-variable', pkg, 'files', file)).toString('base64')}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'SG'; src: url(${font('space-grotesk', 'space-grotesk-latin-wght-normal.woff2')}); font-weight: 300 700; }
@font-face { font-family: 'JB'; src: url(${font('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')}); font-weight: 100 800; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: #050b14; color: #ededed; font-family: 'SG'; position: relative; overflow: hidden; }
.glow { position: absolute; inset: 0; background:
  radial-gradient(circle at 85% 110%, rgba(0,240,255,0.22), transparent 55%),
  radial-gradient(circle at 0% -10%, rgba(88,28,135,0.28), transparent 50%); }
.grid { position: absolute; inset: 0; background-size: 48px 48px;
  background-image: linear-gradient(to right, rgba(0,240,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,240,255,0.06) 1px, transparent 1px); }
.wrap { position: relative; padding: 72px 92px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
.tag { font-family: 'JB'; font-size: 26px; letter-spacing: 0.22em; text-transform: uppercase; color: #00f0ff; }
h1 { font-size: 100px; line-height: 1.02; letter-spacing: -0.04em; font-weight: 700; }
h1 span { color: #00f0ff; }
.role { font-family: 'JB'; font-size: 36px; color: #00f0ff; margin-top: 28px; }
.sub { font-size: 26px; color: #a3a3a3; margin-top: 18px; max-width: 1016px; }
.foot { font-family: 'JB'; font-size: 24px; color: #a3a3a3; display: flex; justify-content: space-between; }
</style></head><body><div class="glow"></div><div class="grid"></div><div class="wrap">
<div class="tag">Portfolio</div>
<div><h1>Diki Alif<br>Taufik<span>.</span></h1>
<div class="role">&gt; Web Developer &amp; AI Enthusiast</div>
<div class="sub">Building scalable solutions and leveraging AI to solve real-world problems.</div></div>
<div class="foot"><span>Bandung, Indonesia</span><span>React · Laravel · Supabase</span></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(root, 'public', 'og-image.png'), type: 'png' });
await browser.close();
console.log('wrote public/og-image.png');
