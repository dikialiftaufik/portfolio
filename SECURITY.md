# Security policy

## Reporting a vulnerability

Please do not open a public issue. Email **dikialif550@gmail.com** with steps to reproduce.
I aim to acknowledge within 3 days.

## Scope notes

- The Supabase **anon key** in `.env.production` is public by design (it ships in every page load).
  Access control is row-level security; see `docs/adr/0003-admin-authorization.md`.
- A **`service_role`** key, a database password or a JWT secret appearing anywhere in the repository,
  its history or a build is a vulnerability: report it immediately.
- CI runs gitleaks on every push and pull request.
