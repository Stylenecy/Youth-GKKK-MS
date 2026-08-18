# BRIEF UNTUK ANTIGRAVITY — Landing Page YGMS, Putaran 2

**Dibuat:** 18 Agustus 2026, oleh Claude Code (sesi yang membangun redesign gelap "Nocturne").
**Sumber:** `.agent/Komentar/Komentar-Ide-LP.txt` — komentar mentah Dex setelah melihat versi pertama.
**Format:** mengikuti pola delegasi proyek ini sendiri (lihat `PROJECT_MASTER.md` §"29 Jul 2026 — Delegation/Handoff Spec").

Format laporan balik ada di §7. Dex sengaja tidak menunggu — kerjakan semua,
lapor di akhir, bukan tanya di tengah jalan kecuali benar-benar di §6.

---

## 0. WAJIB DIBACA DULU — jangan mulai sebelum ini

1. **Baca `.agent/AGENT.md` seluruhnya.** Berkas itu baru saja diperbarui
   (18 Ags, sesi ini juga) karena versi lamanya menyebut design system
   "Sanctuary Editorial" (terang, parchment) dan melarang glow/gradient —
   **itu sudah tidak berlaku**. Situs sekarang gelap ("Nocturne"), dan glow
   memang bagian dari desainnya. **Jangan kembalikan ke terang.** Kalau kamu
   menemukan dokumen LAIN yang menyebut "Sanctuary Editorial" atau palet
   terang, itu arsip sejarah — abaikan, jangan diikuti.
2. **Baca `PROJECT_MASTER.md`, dua entri terakhir** (tanggal 18 Ags): berisi
   alasan lengkap kenapa desain pindah ke gelap, angka kontras, dan apa yang
   sudah diverifikasi. Jangan mengulang riset yang sudah ada di situ.
3. **Jalankan `npm run dev`, buka `http://localhost:3000`, gulir dari atas
   ke bawah sebelum mengubah apa pun.** Rasakan dulu apa yang sudah ada.

---

## 1. Ruang lingkup — HANYA landing page

**Boleh disentuh:**
- `src/app/page.tsx`
- `src/components/landing/*` (HeroCinematic, Preloader, EmberCrest, Reveal)
  — **KECUALI `FrameSequence.tsx`, lihat larangan di bawah**
- `src/app/globals.css` — **hanya kalau perlu token baru**, bukan hex baru
  di tengah komponen
- Sitewide: mengganti teks "Space Youth" → "Youth" di berkas manapun ia
  muncul (daftar lengkap ada di §3.5) — ini satu-satunya perubahan yang
  boleh keluar dari `page.tsx`/`landing/*`

**JANGAN disentuh sama sekali:**
- `src/components/landing/FrameSequence.tsx` dan folder `public/sequence/`
  (belum ada) — ini komponen image-sequence yang nunggu aset 3D render.
  Speknya lengkap di `docs/ASSET-SPEC_landing-3d.md` (60 frame, prompt
  generate, cara potong video, cara pasang). **Aset itu digenerate Dex
  sendiri secara manual** (pakai AI image/video generator + prompt yang
  sudah ditulis khusus, lalu dipotong pakai ffmpeg) — bukan pekerjaan
  Antigravity. Jangan mencoba generate asetnya sendiri walau kamu punya
  akses ke tool image-gen, dan jangan mengubah komponen `FrameSequence.tsx`
  atau menyambungkannya ke `page.tsx`. Komponennya sengaja diam
  (`frameCount={0}`) sampai Dex sendiri yang memasangnya nanti.
- `src/app/dashboard/**` — sudah diupgrade sesi ini juga (kontras gelap,
  hover, meter kesiapan), jangan diapa-apakan
- `src/lib/data.ts`, `src/lib/supabase/**`, `supabase/**`, `scripts/**` —
  data layer, itu bukan pekerjaan desain
- `src/app/login/**`, `src/app/auth/**` — ada fix bug login yang baru saja
  ditemukan (cookie sesi), jangan sampai tertimpa
- `tests/**` kecuali kamu MENAMBAH tes baru untuk hal yang kamu ubah (jangan
  menghapus/melemahkan tes yang sudah lulus)

