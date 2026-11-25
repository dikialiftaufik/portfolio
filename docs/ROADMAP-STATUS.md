# Status roadmap (per 2026-11-25)

Sumber: analisis teknis & roadmap (dokumen lokal `docs/internal/ANALISIS-DAN-ROADMAP.md`,
tidak ikut ter-push). Legenda: ✅ selesai & terverifikasi · 🟡 kode siap, butuh langkah Anda ·
⏳ belum dikerjakan (backlog, butuh keputusan/akun).

## Fase 0 — Pengamanan segera

| #   | Tugas                               | Status                                                                                                 |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 0.1 | Matikan sign-up Supabase            | 🟡 dashboard, `SECURITY-RUNBOOK` langkah 1                                                             |
| 0.2 | S3: `insert().select()` pada kontak | ✅ diganti RPC `submit_message` (+ fallback `insert` tanpa `select` selama migrasi belum jalan)        |
| 0.3 | RLS ke admin spesifik               | ✅ migrasi `0002` (`is_admin()`), teruji 22/22 di PostgreSQL lokal; 🟡 perlu diterapkan ke proyek Anda |
| 0.4 | MFA admin, rotasi password          | 🟡 dashboard                                                                                           |
| 0.5 | Scan riwayat git                    | 🟡 `gitleaks detect` lokal; CI sudah memindai tiap push                                                |
| 0.6 | LICENSE, typo `innovaiition`        | ✅ MIT (silakan ganti bila ingin lisensi lain); 🟡 jalankan migrasi `0003` setelah deploy              |

## Fase 1 — Tooling & jaring pengaman

| Tugas                                                                                                 | Status                                                                                             |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| package.json, Node pin, lockfile, EditorConfig, ESLint flat, Prettier, Husky, lint-staged, Commitlint | ✅                                                                                                 |
| Vitest: matcher, locale, config, mapping, store, upload, komponen                                     | ✅ 72 tes, cakupan > 90% pada `src/shared/lib` + matcher                                           |
| GitHub Actions (lint, tes, build, e2e, Lighthouse, pgTAP, gitleaks) + Dependabot                      | ✅ ditulis; 🟡 belum pernah berjalan di GitHub (butuh push)                                        |
| Migrasi berversi + trigger `updated_at`                                                               | ✅ `supabase/migrations`, `config.jsonc` dari Supabase CLI                                         |
| Tes RLS                                                                                               | ✅ `supabase/tests/rls.test.sql`; dijalankan lewat shim pgTAP di PG 18 (bukan stack Supabase asli) |

## Fase 2 — Migrasi build modern

✅ Vite + React 19 + TypeScript strict + Tailwind v4, dua entry (admin tidak ikut bundle publik),
semua dependensi self-host, env Vite, struktur fitur, duplikasi T1 hilang (ADR-0002).
Terukur lokal (Lighthouse, build produksi): performa mobile 94 / desktop 96, a11y 100, SEO 100,
JS awal ≈ 90 KB gzip, tanpa `unsafe-eval`.
⏳ `database.types.ts` hasil `supabase gen types` (butuh proyek terhubung; tipe baris ditulis manual).
Catatan: React 19 (bukan 18 seperti di rencana) karena itu versi terkini yang kompatibel.

## Fase 3 — Hardening & delivery

| Tugas                                                                                            | Status                                                                                                    |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `vercel.json`: CSP ketat, HSTS, nosniff, referrer, permissions, frame-ancestors, cache immutable | ✅ (belum diuji di Vercel sungguhan; cek `securityheaders.com`)                                           |
| Anti-spam kontak                                                                                 | ✅ rate limit per email + global di DB, retensi `purge_old_messages`; ⏳ CAPTCHA/Edge Function (ADR-0004) |
| Bucket: MIME allow-list, nama acak, tanpa upsert                                                 | ✅                                                                                                        |
| Sentry, uptime monitor                                                                           | ⏳ butuh akun/DSN; ✅ keep-alive GitHub Action (butuh 2 repo variable)                                    |
| Preview per PR + Playwright smoke                                                                | ✅ e2e hermetik di CI; preview Vercel aktif otomatis dari integrasi GitHub                                |

## Fase 4 — Performa, SEO, aksesibilitas

| Tugas                                                                                       | Status                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gambar: WebP + `<picture>`, dimensi eksplisit, kompres klien saat upload                    | ✅ 5,9 MB → 0,4 MB (WebP)                                                                                                                                                                             |
| Canvas: pause saat hidden/off-screen, `prefers-reduced-motion`                              | ✅                                                                                                                                                                                                    |
| SEO: og:image/url, twitter:card, canonical, JSON-LD, robots, sitemap, `<html lang>` dinamis | ✅ canonical/sitemap otomatis dari `VERCEL_PROJECT_PRODUCTION_URL` atau `VITE_SITE_URL` (dibuang bila tidak ada)                                                                                      |
| Prerender                                                                                   | ⏳ dievaluasi di ADR-0002: tag statis + JSON-LD cukup untuk saat ini                                                                                                                                  |
| WCAG 2.2 AA                                                                                 | ✅ axe (home, modal, versi Indonesia, login admin, admin masuk + form + dialog hapus) nol pelanggaran; tablist + panah, focus trap modal, `aria-pressed`, `role="log"`; ⏳ audit manual screen reader |
| Lighthouse CI budget                                                                        | ✅ `lighthouserc.json`                                                                                                                                                                                |

## Fase 5 — Fitur & kualitas produk

| Tugas                                                              | Status                                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Chatbot jujur (T5/T6/T7), data tunggal `profile.ts` (T14)          | ✅ label "AI-powered" dihapus; jawaban Next.js/Node/TensorFlow dikoreksi |
| Chatbot RAG dengan Edge Function                                   | ⏳ butuh kunci API + keputusan biaya                                     |
| i18n penuh (T8: konten DB & chatbot dwibahasa)                     | ⏳                                                                       |
| Admin: drag-drop urutan, soft delete, ekspor CSV, notifikasi email | ⏳                                                                       |
| Studi kasus proyek, blog, analytics                                | ⏳                                                                       |
| ADR 0002–0004, CONTRIBUTING, SECURITY, README, DEPLOY              | ✅                                                                       |

## Perbaikan tambahan yang ditemukan saat verifikasi

- Chatbot menggulir **seluruh halaman** ke bawah saat load (hero terpotong): sekarang hanya log yang digulir.
- Panel chatbot melebar (498 px) di layar 375 px karena chip `nowrap`: diperbaiki + tes regresi.
- supabase-js terbaru me-retry GET gagal 1s/2s/4s sehingga fallback seed tertunda ±7 s saat offline: retry dimatikan.
- Typo nama file, `onKeyPress` usang, bendera/noise dari host pihak ketiga, tombol logo tanpa label, kontras teks kecil.
