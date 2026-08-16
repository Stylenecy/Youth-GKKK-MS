# PANDUAN TEKNIS: Cinematic 3D Hero Canvas (Three.js + Post-Processing + Web Audio API)

> **Untuk Dex Bennett** — Dokumentasi ini dibuat agar teknik 3D Hero yang diimplementasikan di **Space Youth (YGMS v2)** bisa dipelajari dan diterapkan langsung di projek **Dex-Portfolio**!

---

## 1. Arsitektur Komponen (`Hero3DCanvas.tsx`)

Komponen 3D Hero ini menggabungkan **6 elemen visual & audio utama**:

```
                  ┌──────────────────────────────────────────┐
                  │          Three.js WebGL Canvas           │
                  └────────────────────┬─────────────────────┘
                                       │
      ┌────────────────┬───────────────┼───────────────┬────────────────┐
      ▼                ▼               ▼               ▼                ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
│  Emissive   │ │ UnrealBloom │ │ Reflector   │ │ THREE.Points│ │  Web Audio   │
│ 3D Geometry │ │ (Real Bloom)│ │(Wet Mirror) │ │ (Particles) │ │ Synthesizer  │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └──────────────┘
```

---

## 2. Rincian 6 Elemen Utama & Kode Sumbernya

### A. Real Bloom Effect (`UnrealBloomPass`)
Bukan bayangan blur CSS/PNG palsu! Menggunakan post-processing `EffectComposer` yang memproses intensitas cahaya emissive 3D secara fisik:

```typescript
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// Setup RenderPass & UnrealBloomPass
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  1.4,  // Strength (Kekuatan Pendaran)
  0.6,  // Radius (Jangkauan Bloom)
  0.15  // Threshold (Batas Intensitas Cahaya yang Mengeluarkan Bloom)
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Di dalam Animation Loop: panggil composer.render() bukan renderer.render()
composer.render();
```

### B. Emissive Material pada 3D Geometry
Supaya objek 3D memancarkan cahaya yang memicu Bloom:

```typescript
const ringMat = new THREE.MeshStandardMaterial({
  color: 0xf59e0b,
  emissive: 0xd97706,         // Warna Pendaran Amber
  emissiveIntensity: 2.5,     // Intensitas Pendaran Tinggi
  metalness: 0.8,
  roughness: 0.2,
});
```

### C. Reflector Plane (Cermin Basah / Wet Floor Mirror)
Efek lantai basah memantulkan objek 3D & partikel secara real-time di bawah viewport:

```typescript
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

const reflectorGeo = new THREE.PlaneGeometry(30, 30);
const reflectorFloor = new Reflector(reflectorGeo, {
  clipBias: 0.003,
  textureWidth: Math.floor(width * 0.75),
  textureHeight: Math.floor(height * 0.75),
  color: 0x221e1a, // Tint gelap lantai basah
});
reflectorFloor.rotation.x = -Math.PI / 2;
reflectorFloor.position.y = -0.8;
scene.add(reflectorFloor);
```

### D. Particle Field (`THREE.Points`)
Awan partikel melayang yang memberikan kedalaman atmosfer luar angkasa / spiritual:

```typescript
const particleCount = 450;
const particlePositions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  particlePositions[i * 3]     = (Math.random() - 0.5) * 14;
  particlePositions[i * 3 + 1] = Math.random() * 8 - 1;
  particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 14;
}

const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

const particleMat = new THREE.PointsMaterial({
  color: 0xfbefd5,
  size: 0.08,
  transparent: true,
  opacity: 0.75,
  blending: THREE.AdditiveBlending,
});

const particleSystem = new THREE.Points(particleGeo, particleMat);
scene.add(particleSystem);
```

### E. Three.Fog (Fading Depth into Canvas)
Menghilangkan batas tajam antara objek 3D dengan latar belakang kanvas:

```typescript
scene.fog = new THREE.FogExp2(0x131110, 0.045);
```

### F. Web Audio API Synthesizer (Atmospheric Ambient Pad)
Tanpa file `.mp3` eksternal! Menggunakan Web Audio API bawaan browser untuk mensintesis gelombang suara ambient warm pad dengan frekuensi akord celestial (110Hz, 164.81Hz, 220Hz, 277.18Hz) & LFO detune wobble:

```typescript
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const ctx = new AudioCtx();

const masterGain = ctx.createGain();
masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
masterGain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 2.5); // Smooth fade in

// Lowpass Filter untuk Suara Hangat
const filter = ctx.createBiquadFilter();
filter.type = "lowpass";
filter.frequency.setValueAtTime(450, ctx.currentTime);

masterGain.connect(filter);
filter.connect(ctx.destination);

// Akord Suara Ambient (F# Minor / A Major Frequencies)
const freqs = [110.0, 164.81, 220.0, 277.18];
freqs.forEach((f) => {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(f, ctx.currentTime);

  // LFO Wobble untuk Kedalaman Suara
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.2;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 1.5;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start();

  osc.connect(masterGain);
  osc.start();
});
```

---

## 3. Cara Mengadopsi ke `Dex-Portfolio`

1. **Instal Dependensi di Repo Dex-Portfolio**:
   ```bash
   npm install three @types/three
   ```
2. **Copy / Adaptasi Komponen**:
   Ambil struktur `src/components/Hero3DCanvas.tsx` dari projek `Youth-GKKK_MS`.
3. **Ubah Geometri Centerpiece**:
   Untuk `Dex-Portfolio`, ganti Salib/Ring dengan geometri 3D representasi portfolio Dex (misalnya: *Icosahedron*, *Monolith*, atau *Abstract Tech Node Mesh*).
4. **Warna Theme**:
   Sesuaikan warna `color` & `emissive` (misal: aksen Cyan `#06b6d4` atau Cyber Amber `#f59e0b`).

---
*Dokumen ini dibuat otomatis oleh Antigravity untuk dokumentasi teknik 3D Dex Bennett.*
