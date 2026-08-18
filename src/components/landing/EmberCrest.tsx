"use client";

import { useEffect, useRef } from "react";
import crestPoints from "@/lib/crest-points.json";

/**
 * The crest, told as fire.
 *
 * 3,600 embers drift in the dark, then gather into the real Youth GKKK
 * crest — flame above, vessel below, cross held inside. The target
 * positions are sampled from `public/logo/derived/logo-crest-transparent.png`
 * (see scripts note in docs), so the shape people see assemble is the actual
 * logo, not an approximation of it.
 *
 * Why a ShaderMaterial instead of moving points in JS: every ember's drift,
 * flicker, size and colour is a pure function of (progress, time, its own
 * seed). Handing that to the GPU means the per-frame CPU cost is two uniform
 * writes rather than rewriting a 10,800-float buffer, which is what makes
 * this cheap enough to sit on the page people open most.
 *
 * A previous session shipped Three.js on this page and it had to be pulled:
 * 561 KB eagerly imported, an rAF loop that never stopped, `prefers-reduced-
 * motion` ignored, and GPU buffers leaked on unmount. Each of those is
 * addressed here — the module is only ever reached through a dynamic import,
 * the loop stops when the canvas leaves the viewport, reduced motion renders
 * a single settled frame with no loop at all, and everything allocated is
 * disposed.
 */

const COUNT = crestPoints.length / 2;

/** #83021C — the vessel's maroon, in linear-ish 0..1 for the shader. */
const COLD: [number, number, number] = [0x83 / 255, 0x02 / 255, 0x1c / 255];
/** #FDBE02 — the flame's gold. */
const HOT: [number, number, number] = [0xfd / 255, 0xbe / 255, 0x02 / 255];

const VERT = /* glsl */ `
  attribute vec3 aScatter;
  attribute float aHeat;
  attribute float aPhase;

  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;

  varying float vHeat;
  varying float vAlpha;

  void main() {
    // smoothstep so the gathering eases in and settles instead of arriving
    // at a constant speed and stopping dead.
    float e = uProgress * uProgress * (3.0 - 2.0 * uProgress);

    vec3 pos = mix(aScatter, position, e);

    float tau = 6.28318;
    float flick = sin(uTime * 2.0 + aPhase * tau) * 0.5 + 0.5;

    // Loose drift while still scattered — fades out as they find the shape.
    float drift = 1.0 - e;
    pos.x += sin(uTime * 0.40 + aPhase * tau) * 0.28 * drift;
    pos.y += cos(uTime * 0.33 + aPhase * 4.0) * 0.28 * drift;
    pos.z += sin(uTime * 0.27 + aPhase * 8.0) * 0.34 * drift;

    // Once formed, only the hot end keeps moving — the flame breathes, the
    // vessel holds still. That contrast is the whole point of the mark.
    pos.y += flick * 0.014 * aHeat * e;
    pos.x += sin(uTime * 3.0 + aPhase * 12.0) * 0.007 * aHeat * e;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uSize * (0.55 + aHeat * 0.8) * (0.7 + flick * 0.55);
    gl_PointSize = size * uPixelRatio * (10.0 / max(0.001, -mv.z));

    vHeat = aHeat;
    vAlpha = mix(0.32, 1.0, e) * (0.55 + flick * 0.45);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;

  uniform vec3 uCold;
  uniform vec3 uHot;

  varying float vHeat;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    // Soft falloff stands in for a sprite texture — one less asset to ship.
    float glow = pow(1.0 - d * 2.0, 2.2);
    gl_FragColor = vec4(mix(uCold, uHot, vHeat), glow * vAlpha);
  }
`;

type Props = {
  /** 0 = embers scattered, 1 = crest fully formed. */
  progress: number;
  /** Render one settled frame and never start a loop. */
  reducedMotion: boolean;
  className?: string;
};

