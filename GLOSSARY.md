# GLOSSARY

Domain and architecture terms used in this portfolio. Architecture words follow fixed meanings: **Module** (interface + implementation), **Interface** (everything a caller must know), **Seam** (where the Interface lives), **Adapter** (what sits at a Seam), **Depth** (leverage per unit of interface), **Leverage** (caller payoff), **Locality** (maintainer payoff).

- **Showcase** — the tabbed Module (`Projects` / `Certificates` / `Tech Stack`). Data from `js/content.js`.
- **Matcher** — the answer Module in `js/matcher.js`. Interface: `findAnswer(query) -> string`. Token-exact; no substring traps.
- **Locale** — the i18n Module in `js/locale.js`. Interface: `get(path, lang)` with English fallback.
- **Content** — the data Module in `js/content.js` (`projectsData`, `certificatesData`, `techStackData`).
- **Particle Field** — the hero canvas background. Tuned in `index.html` (Hero); density capped on phones.
- **Inbox** — visitor messages sent from the contact form, read and managed in the admin console.
- **Viewer** — anyone opening the public portfolio page.
- **Admin** — the portfolio owner, signed in to the admin console.
- **Store** — the live-data Module both views read through.
- **Adapter** — the backend behind the Store in a given situation (live backend or frozen seed).
- **Seed** — the frozen fallback data used when the backend is unreachable or unconfigured.
