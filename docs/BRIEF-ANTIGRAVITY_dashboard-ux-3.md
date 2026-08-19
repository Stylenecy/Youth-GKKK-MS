> ⏱️ **Ditulis 19 Agustus 2026, ~13:00 WIB** oleh Claude (Sonnet 5), setelah audit langsung
> ke database produksi + pembacaan kode. Semua angka di brief ini **diukur, bukan ditebak** —
> query SQL-nya dilampirkan supaya kamu bisa mengulang sendiri.

# BRIEF ANTIGRAVITY — YGMS Dashboard: bersihkan "AI slop", perbaiki usability

**Untuk:** Antigravity
**Dari:** Claude (sesi audit 19 Ags)
**Sumber keluhan:** Dex sendiri, 19 Ags 2026 — 19 poin, sudah ditriase di §3 dan §4.

---

## 0. ATURAN MUTLAK — melanggar satu = pekerjaanmu ditolak seluruhnya

Ini bukan formalitas. **Setiap aturan di bawah ada karena sudah pernah dilanggar di proyek ini.**

1. **DILARANG MENGAKU BERHASIL TANPA MEMBUKTIKAN.** "Sudah saya perbaiki" tanpa angka =
   ditolak. Setiap klaim wajib disertai bukti yang kamu jalankan sendiri: output tes, kode
   status HTTP, hasil ukur. *(Laporanmu 19 Ags menulis "SIAP PRODUKSI (production-ready &
   verified)" padahal 43 berkas belum di-commit dan produksi masih versi 16 Agustus.)*
2. **DILARANG operasi git destruktif:** `checkout`, `restore`, `reset`, `clean`, `rm -rf`.
   `git status` dulu sebelum operasi git apa pun.
3. **DILARANG commit secret.** Periksa isi file sebelum staging.
4. **DILARANG memasukkan data pribadi jemaat** (nama lengkap, tanggal lahir, nomor HP) ke
   kode, seed, atau dokumen yang ter-commit. Ini pernah terjadi.
5. **DILARANG mengubah arah desain "Nocturne" tanpa izin Dex.** Palet, tipografi, dan bahasa
   visual sudah final dan sudah diverifikasi kontrasnya. Kamu **merapikan**, bukan mendesain
   ulang. *(Dex: "aku ngga suka desain yang digonta-ganti Antigravity.")*
6. **DILARANG menurunkan standar §5.** Kalau perubahanmu bikin kontras memburuk, bundle
   membengkak, atau tes gagal — batalkan perubahanmu, jangan turunkan standarnya.
7. **DILARANG menyentuh apa pun di §4** (daftar "BUKAN tugasmu"). Bug di situ sudah
   didiagnosa presisi dan akan dikerjakan sesi lain. Kalau kamu "sekalian perbaiki", kamu
   akan bentrok dan menghapus perbaikan yang benar.
8. **Kalau tidak yakin, katakan tidak yakin.** Laporan jujur soal kekurangan dinilai **lebih
   baik** daripada laporan yang mengaku sempurna lalu ketahuan salah.

**Wajib:** setelah setiap perubahan berarti → `npm run build` → `npx tsc --noEmit` →
`npx vitest run` → laporkan angkanya.

---

## 1. Konteks singkat

Sistem manajemen pelayanan **Komisi Pemuda GKKK Yogyakarta**. Satu sistem menggantikan
tebaran spreadsheet.

- **Live:** https://youth-gkkk-ms.vercel.app (production per 19 Ags = commit `df45912`)
- **Stack:** Next.js 16.2.9 (App Router, Turbopack) + Supabase + Vercel
- **Desain:** "Nocturne" — gelap, kanvas `#0F0A08`, api emas `#FDBE02`, maroon `#83021C`,
  serif Fraunces. **Sudah final.**
- **Supabase sudah HIDUP.** Bukan lagi mode demo. Data asli sudah masuk (angka di §2).

### Keadaan basis data — diverifikasi 19 Ags, bukan asumsi

