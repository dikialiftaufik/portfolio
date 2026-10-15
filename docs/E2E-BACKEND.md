# E2E Proof — Dual-View + Backend (Task 7)

Run top to bottom in one session. Mark each PASS/FAIL. All must PASS.
Prerequisites: `supabase/schema.sql` + `supabase/seed.sql` applied
(projects 3 / certificates 7 / tech_stack 18), one admin user exists,
bucket `portfolio-media` exists, site served via `npx serve .`.

## A. Cross-browser content round-trip (the core promise)

1. Open `/admin.html` in Chrome. Log in with the admin user.
   Expected PASS: console with Projects / Certificates / Tech Stack lists. ✅ (2026-10-16, agent: code path verified, manual UI pass by owner)
2. Add a project titled `E2E-PROBE-<hour>` (e.g. `E2E-PROBE-21`) with any
   `assets/` image or a fresh Storage upload.
   Expected PASS: toast "Project saved" via live region.
3. Open `/` (user view) in an **incognito window / different browser**
   (no login). Expected PASS: the `E2E-PROBE` card appears under Projects —
   no code touched.
4. Refresh the incognito user page. Expected PASS: card persists (live DB).
5. Back in admin, edit the probe title → save. Expected PASS: user view
   reflects the edit (realtime subscription, at most after refresh).
6. Back in admin, delete the probe → confirm in the modal.
   Expected PASS: toast "Project deleted"; probe gone from the user view.

## B. Contact inbox round-trip

7. In the incognito user view, send a contact message
   ("E2E probe message — safe to delete").
   Expected PASS: "Message sent. I usually respond within 24 hours."
   and the form clears.
8. In admin, open the Inbox. Expected PASS: probe message on top, unread.
9. Mark as read, then delete it. Expected PASS: list updates; counts agree.

## C. Security: anonymous access shape (verified live 2026-10-16)

10. Anonymous `GET /rest/v1/projects?select=id,title` → **200 + 3 rows**.
    PASS (agent-verified via REST).
11. Anonymous `POST /rest/v1/projects` (valid body) →
    **401** `new row violates row-level security policy`. Writes are
    admin-only. PASS (agent-verified via REST).
12. Anonymous `POST /rest/v1/messages` (valid probe) → **201** with the
    row echoed back. Public insert works; reading/deleting stays admin-only.
    STATUS 2026-10-16: **FAIL — returns 401** `new row violates
    row-level security policy for table "messages"`. The public-insert
    policy did not take effect from the earlier partial `schema.sql` run
    (that run died at the Storage block pre-fix). FIX: re-run the full
    current `supabase/schema.sql` (idempotent, `public`-quoting fixed in
    `d9cc0b0`), then re-run this probe. Until then, contact-form delivery
    to the inbox is DOWN — the UI correctly falls back to `mailto:`.
    (Probe deleted / never created; nothing to clean.)

## D. Honest offline behavior

13. In `config.local.js`, temporarily set a wrong anon key (or go offline)
    and reload `/`. Expected PASS: Showcase still renders from frozen seed
    with a "Showing cached content…" banner and a "Try again" button —
    never a blank page. Restore the key afterwards.

## E. Cleanup + record

14. Confirm no `E2E-PROBE` rows and no probe messages remain
    (`select count(*)`, or visual check in admin).
15. Record results: all 15 PASS → Task 7 done. Any FAIL → file as
    `Final:` finding with step number before release.

## Agent-verified live results (2026-10-16, project `portfolio`)

- `GET projects/certificates/tech_stack/messages` → 200 with 3 / 7 / 18 / 0 rows.
- Anonymous write to `projects` → 401 RLS violation (correct: admin-only).
- Anonymous write to `messages` → **401, INCORRECT** (must be 201).
  Open finding: re-run full `supabase/schema.sql`, then re-probe.
- No JWT or `service_role` material in git history (`git log -S` clean).
