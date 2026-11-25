# Contributing

1. `nvm use && npm install` (Node 22). Hooks install automatically (`npm run prepare`).
2. Branch from `master`; keep PRs small.
3. Commit with Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:` …). Commitlint enforces it.
4. Before pushing: `npm run lint && npm run typecheck && npm test`. Run `npm run test:e2e` for UI changes.

## Definition of done for a PR

- [ ] Lint, type-check, unit and e2e (incl. axe) pass
- [ ] No new `any` / `eslint-disable` without a written reason
- [ ] Database changes are a new numbered migration in `supabase/migrations/` plus an RLS test
- [ ] No secrets (gitleaks green); `service_role` never in client code or `VITE_*`
- [ ] Lighthouse and axe budgets still met
- [ ] Docs/ADR updated when an architectural decision changes

## Conventions

- Feature code in `src/features/<name>`, shared code in `src/shared`. UI never sees snake_case:
  mapping lives in `src/shared/lib/store/mapping.ts`.
- Facts used in more than one place go in `src/shared/lib/profile.ts`.
- Images: put masters in `assets-src/`, run `npm run images`. File names are lowercase kebab-case.
- Tailwind v4: tokens in `@theme` (`src/styles/main.css`); prefer utilities over new CSS.
