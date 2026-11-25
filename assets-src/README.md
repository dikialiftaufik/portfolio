# Assets (master images)

Masters live here and are **not served**. `npm run images` writes the optimized copies to
`public/assets/images/` (same name and format, recompressed, plus a `.webp` sibling that the
site serves through `<picture>`). Database rows keep pointing at `assets/images/...`.

Convention: `kebab-case`, lowercase, no spaces or apostrophes.

- `images/projects/` — project screenshots (`boloo-food-order.png`, `the-komars.png`, `ppdb-online.png`)
- `images/certs/` — certificates (`cert-<slug>-<issuer>-<year>.<ext>`)
- `public/favicon.png` — site icon (128 px)
- `public/og-image.png` — link preview image, regenerate with `node scripts/generate-og-image.mjs`

When adding media: drop the master here, run `npm run images`. Keep width/height in markup to avoid CLS.
Admin uploads are resized to WebP in the browser (max 1600 px) and stored with a random suffix.

## Storage uploads (admin console → Supabase bucket `portfolio-media`)

- Paths: `projects/<kebab>-<random>.<ext>`, `certs/<kebab>-<random>.<ext>`; uploads never overwrite (no upsert).
- Allowed: PNG, JPG, WebP (also enforced by the bucket). Input up to 10 MB; the stored file is capped at **2 MB**.
- Replacing an image deletes the old Storage file (best-effort); old `assets/` files stay as seed fallback.
