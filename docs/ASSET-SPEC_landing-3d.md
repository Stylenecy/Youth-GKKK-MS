# Spesifikasi aset image-sequence untuk landing YGMS

**Dibuat 18 Agustus 2026.** Komponen penerimanya sudah ada dan sudah jalan:
`src/components/landing/FrameSequence.tsx`. Berkas ini isinya **apa yang harus
kamu render**, supaya begitu asetnya jadi tinggal drop folder + ubah satu baris.

Selama frame belum ada, `frameCount={0}` bikin komponen menampilkan poster saja
dan diam. Tidak ada yang rusak, tidak ada yang perlu ditunggu.

---

## 1. Aturan yang tidak boleh dilanggar

| Aturan | Angka | Kenapa |
|---|---|---|
| Latar | **transparan** (alpha) atau `#0F0A08` persis | Situs gelap. Latar putih/abu akan kelihatan sebagai kotak. |
| Warna nyala | `#FDBE02` | Emas brand. Jangan oranye, jangan kuning lain. |
| Warna wadah/bayangan | `#83021C` | Maroon brand. |
| Jumlah frame | **60** | Cukup mulus saat di-scrub, dan totalnya masih masuk akal diunduh. |
| Resolusi | **1200 × 1200 px** | Persegi supaya aman di HP (portrait) dan desktop (landscape) dengan `object-contain`. |
| Format | **WebP**, quality 72–78 | AVIF lebih kecil tapi decode-nya lebih lambat — untuk scrub 60 frame, kecepatan decode lebih penting daripada ukuran. |
| Berat per frame | **≤ 45 KB** | 60 × 45 KB ≈ **2,7 MB** total. Itu plafonnya. Kalau lewat, turunkan quality dulu, baru resolusi. |
| Penamaan | `frame-001.webp` … `frame-060.webp` | Nol di depan wajib, 3 digit. Tanpa itu urutannya kacau. |
| Lokasi | `public/sequence/<nama-adegan>/` | Contoh: `public/sequence/crest-forge/frame-001.webp` |

> ⚠️ **Jangan taruh di `src/`.** Semua isi `src/` ikut ter-deploy sebagai bundle.
> `public/` dilayani sebagai file statis — itu yang benar untuk gambar.

---

## 2. Adegan yang paling nyambung dengan yang sudah ada

Hero paling atas sudah dipakai partikel Three.js (bara berkumpul jadi crest).
Sequence **jangan mengulang itu** — nanti dua-duanya terasa sama dan tidak ada
yang istimewa. Yang belum ada dan paling kuat:

**"Wadah terbuka" — salib di dalam wadah berputar 360°, terurai lalu menyatu.**

- Frame 001–015: wadah "U" utuh, berputar pelan dari depan ke ¼ putaran.
- Frame 016–035: wadah **terurai jadi kepingan** yang melayang terpisah
  (exploded view), salib di tengah tetap diam dan menyala.
- Frame 036–055: kepingan berputar balik dan **menyatu lagi**, makin rapat.
- Frame 056–060: utuh kembali, nyala api naik.

Itu persis "comes apart frame by frame" yang kamu maksud, dan maknanya nyambung
ke filosofi logo: wadah bisa terurai, tapi menyatu lagi sebagai satu kesatuan.

---

## 3. Prompt untuk Nano Banana / generator gambar

Render **satu frame kunci dulu** dengan prompt di bawah, cek hasilnya, baru
lanjut ke sisanya. Jangan langsung generate 60.

```
A single sacred emblem floating in pure darkness. A deep crimson (#83021C)
chalice-like vessel shaped as a wide letter "U" with upward prongs, cradling
a glowing golden cross (#FDBE02) at its centre, with a small flame rising
above. Volumetric golden rim light, subtle ember particles drifting upward,
polished ceramic-metal material with soft specular highlights.

Pure black background (#0F0A08), no floor, no horizon, no text, no logo,
centred composition, symmetrical, generous empty margin around the object.

Cinematic product render, octane, 8k, sharp focus, high dynamic range.
```

Untuk tiap frame berikutnya, tambahkan **satu** baris kontrol di akhir:

- Putaran: `rotated 6 degrees clockwise around the vertical axis from the previous frame`
- Terurai: `the vessel is fragmented into 8 floating shards, separated by <N> units, cross remains fixed and lit`
- Menyatu: `the shards are converging back, gap reduced to <N> units`

**Realistis soal AI generator:** model gambar seperti ini **tidak konsisten
antar-frame** — bentuk, pencahayaan, dan posisi akan sedikit berubah tiap
render, dan hasilnya bisa terlihat berkedip saat di-scrub. Dua jalan keluar:

1. **Video dulu, baru dipotong.** Generate satu klip video pendek (3–4 detik)
   dengan gerakan yang kamu mau, lalu potong jadi frame. Ini yang paling
   mungkin mulus, dan ini juga alasan EZGIF muncul di rencanamu.
2. **Blender.** Kalau mau benar-benar presisi, model crest-nya sederhana
   (`public/logo/derived/logo-crest-vector.svg` bisa di-import langsung sebagai
   kurva lalu di-extrude). Render 60 frame dari satu kamera = konsistensi 100%.

Kalau tujuannya "kelihatan premium", **opsi 2 hasilnya jauh lebih rapi** dan
sebenarnya tidak lebih lama, karena tidak perlu trial-and-error tiap frame.

---

## 4. Memotong video jadi frame

EZGIF bisa, tapi batas unggahnya kecil dan hasilnya dikompres ulang. Kalau
ffmpeg tersedia, ini lebih terkontrol dan gratis:

```bash
# video -> 60 frame webp, 1200x1200, kualitas terjaga
ffmpeg -i sumber.mp4 -vf "fps=20,scale=1200:1200:force_original_aspect_ratio=decrease,pad=1200:1200:(ow-iw)/2:(oh-ih)/2:color=0x0F0A08" \
  -frames:v 60 -q:v 78 public/sequence/crest-forge/frame-%03d.webp
```

Cek total beratnya sebelum commit:

```bash
du -sh public/sequence/crest-forge/
```

Harus **di bawah 2,7 MB**. Kalau lewat, turunkan `-q:v` ke 70 dulu.

---

## 5. Memasang ke halaman

Setelah folder terisi, tambahkan ini ke `src/app/page.tsx` (di antara section
02 dan 03 adalah tempat yang paling masuk akal — jeda visual setelah teks
padat):

```tsx
import FrameSequence from "@/components/landing/FrameSequence";

<FrameSequence
  frameUrl={(i) => `/sequence/crest-forge/frame-${String(i).padStart(3, "0")}.webp`}
  frameCount={60}
  posterUrl="/sequence/crest-forge/frame-001.webp"
  width={1200}
  height={1200}
>
  <div className="pointer-events-none absolute inset-x-0 bottom-[12%] text-center">
    <p className="t-title text-balance text-ink">
      Terurai, lalu <span className="glow-gold">menyatu lagi</span>
    </p>
  </div>
</FrameSequence>
```

Itu saja. Yang sudah ditangani komponen tanpa perlu kamu urus:

- frame baru diunduh saat section mendekati layar (bukan saat halaman dibuka),
- diunduh berurutan supaya scrub di awal langsung jalan,
- frame yang belum sampai jatuh ke frame terdekat yang sudah ada — tidak pernah
  blank,
- `prefers-reduced-motion` → poster diam, tidak ada unduhan sequence sama sekali,
- satu canvas, satu `drawImage` per frame — bukan 60 `<img>` bertumpuk.

---

## 6. [TANYA DEX]

1. **Adegan mana yang mau dipakai?** Usulanku di §2, tapi kalau kamu punya
   bayangan lain, itu yang menang.
2. **Blender atau video-lalu-dipotong?** Jujur: Blender hasilnya lebih rapi
   untuk objek berputar seperti ini. Tapi kalau kamu belum pernah pakai, jalur
   video lebih cepat dimulai.
3. **Prompt yang kamu bilang sudah punya** — kirim, biar kubandingkan dengan
   §3 dan kugabung yang terbaik dari dua-duanya.
