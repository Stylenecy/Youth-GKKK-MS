import { CREST_COUNT, CREST_POINTS_B64 } from "./crest-points";

/**
 * The crest, told as fire — v3 port of the v2 `EmberCrest`
 * (tag `backup/landing-v2-2026-10-04`).
 *
 * 3,600 embers drift in the dark, then gather into the real Youth GKKK
 * crest as the visitor scrolls: flame above (gold), vessel below (maroon).
 * The targets are sampled from the actual logo, so the shape that assembles
 * is the mark itself.
 *
 * Same shader as v2, but on raw WebGL instead of Three.js: the v3 budget
 * (≤ 60 KB gz of motion JS) has no room for a 130 KB renderer when the
 * scene is one draw call. Every ember's drift, flicker and colour is a pure
 * function of (progress, time, its own seed), so a frame costs the CPU a
 * handful of uniform writes.
 *
 * Budget rules (DEX-MOTION-LANGUAGE §1.5, RENCANA §6):
 * - the module is only reached through a dynamic import, after the stage is
 *   about one screen away;
 * - frames run only while the stage is on screen, the tab is visible, and
 *   something is happening (scrolling, the shape still settling, or a few
 *   seconds of "breathing" after the last scroll). A still page draws
 *   nothing — rAF while idle stays 0;
 * - "lite" tier (weak phones): half the embers, pixel ratio 1, 30 fps, and a
 *   shorter breathing window. A device that turns out slower than it claims
 *   is demoted to lite after its first frames;
 * - software-rendered WebGL is refused (failIfMajorPerformanceCaveat): the
 *   static crest underneath stays instead.
 */

export type FireTier = "full" | "lite";

export type FireHandle = {
  /** Something moved — keep drawing for a while. */
  wake: () => void;
  destroy: () => void;
};

type Options = {
  tier: FireTier;
  /** 0 = embers scattered, 1 = crest formed. Read every frame. */
  target: () => number;
  /** Called once the first frame is on screen. */
  onReady: () => void;
  /** Called if the context is lost; the caller falls back to the image. */
  onLost: () => void;
  /** Called when a slow "full" device is demoted to "lite". */
  onTier?: (tier: FireTier) => void;
};

const TOTAL = CREST_COUNT;

/** Unpack the 10-bit crest coordinates (see crest-points.ts). */
function decodeCrest(): Uint16Array {
  const bytes = atob(CREST_POINTS_B64);
  const out = new Uint16Array(TOTAL * 2);
  let acc = 0;
  let bits = 0;
  let k = 0;
  for (let i = 0; i < bytes.length && k < out.length; i++) {
    acc |= bytes.charCodeAt(i) << bits;
    bits += 8;
    if (bits >= 10) {
      out[k++] = acc & 1023;
      acc >>= 10;
      bits -= 10;
    }
  }
  return out;
}
const FOCAL = 1 / Math.tan((45 * Math.PI) / 360); // 45° vertical FOV

const VERT = `
attribute vec2 aTarget;
attribute vec3 aScatter;
attribute vec2 aSeed;
uniform float uProgress;
uniform float uTime;
uniform float uSize;
uniform float uPR;
uniform float uAspect;
uniform vec3 uCam;
uniform float uRot;
varying float vHeat;
varying float vAlpha;
void main() {
  float e = uProgress * uProgress * (3.0 - 2.0 * uProgress);
  float heat = clamp((aTarget.y / 1.65 + 1.0) * 0.5, 0.0, 1.0);
  vec3 pos = mix(aScatter, vec3(aTarget, aSeed.y), e);
  float tau = 6.28318;
  float ph = aSeed.x;
  float flick = sin(uTime * 2.0 + ph * tau) * 0.5 + 0.5;
  float drift = 1.0 - e;
  pos.x += sin(uTime * 0.40 + ph * tau) * 0.28 * drift;
  pos.y += cos(uTime * 0.33 + ph * 4.0) * 0.28 * drift;
  pos.z += sin(uTime * 0.27 + ph * 8.0) * 0.34 * drift;
  // Once formed, only the hot end keeps moving: the flame breathes, the
  // vessel holds still.
  pos.y += flick * 0.014 * heat * e;
  pos.x += sin(uTime * 3.0 + ph * 12.0) * 0.007 * heat * e;
  float c = cos(uRot);
  float s = sin(uRot);
  pos = vec3(c * pos.x + s * pos.z, pos.y, -s * pos.x + c * pos.z);
  vec3 v = pos - uCam;
  float d = max(0.001, -v.z);
  gl_Position = vec4(v.x * ${FOCAL.toFixed(5)} / uAspect, v.y * ${FOCAL.toFixed(5)}, 0.0, d);
  gl_PointSize = uSize * (0.55 + heat * 0.8) * (0.7 + flick * 0.55) * uPR * (10.0 / d);
  vHeat = heat;
  vAlpha = mix(0.32, 1.0, e) * (0.55 + flick * 0.45);
}`;