export default function EmberCrest({
  progress,
  reducedMotion,
  className,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  // The scene is built once and driven by refs; re-rendering React on every
  // scroll frame to push a number into WebGL would be pure waste.
  const apiRef = useRef<{ setProgress: (p: number) => void } | null>(null);

  progressRef.current = progress;
  useEffect(() => {
    apiRef.current?.setProgress(progress);
  }, [progress]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    // Dynamic import keeps Three.js out of the initial page bundle entirely.
    // Named destructuring rather than a `* as THREE` namespace: the namespace
    // form pins the whole library as reachable and the bundler cannot drop
    // the two thirds of it (loaders, controls, every other geometry and
    // material) that this file never touches.
    import("three")
      .then(({
        WebGLRenderer,
        Scene,
        PerspectiveCamera,
        BufferGeometry,
        BufferAttribute,
        ShaderMaterial,
        Points,
        Group,
        Color,
        AdditiveBlending,
      }) => {
        if (disposed || !hostRef.current) return;

        let renderer: import("three").WebGLRenderer;
        try {
          renderer = new WebGLRenderer({
            alpha: true,
            antialias: false,
            powerPreference: "low-power",
          });
        } catch {
          // No WebGL (old device, blocked, software-rendering disabled).
          // Leaving the host empty lets the CSS fallback underneath show.
          return;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(dpr);
        renderer.setClearColor(0x000000, 0);
        host.appendChild(renderer.domElement);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";

        const scene = new Scene();
        const camera = new PerspectiveCamera(45, 1, 0.1, 100);

        // ---- geometry: crest targets + a scattered origin per ember -------
        const positions = new Float32Array(COUNT * 3);
        const scatter = new Float32Array(COUNT * 3);
        const heat = new Float32Array(COUNT);
        const phase = new Float32Array(COUNT);

        for (let i = 0; i < COUNT; i++) {
          // Stored quantised 0..1023 over the range -1..1.
          const qx = crestPoints[i * 2];
          const qy = crestPoints[i * 2 + 1];
          const x = (qx / 1023) * 2 - 1;
          const y = (qy / 1023) * 2 - 1;

          positions[i * 3] = x * 1.45;
          positions[i * 3 + 1] = y * 1.45;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.12;

          // Scatter origin: a wide shell around the shape, so they fly in
          // from everywhere rather than from one side.
          const a = Math.random() * Math.PI * 2;
          const r = 3.2 + Math.random() * 4.5;
          scatter[i * 3] = Math.cos(a) * r * 0.85;
          scatter[i * 3 + 1] = (Math.random() - 0.5) * 8.5;
          scatter[i * 3 + 2] = Math.sin(a) * r * 0.5 - 1.5;

          // Heat follows height: gold at the flame, maroon at the vessel.
          heat[i] = Math.min(1, Math.max(0, (y + 1) / 2));
          phase[i] = Math.random();
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute(
          "position",
          new BufferAttribute(positions, 3)
        );
        geometry.setAttribute("aScatter", new BufferAttribute(scatter, 3));
        geometry.setAttribute("aHeat", new BufferAttribute(heat, 1));
        geometry.setAttribute("aPhase", new BufferAttribute(phase, 1));

        const material = new ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          uniforms: {
            uProgress: { value: progressRef.current },
            uTime: { value: 0 },
            uSize: { value: 5.2 },
            uPixelRatio: { value: dpr },
            uCold: { value: new Color(...COLD) },
            uHot: { value: new Color(...HOT) },
          },
        });

        const points = new Points(geometry, material);
        const group = new Group();
        group.add(points);
        scene.add(group);

        // ---- resize ------------------------------------------------------
        const resize = () => {
          const w = host.clientWidth || 1;
          const h = host.clientHeight || 1;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          // On a narrow screen the crest has to sit further back or it
          // overflows the viewport and gets cropped at the flame.
          camera.updateProjectionMatrix();
          material.uniforms.uSize.value = w < 640 ? 3.8 : 5.2;
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(host);

        // ---- pointer parallax (desktop only, and never on touch) ---------
        let targetX = 0;
        let targetY = 0;
        const onPointer = (e: PointerEvent) => {
          if (e.pointerType === "touch") return;
          targetX = (e.clientX / window.innerWidth - 0.5) * 0.22;
          targetY = (e.clientY / window.innerHeight - 0.5) * 0.14;
        };
        window.addEventListener("pointermove", onPointer, { passive: true });

        const draw = (t: number) => {
          const p = progressRef.current;
          material.uniforms.uProgress.value = p;
          material.uniforms.uTime.value = t;

          // Pull in as the crest forms — the reveal earns the closeness.
          camera.position.z = 7.4 - p * 2.6;
          camera.position.x += (targetX - camera.position.x) * 0.06;
          camera.position.y += (targetY - camera.position.y) * 0.06;
          camera.lookAt(0, 0, 0);

          group.rotation.y = targetX * 0.6 + Math.sin(t * 0.12) * 0.05;
          renderer.render(scene, camera);
        };

        let raf: number | null = null;
        let running = false;
        const start = performance.now();

        const loop = () => {
          draw((performance.now() - start) / 1000);
          raf = requestAnimationFrame(loop);
        };

        const setRunning = (next: boolean) => {
          if (next === running) return;
          running = next;
          if (next) {
            loop();
          } else if (raf !== null) {
            cancelAnimationFrame(raf);
            raf = null;
          }
        };

        // Only animate while actually on screen. Off-screen canvases burning
        // GPU behind three sections of content was one of the original sins.
        const io = new IntersectionObserver(
          (entries) =>
            setRunning(!reducedMotion && entries.some((e) => e.isIntersecting)),
          { rootMargin: "10% 0px" }
        );
        io.observe(host);

        if (reducedMotion) {
          // One settled frame. No loop, ever.
          material.uniforms.uProgress.value = 1;
          draw(0);
        }

        apiRef.current = {
          setProgress: (v) => {
            progressRef.current = v;
            if (!running && !reducedMotion) draw(0);
          },
        };

        cleanup = () => {
          setRunning(false);
          io.disconnect();
          ro.disconnect();
          window.removeEventListener("pointermove", onPointer);
          geometry.dispose();
          material.dispose();
          renderer.dispose();
          renderer.domElement.remove();
          apiRef.current = null;
        };
      })
      .catch(() => {
        // Chunk failed to load — the static fallback stays visible.
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [reducedMotion]);

  return <div ref={hostRef} aria-hidden="true" className={className} />;
}
