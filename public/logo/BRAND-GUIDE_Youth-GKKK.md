# Brand Guide — Logo Youth GKKK Jogja

Dibuat programatis dari 3 berkas sumber Dex (`Logo-Main.png`, `Logo-BnW.png`, `Logo-WnB.png`) tanggal 17 Agustus 2026. Semua pemrosesan pakai Python (Pillow + numpy) untuk threshold/transparansi/pengukuran warna, dan [vtracer](https://github.com/visioncortex/vtracer) untuk trace SVG — bukan potrace/autotrace (tidak tersedia di mesin ini, dan tidak diinstal terpisah karena vtracer sudah cukup dan hasilnya lebih baik untuk bentuk brush-script ini). Berkas asli **tidak diubah/ditimpa** — semua hasil ada di `derived/`.

## Filosofi logo

Sumber: chat WhatsApp grup "Pengurus Pemuda 2026/2028", 16 Agustus 2026 22:31–22:42 WIB (Dex sendiri yang menjelaskan ke Ko Martin Luther & pengurus lain saat mengirim 6 opsi logo untuk polling):

> **Api** — semangat pemuda yang membara untuk memuliakan Tuhan (salib)
> **Wadah** (bentuk "U") — tempat dimana pemuda bisa bertumbuh dan berkembang bersama di dalam Tuhan sebagai satu kesatuan

Opsi yang dipakai sebagai logo final (disimpan sebagai `Logo-Main.png`) adalah opsi yang disebut Ko Martin Luther di chat yang sama: *"Koko suka v5"* — karena itu berkas ini di beberapa catatan Dex disebut juga "v5". File `Logo-Main.png`/`Logo-BnW.png`/`Logo-WnB.png` tersimpan pukul 22:51–23:01 WIB malam itu, tepat setelah diskusi polling ini.

**[TANYA DEX]** — apakah polling 6 opsi malam 16 Agustus itu sudah resmi ditutup dan opsi ini (yang tersimpan sebagai Logo-Main) sudah final 100%, atau masih menunggu hasil poll di grup? Catatan lama (`PROJECT_MASTER.md`) menyebut poll berbeda tanggal 24 Juli dengan "Opsi 4 menang 5 suara" — itu poll yang lebih lama, bukan yang 16 Agustus ini. Filosofi elemen lain (kompas, pedang, perisai) yang sempat disebut Dex sebagai opsi alternatif **tidak dipakai** di versi final — tidak didokumentasikan lebih lanjut di sini karena bukan bagian dari desain yang jadi.

## Daftar berkas

### Sumber asli (jangan diubah)
| Berkas | Deskripsi | Kapan dipakai |
|---|---|---|
| `Logo-Main.png` | Merah tua (#83021C) di atas kuning keemasan (#FDBE02) | Logo utama — media promosi, poster, medsos di atas latar terang |
| `Logo-BnW.png` | Putih di atas hitam, ada efek glow/bayangan | Latar gelap, merch dark-mode |
| `Logo-WnB.png` | Hitam di atas putih, ada efek glow/bayangan | Dokumen resmi di atas latar putih |
| `Logo-Only_v1.png` | Lambang salib+api (crest) saja, versi 1, di atas kuning | Ikon/badge |
| `Logo-Only_v2.png` | Lambang salib+api (crest) saja, versi 2 (file lebih ringan) | Ikon/badge, favicon crest |

### Hasil olahan (`derived/`)
| Berkas | Deskripsi | Kapan dipakai |
|---|---|---|
| `logo-flat-black.png` | Siluet hitam pekat, latar transparan, **tanpa glow** | Sablon kaos, bordir, stempel, fotokopi/print hitam-putih |
| `logo-flat-white.png` | Siluet putih pekat, latar transparan, **tanpa glow** | Sablon di kain gelap, bordir di kain gelap |
| `logo-main-transparent.png` | Logo utama warna, latar kuning dihapus | Tempel di atas foto/warna lain |
| `logo-bnw-transparent.png` | Varian putih-di-hitam, latar hitam dihapus | Tempel di atas foto/warna lain |
| `logo-wnb-transparent.png` | Varian hitam-di-putih, latar putih dihapus | Tempel di atas foto/warna lain |
| `logo-youth-gkkk.svg` | Hasil trace vektor dari `logo-flat-black.png` (bukan asli Canva) | Butuh skala besar untuk **wordmark penuh** — lihat catatan kualitas di bawah |
| `logo-crest-vector.svg` | **Vektor asli** ekspor Canva Dex (18 Ags) — crest salib+api warna, 22 path, nol raster tertanam | Butuh skala besar untuk **crest saja** (spanduk, cutting sticker, badge) — ini yang paling presisi, dipakai duluan sebelum `logo-youth-gkkk.svg` kalau cuma butuh crest |
| `logo-crest-vector-bw.svg` | Vektor asli sama, versi hitam-putih | Crest hitam-putih skala besar |
| `logo-compact.png` / `logo-compact-transparent.png` | Wordmark "YOUTH" + crest saja, tanpa baris "GKKK JOGJA", kanvas persegi | Favicon, foto profil, ikon app |
| `logo-main-{16,32,64,128}px.png` | Logo penuh di-render ke ukuran kecil | Uji keterbacaan (lihat hasil di bawah) |
| `logo-compact-{16,32,64,128}px.png` | Logo compact di-render ke ukuran kecil | Uji keterbacaan (lihat hasil di bawah) |

## Kode warna (HEX, dari sampling piksel — bukan tebakan)

| Warna | HEX | Sumber |
|---|---|---|
| Kuning keemasan (latar) | `#FDBE02` | Warna dominan latar `Logo-Main.png` (1,97 juta piksel sampel) |
| Merah tua / maroon (tinta) | `#83021C` | Warna dominan wordmark + "GKKK"/"JOGJA" `Logo-Main.png` (71,5 ribu piksel sampel) |
| Hitam (varian W&B) | `#000000` | `Logo-WnB.png` |
| Putih (varian B&W) | `#FFFFFF` | `Logo-BnW.png` |

## Kontras — angka, bukan perkiraan

Rasio kontras WCAG merah-di-kuning (`#83021C` di atas `#FDBE02`), dihitung dari relative luminance formula standar (bukan alat pihak ketiga), disampling langsung dari area teks kecil "GKKK" dan "JOGJA":

**6,30 : 1 — LULUS** ambang WCAG AA 4,5:1 untuk teks normal (bahkan lulus AAA 7:1 nyaris, hanya sedikit di bawahnya).

Grayscale check: setelah `Logo-Main.png` dikonversi ke grayscale, latar ≈147 dan tinta ≈13 dari skala 0–255 (selisih 134) — **logo tetap terbaca tanpa warna**, sudah divisualkan dan dicek langsung.

## Uji keterbacaan ukuran kecil — hasil, bukan perkiraan

Di-render dari sumber 4000×4000px ke 16/32/64/128px pakai Lanczos resampling.

| Ukuran | Logo penuh (dgn "GKKK JOGJA") | Logo compact (wordmark saja) |
|---|---|---|
| 16px | Tidak terbaca sama sekali — jadi gumpalan warna | Tidak terbaca — masih gumpalan, sedikit lebih baik karena elemen lebih sedikit |
| 32px | "GKKK JOGJA" tidak terbaca; "YOUTH" baru sekadar mengesankan ada tulisan, salib+api jadi bentuk kabur | "YOUTH" mulai bisa ditebak sebagai wordmark; salib+api masih kabur |
| 64px | "GKKK JOGJA" secara teknis terlihat sebagai coretan terpisah tapi susah dibaca tanpa tahu isinya duluan; salib+api mulai jelas | "YOUTH" + salib+api sudah jelas terbaca |
| 128px | Semua elemen terbaca jelas | Semua elemen terbaca jelas, lebih besar/tegas dari versi penuh |

**Kesimpulan jujur:** "GKKK JOGJA" mulai tidak terbaca di bawah **64px**, dan salib+api mulai jadi gumpalan di bawah **32px** untuk versi manapun. Karena itu dibuat `logo-compact.png` (wordmark "YOUTH" saja, tanpa baris kedua) — **pakai varian ini untuk favicon/foto profil**, bukan logo penuh. **Ukuran minimum yang disarankan untuk layar: 64px ke atas** (di bawah itu, bahkan versi compact mulai kehilangan detail).

## Pratinjau crop bulat (Instagram profile photo)

| Kandidat | Hasil |
|---|---|
| Crest saja (`Logo-Only_v2.png`) | **Aman.** Lambang sudah punya banyak ruang kosong di sekeliling — muat penuh di dalam lingkaran, tidak ada bagian penting terpotong |
| Wordmark compact (`logo-compact.png`) | **Sedikit terpotong.** Ekor lengkung huruf "Y"/"o" di kiri-bawah dan lengkung hati di akhir huruf "th" di kanan-bawah kena potong tipis oleh lingkaran. Tulisan "YOUTH" dan salib+api sendiri tetap utuh dan terbaca. |

**Rekomendasi:** untuk foto profil Instagram, pakai **crest saja** (`Logo-Only_v2.png`) — paling aman dari potongan. Kalau ingin wordmark ikut tampil, `logo-compact.png` masih bisa dipakai, hanya saja ekor dekoratifnya sedikit terpotong (tidak mengganggu keterbacaan).

## Kualitas hasil trace SVG — jujur

`logo-youth-gkkk.svg` (192KB, 59 path) di-trace dari `logo-flat-black.png` pakai vtracer mode spline (bukan polygon), lalu diperiksa langsung di browser pada perbesaran tinggi (bukan cuma dilihat kecil).

**Hasilnya cukup baik:**
- Lekuk brush-script pada huruf ("Y", "O" dst.) tetap halus, tidak terlihat patahan segi-banyak (faceting) meski di-zoom dekat.
- Bentuk salib tetap presisi (garis lurus, siku tegak lurus).
- Lekuk nyala api di atas tetap mulus.

**Tapi ini bukan vektor "asli"** — ini hasil rekonstruksi otomatis dari gambar raster, jadi:
- Path SVG-nya terdiri dari kurva Bezier hasil pendekatan algoritma, bukan kurva yang sengaja digambar desainer — kalau di-edit manual (misal menggeser satu titik), hasilnya bisa terasa kaku dibanding vektor asli Canva.
- Detail tekstur kuas yang sangat halus (goresan-goresan kecil di dalam badan huruf) sudah hilang, karena sudah difilter waktu jadi `logo-flat-black.png`.

**Update 18 Agustus:** Dex sudah bisa ekspor SVG langsung dari Canva. Hasilnya dicek satu per satu (decode & render tiap berkas, bukan cuma dilihat namanya):
- **Crest (salib+api) berhasil keluar sebagai vektor asli bersih** — `logo-crest-vector.svg` dan `logo-crest-vector-bw.svg` di atas. Ini genuinely lebih baik dari hasil trace, dan warnanya dicek sample piksel: `#FDBD01`/`#82011C` — cocok dengan HEX resmi (selisih cuma pembulatan).
- **Wordmark penuh ("YOUTH" + "GKKK JOGJA" + crest jadi satu) masih belum ada versi vektor asli.** 9 berkas SVG lain yang sempat Dex ekspor (`public/logo/_archive-canva-exports/`) ternyata bukan logo final — isinya papan eksplorasi font ("youth" ditulis 20× dalam gaya brush-lettering berbeda-beda, kemungkinan keekspor pas Dex masih pilih-pilih font), dan secara teknis juga bukan vektor (gambar PNG dibungkus tag SVG, bukan `<path>` asli). Diarsipkan, bukan dihapus, kalau-kalau Dex butuh untuk referensi font.
- **Kesimpulan:** kalau Canva masih bisa diakses, coba ekspor SVG dari elemen wordmark penuh secara terpisah (bukan seluruh desain sekaligus) — kemungkinan itu yang bikin crest berhasil jadi vektor bersih tapi wordmark tidak: mungkin efek glow/bayangan di wordmark yang bikin Canva jatuh ke raster. Sampai itu ada, `logo-youth-gkkk.svg` (hasil trace) tetap satu-satunya opsi vektor untuk wordmark penuh.

## Aturan pemakaian

**Boleh:**
- Pakai varian warna sesuai latar (Main di latar terang, BnW di latar gelap, WnB di dokumen putih)
- Pakai `logo-flat-black`/`logo-flat-white` untuk sablon, bordir, stempel, fotokopi
- Pakai `logo-compact` untuk ukuran kecil (favicon, profile picture, ikon app)
- Beri ruang kosong (padding) di sekeliling logo minimal ±10% dari lebar logo

**Jangan:**
- Jangan meregangkan/mendistorsi logo (ubah rasio lebar:tinggi)
- Jangan ganti warna maroon/kuning ke warna lain di luar dua HEX resmi di atas
- Jangan tambah efek baru (drop shadow, outer glow, gradient) di atas versi yang sudah ada — versi `flat` sengaja dibuat tanpa efek untuk kebutuhan cetak/sablon
- Jangan pakai logo penuh (dengan "GKKK JOGJA") di bawah 64px — pakai `logo-compact` sebagai gantinya
- Jangan pakai `logo-compact.png` untuk crop lingkaran kalau ekor dekoratif "Y"/"th" harus utuh 100% — pakai crest saja

## Yang masih kurang — jujur, bukan basa-basi

1. **Vektor asli dari Canva — sebagian sudah ada.** Crest (salib+api) sudah punya vektor asli (`logo-crest-vector.svg`/`-bw.svg`, 18 Ags). **Wordmark penuh belum** — `logo-youth-gkkk.svg` masih hasil trace otomatis, bukan asli. Kalau butuh wordmark vektor sempurna untuk cetak besar (spanduk, baliho), coba ekspor elemen wordmark itu sendiri dari Canva (bukan seluruh desain) selagi masih bisa akses — lihat catatan di bagian "Kualitas hasil trace SVG".
2. **Status final polling logo 16 Agustus belum dikonfirmasi tertutup** — lihat catatan di bagian Filosofi di atas. **[TANYA DEX]**
3. **Filosofi resmi untuk elemen "kompas"/"pedang"/"perisai"** yang sempat disebut Dex sebagai opsi desain lain tidak terdokumentasi lebih lanjut karena tidak dipakai di versi final — kalau ternyata versi final berubah, filosofi di atas perlu ditulis ulang. **[TANYA DEX]**
4. **Belum ada style guide tipografi resmi** (font brush-script dan font mono yang dipakai di "GKKK"/"JOGJA" belum diidentifikasi nama fontnya — kemungkinan besar font custom/hand-lettered dari Canva, bukan font standar yang bisa dipasang ulang di luar Canva).