Kalau kamu merasa perlu menyentuh sesuatu di luar daftar "boleh" demi
menyelesaikan salah satu butir di bawah, **berhenti dan tulis itu di laporan
§7 sebagai pertanyaan**, jangan langsung dikerjakan.

---

## 2. Fakta yang harus kamu tahu sebelum menulis apa pun

Ini bukan asumsi — semua sudah diverifikasi langsung ke database produksi
(`rbouxffjcqjwywyhbtqw`) per 18 Ags 2026:

| Fakta | Detail |
|---|---|
| Data anggota | **93 profil asli sudah ter-import**, bukan dummy. Nama, Cross, skill — semua nyata. |
| Data ibadah | **29 ibadah asli ter-import**, tapi rentangnya cuma **10 Jan – 25 Jul 2026**. |
| Ibadah mendatang di produksi **SEKARANG** | **NOL.** Sumber jadwal (`Jadwal_Penatalayan_Pemuda_.xlsx`) belum diisi untuk Agustus dan seterusnya. Ini bukan bug — datanya memang belum ada. |
| Dev lokal (`npm run dev` tanpa `.env.local`) | Menampilkan **data demo/seed**, BUKAN data asli di atas. Tanggal "Sabtu 22 Agustus" yang mungkin kamu lihat pas testing lokal itu dummy — dibuat relatif ke hari ini oleh `seed.ts`, bukan jadwal sungguhan. **Jangan bingung dan jangan coba "perbaiki" ini** — itu memang cara kerja fallback datanya, sudah benar. |
| Konsekuensi | **Section "Warta Minggu Ini" di produksi SEKARANG akan menampilkan cabang "tidak ada ibadah", bukan cabang berisi.** Lihat §3.4 — kamu wajib mendesain kedua cabang, dan cabang kosong itu yang paling penting karena itu yang benar-benar tampil hari ini. |

---

## 3. Daftar pekerjaan — satu per satu dari komentar Dex

Setiap butir: **kutipan Dex** → **apa yang harus terjadi** → **kriteria selesai**.

### 3.1 Kurangi teks penjelas

> *"landing page yang terbiasa menjelaskan begitu banyak hal, berbagai
> penjelasan dan poin-poin bisa disingkatin atau bahkan dihilangin"*

Baca ulang SETIAP kalimat di `page.tsx` dan tanya: kalau kalimat ini dibuang,
apa pengunjung kehilangan informasi, atau cuma kehilangan basa-basi? Buang
yang kedua. Contoh nyata yang sudah ketahuan (§3.2, §3.6) — tapi jangan
berhenti di situ, sisir seluruh halaman.

**Kriteria selesai:** jumlah kata di halaman (bukan angka/tanggal/nama)
turun terasa jelas, tapi tidak ada informasi FAKTUAL yang hilang (tanggal,
jam, tempat, nama orang tetap harus ada).

### 3.2 Anggota umum tidak perlu tahu soal "kelelahan pelayanan"

> *"Menurutku anggota umum tidak perlu tau soal kelelahan pelayanan"*

Di `page.tsx`, section "Untuk Pengurus" (cari komentar
`── 04 · Untuk pengurus`), ada 6 kartu fitur. Kartu nomor **02** judulnya
"Peringatan kelelahan" — isinya menjelaskan bahwa sistem MEMATA-MATAI
frekuensi pelayanan anggota. Fitur itu asli dan tetap ada di dashboard, tapi
**tidak boleh diiklankan ke publik** — anggota yang baca situs ini akan
merasa diawasi, bukan dilayani.

**Kriteria selesai:** tidak ada satu kata pun tentang "kelelahan",
"fatigue", atau "peringatan melayani terlalu sering" di manapun pada
`page.tsx`. (Lihat juga §3.10 — seluruh section ini kemungkinan dirombak,
jadi ini mungkin otomatis selesai bareng itu.)

### 3.3 Kurangi em dash (—)

> *"Kurangi em-dashes di penjelasan dong"*

