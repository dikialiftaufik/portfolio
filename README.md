# Portfolio — Diki Alif Taufik

Static single-page portfolio (React 18 UMD + Tailwind Play CDN + Babel standalone). No build step.

## Preview

```bash
npx serve .
# open http://localhost:3000
```

## Structure

```text
index.html              # wiring + presentation only (data lives in js/)
css/main.css            # responsive layer; utilities stay in Tailwind classes
js/locale.js            # translations + get(path, lang) with English fallback
js/content.js           # projectsData, certificatesData, techStackData
js/matcher.js           # knowledgeBase + findAnswer(query) -> string
assets/images/projects/ # project screenshots (kebab-case)
assets/images/certs/    # certificates (cert-<slug>-<issuer>-<year>)
assets/favicon.png
GLOSSARY.md             # domain + architecture terms
docs/                   # local-only analysis (git-ignored)
```

## Asset convention

`kebab-case`, lowercase, no spaces or apostrophes. Compress before adding; keep `loading="lazy"` on gallery images.

## Contact form

Client-side only: opens the visitor's mail app via `mailto:`. It never claims server-side delivery — the button reads "Opening your email app…" and the form keeps its data.

## Deploy

Any static host (GitHub Pages, Netlify, Vercel). No server, no env vars. Pinned CDN versions are in `index.html` `<head>`.
