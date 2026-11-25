# Panduan Deploy Vercel + Backend Supabase

Tujuan: edit konten lewat halaman admin dari mana saja, dan pengunjung langsung melihat
perubahannya tanpa redeploy untuk perubahan konten.

## Cara kerja (wajib paham dulu, 1 menit)

- **Data tinggal di Supabase**, bukan di file website. Admin dan halaman publik membaca
  database yang sama.
- **Ubah konten ≠ redeploy.** Redeploy hanya dibutuhkan kalau kode berubah (`src/`,
  `index.html`, `admin.html`, `public/`).
- Situs sekarang **di-build** (Vite). Vercel menjalankan `npm run build` dan menyajikan `dist/`.
- Kredensial dibaca dari variabel `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`. Nilai
  default ada di `.env.production` (anon key publik, ikut ter-commit). Variabel dengan nama
  sama di dashboard Vercel menimpanya. Tanpa keduanya → mode seed + banner "Showing cached content…".

## Bagian 0 — Backend hijau (sekali saja)

Ikuti `docs/SECURITY-RUNBOOK.md` langkah 1–4 (matikan sign-up, tandai admin, terapkan migrasi).
Lalu cek jumlah baris: projects **3**, certificates **7**, tech_stack **18**:

```sql
select count(*) from public.projects;
select count(*) from public.certificates;
select count(*) from public.tech_stack;
```

## Bagian 1 — Sambungkan Vercel (sekali saja)

1. Push repo ke GitHub, import ke Vercel. `vercel.json` sudah berisi framework Vite,
   header keamanan (CSP, HSTS, dll.) dan rewrite `/admin` → `/admin.html`.
2. Tunggu status **Ready**. Tidak perlu env var kecuali ingin menimpa `.env.production`.
3. Jalankan migrasi `0003` segera setelah deploy pertama build baru ini.

## Bagian 2 — Verifikasi produksi (setiap habis deploy)

1. Buka `https://<domain>/` → **tidak boleh ada** banner "Showing cached content…".
2. Buka `/admin.html` → login admin.
3. Tambah proyek `E2E-PROBE-cek` → "Project saved"; lihat di jendela incognito; hapus lagi.
4. Kirim pesan dari form kontak → muncul di Inbox → tandai baca → hapus.
5. DevTools → Network: tidak ada permintaan ke host selain domain Anda dan `*.supabase.co`;
   Console: tanpa pelanggaran CSP.

## Bagian 3 — Sehari-hari

- Edit konten: `/admin.html` → login → tambah/edit/hapus.
- Tambah gambar: upload di form admin (diperkecil otomatis jadi WebP ≤ 1600px, maks 2 MB
  setelah kompresi) atau tempel URL `https://…`.
- Perubahan kode: PR → CI hijau (`quality`, `e2e`, `lighthouse`) → merge → Vercel deploy.

## Bagian 4 — Masalah umum

| Gejala di Vercel                           | Penyebab                                                | Perbaikan                                                                                |
| ------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Banner "Showing cached content…"           | env tidak terbaca / URL salah / Supabase tertidur       | Cek `.env.production` atau env Vercel; buka dashboard Supabase untuk membangunkan proyek |
| Admin: "Backend isn't connected"           | Sama seperti di atas                                    | Sama                                                                                     |
| Login berhasil tapi simpan gagal (401/403) | Akun belum ditandai admin atau JWT lama                 | Runbook langkah 2, lalu log out/in                                                       |
| Gambar sertifikat pertama rusak            | Migrasi `0003` belum dijalankan                         | Jalankan `0003`                                                                          |
| Pesan kontak gagal                         | Migrasi `0002` belum diterapkan atau terkena rate limit | Terapkan `0002`; tunggu 1 jam bila 3 pesan dengan email sama                             |
| Console penuh pelanggaran CSP              | Sumber baru (domain gambar/skrip)                       | Ubah `Content-Security-Policy` di `vercel.json` secara sadar                             |

## Bagian 5 — Keamanan & rotasi key

- Anon key aman terlihat (pagarnya RLS). **Tidak boleh bocor**: `service_role`, password admin, JWT secret.
- Putar key: Supabase → Project Settings → API → buat key baru → perbarui `.env.production` / env Vercel → redeploy.