Cari `—` di seluruh teks YANG TAMPIL DI LAYAR (bukan komentar kode `//` atau
`/* */`) di `page.tsx` dan `src/components/landing/*.tsx`. Dua yang sudah
ketahuan pasti tampil:
- `page.tsx`, RHYTHM array: `"Kelompok kecil — bertumbuh bersama"`
- `page.tsx`, section penutup: `"...tidak ada satu pun dari mereka yang
  terlupakan — dan supaya angkatan berikutnya..."`

Ganti dengan titik, koma, atau susun ulang kalimatnya. **Boleh tetap ada
em dash di komentar kode** (itu gaya penulisan teknis proyek ini, bukan
copy yang dibaca pengunjung) — jangan disentuh.

**Kriteria selesai:** `grep -rn "—" src/app/page.tsx src/components/landing/`
lalu buka tiap hasil — nol yang berada di dalam JSX (antara `>` dan `<`).

### 3.4 Section "Warta Minggu Ini" harus terasa seperti dashboard status live

> *"Aku ingin bagian Warta Minggu Ini dibuat lebih keren lagi, bener-bener
> seperti dashboard canggih yang menunjukkan tema, tanggal, jam, dan detail
> lainnya (meskipun sebetulnya Sabtu ini tidak ada ibadah Pemuda)"*

Ini **dua desain**, bukan satu — dan yang kedua lebih penting karena itu
yang benar-benar tampil hari ini (lihat §2):

**(a) Cabang "ada ibadah"** (`upcoming` terisi) — perkuat jadi terasa seperti
status langsung: bisa ditambah elemen seperti indikator "LIVE" kalau
harinya sudah Sabtu, jam mundur (countdown) yang lebih menonjol, badge
status yang lebih tegas. Data yang sudah tersedia dari `upcoming`:
`weeklyTheme`, `date`, `description`, `speakerName`, `eventType`,
`stewardAssignments`. Jangan mengarang field baru yang tidak ada di
`src/lib/types.ts`.

**(b) Cabang "tidak ada ibadah"** (`upcoming` null) — SEKARANG isinya:
```
"Rumah digital pemuda GKKK Yogyakarta"
"Belum ada jadwal ibadah yang tercatat. Pengurus dapat menambahkannya lewat dashboard."
```
Ini **menyesatkan** — kesannya seolah database kosong total, padahal 93
anggota dan 29 ibadah lama sudah ada, cuma jadwal ke depan belum diisi.
Tulis ulang jadi jujur dan tetap terasa "hidup", bukan seperti error.
Sesuatu di arah: mengakui tidak ada ibadah minggu ini secara jelas, tapi
tetap menunjukkan bahwa sistemnya aktif (misalnya menunjuk ke ibadah
terakhir yang tercatat, atau ke Ritme Minggu di bawahnya sebagai pola
tetapnya). **Kamu yang merancang katanya — tapi kalimat "belum ada jadwal
ibadah yang tercatat" harus hilang, karena itu bohong.**

**Kriteria selesai:** buka halaman di `npm run dev` (akan menampilkan cabang
demo, bukan cabang kosong asli — lihat §2) DAN baca kode cabang `else`-nya
langsung untuk memastikan copy-nya sudah benar meski tidak bisa dilihat
langsung di layar lokal.

### 3.5 Nama: "Space Youth" → "Youth"

> *"Namanya sekarang tidak lagi Space Youth, tapi Youth aja."*

Ganti di **seluruh 13 titik** ini (hasil pencarian, verifikasi ulang sebelum
mulai karena mungkin sudah berubah):

```
src/app/layout.tsx           (4 titik: title default, template, applicationName, openGraph title)
src/app/login/page.tsx       (1 titik)
src/app/not-found.tsx        (1 titik)
src/app/opengraph-image.tsx  (2 titik: alt text + teks di gambar)
src/app/page.tsx             (1 titik, footer)
src/components/Masthead.tsx  (2 titik: aria-label + teks wordmark)
src/components/MobileNav.tsx (1 titik)
src/components/Sidebar.tsx   (1 titik) — INI DI DASHBOARD, tapi cuma ganti
                              nama, bukan desain. Boleh disentuh KHUSUS
                              untuk penggantian nama ini saja.
src/lib/site.ts              (1 titik, SITE_NAME)
```

Jalankan `grep -rn "Space Youth" src/` setelah selesai — harus nol hasil.

