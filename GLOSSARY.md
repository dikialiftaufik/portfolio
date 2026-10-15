# GLOSSARY

Domain and architecture terms used in this portfolio. Architecture words follow fixed meanings: **Module** (interface + implementation), **Interface** (everything a caller must know), **Seam** (where the Interface lives), **Adapter** (what sits at a Seam), **Depth** (leverage per unit of interface), **Leverage** (caller payoff), **Locality** (maintainer payoff).

- **Showcase** — the tabbed Module (`Projects` / `Certificates` / `Tech Stack`). Data from `js/content.js`.
- **Matcher** — the answer Module in `js/matcher.js`. Interface: `findAnswer(query) -> string`. Token-exact; no substring traps.
- **Locale** — the i18n Module in `js/locale.js`. Interface: `get(path, lang)` with English fallback.
- **Content** — the data Module in `js/content.js` (`projectsData`, `certificatesData`, `techStackData`).
- **Particle Field** — the hero canvas background. Tuned in `index.html` (Hero); density capped on phones.