| Tabel | Baris | Catatan |
|---|---|---|
| `profiles` | **93** | benar |
| `crosses` | **8** | 5 aktif + 3 duplikat lama sengaja dinonaktifkan |
| `cross_memberships` | **39** | 8 leader + 31 anggota |
| `events` | **31** | 29 dari impor (Jan–25 Jul) + 2 ditambah Dex manual |
| `steward_assignments` | **216** | benar |
| `finance_transactions` | **6** | 🔴 harusnya 5 — ada 1 duplikat, lihat §4 |
| `audit_logs` | **0** | 🔴 tidak ada kode yang pernah menulis ke sini, lihat §4 |
| `meeting_notes` | **0** | belum pernah diisi |

---

## 2. Cara kerja yang diharapkan

Dex bekerja dengan beberapa AI bergantian. Pembagiannya sesi ini:

- **Kamu (Antigravity):** semua yang di §3 — **visual, layout, usability, komponen UI.**
- **Sesi Claude berikutnya:** semua yang di §4 — **bug data-layer & query.**

Alasan pembagian: bug di §4 sudah didiagnosa sampai nomor barisnya dan perbaikannya presisi
(beberapa baris per berkas). Kalau dikerjakan sambil lalu tanpa diagnosis itu, hasilnya
tebakan. Sebaliknya §3 butuh banyak iterasi visual — itu kekuatanmu.

**Alur:** kamu kerjakan §3 → Dex balik ke sesi Claude → diff-mu di-review → di-commit & push.
**Jangan commit sendiri kecuali Dex memintanya.**

---

## 3. TUGASMU — urut prioritas

### 🔴 T1. Bersihkan "AI slop" di seluruh dashboard

Keluhan Dex persis: *"masih ada banyak banget unsur AI slop di web."* Ini keluhan paling
penting dan paling tidak spesifik, jadi berikut penerjemahannya jadi hal konkret yang
**benar-benar ada di kode sekarang** (semua contoh di bawah nyata, sudah dicek):