**Keputusan turunan yang BOLEH kamu ambil sendiri:** "Youth" sendirian
kadang terasa janggal secara tata bahasa Inggris di beberapa kalimat
(misalnya "Youth GKKK" oke, tapi cek konteks tiap titik). Sesuaikan kalimat
di sekitarnya secukupnya supaya tetap enak dibaca, tapi jangan menambah kata
lain ke namanya sendiri.

### 3.6 Hero: buang metafora yang membingungkan, langsung nyatakan identitas

> *"Kenapa 'Bara yang belum berkumpul'? What's that???"*
> *"Langsung kasih aja, Youth GKKK YK gitu atau bagaimana, daripada
> tagline tidak jelas"*

Di `src/components/landing/HeroCinematic.tsx`, Act 1 (teks yang muncul
paling awal saat scroll) sekarang:
```
"Bara yang belum berkumpul"
```
Ganti jadi pernyataan identitas yang LANGSUNG jelas tanpa perlu konteks —
sesuatu seperti "Youth GKKK Yogyakarta" sebagai judul utama Act 1, bukan
puisi. Kicker di atasnya ("Komisi Pemuda GKKK Yogyakarta") boleh tetap atau
digabung.

**Act 2 (penjelasan Api/Wadah) BOLEH tetap** — Dex tidak komplain soal itu,
itu lapisan makna sekunder yang muncul setelah identitasnya jelas duluan,
bukan pengganti identitas.

**Act 3** ("Satu api, satu wadah" + deskripsi) — cek juga apakah masih
nyambung setelah Act 1 diubah; kemungkinan perlu disesuaikan supaya tidak
mengulang kalimat yang sama.

**Kriteria selesai:** orang yang baru pertama kali buka situs dan cuma
melihat Act 1 (belum scroll lebih jauh) harus langsung tahu ini situs
tentang apa, tanpa perlu menebak.

### 3.7 Section "Ritme Minggu" — pertahankan, jangan dirombak

> *"Yang Ritme aku lumayan suka."*

**Jangan ubah struktur atau isi section ini** (`id="ritme"` di `page.tsx`).
Kalau kamu menerapkan perubahan sistemik ke kicker/nomor section (§3.8),
section ini ikut menerima perubahan itu SAJA — jangan mengubah apa pun yang
lain di dalamnya.

### 3.8 Nomor section terasa "AI slop" — jadikan scroll animation premium

> *"Setiap judul kecil itu terasa terlalu AI slop... boleh dibuat jadi
> scroll animation? Jadi per nomor dan judul itu besar, per segmen itu
> jelas, dan semuanya jadi scroll-animation yang premium instead of just
> static segmen by segmen."*

Pola `<span className="kicker-num">01</span> Nama Section` yang statis dan
kecil ini dipakai berulang di section 01, 02, 03, 04 (definisi CSS-nya di
`src/app/globals.css`, cari `.kicker` dan `.kicker-num`). Dex secara
spesifik minta: **nomor jadi besar, dan animasinya scroll-driven**, bukan
sekadar fade-in statis begitu section masuk layar (yang sekarang sudah ada
lewat komponen `Reveal` itu masih terasa generik).

Rancang ulang device ini sebagai satu komponen yang dipakai ulang di semua
section (jangan 4 implementasi berbeda). Ide arah (kamu boleh kembangkan):
nomor section besar yang bergerak/berubah opacity mengikuti posisi scroll
relatif terhadap section-nya sendiri (mirip pola yang sudah dipakai di
`HeroCinematic.tsx` — baca `src/lib/motion.ts`, sudah ada `useScrollProgress`
dan `remap` yang bisa dipakai ulang, tidak perlu bikin dari nol).

**Wajib:** hormati `prefers-reduced-motion` — kalau aktif, tampilkan nomor
besar dalam keadaan diam/statis, jangan skip section-nya. Pola ini sudah
ada di `useReducedMotion()` (`src/lib/motion.ts`), pakai itu.

**Kriteria selesai:** device baru dipakai konsisten di section 01–04 (dan
05 kalau cocok), scroll-driven bukan cuma fade-in sekali, ada jalur reduced
motion, dan section "Ritme Minggu" isinya (§3.7) tidak berubah selain
device nomor ini.

