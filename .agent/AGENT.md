# AGENT.md — Youth GKKK Management System (YGMS v2)

Instruksi untuk AI yang melanjutkan proyek ini. Baca dulu sebelum ngoding.

## Apa Ini
Platform internal pengurus **Komisi Pemuda GKKK Yogyakarta** (kepengurusan 2026).
Mengelola: jadwal ibadah & latihan, penatalayan/liturgos, data anggota & Cross,
keuangan, rapat, dan arsip.

## Stack
- **Next.js 16** (App Router, TypeScript Strict, `src/`) + **React 19**
- **Tailwind CSS v4** (CSS-first config di `src/app/globals.css`)
- **Supabase** (Postgres + Auth) via `@supabase/ssr` — **LIVE di produksi**
  (project `rbouxffjcqjwywyhbtqw`). 93 profil, 5 Cross, 29 ibadah, 216
  penatalayan sudah ter-import (18 Ags 2026). Login Google jalan.
- **Three.js** — dipakai di landing (`src/components/landing/EmberCrest.tsx`),
  selalu lewat dynamic import, jangan pernah `import * as THREE`.
- Deploy target: **Vercel** — https://youth-gkkk-ms.vercel.app

## Design System — "Nocturne" (JANGAN DIRUSAK)
> ⚠️ **18 Ags 2026: seluruh situs dipindah dari terang ("Sanctuary Editorial")
> ke gelap ("Nocturne").** Kalau kamu menemukan dokumen lain (termasuk versi
> lama berkas ini) yang menyebut "warm parchment", "Sanctuary Editorial", atau
> melarang glow/gradient — itu **catatan sejarah, bukan aturan aktif**. Jangan
> kembalikan ke terang. Ini bukan selera yang belum final; ini keputusan Dex
> yang sudah diverifikasi (26/26 pasangan warna lulus WCAG AA, lihat
> `PROJECT_MASTER.md` §"18 Ags 2026").

**DNA: dasar gelap hampir hitam + emas brand sebagai satu-satunya sumber
cahaya.** Dua warna ini terikat ke logo (`public/logo/BRAND-GUIDE_Youth-GKKK.md`)
dan tidak boleh diganti:

| Token CSS (`src/app/globals.css`) | Value | Peran |
|-------|-------|-------|
| `--color-canvas` | `#0F0A08` | dasar hampir hitam |
| `--color-surface` | `#1A1210` | kartu |
| `--color-ink` | `#F7EFE2` | teks utama |
| `--color-accent` | `#FDBE02` | emas brand — SATU aksen bercahaya |
| `--color-deep` | `#2A060F` | anchor maroon (section gelap) |
| `--color-maroon` | `#83021C` | maroon brand — HANYA fill, jangan jadi teks (1,87:1, gagal AA) |

**JANGAN PERNAH menulis hex warna baru di className atau style.** Semua warna
lewat token di atas (`bg-accent`, `text-ink-muted`, dst). Kalau butuh warna
yang belum ada, tambahkan token baru di `globals.css` — dengan rasio kontras
dihitung, bukan ditebak (lihat pola di komentar `globals.css`).

**Sekarang BOLEH dan memang dipakai:** glow (`text-shadow`, `box-shadow`
lembut), gradient tipis (`.bloom`, `.meter-fill`), partikel WebGL. **Tetap
tidak boleh:** neon jenuh berlebihan, shadow tebal ala Material, apa pun yang
bikin teks di bawah 4,5:1.

**Typography trio (tidak berubah):**
- **Fraunces** (serif display) — headings, section labels
- **Geist** (sans) — body text, navigation
- **Geist Mono** (mono) — numbers, dates, tags, section-number prefix

**Wajib sebelum bilang selesai:** kalau menambah/mengubah pasangan
teks+background, hitung rasio kontrasnya (formula relative luminance WCAG,
bukan alat pihak ketiga) dan pastikan ≥4,5:1. Cara cepat: baca
`--color-*` yang sudah ada dari `globals.css`, jangan mengetik ulang hex-nya.

## Arsitektur Penting
- **Data layer tunggal:** `src/lib/data.ts`. Semua halaman ambil data dari sini.
  - Kalau env Supabase ada → data DB nyata (produksi: SELALU ada, sudah live).
  - Kalau tidak (dev lokal tanpa `.env.local`) → fallback ke `src/lib/seed.ts`
    (mode demo, tanggal dummy relatif ke hari ini).
  - Web SELALU render sesuatu. Jangan bypass layer ini.
  - ⚠️ **Dev lokal di repo ini TIDAK punya `.env.local`** → yang tampil di
    `npm run dev` lokal adalah data demo/seed, BUKAN 93 anggota asli. Jangan
    kaget kalau tanggal/nama di layar lokal beda dari yang disebut Dex —
    itu memang dua sumber data yang berbeda, bukan bug.
- **Tipe domain:** `src/lib/types.ts` — map ke entity di blueprint.
- **UI components:** `src/components/` — komponen reusable.

## Aturan Keras
- **JANGAN hapus data/histori.** Arsipkan kalau merapikan.
- **Jangan klaim "done" untuk stub.** Verifikasi `npm run build` hijau dulu.
- Tulis progress ke `PROJECT_MASTER.md` setiap unit kerja selesai.
- Komentar & kode: gaya yang sama dengan sekitarnya.

## Perintah
```bash
npm run dev      # Dev server
npm run build    # WAJIB hijau sebelum bilang selesai
npm start        # Serve hasil build
```

## Roadmap Singkat (lihat PROJECT_MASTER.md untuk detail)
Integrasi Supabase (auth + RLS + DB), CRUD via Server Actions, drag-drop steward
assignment, finance form with receipt upload, analytics, deploy Vercel.
