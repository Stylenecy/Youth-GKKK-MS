> ⏱️ **Brief ini ditulis 11 Agustus 2026, 11:15 WIB** oleh Claude (orkestrator), berdasarkan kondisi proyek pada jam tersebut.
>
> **Kenapa ini ada:** Dex bekerja dengan beberapa AI bergantian. Brief ini memastikan siapa pun yang melanjutkan bekerja dari keadaan yang sama, dengan standar yang sama, tanpa mengulang kesalahan yang sudah pernah terjadi.
>
> **Kalau kamu membaca ini setelah tanggal di atas:** periksa dulu apakah ada perubahan yang belum tercatat di sini — lihat `git log` dan berkas status proyek. Laporkan kalau kondisinya sudah berbeda.

# BRIEF UNTUK AI PELAKSANA — YGMS (Space Youth GKKK)

**Untuk:** AI/agen mana pun yang melanjutkan proyek ini
**Dari:** Claude (orkestrator). Dex akan mengaudit hasilmu memakai standar di dokumen ini.
**Tanggal brief:** 11 Agustus 2026

---

## 0. BACA INI DULU — cara kerja yang diwajibkan

Kamu **tidak** dinilai dari seberapa banyak fitur yang kamu tambah. Kamu dinilai dari **berapa banyak yang benar-benar jalan di produksi** dan **berapa sedikit yang kamu rusak**.

**Aturan mutlak — melanggar satu saja = pekerjaanmu ditolak seluruhnya:**

1. **DILARANG MENGAKU BERHASIL TANPA MEMBUKTIKAN.** "Sudah saya deploy" tanpa mengecek URL-nya hidup = tidak diterima. Setiap klaim harus disertai bukti yang kamu jalankan sendiri (kode status HTTP, keluaran tes, angka hasil ukur).
2. **DILARANG operasi git destruktif:** `checkout`, `restore`, `reset`, `clean`, `rm -rf`. `git status` dulu sebelum operasi git apa pun. Kalau perlu memulihkan kode lama, ambil isinya lewat `git show` lalu tulis ulang sebagai perubahan baru.
3. **DILARANG commit secret.** Periksa isi file sebelum staging, walau namanya terlihat aman.
4. **DILARANG memasukkan data pribadi jemaat** — nama lengkap, tanggal lahir, nomor HP — ke dalam kode, seed, atau repo. *(Ini pernah terjadi: sebuah AI menyalin 12 nama + tanggal lahir dari ekspor WhatsApp ke berkas seed, padahal halaman dashboard terbuka tanpa login saat mode demo.)*
5. **DILARANG menurunkan standar yang sudah dicapai** (lihat §2). Kalau perubahanmu membuat kontras memburuk, bundle membengkak, atau tes gagal — batalkan perubahanmu, jangan turunkan standarnya.
6. **DILARANG mengirim apa pun** ke siapa pun atas nama Dex.

**Wajib dilakukan:**
- Setelah setiap perubahan berarti: **build → typecheck → tes → deploy → verifikasi produksi sendiri.**
- Kalau tidak yakin, **katakan tidak yakin**.
- Kalau menemukan bug yang bukan bagian tugasmu, **laporkan**, jangan diam-diam diperbaiki tanpa disebut.

---

## 1. Apa itu proyek ini

Sistem manajemen pelayanan **Komisi Pemuda GKKK Yogyakarta**. Tujuannya: **satu sistem menggantikan tebaran Google Spreadsheet dan Google Docs.**

- **Live:** https://youth-gkkk-ms.vercel.app
- **Repo:** `D:\AT Kuliah\All of Project\Youth-GKKK_MS`
- **Stack:** Next.js (App Router) + Supabase + Vercel
- **Arah desain:** bernama **"Warta"** — editorial, hangat tapi tidak murahan, palet dasar `#faf7f2`. Audiensnya jemaat pemuda dengan HP kelas menengah. **Jangan ubah arah desain ini tanpa izin Dex.**

