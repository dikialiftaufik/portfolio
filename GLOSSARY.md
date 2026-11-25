# GLOSSARY

Domain and architecture terms used in this portfolio. Architecture words follow fixed meanings: **Module** (interface + implementation), **Interface** (everything a caller must know), **Seam** (where the Interface lives), **Adapter** (what sits at a Seam), **Depth** (leverage per unit of interface), **Leverage** (caller payoff), **Locality** (maintainer payoff).

- **Showcase** — the tabbed Module (`Projects` / `Certificates` / `Tech Stack`). Rendered by `src/features/showcase`; data via `useShowcaseData` (Store).
- **Matcher** — the answer Module in `src/features/chatbot/matcher.ts`. Interface: `findAnswer(query) -> string`. Token-exact; no substring traps. Answers live in `knowledge-base.ts` and are static (not generative AI).
- **Locale** — the i18n Module in `src/shared/lib/locale.ts`. Interface: `get(path, lang)` with English fallback.
- **Content** — the frozen data Module in `src/content/seed.ts` (`projectsData`, `certificatesData`, `techStackData`). Owner facts shared across the UI live in `src/shared/lib/profile.ts`.
- **Particle Field** — the hero canvas background. Imperative canvas in `src/features/hero/particle-field.ts`; density capped on phones, paused off-screen/hidden and under reduced motion.
- **Inbox** — visitor messages sent from the contact form, read and managed in the admin console.
- **Viewer** — anyone opening the public portfolio page.
- **Admin** — the portfolio owner, signed in to the admin console.
- **Store** — the live-data Module both views read through. Interface: `list/subscribe/create/update/remove/sendMessage` in `src/shared/lib/store`; Supabase and Seed are its Adapters.
- **Adapter** — the backend behind the Store in a given situation (live backend or frozen seed).
- **Seed** — the frozen fallback data used when the backend is unreachable or unconfigured.
- **Admin identity** — the user whose `app_metadata.role` is `admin`; the only identity RLS lets write (ADR-0003).
- **Contact RPC** — `public.submit_message`, the rate-limited entry point for visitor messages (ADR-0004).
- **Migration** — a numbered, versioned SQL file in `supabase/migrations/`.
