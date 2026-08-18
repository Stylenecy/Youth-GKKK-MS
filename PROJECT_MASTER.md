> 🔴 **AI/agen yang melanjutkan proyek ini: BACA `BRIEF-AI_YGMS.md` LEBIH DULU** sebelum menyentuh apa pun.

# PROJECT MASTER — Youth GKKK Management System (YGMS v2)

**Canonical:** `D:\AT Kuliah\All of Project\Youth-GKKK_MS\PROJECT_MASTER.md` (confirmed by Dex 2026-07-29 — rename dari `youth-gkkk_v2` valid)
**Last Updated:** 2026-07-03 02:25 (status body belum diverifikasi ulang sejak itu — lihat catatan delegasi 2026-07-29 di bawah)

---

## Vision & Mission

**Vision:** Build the "Digital Home & Operating System" of GKKK Youth Ministry (Space Youth).

**Mission:**
- Preserve ministry history and organizational memory.
- Streamline weekly operations and reduce repetitive administrative work.
- Support future committee generations without forcing rigid workflows.
- Replace fragmented spreadsheets, chats, and manual documents with a centralized platform.
- Provide members with a modern, inspiring digital experience — warm, editorial, and human-centric.

---

## Core Philosophy (Sanctuary Editorial)

- **History-First:** Data is NEVER hard-deleted. Use soft deletes and audit trails.
- **Event-First:** The Saturday Gathering is the center. Every module supports it.
- **Practicality-First:** Beautiful enough that members enjoy it, practical enough that committee members rely on it weekly.
- **Sanctuary Editorial Design:** Warm parchment canvas, single amber accent, Fraunces/Geist/Geist Mono trio, numbered editorial sections, minimal shadows.

---

## Past (Track Record)

### 2026-06-21 — MVP v1 (Next.js + Supabase, dual-mode)
- First scaffold of Youth GKKK platform at `youth-gkkk/`. MVP code-complete, build GREEN, 8 routes verified 200.
- Next.js 16 + Tailwind v4 + Supabase with dual-mode data layer.
- **Not deployed** — pending Dex visual review.

### 2026-06-28 — KKN Eyecare Org Restructure
- Struktur organisasi KKN di-update, 26 org unique.
- Rekrutmen Perkap, grup Perkap dibuat.

### 2026-07-03 — Supabase Integration Start
- Setup dual-mode data layer verified.
- Active focus: Supabase (Auth + DB) setup.
- Build Status: GREEN.

---

## Present (Active Focus)

### Active
| # | Item | Status |
|---|------|--------|
| 1 | **Finish core UI for all modules** | ✅ Complete |
| 2 | **Verify build clean** | ✅ GREEN |
| 3 | **Data seed = demo, BUKAN data asli** | ✅ Dipulihkan 8 Ags — lihat §"8 Ags 2026" |
| 4 | **3D Cinematic Hero Canvas (Three.js)** | ❌ **Dibatalkan 8 Ags** — tidak pernah live. Kodenya disimpan di `docs/experiments/` |
| 5 | **CRUD ubah/hapus (ibadah + keuangan)** | ✅ Complete 8 Ags — soft delete, bisa dipulihkan |
| 6 | **Daftar anggota per kelompok Cross** | ✅ Complete 8 Ags — pakai tabel `cross_memberships` |
| 7 | **Tes otomatis** | ✅ Complete 8 Ags — 35 tes, `npm test` |
| 8 | **Prepare Supabase (schema + seed)** | ✅ Done — idempotent SQL ready, schema executed in Supabase dashboard |
| 9 | **Create Supabase auth users** | 🔲 Dex action — buat 10 users di Auth UI, trigger bikin profiles |
| 10 | **Run seed.sql** | ⏳ Setelah auth users dibuat, jalankan seed.sql di SQL Editor |
| 11 | **Run migration 0002–0004** | ✅ Sudah dijalankan langsung via Supabase MCP 8 Ags — lihat §"8 Ags malam" & §"8 Ags — dikerjakan tanpa buru-buru" |
| 12 | **Connect env di Vercel** | ✅ 2 env var terpasang (URL, anon key) — `ADMIN_EMAILS`/`CROSS_CLAIM_CODE` sempat dipasang lalu **dicabut**, pindah jadi konfigurasi di DB |
| 13 | **Deploy to Vercel** | ✅ **LIVE — https://youth-gkkk-ms.vercel.app** |
| 14 | **Aktifkan Google OAuth provider di Supabase** | 🟡 **Satu-satunya langkah Dex yang tersisa** — tidak mendesak, panduan tenang di §"8 Ags — dikerjakan tanpa buru-buru" |
| 15 | **Rollout ke 8 Cross Leader** | ⏸️ **Ditunda oleh Dex** — baru pilot Dex + Angel dulu, 6 CL lain belum diberi tahu |

---

## 8 Ags 2026 malam — Cross Leader self-service (16:00–16:40, jelang ibadah 17:00)

Dex minta 5 kelompok Cross bisa dipakai **malam ini** — 8 CL (Dex, Angel, Wangke, Arion,
Nita, Grace, Erica, Nathan; Wangke+Arion & Nita+Grace+Erica co-lead) login sendiri dan
kelola anggota kelompoknya sendiri, tanpa nunggu spreadsheet `Jadwal_Penatalayan_Pemuda_.xlsx`
dirapikan.

**Ditemukan & dikerjakan (semua lewat MCP Supabase, real project, bukan simulasi):**
- Project Supabase `Youth-GKKK-MS` (`rbouxffjcqjwywyhbtqw`) ternyata **INACTIVE** (di-pause
  free tier) — di-restore. Schema dasar sudah ada dari sesi lama, **0 baris data nyata** di
  semua tabel (belum pernah ada login/seed asli).
- 🔴 **Bug RLS yang belum ketahuan:** `cross_memberships` dan `skills` punya RLS aktif tapi
  **nol policy** — semua query real akan ditolak diam-diam begitu ada login sungguhan. Juga
  `finance_transactions` tidak punya policy UPDATE, jadi tombol ubah/hapus transaksi dari
  sesi tadi sore **tidak akan pernah jalan** sampai ini diperbaiki. Ditambal di migrasi `0003`.
- **Skema multi-leader:** `crosses.leader_id` (FK tunggal) tidak cukup untuk kelompok co-led.
  Kepemimpinan sekarang `role` di `cross_memberships` — berapa pun leader per kelompok.
- **5 Cross asli ditanam ke DB sungguhan** (bukan cuma demo seed): Cross Dex · Cross Angel ·
  Cross Wangke & Arion · Cross Nita, Grace & Erica · Cross Nathan.
- **Halaman baru `/dashboard/cross/mine`** ("Kelompokku", tab utama di nav HP): login pertama
  → pilih kelompok + kode akses → langsung lihat & tambah anggota (nama saja, sisanya boleh
  nanti). Kepemilikan dicek di server action + RLS, bukan cuma UI.
