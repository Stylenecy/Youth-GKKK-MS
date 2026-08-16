# BRIEF — YGMS: Kolom Nomor Telepon + Tombol WhatsApp

**Untuk:** AI pelaksana · **Dari:** Claude (orkestrator) · **Tanggal:** 12 Agustus 2026
**Proyek:** `D:\AT Kuliah\All of Project\Youth-GKKK_MS`

> Baca `BRIEF-AI_YGMS.md` di root repo lebih dulu. Semua aturan §0 dan standar §2 di sana **tetap berlaku penuh** untuk tugas ini. Brief ini hanya menambah satu pekerjaan.

---

## 1. Tujuan

Tim ibadah dan pengurus sering perlu menghubungi anggota mendadak (misal penatalayan berhalangan, cari pengganti). Sekarang mereka harus mencari nomor di spreadsheet lain.

**Yang dibangun:** dari halaman profil anggota, ada tombol **"Chat via WhatsApp"** yang langsung membuka percakapan.

---

## 2. Tiga syarat yang TIDAK boleh dilanggar

1. **Dikunci per PERAN, bukan per login.**
   - Boleh melihat/memakai kontak: **pengurus** dan **tim ibadah**
   - **Tidak boleh:** anggota biasa yang login. Mereka tetap lihat nama & jadwal, **tidak** nomor.
   - Kalau peran "tim ibadah" belum ada di skema, **buat**, jangan dititipkan ke peran admin.

2. **Nonaktif sampai autentikasi asli hidup.**
   Situs masih mode demo. **Nomor asli tidak boleh masuk ke seed atau berkas yang ter-commit.** Bangun kolom + UI + aturan aksesnya sekarang, tapi biarkan kosong sampai Dex menyambungkan Supabase. Pakai nomor contoh yang jelas palsu (mis. `6280000000001`) untuk pengujian.

3. **Nomor tidak ditampilkan telanjang di daftar.**
   Di daftar anggota: **tidak ada kolom nomor**. Di halaman profil: tombol WhatsApp. Kalau nomornya perlu terlihat sebagai teks, taruh di balik satu klik ("Tampilkan nomor").

---

## 3. Yang harus dikerjakan

### T1 — Kolom & impor
- Tambahkan kolom nomor telepon di tabel anggota (nullable).
- **Normalisasi saat impor.** Nomor di sumber kemungkinan campur: `08xxx`, `+62 xxx`, `62-xxx`, ada spasi/tanda hubung/kurung, mungkin ada yang kosong atau jelas bukan nomor.
  Aturan: buang semua non-digit → kalau mulai `0` ganti jadi `62` → kalau mulai `62` biarkan → kalau mulai `+62` jadi `62`.
  **Simpan hasil normalisasi**, bukan mentahnya. Simpan juga versi mentah di kolom terpisah kalau perlu ditelusuri.
- **Nomor tidak valid jangan dipaksa masuk.** Kalau gagal dinormalisasi, biarkan kosong dan **catat di laporan berapa banyak yang gagal** (jumlahnya saja — **jangan salin nomornya ke laporan**).

### T2 — Tombol WhatsApp
- Format tautan: `https://wa.me/<nomor62>` — buka di tab baru, dengan `rel="noopener"`.
- **Kalau nomor kosong/tidak valid: tombol tidak muncul sama sekali.** Jangan tampilkan tombol yang membawa ke halaman error.
- Tombol harus punya nama aksesibel yang jelas (mis. "Chat via WhatsApp dengan [nama]"), target sentuh memadai, dan kontras sesuai standar §2 brief utama.

### T3 — Aturan akses
- Terapkan di **dua lapis**: (a) RLS/kebijakan basis data supaya nomor tidak terkirim ke klien yang tidak berhak, dan (b) UI yang menyembunyikannya.
  **Lapis (a) wajib.** Menyembunyikan di UI saja tidak cukup — datanya tetap terkirim dan bisa dilihat di devtools.
- Uji: pengguna berperan anggota biasa **tidak menerima** field nomor dalam respons API sama sekali.

### T4 — Pengujian
Tambahkan tes untuk: normalisasi (minimal 6 variasi format + 2 kasus tidak valid), tombol tidak muncul saat nomor kosong, dan anggota biasa tidak menerima field nomor.

---

## 4. Yang DILARANG

- ❌ Memasukkan nomor asli ke seed, berkas contoh, atau apa pun yang ter-commit
- ❌ Menaruh nomor di URL halaman aplikasi, query string, atau log
- ❌ Menampilkan nomor di daftar/tabel yang bisa disalin massal
- ❌ Menambah kolom lain yang tidak diminta (tanggal lahir, alamat, dsb)
- ❌ Menurunkan standar §2 brief utama (kontras, bundle, tes, rute)
- ❌ Operasi git destruktif · commit secret

---

## 5. Checklist wajib (jawab dengan bukti)

- [ ] Peran yang boleh melihat kontak: ______ · cara aku membatasinya: ______
- [ ] Anggota biasa **tidak menerima** field nomor di respons API. Cara aku menguji: ______
- [ ] Tidak ada nomor asli di seed atau berkas ter-commit. Bukti pencarian: ______
- [ ] Normalisasi diuji ___ variasi format · yang gagal ditangani dengan: ______
- [ ] Tombol tidak muncul saat nomor kosong. Bukti: ______
- [ ] Tes: ___/___ lulus · `tsc` bersih? ___ · build sukses? ___
- [ ] JS klien sekarang ___ KB gzip (baseline sebelumnya: ___)
- [ ] Kegagalan kontras: ___ (harus 0)
- [ ] Berkas lama yang berubah (dari `git diff --stat`): ______
- [ ] Hal yang aku TIDAK yakin: ______

---

## 6. Laporan yang diserahkan

1. Apa yang dibangun + berkas yang disentuh
2. Bagaimana aturan akses diterapkan (sebutkan lapis basis data **dan** UI)
3. Jumlah nomor yang gagal dinormalisasi — **jumlah saja, jangan nomornya**
4. Hasil checklist §5 satu per satu
5. Apa yang menunggu Dex
6. Hal yang diragukan

> Laporan ini akan diaudit ulang. Klaim yang tidak bisa dibuktikan lebih baik ditulis "tidak yakin" sejak awal.