const FRAG = `
precision mediump float;
varying float vHeat;
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float glow = pow(1.0 - d * 2.0, 2.2);
  // #83021C (vessel maroon) → #FDBE02 (flame gold)
  vec3 col = mix(vec3(0.514, 0.008, 0.110), vec3(0.992, 0.745, 0.008), vHeat);
  gl_FragColor = vec4(col, glow * vAlpha);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
}

export function createEmberCrest(host: HTMLElement, opts: Options): FireHandle | null {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    powerPreference: "low-power",
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return null;

  // A failed setup releases its context now rather than whenever GC runs.
  const giveUp = () => {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  };
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return giveUp();
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return giveUp();
  gl.useProgram(prog);

  // ---- geometry ---------------------------------------------------------
  // Shuffled, so any prefix of the buffer is an even sample of the whole
  // crest: the lite tier (and a mid-flight demotion) just draws fewer.
  const order = Array.from({ length: TOTAL }, (_, i) => i);
  for (let i = TOTAL - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const crestPoints = decodeCrest();
  const data = new Float32Array(TOTAL * 7);
  for (let k = 0; k < TOTAL; k++) {
    const i = order[k];
    // Stored quantised 0..1023 over the range -1..1.
    const x = (crestPoints[i * 2] / 1023) * 2 - 1;
    const y = (crestPoints[i * 2 + 1] / 1023) * 2 - 1;
    const a = Math.random() * Math.PI * 2;
    const r = 3.4 + Math.random() * 4.8;
    const o = k * 7;
    data[o] = x * 1.65;
    data[o + 1] = y * 1.65;
    // Scatter origin: a wide shell around the shape, so they fly in from
    // everywhere rather than from one side.
    data[o + 2] = Math.cos(a) * r * 0.85;
    data[o + 3] = (Math.random() - 0.5) * 8.5;
    data[o + 4] = Math.sin(a) * r * 0.5 - 1.5;
    data[o + 5] = Math.random();
    data[o + 6] = (Math.random() - 0.5) * 0.15;
  }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const attr = (name: string, size: number, offset: number) => {
    const loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 28, offset * 4);
  };
  attr("aTarget", 2, 0);
  attr("aScatter", 3, 2);
  attr("aSeed", 2, 5);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  const uProgress = u("uProgress");
  const uTime = u("uTime");
  const uSize = u("uSize");
  const uPR = u("uPR");
  const uAspect = u("uAspect");
  const uCam = u("uCam");
  const uRot = u("uRot");

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  // Additive light, kept premultiplied: colour = Σ c·a, alpha = Σ a.
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  let tier = opts.tier;
  let count = tier === "lite" ? Math.round(TOTAL / 2) : TOTAL;
  let pr = 1;
  let aspect = 1;
  let width = 1;
  let baseZ = 1;

  const resize = () => {
    pr = tier === "lite" ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    width = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    canvas.width = Math.round(width * pr);
    canvas.height = Math.round(h * pr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = width / h;
    // On a narrow stage the crest sits further back so the flame and the
    // vessel's edges are never cropped.
    baseZ = aspect < 0.8 ? 0.8 / aspect : 1;
    gl.uniform1f(uAspect, aspect);
    gl.uniform1f(uPR, pr);
    const size = width < 640 ? 4.8 : 6.8;
    gl.uniform1f(uSize, tier === "lite" ? size * 1.25 : size);
  };

  // ---- pointer parallax (fine pointers only) ----------------------------
  let px = 0;
  let py = 0;
  let camX = 0;
  let camY = 0;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const onPointer = (e: PointerEvent) => {
    px = (e.clientX / window.innerWidth - 0.5) * 0.22;
    py = (e.clientY / window.innerHeight - 0.5) * 0.14;
    wake();
  };

  // ---- frame ------------------------------------------------------------
  let shown = 0;
  const t0 = performance.now();
  let drawn = false;

  const draw = (now: number) => {
    const t = (now - t0) / 1000;
    const goal = Math.min(1, Math.max(0, opts.target()));
    // The first frame starts where the scroll already is — a stage that is
    // on screen when the engine arrives (restored scroll, anchor jump, fast
    // fling) must not flash scattered embers over the still crest.
    if (!drawn) shown = goal;
    shown += (goal - shown) * (tier === "lite" ? 0.2 : 0.12);
    if (Math.abs(goal - shown) < 0.0005) shown = goal;
    camX += (px - camX) * 0.06;
    camY += (py - camY) * 0.06;
    gl.uniform1f(uProgress, shown);
    gl.uniform1f(uTime, t);
    // Pull in as the crest forms — the reveal earns the closeness.
    gl.uniform3f(uCam, camX, camY, (7.4 - shown * 2.6) * baseZ);
    gl.uniform1f(uRot, camX * 0.6 + Math.sin(t * 0.12) * 0.05);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, count);
    if (!drawn) {
      drawn = true;
      opts.onReady();
    }
    return Math.abs(goal - shown) > 0 || Math.abs(px - camX) > 0.001 || Math.abs(py - camY) > 0.001;
  };

  // ---- loop: only while visible AND awake -------------------------------
  const breatheFor = () => (tier === "lite" ? 2500 : 6000);
  let awakeUntil = 0;
  let onScreen = false;
  let raf = 0;
  let last = 0;
  let probeFrames = 0;
  let probeStart = 0;
  // Set when a stopped rAF chain restarts, so the speed probe can tell a
  // pause (asleep, off screen, hidden tab) from a genuinely slow frame.
  let resumed = false;

  const tick = (now: number) => {
    raf = 0;
    if (!onScreen || document.hidden) return;
    // Lite: 30 fps is plenty for embers and halves the GPU work.
    if (tier === "lite" && now - last < 30) {
      raf = requestAnimationFrame(tick);
      return;
    }
    last = now;
    const moving = draw(now);
    // A "full" device that cannot hold ~40 fps over 40 consecutive frames is
    // demoted for good. A pause restarts the count so the pause itself is
    // never mistaken for slowness; a slow frame does not.
    if (tier === "full" && probeFrames < 40) {
      if (probeFrames === 0 || resumed) {
        probeStart = now;
        probeFrames = 0;
      }
      resumed = false;
      probeFrames++;
      if (probeFrames === 40 && (now - probeStart) / 39 > 25) {
        tier = "lite";
        count = Math.round(TOTAL / 2);
        resize();
        opts.onTier?.(tier);
      }
    }
    if (moving || now < awakeUntil) raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    awakeUntil = performance.now() + breatheFor();
    if (!raf && onScreen && !document.hidden) {
      resumed = true;
      raf = requestAnimationFrame(tick);
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      if (onScreen) wake();
    },
    { rootMargin: "5% 0px" }
  );
  const ro = new ResizeObserver(() => {
    resize();
    // Repaint once even if asleep, so a rotated phone is never left with a
    // stretched last frame.
    if (onScreen) wake();
  });
  const onVisibility = () => {
    if (!document.hidden) wake();
  };
  // Not restored: the still crest underneath is the fallback.
  const onLost = () => {
    destroy();
    opts.onLost();
  };

  host.appendChild(canvas);
  resize();
  io.observe(host);
  ro.observe(host);
  window.addEventListener("scroll", wake, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost);
  if (fine) window.addEventListener("pointermove", onPointer, { passive: true });

  let destroyed = false;
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    io.disconnect();
    ro.disconnect();
    window.removeEventListener("scroll", wake);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
    window.removeEventListener("pointermove", onPointer);
    gl!.deleteBuffer(buf);
    gl!.deleteProgram(prog);
    gl!.deleteShader(vs);
    gl!.deleteShader(fs);
    gl!.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  }

  return { wake, destroy };
}
