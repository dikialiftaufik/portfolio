// Builds the optimized legacy seed images: assets-src/images/** -> public/assets/images/**.
// Each source produces (a) a recompressed file in its original format, because
// content rows still reference the original extension, and (b) a .webp sibling that
// <OptimizedImage> serves via <picture>. Re-run with `npm run images` after changing
// anything in assets-src/.
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'assets-src', 'images');
const outDir = join(root, 'public', 'assets', 'images');
const MAX_WIDTH = 1200;

// Source names with typos are corrected on the way out (also update DB rows: migration 0003).
const RENAMES = { 'cert-innovaiition-plan-2025': 'cert-innovation-plan-2025' };

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

let before = 0;
let after = 0;
for (const file of walk(srcDir)) {
  const ext = extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue;
  const rel = relative(srcDir, file);
  const dir = dirname(rel);
  const base = rel.slice(dir === '.' ? 0 : dir.length + 1, -ext.length);
  const name = RENAMES[base] ?? base;
  const target = join(outDir, dir);
  mkdirSync(target, { recursive: true });

  const pipeline = () =>
    sharp(file).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const original = join(target, `${name}${ext}`);
  const webp = join(target, `${name}.webp`);

  if (ext === '.png')
    await pipeline().png({ palette: true, quality: 80, compressionLevel: 9 }).toFile(original);
  else await pipeline().jpeg({ quality: 78, mozjpeg: true }).toFile(original);
  await pipeline().webp({ quality: 78 }).toFile(webp);

  before += statSync(file).size;
  after += statSync(webp).size;
  console.log(`${rel} -> ${name}.webp (${(statSync(webp).size / 1024).toFixed(0)} KB)`);
}
console.log(`total: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB (webp)`);