**Status penting: situs masih MODE DEMO.** Supabase belum tersambung. Data yang tampil adalah data contoh.

---

## 2. Standar yang WAJIB dipertahankan (angka nyata, sudah tercapai)

| Ukuran | Nilai sekarang | Aturan |
|---|---|---|
| Kegagalan kontras | **0** dari 14 pasangan token | Tidak boleh bertambah. Minimum rasio **4,5:1** untuk teks, **3:1** untuk border kontrol |
| Rute hidup | **16** (15 × 200 + 404 benar) | Tidak boleh ada yang mati |
| JS klien | **197 KB gzip** | Tidak boleh membengkak tanpa alasan kuat yang kamu tulis |
| Tes otomatis | **35/35 lulus** | Harus tetap lulus semua |
| `tsc --noEmit` | bersih | Harus tetap bersih |
| `<h1>` per halaman | tepat 1 | Pertahankan |
| Aksesibilitas | fokus keyboard terlihat · target sentuh memadai · `prefers-reduced-motion` dihormati · terbaca saat zoom 200% · alt text lengkap | Semua wajib |

> Catatan sejarah: pernah ada penambahan Three.js **139 KB gzip** di halaman depan tanpa fallback dan mengabaikan `prefers-reduced-motion`. Itu dibatalkan. Komponennya diarsipkan di `docs/experiments/` — **jangan dikembalikan ke build** tanpa izin Dex.

---

## 3. Yang SUDAH SELESAI (jangan dikerjakan ulang)

- Desain ulang seluruh halaman dashboard ke bahasa visual "Warta"
- Modal form aksesibel (focus trap, Escape, fokus kembali ke pemicu)
- Label enum mentah (`published`, `cash_offering`, dst) sudah diterjemahkan — **0 yang bocor ke UI**
- `robots.ts` (dashboard & login di-disallow), `sitemap.ts`, `opengraph-image`, halaman 404
- CRUD ubah/hapus dengan **soft delete** (bisa dipulihkan)
- Daftar anggota per kelompok Cross
- Bug jam ibadah diperbaiki (form lama menyimpan 07:00, seharusnya 17:00)
- **Modul Keuangan** disesuaikan dengan spreadsheet Nathan (Bendahara): 15 kategori miliknya, pemisahan **Kas Besar / Kas Kecil**, **kotak tempel-impor** dengan validasi (gagal semua kalau ada satu baris salah — tidak ada data masuk setengah), **ekspor CSV**, dan peran **Bendahara**
- Struktur Cross: **8 leader / 5 kelompok** — Dex · Angel · ko Wangke + Arion · Nita + Grace + Erica · Nathan. Satu kelompok bisa punya lebih dari satu leader. Tiap leader hanya mengelola kelompoknya sendiri.

---

## 4. TUGAS — urut prioritas

### T1. 🔴 Impor data asli Pemuda dari Google Drive

Dex punya folder Drive berisi data asli yang selama ini tersebar:
`Data Cross` · `DATA PEMUDA GKKK` · `Jadwal Penatalayan Pemuda` · `JOBDESK PENGURUS` · `laporan keuangan pemuda 2024-2026` · `NOTULENSI RAPAT PEMUDA`

Langkah:
1. Minta Dex mengunduh folder itu ke dalam repo (kamu **tidak bisa** membaca Google Drive).
2. Petakan tiap berkas ke skema basis data yang ada. **Laporkan dulu peta itu sebelum menulis kode.**
3. Kalau ada kolom di berkas asli yang tidak muat di skema, **sesuaikan skema** — jangan memaksa pengurus mengubah cara kerja mereka.
4. Buat jalur impor yang bisa diulang, dengan validasi. Jangan mengetik ulang data secara manual ke dalam kode.

⚠️ **Data anggota mengandung nama asli.** Sampai Dex memutuskan sebaliknya:
- Halaman anggota **tidak boleh terbaca publik**
- Nama asli **tidak boleh masuk ke berkas seed yang ter-commit**
- Tanggal lahir dan nomor HP: **jangan ditampilkan sama sekali**