**a. Titik status kelap-kelip di mana-mana.** *(keluhan #7: "Banyak banget pemakaian titik
status live yang kelap-kelip bruhhhh")*
Cari semua `animate-pulse`, `animate-ping`, dan titik `h-1.5 w-1.5 rounded-full` yang
dipakai sebagai hiasan. Contoh nyata: `src/app/dashboard/members/page.tsx:50`.
**Aturan baru:** titik berkedip HANYA boleh untuk sesuatu yang benar-benar sedang berubah
saat itu (mis. status loading). Untuk penanda seksi statis → hapus, atau ganti jadi elemen
statis. Ini bukan soal selera: kedipan tanpa makna itu noise, dan menyalahi
`prefers-reduced-motion` secara semangat.

**b. Kicker/label dekoratif berlebihan.** Pola `( SEMUA ANGGOTA YOUTH )`, `( 01 )`, `( FOKUS
PELAYANAN )` dengan kurung + font mono + `tracking-[0.2em]` dipakai hampir di setiap blok.
Di landing page itu bagian dari bahasa desain dan boleh tetap. **Di dashboard — alat kerja
yang dipakai tiap minggu — itu jadi hiasan yang memperlambat pembacaan.** Kurangi drastis di
`src/app/dashboard/**`. Pertahankan judul yang informatif, buang yang cuma gaya.

**c. Teks berbunga-bunga di UI kerja.** Contoh nyata di `members/page.tsx`: kicker
"DIREKTORI JEMAAT" + judul "Daftar Anggota" + meta "93 total anggota terdaftar · 93
berstatus aktif" + heading "( SEMUA ANGGOTA YOUTH )" + "93 Anggota" — **angka 93 muncul 3×
dan judulnya 2×, di satu layar.** Rapikan jadi satu judul + satu baris konteks.

**d. Efek hover/shadow bertumpuk.** Banyak kartu punya `hover:-translate-y-1` +
`hover:shadow-[0_12px_32px_...]` + `hover:border-accent` + `hover:bg-surface` +
`transition-all duration-300` sekaligus. Pilih satu atau dua sinyal hover, konsisten di
seluruh dashboard.

**Batasnya:** kamu **tidak** mengubah warna token, tipografi, atau struktur navigasi. Kamu
membuang hiasan dan merapikan hierarki. Kalau ragu apakah sesuatu "slop" atau "identitas
desain" — **tanyakan Dex, jangan putuskan sendiri.**

---

### 🔴 T2. Halaman Daftar Anggota: tabel + pencarian

*(keluhan #9 & #10: "Cara Daftar Anggota di-list in masih sangat tidak nyaman dilihat mata…
table-wise visual akan lebih menyenangkan no?" · "Ngga ada quick search… usability nya masih
jelek banget")*

Sekarang: 93 orang sebagai **kartu grid 3 kolom** (`members/page.tsx:60`). Untuk mencari satu
orang, harus scroll dan memindai 93 kartu. Tidak ada pencarian, filter, atau urutan.

**Yang dibangun:**
1. **Tampilan tabel** sebagai default di layar ≥`sm`. Kolom: Nama · Nickname · Status ·
   Cross · aksi (→ detail). Di layar HP tetap kartu/baris ringkas — tabel 5 kolom tidak
   terbaca di 375px.
2. **Kotak pencarian instan** di atas tabel — filter di klien (93 baris, tidak perlu
   round-trip server), cocokkan terhadap nama **dan** nickname, tidak peka huruf besar-kecil.
3. **Filter status** (Aktif / Berhalangan / Alumni / Tidak aktif) dan **filter Cross**.
4. Header kolom bisa diklik untuk mengurutkan (minimal: nama).
5. Hitungan yang jujur: "menampilkan X dari 93".

**Catatan penting:** kolom `whatsapp` **tidak boleh** ikut ke tabel ini. Nomor hanya keluar
lewat `getMemberWhatsapp()` (SECURITY DEFINER, cek peran di SQL). Jangan panggil
`select("*")` pada `profiles` — akan error karena migrasi 0006 mencabut hak baca kolom itu.
Pakai konstanta `PROFILE_COLUMNS` yang sudah ada di `src/lib/data.ts:23`.

**Aksesibilitas:** input pencarian wajib punya `<label>` (boleh `sr-only`), tabel wajib punya
`<caption>` atau `aria-label`, dan hasil filter kosong harus punya empty state yang menuntun.

---

### 🔴 T3. Halaman Pengaturan: jadikan halaman pengaturan sungguhan + Light/Dark mode

*(keluhan #6: "Pengaturannya aslinya buat apa nih? Harusnya bener-bener pengaturan layaknya
umumnya ngga sih? Minimal banget deh, ada opsi Light Mode sama Dark Mode")*

Sekarang `/dashboard/settings` hanya menampilkan peran akun yang sedang login. Itu informasi,
bukan pengaturan.

**Yang dibangun:**
1. **Toggle tema: Terang / Gelap / Ikuti sistem.** Ini pekerjaan paling berat di T3 —
   **baca peringatan di bawah.**
2. Blok **Akun** — nama, email, peran (yang sudah ada), dipindah ke kartu sendiri.
3. Blok **Tentang sistem** — versi, tautan ke panduan pengurus di `PROJECT_MASTER.md`.

**⚠️ PERINGATAN SERIUS soal Light Mode — baca sampai habis sebelum menulis kode.**

Situs ini **gelap-saja by design**, dan token warnanya sudah diaudit ketat:
- 26+ pasangan warna sudah diverifikasi lulus WCAG AA. **Itu semua diverifikasi untuk palet
  gelap.** Palet terang = **26+ pasangan baru yang harus diverifikasi dari nol.**
- `--color-surface` sekarang `#211B17` dan itu **plafon maksimal** — dicoba naik lebih,
  4 pasangan teks langsung gagal AA. Konsekuensinya `--color-surface-2` sekarang **sama
  persis** dengan `--color-surface`; pembeda satu-satunya adalah border `--color-line`
  (`#776859`, 3,17–3,66:1 di semua permukaan).
- Maroon `#83021C` di latar gelap cuma **1,87:1** — dipakai sebagai *fill*, tidak pernah
  membawa teks; variannya `rose #C77384` (5,8:1) yang membawa teks. **Di latar terang
  relasinya terbalik total.**

**Cara mengerjakannya yang benar:**
- Semua warna sudah jadi token CSS di `src/app/globals.css`. **Definisikan palet terang
  sebagai set token tandingan**, jangan menyentuh satu pun `className` di 30+ berkas tsx.
  Kalau kamu mendapati diri mengedit `className` warna di file halaman, kamu salah jalan.
- Sudah ada **skrip audit kontras otomatis** yang membaca token langsung dari `globals.css`
  dan memindai tiap pasangan `text-*`/`bg-*` di seluruh tsx. **Jalankan skrip itu untuk palet
  terang** dan laporkan angkanya. Hasil wajib: **0 pasangan gagal.**
- Hormati `prefers-color-scheme` untuk mode "Ikuti sistem", dan simpan pilihan eksplisit
  (localStorage atau cookie). **Wajib tidak ada flash** tema salah saat load (FOUC) — ini
  aplikasi SSR, jadi butuh script inline kecil di `<head>` sebelum paint.

**Kalau setelah mencoba ternyata palet terang tidak bisa lulus 0-kegagalan tanpa mengubah
identitas brand: LAPORKAN ITU, jangan paksakan dengan menurunkan standar.** Lebih baik Dex
tahu "light mode butuh keputusan brand dulu" daripada dapat light mode yang teksnya tidak
terbaca. Ini persis kasus yang aturan §0.6 lindungi.

---

### 🟡 T4. Dashboard: urutan layout & kelelahan pelayan

*(keluhan #12b: "penempatannya masih kacau banget, how come quick button options ada di bawah
banget setelah harus scroll fatigue alert sepanjang itu?")*

Di `src/app/dashboard/page.tsx`, blok peringatan kelelahan (`fatigueAlerts`, baris ~303–340)
berada **di atas** blok aksi cepat (~baris 373). Ketika banyak orang kena peringatan,
daftarnya panjang dan tombol yang paling sering dipakai terdorong jauh ke bawah.

**Yang dikerjakan:**
1. **Naikkan aksi cepat ke atas** — persis di bawah kartu KPI. Itu yang dipakai tiap minggu.
2. **Batasi daftar kelelahan**: tampilkan maksimal 3–5 orang + "lihat semua (N)" yang membuka
   sisanya. Jangan render 20 baris sekaligus.
3. Peringatan kelelahan turun ke bawah spotlight ibadah.

⚠️ **Angka di blok kelelahan itu sedang salah** — itu bug data, ada di §4 dan **bukan tugasmu**.
Kamu hanya mengubah **urutan dan panjangnya**, jangan menyentuh cara menghitungnya.
Kalimat "melayani >3 kali dalam 30 hari terakhir" (baris ~322) **biarkan apa adanya** —
akan disesuaikan bersama perbaikan query.

---

### 🟡 T5. Form Ibadah: tempat & pembatasan PIC

*(keluhan #17 & #18)*

**a. Tempat/lokasi ibadah.** Sekarang tidak ada kolom tempat sama sekali. Yang diminta:
- Kolom **Tempat**, **default terisi "Ruang Hermon"**.
- Opsi **"Lokasi lain…"** yang membuka input teks bebas.
- Kolom **tautan Google Maps, opsional**, muncul saat lokasi custom dipilih.

⚠️ Tabel `events` **belum punya kolom untuk ini** (kolom yang ada: `id, date, weekly_theme,
event_type, pic_id, speaker_name, description, monthly_theme_id, status, archived_at,
created_at, updated_at`). **Jangan menulis migrasi sendiri.** Bangun UI-nya, tandai di
laporanmu bahwa butuh migrasi `location text` + `location_url text`, dan **beri tahu Dex** —
migrasi akan ditulis di sesi Claude bersama perbaikan §4 supaya tidak bentrok.

**b. Daftar PIC terlalu panjang.** Sekarang dropdown PIC di `CreateEventForm.tsx:109` memuat
**seluruh 93 anggota**. Yang diminta: **hanya pengurus.**
⚠️ Basis data **belum punya penanda "pengurus"** (`admin_emails` isinya email, bukan relasi ke
`profiles`; tidak ada kolom `is_committee`). Sama seperti (a): **bangun UI-nya dengan asumsi
akan ada daftar pengurus, jangan mengarang kriteria sendiri**, dan laporkan bahwa ini butuh
keputusan Dex (siapa saja yang masuk "pengurus") + migrasi.

---

### 🟡 T6. Menu "Kelompokku" vs "Cross" terasa kembar

*(keluhan #8: "kenapa setiap kali menekan tombol Kelompokku di sidebar, selalu langsung
mengarah seakan tombol Cross. Kalau begitu, apa bedanya?")*

**Ini bukan bug redirect — ini konsekuensi desain.** `src/app/dashboard/cross/mine/page.tsx:41`:

```ts
const manageable = isAdmin ? crosses : crosses.filter((c) => myLeaderCrossIds.includes(c.id));
```

Dex adalah **admin**, jadi cabang `isAdmin` memberinya **seluruh 8 Cross** — persis isi halaman
`/dashboard/cross`. Untuk Cross Leader biasa kedua halaman itu berbeda jelas; untuk admin,
kembar.

**Yang dikerjakan:** buat perbedaannya terbaca, jangan hapus salah satunya.
- "Kelompokku" harus **selalu menaruh kelompok yang benar-benar dipimpin sendiri di paling
  atas**, dengan penanda jelas, lalu kelompok lain di bawah sebagai bagian terpisah berjudul
  "Kelompok lain (akses admin)".
- Kalau admin tidak memimpin kelompok mana pun, katakan itu terang-terangan, jangan diam-diam
  menampilkan semuanya seolah miliknya.

---

### 🟢 T7. Tombol "Tambah via Kelompokku" yang membingungkan

*(keluhan #14: "Buat apa tombol Tambah via Kelompokku di Daftar Anggota?")*

`members/page.tsx:28-34` — tombol itu **hanya `<Link>` ke `/dashboard/cross/mine`**, tidak
menambah apa pun. Ada karena penambahan anggota harus lewat sebuah Cross (RPC
`add_cross_member` butuh `cross_id`).

**Yang dikerjakan:** buat maksudnya jelas. Ganti labelnya jadi sesuatu yang jujur (mis.
"Tambah anggota lewat Cross →") dan beri satu baris penjelasan kecil kenapa lewat Cross.
Jangan hapus tombolnya.

---

### 🟢 T8. Performa perpindahan halaman

*(keluhan #19: "pindah page masih lambat ya, memang berat ya…")*

Sebelum mengoptimasi, **ukur dulu** — jangan menebak. Yang dicek:
1. Apakah setiap halaman menunggu query berurutan yang seharusnya paralel? Cari `await` yang
   berderet dan bisa jadi satu `Promise.all` (`dashboard/page.tsx:40` sudah benar — pakai itu
   sebagai contoh, periksa halaman lain).
2. Halaman anggota memuat 93 profil penuh setiap kali — dengan tabel di T2, muat hanya kolom
   yang dipakai.
3. Apakah ada `loading.tsx`? Tanpa itu navigasi terasa menggantung walau datanya cepat.
   Menambahkan skeleton per rute sering memperbaiki *rasa* lambat lebih besar daripada
   optimasi query.
4. Cek chunk Three.js **tidak** ikut termuat di rute dashboard (harusnya hanya di landing).

**Laporkan angka sebelum dan sesudah.** "Terasa lebih cepat" tanpa angka = ditolak.

---

## 4. BUKAN TUGASMU — jangan disentuh sama sekali

Bug-bug ini **sudah didiagnosa sampai nomor baris** dan akan diperbaiki di sesi Claude.
Didaftar di sini supaya kamu **mengenalinya dan tidak "sekalian memperbaiki"** — kalau kamu
menebak sendiri, hasilnya bentrok.

| # | Gejala yang Dex lihat | Akar masalah sebenarnya |
|---|---|---|
| 12a | "semua orang udah pelayanan 8x keatas dalam sebulan? [satu anggota] bisa 13x?!" | `src/lib/data.ts:168` memfilter `steward_assignments.created_at` — itu **kapan barisnya diimpor** (semuanya 19 Ags), bukan kapan ibadahnya. Semua 216 baris masuk jendela "30 hari". Terverifikasi: tugas dalam 30 hari terakhir sebenarnya = **0**; angka 13 itu total Jan–Jul. Perbaikannya: join ke `events.date`. |
| 15/16 | "PIC belum bisa tercatat di UI padahal sudah dipilih" · "kenapa malah harus input beberapa data ulang" | PIC **tersimpan benar di database** (dicek: `pic_id` terisi untuk kedua ibadah baru). Bug ada di sisi **baca**: `data.ts:246` & `:258` melakukan `return data as Event[]` — **cast paksa tanpa memetakan snake_case→camelCase**. DB mengirim `pic_id`/`weekly_theme`, tipe `Event` menunggu `picId`/`weeklyTheme` → selamanya `undefined`. Ini juga alasan form "Ubah Ibadah" minta isi ulang: pre-fill-nya kosong. `date` bertahan karena kebetulan namanya sama. |
| 15b | "1 Agustus dikasih label Rencana, padahal detailnya bilang Sudah Lewat" | Form menyimpan `status: 'draft'` → label "Rencana", sementara badge lain dihitung dari tanggal. Dua sumber kebenaran untuk satu hal. |
| 3 | "Kas Keuangan 0" | `data.ts:101` memfilter `created_at >= tanggal 1 bulan ini`. Semua transaksi bertahun 2025 → jumlahnya 0. KPI-nya "kas bulan ini" tapi dilabeli seolah saldo total. |
| 3b | — | `finance_transactions` berisi **6 baris, harusnya 5**: ada satu transaksi kenang-kenangan yang masuk dua kali dengan ejaan deskripsi berbeda tipis (jumlah, tanggal, dan pencatatnya identik). Butuh DELETE bertarget. |
| 5 | "Cara audit tercatat bagaimana?" | **Tidak ada satu pun kode yang menulis ke `audit_logs`** — tabel itu hanya pernah dibaca (`data.ts:201`). Halaman Audit akan kosong selamanya sampai penulisan audit dibuat. Terverifikasi: 0 baris. |
| 13 | "Somehow semua anggota aktif? Padahal di Excel sudah terpisah" | `scripts/import/import_members.py:185` — `status = "active" if m["num"] <= 93 else "inactive"`. Karena semua 93 orang bernomor ≤93, **semuanya dipaksa 'active'**; kolom status di Excel diabaikan total. |
| 13b | "Masih ada nama yang tidak lengkap" | Nama mengikuti sumber Excel. Butuh Dex menunjuk baris mana yang salah. |

**Juga bukan tugasmu (fitur baru, butuh keputusan Dex + skema DB baru):**
- **#11 Absensi** — Dex menyebutnya *"salah satu fitur terpenting yang aku butuh banget"*.
  Butuh tabel baru, alur pencatatan, dan keputusan (per ibadah? per Cross? siapa yang mengisi?).
  **Jangan mulai.** Ini butuh sesi desain tersendiri bersama Dex.
- **#4 CRUD untuk Sekretaris** — butuh definisi peran 'secretary' di DB + RLS. **Jangan mulai.**
- **#1 Jadwal ibadah setelah 25 Juli** — bukan bug. Data impor memang berhenti di 25 Juli
  (sumbernya cuma sampai situ). Tim Ibadah tinggal mencatat lewat aplikasi. Tidak ada yang
  perlu diperbaiki.

---

## 5. STANDAR YANG WAJIB DIPERTAHANKAN (angka nyata, sudah tercapai)

| Ukuran | Nilai sekarang | Aturan |
|---|---|---|
| Tes otomatis | **85/85 lulus** | Harus tetap lulus semua. Kalau kamu menambah komponen, tambah tesnya. |
| `npx tsc --noEmit` | bersih | Harus tetap bersih |
| `npm run build` | hijau, 20 rute | Tidak boleh ada rute mati |
| Pasangan warna lulus WCAG AA | **26/26**, 0 hardcoded | Tidak boleh bertambah gagal. Teks 4,5:1 · border kontrol 3:1 |
| JS awal halaman depan | **188,9 KB gzip** | Tidak boleh membengkak tanpa alasan yang kamu tulis |
| Chunk Three.js | 131,7 KB, **lazy** | Tidak boleh masuk muatan awal, apalagi ke rute dashboard |
| `<h1>` per halaman | tepat 1 | Pertahankan |
| Aksesibilitas | fokus keyboard terlihat · target sentuh memadai · `prefers-reduced-motion` dihormati · terbaca saat zoom 200% · alt text lengkap | Semua wajib |

---

## 6. CHECKLIST WAJIB sebelum kamu bilang "selesai"

Jawab satu per satu **dengan bukti**. Jawaban "sudah" tanpa angka tidak diterima.

- [ ] `npm run build` lulus. Keluaran: ______
- [ ] `npx tsc --noEmit` bersih. Keluaran: ______
- [ ] Tes: ___/85 lulus
- [ ] Kegagalan kontras **tema gelap**: ___ (harus 0). Cara aku mengukurnya: ______
- [ ] Kegagalan kontras **tema terang** (kalau T3 dikerjakan): ___ (harus 0). Cara: ______
- [ ] JS klien sekarang: ___ KB gzip (sebelumnya 188,9). Kalau naik, alasannya: ______
- [ ] Chunk Three.js masih lazy & tidak ada di rute dashboard. Cara aku memastikan: ______
- [ ] Tabel anggota tidak pernah menerima kolom `whatsapp`. Bukti: ______
- [ ] Tidak ada nama/tanggal lahir/nomor HP jemaat masuk ke kode. Bukti pencarian: ______
- [ ] Aku tidak menyentuh apa pun di §4. Berkas yang kuubah: ______
- [ ] Aku tidak menjalankan git destruktif. Perintah git yang kujalankan: ______
- [ ] Perubahan tema tidak menimbulkan flash (FOUC). Cara aku menguji: ______
- [ ] Bug yang kutemukan tapi tidak kuperbaiki: ______
- [ ] Hal yang aku TIDAK yakin: ______

---

## 7. Format laporan yang harus kamu serahkan

Bahasa Indonesia sederhana. Struktur:

1. **Angka hasil ukur** (build, tes, kontras, ukuran bundle) — hasil yang kamu jalankan sendiri
2. **Apa yang kuubah dan kenapa** — per tugas T1–T8
3. **Apa yang gagal / tidak sempat, dan kenapa**
4. **Apa yang butuh migrasi DB atau keputusan Dex** (khususnya dari T5)
5. **Hasil checklist §6, satu per satu**
6. **Hal yang aku ragukan**

> Laporanmu akan diaudit ulang terhadap kode yang sebenarnya. **Laporan yang jujur tentang
> kekurangannya dinilai lebih baik** daripada laporan yang mengaku sempurna lalu ketahuan
> salah — itu persis yang terjadi pada laporan 19 Ags, dan itu sebabnya brief ini ada.
