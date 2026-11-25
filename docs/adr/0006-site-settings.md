# Site settings live in a one-row table

Status: accepted

The "Download CV" link was hard-coded in `profile.ts`, so changing it needed a code change and a redeploy.

## Decision

- `public.site_settings` holds exactly one row (`id boolean primary key check (id)`) with typed columns, first `cv_url` (migration `0005_site_settings.sql`).
- Public read, admin-only update (ADR-0003). No insert or delete policy. `anon` has no write grant, and `authenticated` may update `cv_url` only; `TRUNCATE`, which ignores RLS, is revoked too.
- The link must be `https`, with a dotted host, no user info, no whitespace, at most 2048 characters. A check constraint enforces it; `parseCvUrl` applies it in the admin form, the Store and the public button. The two are written separately: change both together.
- The Store exposes `getSettings` / `updateSettings`. A settings row is not a Collection: it cannot be created, deleted or reordered.
- `profile.cvUrl` is the fallback. The public button renders it first and upgrades to the live link once the browser is idle.

## Considered

| Option                       | Why not                                               |
| ---------------------------- | ----------------------------------------------------- |
| Key-value table              | Weak per-key validation                               |
| `VITE_CV_URL` env var        | The admin can't change it, and each change redeploys  |
| `/cv` redirect function      | Adds a server runtime the project doesn't have        |
| Hide the button until loaded | Layout shift, and no button at all when offline       |
| Upload the PDF to Storage    | Larger scope: new MIME allow-list, policies and limit |

## Consequences

- A click before the fetch finishes, or while the backend is unreachable, opens the fallback link. Keep `profile.cvUrl` reasonably current and keep that file accessible.
- No realtime: visitors see a new link after reloading the page.
- `seed.sql` does not touch the row, and re-running the migration keeps the admin's link.
- Rollback: revert the frontend. The table can stay.