### 3.9 Cross: perjelas mana yang bisa diklik, mana yang cuma info

> *"Cross malah sudah sesuai dengan yang asli... aku masih bingung gunanya
> ada informasi Sabtu dan jam itu buat apa... itu bisa menjadi MVP
> selanjutnya... sekarang belum click-able, aku ingin ditunjukkan lebih
> jelas, bagian mana yang read-only dan bagian yang clickable"*

Section 03 di `page.tsx` menampilkan daftar Cross sebagai `<li className=
"card-sunk">` — bentuknya kartu tapi TIDAK bisa diklik (tidak ada `<a>`
atau `<Link>` di dalamnya), dan visualnya (bayangan hover di CSS `.card`)
bisa membuat orang MENGIRA itu bisa diklik padahal tidak.

**Yang harus kamu kerjakan (murni desain, bukan fitur baru):**
1. Pastikan style-nya SECARA VISUAL jujur: kalau tidak bisa diklik, jangan
   pakai style yang menyiratkan bisa diklik (jangan pakai class `.card`
   yang punya hover-lift; `.card-sunk` yang dipakai sekarang sudah benar
   tidak API interaktif — cek betul tidak ada tambahan hover/cursor-pointer
   yang menyaru).
2. `meetingDay`/`meetingTime` yang ditampilkan (`c.meetingDay c.meetingTime`)
   nilainya SAMA untuk semua 5 Cross ("Sabtu 19:00") — ini data placeholder
   seragam dari proses import, bukan jadwal per-Cross yang sungguh berbeda.
   **Jangan hapus field ini sendiri** (itu keputusan data, bukan desain) —
   tapi TULIS di laporan §7 sebagai temuan, karena menampilkan info yang
   terlihat presisi padahal seragam/tidak bermakna itu berpotensi
   menyesatkan.

**Yang TIDAK boleh kamu kerjakan:** membuat halaman detail Cross yang bisa
diklik publik. Itu perubahan fitur/data (butuh routing baru, keputusan privasi
soal siapa yang boleh lihat data Cross tanpa login), bukan pekerjaan desain.
Kalau kamu merasa ini mudah dibuat, JANGAN — tulis sebagai usulan MVP
berikutnya di laporan §7, persis seperti yang Dex sendiri sudah duga.

**Kriteria selesai:** visual Cross list tidak lagi menyiratkan bisa diklik
padahal tidak bisa. Tidak ada route/link baru ditambahkan.

### 3.10 Section "Untuk Pengurus" — rombak atau pangkas total

> *"Bagian 4. Untuk Pengurus felt so off, aku masih bingung what's this
> for, in fact, it felt useless and out of place."*

Section ini (`── 04 · Untuk pengurus` di `page.tsx`) sekarang berupa grid
6 kartu yang menjelaskan fitur INTERNAL dashboard (jadwal, kelelahan,
Cross, keuangan, notulen, riwayat) ke pengunjung publik yang kebanyakan
BUKAN pengurus. Itu sebabnya terasa salah tempat — ini brosur fitur admin
yang nyasar ke halaman publik.

**Fungsi SEBENARNYA dari section ini cuma satu: pintu masuk `/login` untuk
pengurus.** Semua penjelasan 6 fitur itu kemungkinan besar bisa dibuang.

Kamu punya keleluasaan merancang ulang, dengan satu syarat keras: **tombol/
link ke `/login` untuk pengurus WAJIB tetap ada di halaman**, di posisi yang
masuk akal (boleh section pendek berdiri sendiri, boleh dipindah/digabung
ke footer baru di §3.11 — itu keputusanmu). Yang tidak boleh: section 6-kartu
fitur admin yang menjelaskan cara kerja internal sistem ke publik.

**Kriteria selesai:** tidak ada lagi penjelasan fitur internal admin
(termasuk otomatis menghapus "Peringatan kelelahan" dari §3.2) yang
ditujukan ke publik. Link `/login` untuk pengurus tetap bisa ditemukan.

### 3.11 Footer — logo jadi lingkaran besar, jadi elemen latar