### T2. Sambungkan Supabase (butuh Dex — siapkan, jangan paksakan)

Yang menunggu Dex (kredensial hanya dia yang punya):
1. Jalankan migrasi yang ada, termasuk `supabase/migrations/0002_soft_delete_finance.sql`
2. Tambahkan email Nathan ke `treasurer_emails` (satu baris, pola sama seperti `admin_emails`)
3. Aktifkan Google OAuth provider di Supabase
4. Pasang env var di Vercel lalu redeploy

**Tugasmu:** tulis panduan langkah-per-langkah yang **sangat jelas**, dengan **cara memverifikasi tiap langkah berhasil**. Jangan cuma daftar perintah.

### T3. Jalur pilot 2 orang
Dex belum mempublikasikan ke 8 Cross Leader. Yang lebih dulu dipakai: **Dex + Angel** (Angel ketua pengurus). Pastikan sistem masuk akal walau baru 2 leader dan 1–2 kelompok terisi — termasuk **tampilan saat data masih kosong yang menuntun**, bukan halaman kosong.

### T4. Rencana lomba 17-an (ringan saja)
Sudah ada `Rencana_Games_17an_Pemuda_15Ags2026.md`. Acara: **Sabtu 15 Agustus 16.00 di SMP Kalam Kudus**, tema "MERAH PUTIH: ONE FOR ALL", 6 lomba. **Jangan besarkan dokumen ini.** Yang belum: keputusan hadiah (Nathan belum menjawab sejak 10 Ags).

---

## 5. Yang HANYA Dex yang bisa putuskan (jangan diputuskan sendiri)

1. **Nama anggota boleh tampil publik atau tidak**
2. Kapan mempublikasikan ke 8 Cross Leader
3. Semua langkah Supabase (kredensial)
4. Anggaran dan pembelian untuk lomba 17-an
5. Perubahan arah desain "Warta"

---

## 6. CHECKLIST WAJIB sebelum kamu bilang "selesai"

Jawab satu per satu **dengan bukti**. Jawaban "sudah" tanpa angka tidak diterima.

- [ ] `npm run build` lulus. Keluaran: ______
- [ ] `tsc --noEmit` bersih. Keluaran: ______
- [ ] Tes: ___/35 lulus
- [ ] Sudah deploy, dan **aku sendiri membuka tiap rute**. Jumlah rute 200: ___ · 404 benar: ya/tidak
- [ ] JS klien sekarang: ___ KB gzip (sebelumnya 197). Kalau naik, alasannya: ______
- [ ] Kegagalan kontras: ___ (harus 0). Cara aku mengukurnya: ______
- [ ] Tidak ada nama/tanggal lahir/nomor HP jemaat di kode atau seed. Bukti pencarian: ______
- [ ] Halaman anggota tidak terbaca tanpa login. Cara aku menguji: ______
- [ ] Aku tidak menjalankan git destruktif. Perintah git yang kujalankan: ______
- [ ] Aku tidak commit secret. Cara aku memastikan: ______
- [ ] Bug yang kutemukan tapi tidak kuperbaiki: ______
- [ ] Hal yang aku TIDAK yakin: ______

---

## 7. Format laporan yang harus kamu serahkan

Bahasa Indonesia sederhana. Struktur:

1. **URL yang sudah kuverifikasi hidup sendiri** + angka hasil ukur
2. **Apa yang kuubah dan kenapa**
3. **Apa yang gagal / tidak sempat, dan kenapa**
4. **Apa yang menunggu Dex** — urut prioritas, sesingkat mungkin
5. **Hasil checklist §6, satu per satu**
6. **Hal yang aku ragukan**

> Dex akan menyerahkan laporanmu kembali ke Claude untuk diaudit. Laporan yang jujur tentang kekurangannya dinilai **lebih baik** daripada laporan yang mengaku sempurna lalu ketahuan salah.
