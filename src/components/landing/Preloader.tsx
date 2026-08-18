"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";

/**
 * First-visit preloader.
 *
 * A count arcs past on a curve while the crest gathers its light, then the
 * whole thing dissolves. Modelled on the Moneta reference, rebuilt around
 * the flame instead of a sphere.
 *
 * Three rules keep this from becoming a tax on the person visiting:
 *   1. Once per browser session, not once per page view.
 *   2. Never for someone who asked for reduced motion — they get the page.
 *   3. Always skippable, and hard-capped, so it can never strand anyone.
 *
 * It is an overlay, not a gate: the page underneath has already rendered
 * and is fully readable the moment this clears.
 */

const SESSION_KEY = "ygms:preloaded";
const HARD_CAP_MS = 2600;

/** Numbers riding an arc, the way a speedometer sweeps past. */
function CountArc({ value }: { value: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const shown = useRef(0);
  const target = useRef(0);
  const raf = useRef<number | null>(null);

  target.current = value;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const W = 520;
    const H = 64;
    const RADIUS = 300;
    const CX = W / 2;
    const CY = 316;
    const STEP = Math.PI / 17;
    const SPAN = 5;

    const paint = (v: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== W * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);
      ctx.font = `300 16px ui-monospace, "SF Mono", Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let n = 0; n <= 100; n++) {
        const dist = n - v;
        const abs = Math.abs(dist);
        if (abs > SPAN) continue;

        const angle = -Math.PI / 2 + dist * STEP;
        const x = CX + Math.cos(angle) * RADIUS;
        const y = CY + Math.sin(angle) * RADIUS;
        if (x < -70 || x > W + 70 || y < -20 || y > H + 20) continue;

        const fade = Math.pow(1 - abs / SPAN, 2.2);
        const focal = Math.max(0, 1 - abs / 1.2);

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1 + focal * 0.35, 1 + focal * 0.35);
        if (focal > 0.05) {
          ctx.shadowColor = `rgba(253, 190, 2, ${focal * 0.9})`;
          ctx.shadowBlur = 20 * focal;
        }
        // The number under the needle is gold; its neighbours cool to cream.
        const g = Math.round(239 - focal * 49);
        const b = Math.round(226 - focal * 224);
        ctx.fillStyle = `rgba(253, ${g}, ${b}, ${Math.max(0, 0.95 * fade)})`;
        ctx.fillText(String(n), 0, 0);
        ctx.restore();
      }
    };

    const tick = () => {
      const delta = target.current - shown.current;
      if (Math.abs(delta) < 0.01) {
        shown.current = target.current;
        paint(shown.current);
        raf.current = null;
        return;
      }
      shown.current += delta * 0.08;
      paint(shown.current);
      raf.current = requestAnimationFrame(tick);
    };

    if (raf.current === null) raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, [value]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        width: 520,
        maxWidth: "92vw",
        height: 64,
        display: "block",
        WebkitMaskImage:
          "radial-gradient(ellipse 55% 100% at 50% 50%, #000 0%, rgba(0,0,0,.85) 35%, rgba(0,0,0,.35) 65%, transparent 100%)",
        maskImage:
          "radial-gradient(ellipse 55% 100% at 50% 50%, #000 0%, rgba(0,0,0,.85) 35%, rgba(0,0,0,.35) 65%, transparent 100%)",
      }}
    />
  );
}

export default function Preloader() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [count, setCount] = useState(0);

  const finish = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => {
      setActive(false);
      document.documentElement.style.removeProperty("overflow");
    }, 700);
  }, []);

  // Decide on the client only — the server has no idea whether this browser
  // has already seen it, and guessing would cause a hydration mismatch.
  useEffect(() => {
    if (reduced) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Private mode / storage blocked. Showing it once is the safe fallback.
    }
    if (seen) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* nothing to do */
    }
    setActive(true);
  }, [reduced]);

  useEffect(() => {
    if (!active || leaving) return;
    document.documentElement.style.overflow = "hidden";

    // Uneven steps: a bar that climbs at a constant rate reads as fake.
    let cancelled = false;
    let at = 0;
    const bump = () => {
      if (cancelled) return;
      const jump = Math.random() < 0.2 ? 2 + Math.random() * 4 : 7 + Math.random() * 16;
      at = Math.min(100, at + jump);
      setCount(at);
      if (at >= 100) {
        window.setTimeout(() => !cancelled && finish(), 480);
        return;
      }
      window.setTimeout(bump, 90 + Math.random() * 190);
    };
    const kickoff = window.setTimeout(bump, 220);

    // Nothing may hold the page hostage, whatever happens above.
    const cap = window.setTimeout(finish, HARD_CAP_MS);

    const skip = () => finish();
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });

    return () => {
      cancelled = true;
      window.clearTimeout(kickoff);
      window.clearTimeout(cap);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      document.documentElement.style.removeProperty("overflow");
    };
  }, [active, leaving, finish]);

  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat"
      onClick={finish}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0F0A08",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        opacity: leaving ? 0 : 1,
        transform: leaving ? "scale(1.04)" : "none",
        filter: leaving ? "blur(10px)" : "none",
        transition: "opacity .7s cubic-bezier(.4,0,.2,1), transform .7s, filter .7s",
        cursor: "pointer",
      }}
    >
      {/* Ember bloom behind everything */}
      <div
        aria-hidden="true"
        className="bloom"
        style={{
          width: "min(760px, 120vw)",
          height: "min(760px, 120vw)",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      {/* Sparks */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {Array.from({ length: 22 }, (_, i) => {
          const seeded = (i * 2654435761) % 1000 / 1000;
          const seeded2 = (i * 40503) % 997 / 997;
          return (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${8 + seeded * 84}%`,
                top: `${55 + seeded2 * 40}%`,
                width: 2,
                height: 2,
                borderRadius: "50%",
                background: "rgba(253,190,2,.75)",
                boxShadow: "0 0 6px rgba(253,190,2,.6)",
                animation: `drift-up ${4 + seeded2 * 4}s ease-out ${seeded * 3.5}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* Crest */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/derived/logo-crest-vector.svg"
          alt=""
          width={92}
          height={128}
          className="ember-breathe"
          style={{
            display: "block",
            filter: "drop-shadow(0 0 26px rgba(253,190,2,.45))",
          }}
        />
      </div>

      <div
        style={{
          zIndex: 2,
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          fontSize: 11,
          letterSpacing: "0.42em",
          color: "rgba(247,239,226,.72)",
          textIndent: "0.42em",
        }}
      >
        YOUTH GKKK JOGJA
      </div>

      <div style={{ zIndex: 2, marginTop: 4 }}>
        <CountArc value={count} />
      </div>
    </div>
  );
}