> *"Footer di landing page juga masih sangat biasa-biasa saja. Logo yang
> dibawah dekat area footer tolong dibuat border nya jadi lingkaran, dan
> tolong dibuat lebih besar, menjadi background."*
>
> *"Implemen ide footer ini: `dex-portfolio/.agent/FE-idea-v2/
> bohdan_design.html`"*

Footer sekarang (`<footer>` di paling bawah `page.tsx`) cuma logo kecil 28px
+ dua baris teks + copyright, rata kiri-kanan. Dua perubahan:

1. **Logo jadi lingkaran, jauh lebih besar, jadi elemen latar** (bukan
   ikon kecil sejajar teks lagi). Pakai
   `public/logo/derived/logo-crest-transparent-128.png` atau
   `logo-crest-vector.svg` (SVG lebih tajam untuk ukuran besar). Border
   radius penuh (`rounded-full`), diposisikan sebagai elemen dekoratif besar
   di belakang/menyatu dengan konten footer, bukan di depan mengganggu
   keterbacaan teks.

2. **Konsep dari referensi Bohdan** (⚠️ **PENTING, baca ini sebelum buka
   berkasnya**): berkas itu adalah hasil ekspor Framer (~1MB, HTML
   ter-obfuskasi, bergantung pada runtime proprietary Framer + library
   `lenis` untuk smooth-scroll + sistem "code component" milik Framer
   sendiri). **JANGAN mencoba menyalin kode HTML/CSS-nya secara literal —
   itu tidak akan jalan di Next.js/Tailwind dan akan menyeret dependency
   yang tidak perlu.** Ambil **konsepnya saja**: nama/wordmark brand
   ditampilkan RAKSASA sebagai elemen visual footer, nyaris jadi background,
   bukan teks kecil biasa. Terapkan konsep itu dengan crest YGMS (bukan
   kutip teks brand orang lain), dibangun native dengan Tailwind/CSS biasa
   seperti komponen lain di proyek ini — boleh discroll-reveal
   (`Reveal`/pola dari §3.8) supaya masuk saat footer terlihat, tidak perlu
   library smooth-scroll baru.

**Kriteria selesai:** footer punya crest lingkaran besar sebagai elemen
visual utama, terinspirasi (bukan menyalin kode) dari referensi, tanpa
dependency baru (tidak ada `lenis`, tidak ada Framer runtime).

---

## 4. Aturan teknis keras (semua wajib, tidak bisa ditawar)

1. **`prefers-reduced-motion` wajib dihormati** di setiap animasi baru.
   Pakai `useReducedMotion()` dari `src/lib/motion.ts` — jangan bikin
   pengecekan sendiri.
2. **Tidak ada hex warna baru langsung di className/style.** Semua lewat
   token `--color-*` di `globals.css`. Kalau perlu token baru, hitung
   kontrasnya dulu (lihat pola komentar di `globals.css`, ada rumus dan
   alasan tiap angka).
2b. **Setiap elemen kotak (card, chip, pill, panel) WAJIB pakai
   `border-line` (`--color-line`, ≥3:1 di setiap permukaan), BUKAN
   `border-rule-soft`.** Ini bukan selera — ditemukan bug nyata 18 Ags:
   `.card`/`.tag`/chip lama pakai `--color-rule-soft`, yang cuma **1,16:1**
   terhadap fill-nya sendiri — nyaris tidak kelihatan, semua kotak
   melebur jadi satu dengan latar. Sudah diperbaiki di seluruh dashboard +
   komponen bersama (`--color-line` = `#776859`, `--color-line-accent` =
   `#946e14` untuk kartu terpilih/aktif). Kalau kamu bikin elemen kotak
   BARU di landing (kartu Warta, chip Cross, footer, dll.) — pakai token
   ini dari awal, jangan reproduksi pola lama.
   **Catatan jujur soal fill:** `--color-surface`/`--color-surface-2`
   TIDAK bisa dinaikkan banyak dari nilai sekarang — teks `ink-faint` yang
   sudah lulus AA di atasnya jadi batas atasnya (lihat komentar di
   `globals.css`). Jadi pembeda utama antar-kotak itu **border**, bukan
   beda warna isi yang kentara. Kalau butuh efek "kaca" yang lebih jelas
   (istilah Dex: glassmorphism) — itu cuma masuk akal di area yang ADA
   sesuatu di baliknya untuk di-blur (mis. kartu yang mengambang di atas
   hero/bloom), bukan di kartu polos di atas latar rata. Jangan pasang
   `backdrop-filter: blur()` di kartu yang latarnya cuma warna solid —
   itu boros GPU tanpa hasil kelihatan.
