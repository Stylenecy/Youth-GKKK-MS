# Catatan Pemeriksaan — Laporan_Kas_Pemuda_2026.xlsx

**Berkas asli TIDAK diubah.** Catatan ini berdiri sendiri, untuk Dex sampaikan ke Nathan
dengan caranya sendiri. Diperiksa 11 Agustus 2026 dengan membuka ulang isi berkas dan
menghitung ulang setiap angka secara manual (bukan cuma membaca tampilan formulanya).

---

## Ringkasan singkat

Ini bukan spreadsheet kas sederhana — Nathan membangun **sistem akuntansi double-entry**
yang lengkap: 9 sheet (Dashboard, Daftar Akun, Jurnal, Buku Besar, Neraca Saldo, Laporan
Bulanan, Rekap Kegiatan, Bukti Transaksi, Pengaturan), dengan validasi otomatis per baris
jurnal (kolom status OK/ERROR) dan struktur akun yang rapi. **Dari 150 baris transaksi yang
sudah diinput, semuanya seimbang (total Debit = total Kredit persis, sampai ke rupiah) dan
memakai kode akun yang valid.** Itu dasar yang kuat — kesalahan double-entry paling umum
(baris tidak seimbang, akun ngawur) nol ditemukan.

Ada beberapa hal konkret yang perlu dibereskan sebelum ini jadi laporan resmi ke jemaat/majelis
— rincian di bawah.

---

## 1. Struktur & kelengkapan

