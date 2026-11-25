// Copies one SVG per technology from the devicon package into public/tech/<name>.svg.
// The site then loads only the icons it shows (no icon font). Colored `original`
// variants are preferred; `plain` is the fallback. Output is git-ignored.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'devicon', 'icons');
const out = join(root, 'public', 'tech');

if (!existsSync(src)) {
  console.error('devicon is not installed. Run `npm install` first.');
  process.exit(1);
}

mkdirSync(out, { recursive: true });
let copied = 0;
for (const name of readdirSync(src)) {
  const candidates = [`${name}-original.svg`, `${name}-plain.svg`];
  const file = candidates.find((f) => existsSync(join(src, name, f)));
  if (!file) continue;
  copyFileSync(join(src, name, file), join(out, `${name}.svg`));
  copied += 1;
}
console.log(`sync-tech-icons: ${copied} icons -> public/tech`);