3. **Tidak ada dependency npm baru** kecuali benar-benar tidak terhindarkan
   — dan kalau iya, jelaskan kenapa di laporan §7 sebelum menginstal.
4. **Three.js (kalau disentuh sama sekali) HARUS tetap dynamic import**
   dengan named destructuring (`import("three").then(({ Scene, ... }) =>`),
   BUKAN `import * as THREE` — itu mematikan tree-shaking dan sudah pernah
   jadi masalah (baca komentar di `EmberCrest.tsx`).
5. **Wajib jalan bersih sebelum lapor selesai:**
   ```bash
   npx tsc --noEmit
   npm test
   npm run build
   ```
   Ketiganya harus hijau/lulus. Tempel outputnya di laporan §7.
6. **Jangan hapus atau melemahkan tes yang sudah ada** (`tests/motion.test.ts`
   khususnya menjaga koreografi hero — kalau kamu mengubah timing hero,
   sesuaikan tesnya, jangan dihapus).

---

## 5. Cara verifikasi visual (bukan cuma percaya kode)

Ini proyek yang sebelumnya nyaris salah kaprah karena sesi lain tidak bisa
menampilkan browser dan mengira animasi rusak padahal cuma tab-nya
di-throttle (baca `PROJECT_MASTER.md` kalau penasaran ceritanya). Kalau kamu
punya akses browser/screenshot:

1. Jalankan `npm run dev`, buka `http://localhost:3000`.
2. Screenshot tiap section SEBELUM dan SESUDAH perubahan.
3. Coba scroll manual (bukan cuma baca kode) untuk memastikan animasi
   scroll-driven benar jalan, bukan cuma benar secara matematika.
4. Test dengan `prefers-reduced-motion: reduce` aktif (DevTools →
   Rendering → Emulate CSS media feature) — pastikan halaman tetap penuh
   informasi, tidak ada yang hilang, cuma animasinya yang mati.
5. Kalau tidak punya akses browser sama sekali, jujur tulis itu di laporan
   §7 — jangan mengklaim sudah diverifikasi visual kalau sebenarnya tidak.

---

## 6. STOP DAN TANYA — jangan ditebak sendiri

Kalau menemukan salah satu situasi ini, berhenti, jangan menebak, tulis di
laporan §7 sebagai pertanyaan terbuka:

- Kalau menghapus section "Untuk Pengurus" (§3.10) ternyata butuh mengubah
  struktur `<main>`/section lain lebih jauh dari yang dibayangkan.
- Kalau field `meetingDay`/`meetingTime` Cross (§3.9) ternyata dipakai di
  tempat lain (dashboard) sehingga menghapusnya di landing terasa
  inkonsisten — JANGAN hapus datanya sendiri, cuma laporkan.
- Kalau ada konflik antara instruksi di sini dan sesuatu yang kamu baca di
  `PROJECT_MASTER.md` atau `AGENT.md` yang lebih baru dari brief ini.

---

## 7. Format laporan balik

Tulis laporan singkat (boleh langsung ke Dex di chat, atau file baru di
`.agent/Komentar/LAPORAN-Antigravity_landing-page-2.md`), isinya:

1. **Checklist §3.1–§3.11** — selesai / sebagian / tidak dikerjakan (+alasan).
2. **Output `tsc`, `npm test`, `npm run build`** — tempel langsung, jangan
   diringkas jadi "semua lulus" tanpa bukti.
3. **Temuan §3.9** (data Cross seragam) — wajib dilaporkan meski tidak
   diperbaiki sendiri.
4. **Pertanyaan terbuka** dari §6, kalau ada.
5. **Berkas yang diubah** — daftar path, supaya Dex tahu apa yang harus
   di-review sebelum commit (JANGAN commit/push sendiri — itu keputusan
   Dex).