- **4 env var Vercel dipasang langsung** (bukan nunggu Dex): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_EMAILS=dex.bennett28@gmail.com`,
  `CROSS_CLAIM_CODE=PEMUDA88` (kode yang harus disampaikan lisan/WA ke 7 CL lain).
- Login berubah dari "mode demo" jadi sungguhan — dikonfirmasi lewat `/login` yang sekarang
  menampilkan "Gunakan akun Google" dan `/dashboard/*` sekarang **307 ke `/login`** (sebelumnya
  200 terbuka tanpa login).

**🔴 BLOKER SATU-SATUNYA, diverifikasi langsung (bukan tebakan) — klik tombol "Lanjutkan
dengan Google" di produksi lewat browser, request-nya sampai ke Supabase, balasannya:**
```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```
Artinya provider Google **belum pernah diaktifkan** di project Supabase ini — bukan bug kode,
murni belum dikonfigurasi. Perbaikannya di luar akses tool: Dex perlu masuk **Supabase
Dashboard → Authentication → Providers → Google**, aktifkan, isi Client ID + Client Secret
dari Google Cloud Console (buat kalau belum ada — App type "Web application", authorized
redirect URI: `https://rbouxffjcqjwywyhbtqw.supabase.co/auth/v1/callback`). Begitu itu aktif,
seluruh alur (klaim kelompok, tambah anggota) langsung jalan tanpa deploy ulang.

**Batas keamanan kode akses:** `CROSS_CLAIM_CODE` itu gembok pintu, bukan brankas — mencegah
orang random yang nemu URL iseng klaim kelompok, tapi tidak menahan orang yang sengaja
memanggil Supabase REST API langsung. Cukup untuk internal kelompok pemuda malam ini;
kalau perlu lebih kuat nanti bisa diperkuat (mis. per-kelompok kode berbeda + audit log).

> ⚠️ **Catatan susulan (8 Ags, sesi lanjutan):** Dex membatalkan tenggat "malam ini" begitu
> ibadah selesai — belum mempublikasikan ke 7 CL lain, baru Angel yang tahu. Dengan waktu
> longgar, celah keamanan di paragraf di atas **sudah ditutup** (bukan cuma didokumentasikan) —
> lihat §"8 Ags — dikerjakan tanpa buru-buru" di bawah. Baris ini dipertahankan sebagai jejak,
> bukan status terkini.

Verifikasi: `tsc` bersih, 36/36 tes, build bersih, commit `42f0dfd`, deploy `READY`, migrasi
`0002`+`0003` sudah jalan di DB nyata (dicek lewat query, bukan diasumsikan berhasil).

---

## 8 Ags 2026 — dikerjakan tanpa buru-buru (setelah ibadah)

Dex membatalkan tenggat malam ini — belum mau publikasikan ke 7 CL lain, baru Angel yang tahu.
Instruksinya: bangun jalur yang sama (8 leader/5 kelompok, multi-leader, tambah-anggota-cepat,
mobile-first), tapi kali ini **benar** — pengujian, penanganan kesalahan, empty state yang
menuntun, dan sekalian pastikan jalur **pilot 2 orang (Dex + Angel)** masuk akal tanpa menunggu
kedelapan orang.

### Yang diperbaiki dari versi tergesa-gesa

🔴 **Celah keamanan yang tadinya cuma didokumentasikan, sekarang ditutup sungguhan.** Versi
sore mengizinkan siapa pun yang login memanggil Supabase REST API langsung untuk
self-insert sebagai leader kelompok mana pun — kode akses cuma dicek di kode Next.js, bukan
di database. Migrasi `0004` memindahkan seluruh penulisan (`klaim kelompok`, `tambah anggota`)
ke dua fungsi **`SECURITY DEFINER`** di Postgres (`claim_cross_leadership`, `add_cross_member`)
yang memvalidasi kode akses dan kepemimpinan **di SQL**, bukan cuma di TypeScript — dan
kebijakan RLS yang tadinya mengizinkan insert langsung ke `cross_memberships`/`profiles`
**dicabut**. Sekarang tidak ada jalur tulis langsung sama sekali; semuanya lewat fungsi yang
diperiksa. Race condition (dua tap cepat) juga ditutup lewat unique index parsial di DB, bukan
cuma debounce di client.

🔴 **`ADMIN_EMAILS` & `CROSS_CLAIM_CODE` pindah dari env var Vercel ke tabel DB
(`admin_emails`, `cross_claim_codes`, keduanya RLS-terkunci — cuma bisa dibaca lewat fungsi di
atas atau SQL Editor).** Satu sumber kebenaran, bisa diubah Dex sendiri kapan saja lewat SQL
Editor tanpa perlu deploy ulang atau melibatkanku lagi. Dua env var lama sudah dicabut dari
Vercel.

**Empty state, diperbaiki jadi menuntun bukan kosong:**
- `/dashboard/cross/mine` tanpa kelompok yang dikelola → penjelasan + kartu klaim, bukan halaman
  kosong.
- Kelompok terklaim tapi nol anggota → "tidak perlu daftar lengkap dulu, satu-satu juga cukup."
- `/dashboard/cross/[id]` untuk kelompok yang belum diklaim siapa pun → beda pesan dari kelompok
  yang sudah ada CL-nya tapi anggotanya kosong.
- `/dashboard/members` kosong → tidak lagi menyebut "jalankan seed.sql" (sudah tidak relevan;
  anggota sekarang datang dari CL memakai aplikasi, bukan dari seed).
- `/dashboard/settings` → panduan 3-langkah lama (yang menyuruh jalankan `seed.sql` manual)
  diganti 2-langkah nyata + penjelasan bahwa anggota tidak perlu di-seed.

**Jalur admin ditambahkan supaya konsisten dengan backend:** RPC `add_cross_member` sudah
mengizinkan admin (Dex) menambah anggota ke kelompok mana pun, tapi versi sore UI-nya tidak
menampilkan tombol itu untuk kelompok yang belum diklaim Dex sendiri — jadi terasa lebih
terbatas dari yang sebenarnya diizinkan sistem. Sekarang `/dashboard/cross/mine` menampilkan
kelompok itu, ditandai jelas "dikelola lewat akses admin" — beda dari kelompok yang benar-benar
dia pimpin sendiri (dapat lencana CL kalau memang klaim juga).

**Peringatan nama duplikat** di form tambah-cepat — kalau nama yang diketik sudah ada di
kelompok itu, minta konfirmasi sekali lagi (bukan diblokir keras, karena dua orang beda bisa
saja punya nama panggilan sama).

**Jalur pilot 2 orang, diverifikasi cara kerjanya:** tidak ada asumsi "8 leader" atau "5
kelompok terklaim" tertanam di kode manapun (dicek lewat grep) — setiap kelompok dibaca
independen dari kelompok lain, jadi kalau cuma Dex klaim "Cross Dex" dan Angel klaim "Cross
Angel", tiga kelompok lain tetap tampil sebagai "belum diklaim" tanpa mengganggu apa pun.

### Tes bertambah — 50 total (dari 36)

`tests/validation.test.ts` (aturan nama: wajib diisi, maksimal 80 karakter, trim spasi) dan
`tests/cross-data.test.ts` (fungsi mode-demo di `data.ts` — `getCrossLeaders` mengembalikan
kedua nama untuk kelompok co-led, `getCurrentProfile`/`getMyLeaderCrossIds` gagal aman ke
null/kosong di luar sesi asli, bukan melempar error).

### Verifikasi

`tsc --noEmit` bersih · 50/50 tes lulus · build produksi bersih · migrasi `0004` dijalankan
via Supabase MCP dan **dicek lewat query** (bukan diasumsikan): 4 fungsi ada, `admin_emails`
berisi email Dex, `cross_claim_codes` berisi kode, kebijakan insert langsung di
`cross_memberships`/`profiles` sudah tidak ada. Env Vercel dicek ulang: cuma 2 variabel
tersisa (URL + anon key).

### Panduan buat Dex — kapan saja, tidak mendesak

Semua yang bisa kukerjakan tanpa akses Google Cloud Console-mu sudah selesai (schema,
migrasi, RPC, deploy, env Vercel). Tersisa **satu langkah nyata**, dan itu murni karena cuma
kamu yang punya akses ke Google Cloud Console-mu. Tidak ada tenggat — kerjakan kapan
senggang.

**Langkah 1 — Aktifkan Google sebagai provider login (±10–15 menit kalau belum pernah bikin
OAuth client; ±2 menit kalau sudah pernah).**

1. Buka [Google Cloud Console](https://console.cloud.google.com/) → pilih atau buat project
   → **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**
   - Authorized redirect URI: `https://rbouxffjcqjwywyhbtqw.supabase.co/auth/v1/callback`
   - Simpan **Client ID** dan **Client Secret** yang muncul.
2. Buka [Supabase Dashboard](https://supabase.com/dashboard/project/rbouxffjcqjwywyhbtqw) →
   **Authentication → Providers → Google** → aktifkan toggle → tempel Client ID + Client
   Secret dari langkah 1 → **Save**.

**Cara verifikasi langkah ini berhasil (30 detik, tanpa perlu tanya aku):**
Buka `https://youth-gkkk-ms.vercel.app/login` di browser mode ninja/incognito, klik
**"Lanjutkan dengan Google"**. Kalau berhasil → kamu diarahkan ke halaman pilih akun Google
sungguhan. Kalau masih gagal → balik ke halaman ini dengan pesan error, biasanya karena
redirect URI di langkah 1 diketik tidak persis sama (harus `.../auth/v1/callback`, bukan
`.../auth/callback`).

**Setelah itu berhasil (langkah 2, opsional, kapan pun kamu siap mulai pilot):**

3. Buka `youth-gkkk-ms.vercel.app`, klik "Lanjutkan dengan Google", masuk pakai akunmu sendiri.
4. Buka tab **"Kelompokku"** di navigasi bawah (HP) atau samping (desktop).
5. Klik **"Ini kelompokku"** di kartu **Cross Dex**, masukkan kode **`PEMUDA88`**, klik Klaim.
   *(Verifikasi: kartu Cross Dex pindah ke atas, muncul kotak tambah-anggota.)*
6. Kabari Angel untuk ulangi langkah 3–5 di akunnya sendiri, klaim **Cross Angel**.
   *(Verifikasi: buka `/dashboard/cross`, "Pemimpin Angel" muncul di kartu Cross Angel.)*
7. Kalian berdua sudah bisa coba tambah 1–2 nama percobaan lewat kotak di Kelompokku, lihat
   apakah alurnya terasa benar sebelum diperluas ke 6 CL lain.

**Kalau nanti mau ganti kode akses** (`PEMUDA88`) sebelum mengumumkan ke 6 CL lain — buka
Supabase SQL Editor, jalankan:
```sql
update public.cross_claim_codes set code = 'KODE_BARUMU', updated_at = now() where id = 1;
```
Tidak perlu deploy ulang, berlaku seketika.

**Kalau mau menambah admin lain** (misalnya nanti Angel juga perlu akses admin penuh, bukan
cuma leader satu kelompok) — SQL Editor:
```sql
insert into public.admin_emails (email) values ('email-google-nya@gmail.com');
```

---

## 8 Ags 2026 — Audit sesi 7 Ags, pemulihan "Warta", + 4 pekerjaan yang tertunda

**Live & terverifikasi sendiri:** https://youth-gkkk-ms.vercel.app — commit `8d4f547`,
deploy `READY`, **16 rute dicek** (15× 200, 1× 404 untuk URL ngawur). Bukan asumsi.

### Temuan utama: perubahan 7 Ags TIDAK PERNAH di-commit dan TIDAK PERNAH di-deploy

`git log` berhenti di `e760129` (1 Ags). Semua kerja sesi 7 Ags cuma ada sebagai
perubahan lokal yang belum di-commit. **Produksi sepanjang minggu ini tetap versi
"Warta" 1 Ags.** Jadi apa pun yang Dex lihat dan tidak suka, itu di layar lokal —
jemaat tidak pernah melihatnya.

### 3 kemunduran nyata yang dipulihkan

1. 🔴 **Data anggota asli masuk ke bundle publik.** `src/lib/seed.ts` ditulis ulang
   berisi **12 nama lengkap asli + tanggal lahir asli**, diambil dari ekspor WhatsApp
   di `.agent/` — folder yang `.vercelignore` kecualikan dari deploy justru karena
   isinya data pribadi. Semua isi `src/` ikut ter-deploy, dan selama Supabase belum
   tersambung `proxy.ts` **meloloskan semua request `/dashboard` tanpa login**
   (`proxy.ts:9-11`). Artinya `/dashboard/members` akan menerbitkan nama lengkap +
   tanggal lahir ~12 pemuda ke siapa pun yang punya URL-nya. Padahal keputusan
   "nama asli publik atau tidak" **masih menunggu Dex** (NOW.md 2 Ags).
   ➡️ Seed kembali jadi data demo. Roster asli **tidak dibuang** — disimpan di
   `database/ROSTER-ASLI_dari-sesi-Antigravity_7-Ags.ts.txt` yang tidak pernah ikut deploy.

2. 🔴 **Tanggal demo dipatok ke 2026-08-08** dan komentar yang menjelaskan kenapa
   itu bug **dihapus**. `getUpcomingGathering()` menyaring event yang sudah lewat,
   jadi headline halaman depan akan berubah sendiri jam 17:00 hari itu, dan sesudah
   29 Ags seluruh situs jatuh ke empty state — terbaca rusak, bukan belum-dikonfigurasi.
   ➡️ Kembali dihitung relatif terhadap hari ini.

3. 🔴 **Three.js 561 KB mentah / 139 KB gzip** ditambahkan ke halaman depan sebagai
   import langsung (bukan lazy) — halaman yang paling sering dibuka jemaat, di HP
   kelas menengah. Kanvasnya juga: `requestAnimationFrame` tanpa henti dengan bloom
   + reflector (2× render scene per frame), **`prefers-reduced-motion` diabaikan
   total**, tidak ada fallback kalau WebGL gagal, dan osilator LFO + buffer GPU bocor
   saat unmount.
   ➡️ JS klien **333 KB → 197 KB gzip (−41%)**.

### Yang diambil dari sesi 7 Ags karena memang bagus

Ruang Hermon sebagai lokasi (naik jadi data point di halaman depan), latihan 15:00,
dan struktur 5 kelompok Cross Skema 1. Komponen 3D + tulisannya disimpan utuh di
`docs/experiments/` — tekniknya layak dipakai lagi di tempat yang cocok.

### 4 pekerjaan tertunda yang diselesaikan

- **CRUD ubah/hapus** untuk ibadah & keuangan. Dua-duanya *soft*: ibadah diarsipkan,
  transaksi diberi `deleted_at` (migrasi 0002). Sesuai janji situs sendiri — angkatan
  pengurus berikutnya mewarisi ingatan, bukan folder kosong. Semua bisa dipulihkan.
- **Daftar anggota per kelompok Cross**, lewat tabel `cross_memberships` yang sudah
  ada di schema tapi belum pernah dipakai. Jumlah anggota dihitung dari baris
  keanggotaan, bukan kolom `memberCount` yang gampang melenceng.
- **Jam ibadah.** `<input type="date"> `polos tersimpan sebagai UTC tengah malam =
  **07:00 WIB** — diam-diam memindahkan setiap ibadah 17:00. Form sekarang minta jam
  WIB, dikonversi eksplisit lewat `wibToISO()`.
- **35 tes otomatis** (`npm test`). Dua di antaranya penjaga kemunduran: satu gagal
  kalau nama asli muncul lagi di `seed.ts`, satu gagal kalau tanggal seed dipatok
  ke tanggal literal lagi.

### Angka verifikasi

| Yang diukur | Hasil |
|---|---|
| Rute produksi | 15× 200, 404 benar untuk URL ngawur |
| JS klien (gzip) | 197 KB (dari 333 KB) |
| Kontras WCAG AA | **0 kegagalan** dari 14 pasangan token (terendah 4,56:1) |
| `<h1>` per halaman | 1 |
| Tes | 35/35 lulus |
| `tsc --noEmit` | bersih |
| Nama asli di halaman publik | 0 (dipindai di 5 rute produksi) |

---

## 7 Ags 2026 — Perombakan Cinematic 3D Hero & Data Real GKKK Yogyakarta

> ⚠️ **Catatan 8 Ags:** blok di bawah ini ditulis oleh sesi 7 Ags. Isinya menggambarkan
> pekerjaan yang **tidak pernah di-commit dan tidak pernah live**, dan tiga bagiannya
> sudah dibatalkan (lihat §"8 Ags 2026" di atas). Disimpan sebagai catatan sejarah,
> bukan sebagai status terkini.

- **Koreksi Lokasi Kanonis:** Diperjelas 100% bahwa ini adalah **GKKK Yogyakarta** (Ruang Hermon), dengan konteks mahasiswa UKDW, UGM, UAJY, Sanata Dharma, UNY, UPN, AMIKOM, dan ISI Yogyakarta.
- **Pembersihan Data Seed (No AI-Slop):** 
  - Real 7 Pengurus di [seed.ts](file:///D:/AT%20Kuliah/All%20of%20Project/Youth-GKKK_MS/src/lib/seed.ts): Angel, Nita, Arion, Dex, Grace, Erica, Nathan.
  - Real 5 Kelompok Cross (Skema 1 - Adopsi 11 Juli 2026): Cross 1 (Erica), Cross 2 (Wangke & Arion), Cross 3 (Dex), Cross 4 (Nathan), Cross 5 (Angel).
  - Pin Tanggal Ibadah Besok: **Sabtu, 8 Agustus 2026** jam 17:00 WIB (Latihan 15:00 WIB), Tema Bulanan: *"Unchained, Not Unchecked"* (1 Petrus 2:16), WL: Arion Sudibyo, Pembicara: Ko Martin Luther.
- **Cinematic 3D Hero Component (`Hero3DCanvas.tsx`):**
  - **Three.js WebGL Canvas** dengan responsive camera & mouse parallax tilt.
  - **UnrealBloomPass Real Bloom:** Pendaran salib & torus 3D berbasis intensitas fisik emissive (bukan PNG/CSS blur).
  - **Reflector Plane (Wet Floor Mirror):** Lantai cermin basah yang memantulkan objek 3D & partikel.
  - **THREE.Points Particle Field:** Awan partikel emas/amber melayang dengan efek kedalaman.
  - **THREE.FogExp2:** Depth fading eksponensial ke warna kanvas `#131110`.
  - **Web Audio API Synthesizer:** Fitur suara ambient 3D (akord celestial F# minor/A major + LFO wobble) & SFX hover tombol tanpa file mp3 eksternal.
- **Dokumentasi Dex-Portfolio:** Dibuat [TECHNICAL_3D_HERO_GUIDE.md](file:///D:/AT%20Kuliah/All%20of%20Project/Youth-GKKK_MS/TECHNICAL_3D_HERO_GUIDE.md) agar seluruh teknik 3D ini dapat dipelajari dan diterapkan di projek portfolio Dex.


### Blocker
- Belum ada auth users di Supabase (Dex perlu buat manual lewat Auth UI).
- Situs live jalan di **mode demo** (seed data). Aman dan sengaja — lihat §"1 Ags 2026" di bawah.
- 🔴 **Selama mode demo, `/dashboard` terbuka tanpa login.** Begitu Supabase tersambung,
  `proxy.ts` otomatis mengunci semua `/dashboard` ke `/login`. Sampai saat itu:
  **jangan taruh data asli di `src/`.**

---

## 1 Ags 2026 — Deploy + Perombakan Visual ("Warta")

**Live:** https://youth-gkkk-ms.vercel.app — 10/10 rute terverifikasi HTTP 200.
Vercel project `youth-gkkk-ms` (team stylenecys-projects), dideploy via Vercel CLI
yang sudah ter-login sebagai `stylenecy`.

### Bug blocker yang ketemu & diperbaiki
1. **`/login` + seluruh `/dashboard` balas HTTP 500** kalau env Supabase kosong.
   `middleware.ts` memanggil `createServerClient(process.env.X!, ...)` — non-null
   assertion pada nilai undefined → throw di setiap request. **9 dari 10 rute mati**
   di mode demo. Status "dev near-done" di NOW.md sebelumnya tidak akurat.
   → diguard `isSupabaseConfigured()`, `middleware.ts` → `proxy.ts` (Next 16).
2. **Seed data kedaluwarsa.** Semua tanggal seed = Juli 2026 (sudah lewat), jadi
   semua bagian "mendatang" render empty state. Sekarang dihitung relatif ke hari ini.
3. **Zona waktu.** Semua `toLocaleDateString("id-ID")` jalan di zona server (UTC di
   Vercel) → ibadah Sabtu malam bisa tampil sebagai Minggu. Semua diarahkan ke
   `src/lib/datetime.ts` yang pin `Asia/Jakarta`.
4. **Login Google tidak berfungsi.** `redirectTo` pakai origin Supabase (bukan origin
   app), dan server action tidak pernah `redirect()` ke URL provider yang dikembalikan.
5. **`zod` tidak dideklarasikan** di package.json — cuma nebeng transitive dep dari
   `eslint-config-next` (devDependency). Sekarang dependency langsung.

### Arah desain — "Warta" (buletin mingguan jemaat)
Desain lama = landing SaaS generik berbaju krem. Yang baru berangkat dari premis
bahwa pelayanan pemuda itu **ritme**, bukan acara, dan inti penatalayan adalah
**disebut namanya**. Detail lengkap ada di laporan sesi; ringkasnya:
- Headline halaman depan = **tema ibadah minggu ini**, bukan nama produk.
- Daftar "Yang Melayani" pakai nama + peran (bukan lingkaran inisial dekoratif).
- Bagian "Ritme Minggu" (Rabu 19:00 / Sabtu 15:00 / 17:00 / Cross) sebagai tulang punggung.
- Satu section gelap (`--color-deep`) untuk memberi bobot & ritme halaman.
- Fraunces dipakai dengan sumbu **optical-size** (`opsz 144`) supaya terbaca "cetak".
- Sage jadi semantik kedua supaya amber tidak menanggung semua state.

### Aksesibilitas — diukur, bukan diklaim
Token lama **gagal WCAG AA**: `ink-muted` #8B8178 = **3.57:1** (dipakai untuk SEMUA
body copy), `ink-faint` #B0A89E = **2.20:1** (caption). Semua token foreground
disetel ulang agar lulus ≥4.5:1 terhadap *kedua* nada kertas.
Hasil audit otomatis di produksi: **100 elemen teks diperiksa, 0 gagal**, rasio
terburuk 4.56:1. Ditambah: skip link, focus-visible global, target sentuh ≥44px,
`aria-current`, label landmark, `prefers-reduced-motion`, `prefers-contrast`,
11 pasang label/input diasosiasikan, reflow bersih di 320px.

**Navigasi mobile:** sidebar dashboard sebelumnya `hidden md:block` — pengguna HP
**tidak punya cara apa pun** berpindah modul. Sekarang ada bottom tab bar + sheet.

### Performa (diukur di produksi)
| | Sebelum | Sesudah |
|---|---|---|
| Font | 262 KB (Fraunces+Geist+GeistMono, via CDN Google) | **134 KB** (self-host, next/font) |
| Request pihak ketiga | 3 (fonts.googleapis + gstatic) | **0** |
| framer-motion | ~terpakai untuk fade-in saja | dihapus, diganti CSS |
| CSS | — | 8,1 KB |
| JS | — | 150 KB |
| Total halaman depan | — | ~300 KB, 13 request |

`/` pakai ISR `revalidate = 3600` → HTML dilayani dari cache CDN (`x-vercel-cache: HIT`)
tapi "Sabtu ini" tidak pernah basi lebih dari sejam.

### Privasi — perlu perhatian Dex
`.vercelignore` ditambahkan supaya `.agent/` dan `database/` (±22 MB: ekspor chat
WhatsApp, `DATA-PEMUDA_GKKK.xlsx`, catatan rapat, catatan safety personal) **tidak
ikut terunggah** ke Vercel. Tidak ada satu pun file di `src/` yang mengimpornya.
🔴 **Tapi file-file itu masih ter-commit di git.** Kalau repo ini nanti didorong ke
GitHub, pastikan **private**, atau keluarkan dulu dari riwayat. Lihat §Keputusan Dex.

### Putaran kedua (1 Ags, sesi lanjutan)

Deploy sudah beres duluan, jadi sisa pekerjaan dikerjakan hampir seluruhnya dengan
tool file (bukan shell) atas permintaan Dex — dialog izin PowerShell terlalu sering
muncul.

- **Semua halaman dashboard didesain ulang ke "Warta"** — tidak ada lagi yang
  bergantung pada compatibility layer untuk tampilannya: ibadah (dipisah "akan
  datang"/"sudah berlangsung"), anggota, Cross, rapat, keuangan, audit, pengaturan,
  plus 4 halaman detail. Komponen bersama di `src/components/page-parts.tsx`.
- **Modal form sekarang aksesibel.** `src/components/Modal.tsx` baru: `role="dialog"`,
  `aria-modal`, focus trap dua arah (Tab & Shift+Tab), Escape menutup, scroll terkunci,
  fokus dikembalikan ke tombol pemicu saat ditutup. Sebelumnya cuma div biasa —
  pengguna keyboard bisa Tab keluar dialog dan tidak bisa menutup tanpa mouse.
- **Label enum diterjemahkan** di semua halaman (status ibadah, status anggota,
  status penatalayan, kategori keuangan). Sebelumnya `published`/`active`/
  `change_requested` tampil mentah ke pengguna.
- **`recordedById` tidak lagi hardcode** `"user-1"` — jadi prop dengan TODO eksplisit
  menunggu sesi auth Supabase.
- **Halaman pengaturan sekarang berguna:** menampilkan status sambungan + 3 langkah
  Supabase yang tersisa, lengkap dengan peringatan jangan pakai `service_role`.
- **Ditambahkan:** `robots.ts` (dashboard & login di-`disallow` — halamannya memuat
  data anggota), `sitemap.ts` (hanya halaman depan), `opengraph-image.tsx` (kartu
  share dengan palet yang sama, tanpa fetch font eksternal), halaman 404 sendiri,
  `src/lib/site.ts` untuk origin kanonik (pakai `VERCEL_PROJECT_PRODUCTION_URL`,
  tidak dihardcode).
- **Halaman detail anggota sengaja tidak menampilkan nomor kontak** — halaman itu
  bisa dibuka setiap pengguna yang login, dan nomor HP itu milik anggotanya.

### Yang BELUM dikerjakan (jujur)
- Supabase belum tersambung — situs live sepenuhnya mode demo.
- Belum ada CRUD ubah/hapus; form yang ada baru "tambah".
- Daftar anggota per kelompok Cross belum ada (tabel keanggotaan belum diisi).
- Belum ada tes otomatis sama sekali.
- Verifikasi visual dilakukan lewat computed style + audit terprogram, **bukan
  screenshot** — panel browser tidak bisa dipakai di sesi ini.

### Keputusan yang menunggu Dex

1. **Situs sekarang publik dan tanpa password.** Isinya data contoh, jadi tidak ada
   kebocoran. Tapi begitu Supabase disambungkan, halaman depan akan menampilkan
   **nama asli anggota + peran pelayanan** ke siapa pun yang punya link. Untuk warta
   jemaat itu wajar, tapi ini keputusan Dex, bukan keputusanku. Tiga opsi:
   (a) biarkan — memang niatnya buletin publik;
   (b) tampilkan nama panggilan saja (kondisi sekarang, tanpa kontak);
   (c) sembunyikan daftar pelayan di balik login.
   Kalau ragu, kunci dulu lewat Vercel Deployment Protection.
2. **Repo belum punya remote GitHub.** Kalau mau dipush: **private**, dan keluarkan
   dulu `.agent/Cross/Chat/` + `database/` dari riwayat (isinya ekspor WhatsApp,
   data anggota, dan catatan safety soal individu bernama).
3. **3 langkah manual Supabase** (±15-20 menit, tidak bisa diwakilkan ke AI):
   - Buat ~10 user di Supabase → Authentication → Users (trigger bikin `profiles`).
   - Jalankan `seed.sql` di SQL Editor.
   - Isi env di Vercel → Project `youth-gkkk-ms` → Settings → Environment Variables:
     `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`, lalu redeploy.
     (Anon key aman ditaruh di sana; **jangan** pernah pasang `service_role`.)
   Sampai itu dilakukan, situs tetap hidup dan rapi dalam mode demo — tidak error.
4. **Google OAuth** perlu `https://youth-gkkk-ms.vercel.app/auth/callback` didaftarkan
   di Supabase → Authentication → URL Configuration → Redirect URLs.

---

## Future (Roadmap)

### Sprint 0 — Foundation ✅
- [x] Scaffold Next.js + Tailwind + TypeScript
- [x] Sanctuary Editorial design system (colors, typography, components)
- [x] Data layer (dual-mode: Supabase / seed fallback)
- [x] 13 core pages

### Sprint 1 — Auth & Integration ⏳
- [ ] Supabase project setup (env, schema.sql, seed.sql)
- [ ] Auth with Google OAuth + approval flow
- [ ] RLS policies on all tables
- [ ] Deploy to Vercel

### Sprint 2 — CRUD & Interactivity ⏳
- [ ] Create/Edit/Delete for all modules
- [ ] Steward assignment interface (drag member → assign role)
- [ ] Finance form with receipt upload

### Sprint 3 — Advanced Features ⏳
- [ ] Analytics dashboard
- [ ] Global search
- [ ] Notifications
- [ ] PDF export (meetings)

### Backlog (Deferred)
- AI Steward Recommendation
- WhatsApp Integration
- Calendar Sync
- QR Attendance
- Chatbot Assistant

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Framework | Next.js 16.2.9 (App Router) |
| Language | TypeScript Strict |
| Styling | Tailwind CSS v4 |
| Design | Sanctuary Editorial |
| Fonts | Fraunces (serif), Geist (sans), Geist Mono (mono) |
| Database | Supabase (PostgreSQL + Auth + Storage) — coming |
| Deployment | Vercel — coming |

---

## Decision Log

- **2026-07-02:** Rejected Kimi's dark glassmorphic "Space Cosmic" design. Rebuilt as "Sanctuary Editorial" — warm paper palette, single amber accent, Fraunces/Geist typography.
- **2026-07-02:** Chose Next.js over Vite + React Router 7 for SSR, file-based routing, and Supabase compatibility.
- **2026-07-02:** Data layer uses dual-mode (Supabase → seed fallback) so app ALWAYS renders something.

---

## Commands

```bash
npm run dev        # Dev server
npm run build      # MUST be GREEN before claiming done
npm start          # Serve production build
```

---

## 15 Juli 2026 — Branding & Hadiah Pemuda (reconnect dari otak)

- **Logo Pemuda baru** — ko Richard kasih arti logo **SPACE**. Pearce kunci: logo *tidak harus* dirombak dari 0, bisa **upgrade yang sudah ada**. Dex lagi ongoing mendesain. (Detail di `.agent/Cross/PROJECT_MASTER.md` §10.)
- **Hadiah kenang-kenangan pengurus lama** — ongoing (lihat Cross master §5/§10): boneka wajah custom + gantungan, budget <Rp50.000, 4 penerima (Dex & Angel TIDAK termasuk — mereka masih lanjut jadi pengurus baru). Sumber dana: kas pemuda. **Belum dieksekusi.**

---

## 29 Jul 2026 — Delegation / Handoff Spec (OpenCode)

> Format per `_Dex-Brain/Agent-Protocol.md` §15.1. Orchestrator: Dex + Claude (in `_Dex-Brain`). Executor: OpenCode, opened by Dex directly in this folder.

### TASK
Resume Sprint 1 (Supabase Auth + DB integration) from the "Present > Active" table above. This is infra/mechanical wiring work once prerequisites exist — not a design decision.

### KLASIFIKASI
Tier: 🟡 SEDANG (multi-step but pre-defined by Sprint 1 checklist above) | Tool tujuan: OpenCode | Blocked until prerequisite below is met.

### STATUS SEBELUM DIKERJAKAN (belum diverifikasi ulang sesi ini)
- Last verified GREEN build claim: 2026-07-03. **Not re-run this session** — whoever picks this up must run `npm run build` first and confirm GREEN before touching anything, per Agent-Protocol §4.3 (never claim tested without executing).
- Blocker recorded 2026-07-03: no active Supabase project, no `npm run dev` visual review from Dex yet.

### PREREQUISITE — SUPERVISED, cannot be YOLO'd by any AI
Creating the actual Supabase project + getting env keys is a Dex action (account/service creation). OpenCode should **not** attempt to provision this. Wait for Dex to drop real values into `.env.example` → `.env.local` before running Sprint 1 auth/DB tasks.

### ACCEPTANCE CRITERIA
- `npm run build` GREEN, confirmed by actually running it this session (not assumed from the July note).
- Sprint 1 checklist items in "Future > Sprint 1" above move from `[ ]` to `[x]` only as each is actually done and verified running (`npm run dev`), not just written.
- RLS policies applied match `schema.sql` conventions already used elsewhere in `_Dex-Brain` projects (see `leap-2036/schema.sql` for the anon-insert/authenticated-select pattern already validated on this stack).

### JANGAN SENTUH
- ~~Sanctuary Editorial design system / existing Tailwind tokens — no re-theming~~
  **DICABUT 1 Ags 2026 atas instruksi eksplisit Dex** ("esensinya masih belum dapet,
  kembangin desain visualnya jadi lebih gacor"). Instruksi baru menang atas catatan
  29 Jul ini. Nada hangat/parchment dipertahankan; yang berubah adalah struktur,
  skala tipografi, ritme halaman, dan nilai kontras (yang lama gagal WCAG AA).
- Don't touch `.agent/Idea/Youth-GKKK-System_Kimi-Ver/` — that's an archived rejected direction (dark glassmorphic "Space Cosmic"), not live code.

### BUKTI YANG HARUS DIBAWA BALIK
- SELF-AUDIT (§9 Agent-Protocol) + build output.
- Whatever env/schema was actually applied (redact secrets — anon key is public-safe, but don't paste `service_role`).

---

## 18 Ags 2026 malam — Vektor asli crest ketemu, folder logo dirapikan

Dex ternyata **masih bisa ekspor SVG dari Canva** dan sudah coba beberapa kali, hasilnya taruh
langsung di `public/logo/` (9 berkas, nama `v5*.svg`). Dicek satu-satu (decode isi, render
vektornya, sample warna piksel — bukan cuma dilihat nama/ukuran berkas):

- **3 berkas kecil (~10KB) = vektor asli beneran** — crest (salib+api) doang, 22 `<path>`,
  nol gambar tertanam, warna cocok persis HEX resmi (`#FDBD01`/`#82011C` vs `#FDBE02`/`#83021C`,
  selisih pembulatan). **Dipindah ke `derived/logo-crest-vector.svg` (warna) dan
  `derived/logo-crest-vector-bw.svg` (hitam-putih)** — satu duplikat identik diarsipkan.
- **6 berkas besar (6–17MB) = BUKAN logo final.** Di-decode isinya: papan eksplorasi font,
  bukan logo — tulisan "youth" diulang ~20× dalam gaya brush-lettering berbeda-beda (kemungkinan
  keekspor pas Dex masih pilih font di Canva). Secara teknis juga bukan vektor — isinya gambar
  PNG dibungkus tag `<svg>` (34 tag `<image>`), bukan path asli. **Dipindah ke
  `public/logo/_archive-canva-exports/`** (diarsipkan, bukan dihapus — sesuai prinsip
  History-First proyek ini, dan ini punya Dex sendiri, bukan hasil kerja AI yang boleh dibuang
  sepihak).
- **Masih belum ada:** vektor asli untuk **wordmark penuh** ("YOUTH"+"GKKK JOGJA"+crest jadi
  satu). Baru crest-nya yang berhasil keluar vektor bersih dari Canva — dugaan: efek
  glow/bayangan di wordmark yang bikin Canva jatuh ke raster. `derived/logo-youth-gkkk.svg`
  (hasil trace vtracer, dari sesi 17 Ags) masih satu-satunya opsi vektor wordmark penuh.

`BRAND-GUIDE_Youth-GKKK.md` sudah diupdate reflect ini semua.

---

## 18 Ags 2026 — Handoff: DB/import dipindah ke sesi Claude Code lain

Sesi ini (fokus logo) sempat menyentuh Supabase karena diminta lanjutin "web YGMS":
- ✅ **Migrasi 0006 (whatsapp_access) sudah jalan di DB produksi** lewat MCP — aman, schema-only, tidak ada data pribadi.
- ✅ **Bug nyata ditemukan & diperbaiki di kode**: `scripts/import/import_members.py`, `import_cross.py`, `import_events.py` generate pseudo-id teks (`p001`, `c1`, `e001`) padahal kolom `id` semua tabel bertipe `uuid`. Ditambal pakai `scripts/import/id_map.py` (uuid5 deterministik, idempotent). File `scripts/import/output/*.sql` sudah diregenerate dengan UUID valid.
- 🔴 **Belum bisa dieksekusi ke DB** — ketemu blocker lebih dalam: `profiles.id uuid primary key references auth.users(id)` (`supabase/schema.sql:29`). Baris `profiles` **wajib** terhubung ke akun Auth Supabase asli — tidak bisa diisi bebas. Bulk-import 93 anggota butuh keputusan desain dulu (lepas FK / buat 93 akun Auth asli / jangan bulk-import). 3 opsi lengkap ada di transcript sesi ini, tanya Dex kalau perlu diulang.
- **Dex bilang: database/import diurus di sesi Claude Code lain.** Sesi ini berhenti di sini, tidak lanjut eksekusi apa pun ke DB lagi. Kode fix (id_map.py dkk) sudah aman ditinggal — tidak ada efek samping, tinggal dipakai atau diabaikan sesi lain.

---

## 18 Ags 2026 (siang) — Audit & perbaikan 4 berkas SQL impor

Sesi lanjutan yang dimaksud handoff di atas. **Belum ada SQL yang dijalankan ke Supabase** —
akses DB dipakai **baca-saja** (izin eksplisit Dex) untuk memastikan bentuk DB nyata, bukan menebak.

### Keadaan DB produksi per 18 Ags (diverifikasi lewat SELECT, bukan asumsi)

| Tabel | Baris |
|---|---|
| `profiles` | **1** (Dex, dari login Google; nickname masih `dex.bennett28`) |
| `crosses` | **8** ← bukan 5 |
| `cross_memberships` · `events` · `steward_assignments` · `finance_transactions` · `skills` | **0** |
| `auth.users` | 1 |

Praktis masih kosong → impor pertama, tidak ada data lama yang bisa rusak.

### 🔴 Blocker fatal DIKONFIRMASI masih hidup

`profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE` **masih ada**,
dan `profiles.id` **tidak punya DEFAULT**. Dua akibat, satu di antaranya belum pernah dicatat:

1. Impor 93 anggota gagal total di baris pertama.
2. **RPC `add_cross_member` (migrasi 0004) mustahil jalan** — dia insert ke `profiles` tanpa `id`.
   Artinya tombol "tambah anggota" di web YGMS **rusak sejak dibuat**, belum ketahuan karena
   belum pernah ada anggota nyata ditambahkan.

➡️ Ditulis **`supabase/migrations/0007_profiles_standalone.sql`** (lepas FK + kasih DEFAULT).
**Belum dijalankan** — menunggu Dex. Sisa keputusan (orang yang login nanti bisa dapat baris
profil kedua) didokumentasikan di dalam berkas migrasi itu, 3 opsi, belum dipilih.

### 8 grup Cross = sudah duplikat sebelum impor

Dua gelombang: 8 Ags 09:29 (5 grup, `meeting_time` 19:00) + 11 Ags 07:44 (3 grup dari migrasi
0003, 17:00). Nama beda tipis (`Cross Dex` vs `Cross TAMBALBAND`, `Cross Wangke & Arion` vs
`Cross Wangke-Arion`, `Cross Nita, Grace & Erica` vs `Cross Nita-Grace-Erica`) jadi
`on conflict (name)` tidak menangkapnya. `cross.sql` lama akan menambah 5 lagi → **13 grup**.

➡️ Keputusan Dex: pakai nama yang sudah ada. Dipakai 5 grup batch 8 Ags (19:00, cocok dengan
Data Cross.md), 3 duplikat di-`is_active = false` (tidak dihapus).

### Akar masalah semua berkas: pencarian orang pakai `WHERE nickname = '...'`

265 pencarian di 3 berkas. Hasil audit:

| Token | Cocok | Akibat kalau dijalankan apa adanya |
|---|---|---|
| `'Nathan'` (13×) | 2 orang | Cross 4 dapat 2 leader · transaksi Rp350rb masuk 2× · 11 penatalayan tidak menentu orangnya |
| `'Dian'` | 2 orang | Cross 5 dapat 2 anggota |
| `'Ding Ding'` | **0** | Andrea Elita L diam-diam tidak masuk Cross 2 sama sekali |
| `'echa'`, `'valen'` (huruf kecil) | **0** | 2 penatalayan hilang diam-diam |
| `'Joshua A'` | **0** | 1 penatalayan hilang |
| `'SEMINAR'`, `'Pengurus'` ×2, `'Minggu Paskah'`, `'LPP Kaliurang'` | **0** | catatan kolom WL di spreadsheet ikut terparsing sebagai nama orang |

**Temuan paling halus — `'Valen'` cocok tepat 1 baris tapi ORANGNYA SALAH.** 13 baris
(11 penatalayan + Cross 2 + 1 transaksi) tertuju ke Maria Valensia T, padahal 3 bukti
independen menunjuk **Valentia Anggoro**: (a) `DATABASE_MEMBERS.md` menaruh Valentia di C2 dan
Maria Valensia tanpa Cross — Valentia satu-satunya orang C2 yang tidak pernah dimasukkan;
(b) peran Sound/Singer/Pemusik/Multimedia persis skill Valentia, Maria Valensia nol skill;
(c) Valentia tercatat layan 19/28 tapi nama `'Valentia'` **nol kali** muncul di `events.sql`.
**Dikonfirmasi Dex 18 Ags.** Pengaman gagal-keras tidak akan pernah menangkap kelas kesalahan
ini — ketemunya lewat verifikasi silang ke sumber lain.

### Bug zona waktu: 29 dari 29 ibadah

Semua tersimpan `'…T17:00:00Z'` di kolom `timestamptz` → dibaca 17:00 UTC = **00:00 WIB hari
Minggu**. Setiap ibadah Sabtu sore akan tampil sebagai Minggu dini hari. Ibadah 17:00 WIB =
`10:00:00Z`. Semua digeser −7 jam; tanggalnya sendiri tidak berubah.

Ditemukan juga `description` = `'Minggu None bulan N'` di 26 baris — `None` Python bocor jadi teks.

### Hasil: 5 berkas baru, berkas asli tidak disentuh

`scripts/import/output/{members,cross,finance,events}_fixed.sql` + `00_all_fixed.sql`
(+ migrasi `0007`). Semua pencarian pindah ke **nama lengkap** (93/93 unik) lewat dua fungsi
pengaman `_ygms_import_person()` / `_ygms_import_cross()` yang **`RAISE EXCEPTION` kalau hasilnya
bukan tepat 1 baris** — dibuat di awal transaksi, di-`DROP` di akhir.

Nickname kembar **tetap dipertahankan** (`Dian` ×2, `Nathan` ×2) sesuai keinginan Dex — yang
berubah cuma cara mencarinya.

### Verifikasi — dijalankan, bukan diklaim

- **45/45 asersi lolos**: jumlah profil 93→93 · 0 kurung tersisa di `full_name` · 0 tanggal
  lahir palsu · 0 tahun >2010 · **0 `WHERE nickname =` di keempat berkas** · semua 44 nama yang
  dicari cocok tepat 1 profil · keanggotaan Cross **cocok 100%** dengan kolom Cross di
  `DATABASE_MEMBERS.md` (0 beda, 0 orang terlewat) · 8 Cross Leader · 29 ibadah semuanya jatuh
  **Sabtu 17:00 WIB** setelah konversi · 216 penatalayan (221 − 5 baris bukan-orang).
- **Parse ulang dengan parser PostgreSQL asli** (`pglast` v8.4 / libpg_query): 6 berkas,
  **595 statement di `00_all_fixed.sql`, 0 gagal parse**; 7 blok plpgsql tervalidasi terpisah.

### Yang sengaja TIDAK diubah

Generator Python (`import_*.py`) dan `DATA_PEMUDA-GKKK-YK.xlsx` — instruksi Dex: perbaiki SQL
saja, karena Supabase yang jadi sumber kebenaran setelah ini. **Konsekuensi: regenerate dari
xlsx akan mengembalikan semua bug.** Berkas `_fixed.sql` adalah artefak sekali-pakai, bukan
keluaran pipeline.

---

## 17 Ags 2026 — Logo Youth GKKK: kelengkapan berkas selesai

Dex tidak bisa lagi edit logo di Canva (locked). Semua perbaikan dikerjakan terprogram dari
3 PNG sumber Dex (`public/logo/Logo-Main.png`, `Logo-BnW.png`, `Logo-WnB.png` — tersimpan
16 Ags 23:01 malam, tepat setelah polling 6 opsi logo di grup "Pengurus Pemuda 2026/2028").
**Ketiga berkas asli tidak diubah.** Semua hasil di `public/logo/derived/` (16 berkas) +
`public/logo/BRAND-GUIDE_Youth-GKKK.md` (rujukan lengkap: daftar berkas, HEX, aturan pakai,
kekurangan jujur — jangan diringkas ulang di sini, baca langsung berkas itu).

**Filosofi logo (sumber baru, lebih kuat dari premis lama):** chat WA 16 Ags 22:31–22:42,
Dex sendiri ke Ko Martin Luther dkk — **Api** = semangat pemuda membara memuliakan Tuhan
(salib), **Wadah** ("U") = tempat pemuda bertumbuh bersama dalam Tuhan sebagai satu kesatuan.
Ko Martin: *"Koko suka v5"* → itu `Logo-Main.png`. Premis lama di dokumen ini ("Alkitab Terbuka
+ Salib Pohon Pertumbuhan + Kompas", poll 24 Jul) **sudah digantikan** oleh poll 16 Ags ini.

**Angka, bukan perkiraan:** kontras merah-di-kuning (`#83021C` atas `#FDBE02`) = **6,30:1**,
lulus WCAG AA 4,5:1. Logo penuh (dengan "GKKK JOGJA") tidak terbaca di bawah 64px — dibuatkan
`logo-compact.png` (wordmark YOUTH+crest saja) sebagai gantinya untuk favicon/profile.
SVG trace (`logo-youth-gkkk.svg`, vtracer) kualitasnya baik tapi bukan vektor asli.

**Situs sudah dipasangi:** `favicon.ico` (16/32/48px, crest+latar emas) dan `Masthead.tsx`
→ `Logomark` (dipakai di 6 halaman: Masthead, Sidebar, MobileNav, login, not-found, hero)
sekarang render crest asli, ganti SVG hairline lama yang masih pakai premis "Alkitab
terbuka+salib". Dites jalan di `npm run dev` + `tsc --noEmit` bersih.

**🟡 Masih menunggu Dex:** (1) status final polling 6 opsi logo 16 Ags — sudah ditutup resmi
atau belum (`Logo-Main.png` dipakai sebagai asumsi karena itu yang "v5" favorit Ko Martin,
tapi belum ada konfirmasi eksplisit poll selesai); (2) vektor asli dari Canva kalau butuh
skala besar sempurna (spanduk/baliho) — trace vtracer cukup untuk cutting sticker, tidak
untuk itu. Detail penuh + [TANYA DEX] lainnya ada di `BRAND-GUIDE_Youth-GKKK.md`.

---

## 18 Ags 2026 (malam) — Perombakan desain: "Nocturne" + hero 3D

Dex: *"masih ngga puas sama desainnya, apalagi landing page yang aku harap bisa wow banget."*
Keputusan Dex sesi ini: **gelap total di seluruh situs** (bukan hibrida), dan
**Three.js prosedural dulu**, image-sequence menyusul.

### Kenapa desain lama terasa "belum dapet esensinya"

Ketemu akar masalahnya, bukan soal selera: **design system lama tidak memuat
satu pun warna brand.** Logo = gold `#FDBE02` + maroon `#83021C`; situs =
accent `#a94d08` (coklat-amber) di atas kertas krem. Logo dan situs praktis
dua brand berbeda.

### Palet gelap — dihitung, bukan dikira

Maroon `#83021C` di atas latar `#0F0A08` cuma **1,87:1** — mustahil jadi warna
teks. Jadi maroon dipakai sebagai *fill*, dan diturunkan varian `rose #C77384`
(5,8:1) untuk saat harus membawa teks. **26 pasangan warna yang benar-benar
dipakai di CSS diuji satu per satu; semuanya lulus WCAG AA.** Termasuk satu
jebakan: `.btn-primary` lama menulis `#ffffff` di atas accent — putih di atas
emas = **1,47:1, gagal telak**. Diganti jadi warna latar gelap di atas emas
(11,8:1).

Seluruh dashboard ikut gelap **tanpa satu pun komponen halaman disentuh**,
karena `globals.css` sudah punya compatibility layer — cukup ganti nilai token.

### Hero: bara membentuk crest asli

3.600 partikel berhamburan lalu berkumpul membentuk **crest sungguhan** —
posisinya di-sampling dari `logo-crest-transparent.png` (skrip sampling +
pratinjau render dipakai untuk memastikan bentuknya terbaca, bukan diasumsikan).
Panas partikel mengikuti ketinggian: emas di api, maroon di wadah.

Seluruh animasi (drift, kedip, ukuran, warna) dijalankan **di GPU lewat
ShaderMaterial**, jadi biaya CPU per frame cuma 2 penulisan uniform, bukan
menulis ulang 10.800 float.

### Tiga dosa Three.js versi 8 Ags — ditutup semua

| Dosa lama | Sekarang |
|---|---|
| 561 KB di-import langsung | dynamic import, **tidak ada di 9 chunk awal** (diverifikasi dari HTML prerender) |
| rAF jalan terus | IntersectionObserver menghentikan loop saat kanvas keluar layar |
| `prefers-reduced-motion` diabaikan | reduced motion = 1 frame diam, loop tidak pernah start |
| buffer GPU bocor saat unmount | geometry/material/renderer di-dispose, listener dilepas |

Tambahan: namespace import (`THREE.*`) diganti named import → tree-shaking
memangkas **184,6 → 131,7 KB gzip (−29%)**, sekarang di bawah 139 KB yang dulu
jadi alasan pembuangan.

### Yang ditemukan tes, bukan mata

Tes koreografi (`tests/motion.test.ts`, 15 tes baru) menangkap **celah kosong
di tengah scroll**: act 1 sudah habis di progress 0,30 sementara act 2 baru
0,20 — layar nyaris blank, terbaca rusak bukan sinematik. Timing dirapatkan
dan sekarang dijaga asersi "tidak pernah ada momen layar kosong".

### Angka verifikasi

| Yang diukur | Hasil |
|---|---|
| Pasangan warna lulus WCAG AA | **26/26** |
| Tes | **85/85** lulus (dari 70) |
| `tsc --noEmit` | bersih |
| `npm run build` | hijau, 19 rute |
| JS awal halaman depan (gzip) | **188,9 KB** (sebelumnya 197 KB — turun, padahal bertambah hero 3D) |
| Chunk Three.js | 131,7 KB gzip, **lazy**, tidak di muat awal |
| WebGL di browser | konteks hidup, `glError: 0` |

### Belum selesai

- 🟡 **Belum diverifikasi mata.** Pane browser tidak bisa ditampilkan di sesi
  ini (`rAF` tidak jalan saat pane tersembunyi, jadi screenshot & uji scroll
  interaktif mustahil). Matematika koreografi sudah diuji unit test, tapi
  **tampilan visualnya belum pernah dilihat siapa pun.**
- 🟡 Dashboard sudah ikut gelap lewat token, tapi **belum ditinjau halaman per
  halaman** — mungkin ada tempat yang mengandalkan latar terang.
- 🔲 Image-sequence: komponen `FrameSequence` siap, spesifikasi + prompt ada di
  `docs/ASSET-SPEC_landing-3d.md`. Aset belum dibuat.
- 🔲 Fix login (`src/app/auth/callback/route.ts`) **belum di-commit/push**.

### Susulan 18 Ags — "upgrade seluruhnya" (dashboard + penutup landing)

Dex: *"itu kan bagian atas, gimana dengan bagian bawah dan bagian lain? Bagian Pengurusnya?"*

**Bug kontras nyata yang cuma muncul setelah pindah gelap.** `bg-danger` dan
`bg-sage` berubah jadi fill *terang* di tema gelap, tapi teksnya masih
`text-white` — yaitu tombol hapus transaksi, dialog konfirmasi, dan toast
"tersimpan". Diukur: **3,07:1 dan 2,96:1, dua-duanya gagal.** Diganti ke
`text-canvas` (6,42:1 dan 6,64:1). 4 berkas.

**Arah hover terbalik.** Sidebar & MobileNav pakai `hover:bg-canvas-sunk`
(#080505) padahal rail-nya `bg-surface` (#1A1210) — menyentuh baris justru
membuatnya **lebih gelap**, jadi terasa mundur. Di permukaan gelap, hover harus
menambah cahaya. Diganti ke `bg-surface-2`. 4 tempat.

**Audit kontras otomatis seluruh kode.** Skrip membaca token langsung dari
`globals.css` (bukan diketik ulang), memindai tiap `className` yang memasangkan
`text-*` dengan `bg-*` di 30+ berkas tsx, lalu menghitung rasionya. Menemukan
sisa terakhir: `ink-faint` di `surface-2` = **4,47:1**, meleset 0,03. Token
dinaikkan ke `#908273` supaya lolos di keempat permukaan (canvas, surface,
surface-2, canvas-sunk). **Sekarang 0 pasangan gagal, 0 warna hardcoded.**

**Cahaya untuk area pengurus** — sebelumnya bidang gelap datar yang terbaca
"mati":
- wash emas rendah di puncak area kerja (dekoratif, di belakang semua),
- halaman aktif di sidebar dapat **rusuk emas menyala**, bukan cuma pil warna
  (perbedaan warna saja gampang terlewat di daftar 8 item),
- meter kesiapan tim mengisi dengan gradien maroon→emas ("masih memanas");
  begitu tim lengkap jadi sage rata — selesai, tidak perlu dilihat lagi,
- ikon kartu statistik menghangat ke emas saat didekati.

**Penutup landing (section 05).** Halaman dulu berhenti mendadak setelah
section 04. Sekarang ditutup crest yang sama dengan hero tapi diam — pembuka
merakit, penutup istirahat, jadi scroll-nya punya bentuk.

Semua efek baru punya jalur `prefers-reduced-motion` dan `prefers-contrast: more`.

Verifikasi: **85/85 tes · tsc bersih · build hijau 19 rute · 26/26 pasangan token
AA · 0 kegagalan di audit seluruh kode · 0 warna hardcoded.**

### Susulan 18 Ags (malam) — batas kartu/kotak nyaris tak kelihatan, diperbaiki

Dex: *"border tiap-tiap objek itu nggak kentara banget, seakan-akan langsung
background dan tulisan... susah banget bedain objek kotak berisi kata-kata."*

Diukur, ternyata benar: `.card`/`.tag`/chip pakai `--color-rule-soft` sebagai
border — **1,16:1 terhadap fill kartunya sendiri**, nyaris tak kelihatan
(ambang WCAG 1.4.11 untuk batas komponen UI itu 3:1). Ditambah, fill kartu
(`--color-surface` #1A1210) cuma **1,07:1** terhadap latar halaman — dua-duanya
lemah, kartu melebur jadi latar.

**Border diperbaiki penuh:** token baru `--color-line` (`#776859`, dipilih
lewat solver, bukan tebak-tebakan) — **3,17–3,66:1 di SEMUA permukaan** yang
dipakai (canvas/surface/surface-2), plus `--color-line-accent` (`#946e14`)
untuk kartu terpilih/aktif. Dipasang ke `.card`, `.card-sunk`, `.card-surface`,
`.card-glass`, `.tag`, dan 1 chip anggota di `dashboard/cross/mine`.

**Fill kartu naik secukupnya, jujur soal batasnya:** `--color-surface`
dinaikkan ke `#211B17` (1,07→1,16:1) — itu **plafon maksimal**, karena
`ink-faint` yang sudah lulus AA di atas kartu jadi pembatas keras (dicoba naik
lebih, langsung 4 pasangan teks gagal AA — dihitung, bukan ditebak, lihat
transcript). Konsekuensinya: `--color-surface-2` sekarang **sama** dengan
`--color-surface` — tidak ada headroom lagi buat kartu-di-dalam-kartu punya
warna beda; pembeda satu-satunya adalah border.

Verifikasi ulang **semua 26+ pasangan warna** yang pernah lulus AA (bukan cuma
yang baru diubah) — 0 gagal. `tsc` bersih, 85/85 tes, build hijau.

Ditambahkan juga ke `docs/BRIEF-ANTIGRAVITY_landing-page-2.md` §4.2b supaya
putaran desain berikutnya tidak mengulang pola lama.

