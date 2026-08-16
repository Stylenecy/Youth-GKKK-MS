# AGENT.md — Youth GKKK Management System (YGMS v2)

Instruksi untuk AI yang melanjutkan proyek ini. Baca dulu sebelum ngoding.

## Apa Ini
Platform internal pengurus **Komisi Pemuda GKKK Yogyakarta** (kepengurusan 2026).
Mengelola: jadwal ibadah & latihan, penatalayan/liturgos, data anggota & Cross,
keuangan, rapat, dan arsip.

## Stack
- **Next.js 16** (App Router, TypeScript Strict, `src/`) + **React 19**
- **Tailwind CSS v4** (CSS-first config di `src/app/globals.css`)
- **Supabase** (Postgres + Auth) via `@supabase/ssr` — coming
- Deploy target: **Vercel**

## Design System — "Sanctuary Editorial" (JANGAN DIRUSAK)
**DNA: Warm parchment palette + SINGLE amber accent.** Bukan dark glassmorphic.

| Token | Value |
|-------|-------|
| Canvas | `#FAF8F5` (warm parchment) |
| Surface | `#FFFFFF` (white cards) |
| Ink | `#2D2D2D` (deep charcoal) |
| Accent | `#B45309` (amber — SATU aksen) |
| Border | `#E5DCD0` (warm border) |

**Typography trio:**
- **Fraunces** (serif display) — headings, section labels
- **Geist** (sans) — body text, navigation
- **Geist Mono** (mono) — numbers, dates, tags, section-number prefix

**Tidak ada:** gradients, glassmorphism, heavy shadows, neon, glowing elements.

## Arsitektur Penting
- **Data layer tunggal:** `src/lib/data.ts`. Semua halaman ambil data dari sini.
  - Kalau env Supabase ada → data DB (coming).
  - Kalau tidak → fallback ke `src/lib/seed.ts` (mode demo).
  - Web SELALU render sesuatu. Jangan bypass layer ini.
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
