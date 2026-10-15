# Panduan Deploy Vercel + Backend Supabase (Lengkap)

Tujuan akhir: edit konten lewat halaman admin dari mana saja, dan
pengunjung alamat Vercel langsung melihat perubahannya — tanpa redeploy
untuk perubahan konten.

## Cara kerja (wajib paham dulu, 1 menit)

- **Data tinggal di Supabase**, bukan di file website. Admin dan halaman
  publik sama-sama membaca database yang sama.
- **Ubah konten ≠ redeploy.** Redeploy hanya dibutuhkan kalau kodenya
  berubah (`index.html`, `admin.html`, `css/`, `js/`).
- Kredensial dibaca berlapis: `config.local.js` (milik Anda, tidak
  di-commit) menang bila ada; kalau tidak ada, dipakai
  `config.production.js` (anon key publik, ikut ter-deploy). Kalau
  keduanya hilang → mode seed + banner "Showing cached content…".

## Bagian 0 — Pastikan backend hijau (sekali saja)

1. Supabase SQL Editor → Run **seluruh** `supabase/schema.sql` → `Success`.
2. Run `supabase/seed.sql` per blok bila perlu → `Success`.
3. Cek jumlah baris: projects **3**, certificates **7**, tech_stack **18**:
   ```sql
   select count(*) from public.projects;
   select count(*) from public.certificates;
   select count(*) from public.tech_stack;
   ```
4. Authentication → 1 admin user berstatus Confirmed (Auto Confirm ON).
5. Storage → bucket `portfolio-media` ada dan Public.
6. Uji RLS (perintah lengkap di `docs/adr/0001-supabase-backend.md`):
   baca anonim → 200, tulis anonim → 401.

## Bagian 1 — Sambungkan Vercel (sekali saja)

1. Push repo ini ke GitHub (`git push`). Pastikan commit terbaru
   (termasuk `config.production.js`) ikut ter-push.
2. Buka dashboard Vercel → project Anda. Jika deploy otomatis aktif
   (bawaan saat import dari GitHub), tunggu ±1 menit sampai status
   **Ready**. Jika tidak: Deployments → titik tiga → **Redeploy**.
3. Tidak perlu setting environment variable, build command, atau
   routing khusus — `/admin.html` bisa dibuka langsung karena filenya
   memang ada (static murni, tanpa framework).

## Bagian 2 — Verifikasi produksi (setiap habis deploy)

1. Buka `https://<nama-anda>.vercel.app/` → **tidak boleh ada** banner
   "Showing cached content…". Kalau ada → config tidak terbaca, lihat
   tabel masalah di bawah.
2. Buka `https://<nama-anda>.vercel.app/admin.html` → login admin.
3. Tambah proyek `E2E-PROBE-cek` → "Project saved".
4. Buka halaman publik di **incognito** → kartu muncul. Hapus lagi
   proyeknya lewat admin → hilang. Inbox: kirim pesan dari form kontak
   → muncul di admin → tandai baca → hapus.

## Bagian 3 — Cara pakai sehari-hari

- Edit konten dari HP/laptop mana pun: buka `/admin.html` di alamat
  Vercel → login → tambah/edit/hapus → tersimpan ke Supabase.
- Pengunjung langsung melihat hasil — tidak perlu buka Vercel, tidak
  perlu redeploy, tidak perlu sentuh kode/VS Code.
- Tambah gambar: upload di form admin (maks 2 MB, otomatis ke bucket
  `portfolio-media`) atau tempel URL `https://…`.
- Perubahan kode (tampilan/fitur) → commit + push → Vercel deploy ulang
  otomatis → verifikasi Bagian 2.

## Bagian 4 — Kalau ada masalah

| Gejala di Vercel | Penyebab | Perbaikan |
|---|---|---|
| Banner "Showing cached content…" | `config.production.js` tidak ter-deploy / URL salah | Pastikan file ter-commit + ter-push; cek isi URL project |
| Admin: "Backend isn't configured" | Sama seperti di atas | Sama seperti di atas |
| Login gagal | User belum Confirmed / salah project | Authentication → cek status; samakan URL dengan project yang benar |
| Simpan gagal / 401 | Sesi kedaluwarsa | Log out → log in lagi |
| Gambar rusak | Bucket tidak Public / policy Storage belum jalan | Storage → cek bucket; re-run `supabase/schema.sql` |
| Pesan kontak tidak masuk inbox | Policy insert `messages` belum efektif | Re-run **penuh** `supabase/schema.sql`, uji ulang probe |
| Data lama muncul setelah edit | Cache browser / realtime terputus | Refresh; cek koneksi; data di DB adalah kebenaran |

## Bagian 5 — Keamanan & rotasi key

- Yang terlihat di source code website (anon key) **aman terlihat** —
  Supabase merancangnya begitu; pagarnya adalah RLS di database.
- Yang **tidak boleh bocor**: `service_role`, password admin, JWT secret.
- Kalau anon key perlu diganti: Supabase dashboard → Project Settings →
  API → buat/putar key → update `config.production.js` (dan
  `config.local.js` lokal) → commit + push → redeploy.