- **Periode data:** 1 Januari 2026 s/d 8 Agustus 2026 (74 ID transaksi, TRX000–TRX073).
- **9 sheet**, semua terisi kecuali:
  - **`07_Bukti_Transaksi`** — kosong total, cuma header. Instruksi di `08_Pengaturan!A12`
    sendiri bilang "Simpan bukti transaksi dan isi ID/bukti pada sheet ini", tapi belum
    pernah dipakai. Konsisten dengan jurnal: **150 dari 150 baris tidak punya No. Bukti,
    150 dari 150 tidak punya PIC** (kolom D dan L di `02_Jurnal_Transaksi` kosong semua).
  - **`06_Rekap_Kegiatan`** — ada tapi rumusnya tidak jalan (lihat bagian 2, temuan #3).
- **Dua baris kosong nyangkut:** `02_Jurnal_Transaksi!A153` dan `A154` — keduanya berisi
  ID "TRX073" tapi tanggal, akun, dan nominalnya kosong semua. Kelihatan seperti baris yang
  mulai diketik lalu ditinggal belum selesai. Karena debit dan kreditnya sama-sama 0,
  validasi otomatis (kolom M) tetap menganggapnya "OK" — jadi tidak akan kelihatan kalau
  tidak dicek manual seperti ini.

## 2. Integritas hitungan

- ✅ **Semua 74 ID transaksi seimbang** (Debit = Kredit per ID), dicek ulang manual satu-satu,
  bukan cuma percaya kolom status. Total jurnal: Debit Rp26.756.050 = Kredit Rp26.756.050.
- ✅ **Semua kode akun yang dipakai di jurnal ada di Daftar Akun.** Tidak ada kode ngawur.
- ✅ **Tidak ada baris ganda** (transaksi yang ke-input dua kali dengan tanggal/nominal/
  keterangan persis sama) — hanya baris kosong TRX073 di atas yang muncul "identik" karena
  sama-sama kosong, bukan duplikasi transaksi sungguhan.
- 🟡 **Nomor TRX tidak lompat** — TRX000 sampai TRX073 berurutan tanpa nomor hilang. Bagus,
  tanda tidak ada baris yang terhapus tanpa jejak.
- 🟡 **Urutan tanggal transaksi sedikit tidak berurutan** di dua tempat (misalnya baris 127,
  TRX060 bertanggal 18 Juli muncul setelah baris-baris bertanggal 25 Juli). Ini konsisten
  dengan pola pencatatan yang memang telat/dirapel — beberapa transaksi Juli baru dicatat
  8 Agustus (kolom "Tanggal Pencatatan" beda jauh dari "Tanggal Transaksi", contoh TRX070–072).
  **Bukan tanda kesalahan**, cuma dicatatnya belakangan. Disebut supaya kalau nanti dicek
  ulang, tidak bingung kenapa urutannya begitu.

### Temuan #1 (paling penting untuk Dex tahu) — Dashboard menampilkan angka Juli, bukan hari ini

`00_Dashboard!A6` ("TOTAL KAS") mengambil dari `05_Laporan_Bulanan!E7`, dan sheet itu
di-set ke **Periode: Juli 2026** (`05_Laporan_Bulanan!B2`). Itu bukan salah rumus — sengaja
dibuat per-bulan begitu — tapi **belum digeser ke Agustus**, padahal jurnal sudah punya
2 transaksi Agustus:

| Baris | TRX | Tanggal | Keterangan | Nominal |
|---|---|---|---|---|
| 131–132 | TRX062 | 1 Agu 2026 | Persembahan QRIS | Rp48.000 |
| 133–134 | TRX063 | 8 Agu 2026 | Persembahan QRIS | Rp20.000 |

Karena keduanya masuk Kas Kecil, Dashboard sekarang **kekurangan Rp68.000**:

| | Tertulis di Dashboard | Hitung ulang sampai transaksi terakhir (8 Agu) |
|---|---:|---:|
| Kas Besar | Rp19.372.350 | Rp19.372.350 (sama — tidak ada transaksi Agustus di akun ini) |
| Kas Kecil | Rp555.300 | **Rp623.300** |
| **Total Kas** | **Rp19.927.650** | **Rp19.995.650** |

**Perbaikannya satu sel:** ubah `05_Laporan_Bulanan!B2` dari `01/07/2026` ke `01/08/2026`.
Setelah itu Dashboard otomatis ikut naik ke Rp19.995.650. Ini perlu diulang tiap awal bulan
selama Nathan pakai template ini — kalau lupa, Dashboard akan selalu terlihat "kurang" dari
kas sebenarnya begitu ada transaksi bulan baru.

### Temuan #2 — dua baris kosong TRX073

Lihat bagian 1 di atas. Tidak mempengaruhi hitungan (karena isinya nol), tapi baiknya
ditanya ke Nathan: mau dilengkapi (kalau memang ada transaksi yang terlupa) atau dihapus
saja barisnya.

### Temuan #3 — rumus `06_Rekap_Kegiatan` tidak menghitung apa-apa

Sheet ini seharusnya merekap pemasukan/pengeluaran per jenis kegiatan (Fellowship, Retreat,
Bakti Sosial, Worship Night, Lain-lain), tapi kelima barisnya menampilkan **Rp0** untuk
semua kegiatan — padahal di jurnal jelas ada kegiatan "Fellowship" dengan transaksi
sungguhan (baris 121–128, total sekitar Rp587.700).

Penyebabnya kelihatan seperti salah kolom saat menyalin rumus antar sel:
- Kolom **Penerimaan** (`06_Rekap_Kegiatan!B5:B9`) mencocokkan ke
  `02_Jurnal_Transaksi!$D:$D` (kolom **No. Bukti** — yang memang selalu kosong), padahal
  nama kegiatan sungguhan ada di kolom **E** ("Kegiatan").
- Kolom **Pengeluaran** (`06_Rekap_Kegiatan!C5:C9`) malah menjumlahkan kolom
  `02_Jurnal_Transaksi!$I:$I` (isinya teks "Penerimaan"/"Pengeluaran"/"Aset", bukan angka),
  dengan syarat kolom `$H:$H` (Nama Akun, isinya "Kas Besar"/"Konsumsi"/dst) sama dengan
  teks `"Pengeluaran"` — yang tidak akan pernah cocok, karena kolom H tidak pernah berisi
  kata itu.

Perbaikan yang perlu (bukan aku ubah — biar Nathan yang koreksi rumusnya sendiri):
- `B5` semestinya: `=SUMIFS('02_Jurnal_Transaksi'!$K:$K,'02_Jurnal_Transaksi'!$E:$E,A5)`
  (kolom E, bukan D; dan jumlahkan Kredit K, bukan Debit J — Penerimaan dicatat di Kredit)
- `C5` semestinya: `=SUMIFS('02_Jurnal_Transaksi'!$J:$J,'02_Jurnal_Transaksi'!$E:$E,A5,'02_Jurnal_Transaksi'!$I:$I,"Pengeluaran")`
  (kolom E untuk kegiatan, jumlahkan Debit J, syaratnya kolom I = "Pengeluaran")
- Lalu di-*drag* ke bawah untuk baris 6–9.

### Temuan #4 — nama akun 507 beda antara dua sheet

`01_Daftar_Akun!B18` menulis kode 507 sebagai **"Apresiasi dan Hadiah"**, tapi
`04_Neraca_Saldo!B18` menulis kode yang sama sebagai **"Apresiasi dan Perpisahan"**. Kode
akunnya sama, isinya konsisten, cuma labelnya beda — kemungkinan diketik manual di Neraca
Saldo dan tidak ikut ter-update saat nama akun direvisi di Daftar Akun. Rapi-rapi kecil,
tidak mempengaruhi angka.

### Temuan #5 — sheet Buku Besar cuma jalan penuh di Google Sheets

`03_Buku_Besar` memakai rumus `FILTER` + `HSTACK` gaya Google Sheets (kelihatan dari
pembungkus `__xludf.DUMMYFUNCTION` di setiap sel — itu jejak otomatis saat Google Sheets
mengekspor rumus yang tidak dikenali Excel biasa). **Kalau dibuka lewat Google Sheets, aman
dan otomatis kebaruan.** Tapi kalau dibuka pakai Microsoft Excel murni lalu di-*recalculate*
(misalnya tekan F9 atau edit sel manapun di sheet itu), sel-selnya berisiko berubah jadi
error alih-alih menampilkan data buku besar. Sheet-sheet lain (Dashboard, Laporan Bulanan,
Neraca Saldo, Rekap Kegiatan) semuanya pakai SUMIF/SUMIFS biasa — itu aman di kedua aplikasi.

## 3. Konsistensi

- Format tanggal seragam (dd/mm/yyyy) di seluruh jurnal.
- Format angka seragam (`#,##0`, minus ditandai merah dalam kurung) — konsisten dan rapi.
- Kategori pemasukan/pengeluaran dipakai konsisten sesuai Daftar Akun, kecuali temuan #4 di atas.

## 4. Kesiapan untuk dipakai sebagai laporan resmi

**Belum sepenuhnya siap dipakai apa adanya**, tapi bukan karena rusak — kerangkanya sudah
kuat, cuma ada beberapa hal yang perlu diberesin dulu:

1. Geser `05_Laporan_Bulanan!B2` ke bulan berjalan (sekarang: Agustus) — **paling penting**,
   supaya angka "Total Kas" di Dashboard tidak ketinggalan.
2. Perbaiki dua rumus di `06_Rekap_Kegiatan` (Temuan #3) — kalau butuh rekap per kegiatan
   untuk laporan ke majelis, sheet ini sekarang tidak bisa dipakai sama sekali.
3. Putuskan soal dua baris kosong TRX073 (isi atau hapus).
4. Isi No. Bukti + PIC di jurnal, dan mulai pakai sheet Bukti Transaksi — kalau laporan ini
   akan diaudit atau ditunjukkan ke majelis, jejak bukti fisik (nota, kuitansi) biasanya
   diminta. Ini pekerjaan berkelanjutan, bukan sesuatu yang harus dikejar sekaligus.
5. Kalau memang akan dibuka lewat Excel (bukan Google Sheets) oleh siapa pun, cek dulu
   apakah Buku Besar masih menampilkan data dengan benar (Temuan #5).

Poin 1 dan 3 masing-masing beberapa menit. Poin 2 sekitar 10 menit kalau Nathan yang
perbaiki sendiri (dia yang paling paham struktur rumusnya). Poin 4 tidak perlu dikejar
sebelum laporan berikutnya — bisa berjalan seiring waktu.

## Update 11 Ags — modul Keuangan YGMS sudah disesuaikan

Dex minta struktur kas ini langsung diimplementasikan ke YGMS, supaya Nathan tidak perlu
pindah-pindah antara Spreadsheet dan web. Sudah dikerjakan hari ini:

- Kategori pemasukan/pengeluaran di YGMS sekarang **persis nama-nama yang Nathan pakai**
  (Persembahan Pemuda, Iuran Pemuda, Donasi, dst.) — tidak perlu belajar istilah baru.
- **Kas Besar dan Kas Kecil dipisah**, sama seperti di Excel.
- Ada **kotak tempel** di halaman Keuangan YGMS untuk mengimpor data lama — tinggal salin
  baris dari Jurnal, tempel, sistem yang validasi. Kalau ada yang salah format, dikasih
  tahu baris mana sebelum apa pun tersimpan (tidak ada yang tersimpan setengah-setengah).
- Ada tombol **ekspor CSV** kalau Nathan masih butuh berkas untuk laporan ke majelis.
- Nathan jadi **Bendahara** di YGMS — cuma dia dan admin yang bisa mencatat/mengubah
  transaksi setelah ini aktif. (Perlu Dex tambahkan email Nathan sekali lewat SQL Editor —
  bukan sesuatu yang bisa Nathan kerjakan sendiri di web.)

Model di YGMS tetap lebih sederhana dari Excel-nya (satu baris per transaksi, bukan
double-entry dua baris) — itu keputusan yang dipertahankan supaya modul kas gampang dipakai
harian, bukan menggantikan ketelitian pembukuan penuh yang Nathan bangun.

## 5. Kaitan dengan YGMS (modul Keuangan aplikasi)

**Tidak ada perubahan skema dibuat — ini cuma penilaian.**

Skema `finance_transactions` di YGMS sekarang jauh lebih sederhana dari sistem Nathan:
satu baris per transaksi (bukan double-entry dua-baris), field `amount` + `type`
(income/expense) + `category` bebas teks, tanpa konsep akun/kode akun, tanpa Kas
Besar/Kas Kecil terpisah, tanpa saldo awal.

**Yang BISA dipetakan langsung tanpa mengubah skema:**
- `02_Jurnal_Transaksi` (Kegiatan, Keterangan, Debit/Kredit, PIC) → cukup mirip
  `finance_transactions` (description, amount, type, recorded_by) kalau dianggap sebagai
  satu baris "income" atau "expense" per sisi, bukan double-entry penuh.
- Kategori kode akun 501–510 (Konsumsi, Transportasi, dst.) → cocok jadi nilai
  `category` bertipe teks di YGMS, tinggal disamakan daftarnya.

**Yang TIDAK bisa dipetakan tanpa perubahan skema (dan ini keputusan Dex, bukan aku ambil
sendiri):**
- **Kas Besar vs Kas Kecil** — YGMS sekarang cuma satu saldo total, tidak membedakan dua
  kas. Kalau mau menyamakan dengan sistem Nathan, `finance_transactions` perlu kolom
  semacam `account` (nilai: kas_besar/kas_kecil), atau tabel `accounts` terpisah kalau mau
  meniru struktur double-entry penuh.
- **Saldo Dana/Ekuitas Awal** (akun 301) — YGMS tidak punya konsep "saldo pembuka
  kepengurusan". Kalau data historis Nathan mau diimpor apa adanya, transaksi pembuka ini
  perlu tempat khusus, bukan sekadar baris income biasa.
- **Double-entry penuh** (satu transaksi = dua baris berpasangan, harus balance) — YGMS
  sekarang satu baris = satu pergerakan kas, filosofinya lebih sederhana (cocok untuk kas
  kecil harian) tapi tidak sedetail sistem Nathan.

**Kalau nanti mau diimpor:** data Nathan (150 baris jurnal) bisa disederhanakan jadi satu
baris per transaksi untuk YGMS (ambil sisi Debit/Kredit yang bukan akun kas sebagai
`category`+`type`), tapi itu berarti melepas struktur double-entry-nya — cocok untuk
tampilan cepat di aplikasi, tidak cocok kalau Nathan mau tetap audit-trail penuh di Excel
sebagai sumber utama. Dua sistem ini bisa jalan berdampingan (Excel = pembukuan detail,
YGMS = ringkasan cepat untuk pengurus) tanpa memaksa satu menggantikan yang lain — itu
salah satu opsi, bukan satu-satunya. Keputusan arahnya ada di Dex.
