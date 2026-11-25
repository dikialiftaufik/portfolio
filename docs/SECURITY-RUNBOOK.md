# Runbook Keamanan & Rilis (langkah yang harus Anda jalankan sendiri)

Kode, migrasi, dan tes sudah siap di repo. Langkah di bawah menyentuh dashboard
Supabase/Vercel/GitHub milik Anda, jadi tidak bisa dikerjakan dari kode. Urutannya
penting: **jangan lompat ke langkah 3 sebelum langkah 2 selesai**.

## 1. Matikan pendaftaran publik (kritis, 1 menit)

Supabase Dashboard → Authentication → Sign In / Providers → **matikan "Allow new users
to sign up"**. Pastikan hanya 1 user di Authentication → Users (milik Anda).

Bukti: panggilan ini harus ditolak (`signup_disabled`), bukan membuat user:

```bash
curl -X POST "https://PROJECT.supabase.co/auth/v1/signup" \
  -H "apikey: ANON" -H "Content-Type: application/json" \
  -d '{"email":"probe@example.com","password":"Probe-12345!"}'
```

## 2. Tandai akun Anda sebagai admin (sebelum migrasi 0002)

SQL Editor (jalan sebagai owner, tidak terkena RLS):

```sql
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
 where email = 'EMAIL-ADMIN-ANDA';

select email, raw_app_meta_data from auth.users;   -- pastikan role = admin
```

## 3. Terapkan migrasi berurutan (sekali per file)

SQL Editor, jalankan isi file ini **satu per satu, berurutan**:

1. `supabase/migrations/0001_init.sql`: **lewati jika proyek Anda sudah pernah menjalankan
   `schema.sql` lama** (isinya sama). Jangan jalankan ulang setelah 0002.
2. `supabase/migrations/0002_admin_hardening.sql`: RLS khusus admin, RPC kontak dengan
   rate limit, trigger `updated_at`, batas MIME bucket. Aman dijalankan ulang.
3. `supabase/migrations/0003_fix_cert_image_typo.sql`: jalankan **segera setelah deploy
   build baru** (nama file gambar sertifikat diperbaiki).

Lewat CLI (opsional): `npx supabase link --project-ref PROJECT` lalu `npx supabase db push`.

Setelah 0002: **log out lalu log in sekali lagi** di `/admin.html` agar JWT membawa klaim admin.

## 4. Verifikasi (urutan ini)

| Uji                                                     | Hasil yang benar                            |
| ------------------------------------------------------- | ------------------------------------------- |
| `GET /rest/v1/projects?select=id,title` dengan anon key | 200 + baris                                 |
| `POST /rest/v1/projects` dengan anon key                | 401/403                                     |
| `POST /rest/v1/messages` langsung dengan anon key       | 401/403 (sekarang harus lewat RPC)          |
| Form kontak di situs                                    | "Message sent", baris muncul di Inbox admin |
| Kirim 4 pesan dengan email sama dalam 1 jam             | pesan ke-4 ditolak ("Too many messages…")   |
| Admin: tambah/edit/hapus proyek, upload gambar          | berhasil                                    |
| Akun kedua yang login (uji manual, lalu hapus)          | tidak bisa menulis                          |

Tes otomatisnya ada di `supabase/tests/rls.test.sql` (`npx supabase start && npx supabase db reset && npx supabase test db`, butuh Docker).

## 5. Akun admin

- Aktifkan MFA TOTP: Authentication → Multi-Factor (atau Account) dan daftarkan aplikasi authenticator.
- Ganti password bila pernah dibagikan/terekspos.
- Jalur darurat bila terkunci: SQL Editor selalu bisa mengubah `raw_app_meta_data` (langkah 2).

## 6. Vercel

- Settings → Environment Variables (opsional, menimpa `.env.production`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Jangan pernah mengisi `service_role`.
- Pastikan "Automatically expose System Environment Variables" aktif agar canonical/OG/sitemap memakai domain produksi, atau isi `VITE_SITE_URL`.
- Build command otomatis `npm run build`, output `dist`. Cek header di <https://securityheaders.com> setelah deploy.

## 7. GitHub

- Settings → Branches: proteksi `master` (require PR + status check `quality`, `e2e`, `secrets`).
- Settings → Secrets and variables → Actions → **Variables**: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (nilai publik) untuk workflow keep-alive.
- Jalankan `gitleaks detect --redact` sekali di lokal untuk memindai riwayat git (anon key sengaja di-allowlist di `.gitleaks.toml`; temuan lain harus nol).

## 8. Yang sengaja belum ada (butuh akun/keputusan Anda)

- CAPTCHA (Turnstile/hCaptcha) + Edge Function: lihat ADR-0004.
- Sentry / uptime monitor eksternal: butuh DSN/akun. Keep-alive GitHub Action sudah mencegah proyek tidur.
- `pg_cron` retensi pesan: opsional, perintahnya ada di migrasi 0002.
