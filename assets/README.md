# Assets

Convention: `kebab-case`, lowercase, no spaces or apostrophes.

- `assets/images/projects/` — project screenshots (`boloo-food-order.png`, `the-komars.png`, `ppdb-online.png`)
- `assets/images/certs/` — certificates (`cert-<slug>-<issuer>-<year>.<ext>`)
- `assets/favicon.png` — site icon

When adding media: compress first, prefer `.webp` on next migration, keep width/height in markup to avoid CLS.

## Storage uploads (admin console → Supabase bucket `portfolio-media`)

- Paths: `projects/<kebab>.<ext>`, `certs/<kebab>.<ext>` — lowercase, spaces become `-`, strange characters stripped.
- Allowed: PNG, JPG, WebP. Cap: **2 MB** (rejected before upload with a how-to-shrink message).
- Compress before uploading — big files slow the site.
- Replacing an image deletes the old Storage file (best-effort); old `assets/` files stay as seed fallback.
