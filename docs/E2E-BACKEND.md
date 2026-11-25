# E2E Proof — Dual-View + Backend

Two layers:

1. **Automated, hermetic** (`npm run test:e2e`, runs in CI): Playwright against a build in
   `e2e` mode where every request to the backend host is intercepted. It covers the public
   site (live data, seed fallback, contact RPC, tabs, certificate modal, language switch,
   chatbot, mobile menu, reduced motion), admin login and signed-in CRUD (add/edit/delete with
   confirmation, inbox, denied writes), the bundle split, and axe (WCAG 2.2 AA) scans. It never touches a real Supabase project.
2. **Manual, against the real project** (this file): run after applying migrations or when
   changing RLS. Mark each step PASS/FAIL; all must PASS.

Prerequisites: migrations applied in order (`docs/SECURITY-RUNBOOK.md`), `seed.sql` loaded
(projects 3 / certificates 7 / tech_stack 18), admin user marked `role: admin`, bucket
`portfolio-media` exists, site running via `npm run dev` or a Vercel deployment.

## A. Cross-browser content round-trip (the core promise)

1. Open `/admin.html` in Chrome, log in. PASS: Projects / Certificates / Tech Stack lists.
2. Add a project titled `E2E-PROBE-<hour>` with a fresh Storage upload. PASS: "Project saved".
3. Open `/` in an **incognito window**. PASS: the probe card appears, no code touched.
4. Refresh the incognito page. PASS: card persists.
5. Edit the probe title in admin. PASS: the public view reflects it (realtime or after refresh).
   5a. Set the probe's ORDER to `0` and save. PASS: it shows first in admin and on `/`, and the others
   shift down by one. Picking a file under Upload shows a preview before saving, with no CSP error
   in the console.
6. Delete the probe in admin (confirm in the dialog). PASS: "Project deleted"; gone from public view.

## B. Contact inbox round-trip

7. In the incognito view send "E2E probe message — safe to delete".
   PASS: "Message sent." and the form clears.
8. In admin → Inbox. PASS: probe message on top, unread.
9. Mark as read, then delete. PASS: list and counts agree.
10. Send 4 messages with the same email within an hour. PASS: the 4th is refused
    ("Too many messages right now…").

## C. Security: anonymous and non-admin access shape

11. Anonymous `GET /rest/v1/projects?select=id,title` → **200 + 3 rows**.
12. Anonymous `POST /rest/v1/projects` → **401/403** (RLS violation).
13. Anonymous `POST /rest/v1/messages` (direct insert) → **401/403**; only the
    `submit_message` RPC accepts messages now.
14. Anonymous `POST /auth/v1/signup` → refused (sign-ups disabled).
15. A second, non-admin signed-in user cannot insert/update/delete content, read messages
    or upload to Storage. (Create the user from the dashboard, test, delete it.)

## D. Honest offline behavior

16. In `.env.local` set a wrong anon key (or go offline) and reload `/`. PASS: Showcase still
    renders from the frozen seed with "Showing cached content…" and a "Try again" button.
    The automated suite checks the same path (`backend down` tests).

## E. Cleanup + record

17. No `E2E-PROBE` rows or probe messages remain.
18. Record results with the date. Any FAIL → open an issue with the step number.

## History

- 2026-10-16: steps 10–11 verified live (anonymous read 200, anonymous write to content 401).
  Anonymous insert into `messages` returned 401 because the policy from a partial schema run
  had not taken effect; superseded by the RPC design in migration 0002 (ADR-0004).
- 2026-11-25: the RLS contract was executed as pgTAP-style tests (22/22) against PostgreSQL 18
  with a stand-in for Supabase's `auth`/`storage` schemas, and the hermetic Playwright suite
  (24 tests, including axe) passed. The manual steps above have **not** been re-run against
  the live project since migration 0002 was written.
