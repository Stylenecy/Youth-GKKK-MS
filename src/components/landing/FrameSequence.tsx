"use client";

import { useEffect, useRef, useState } from "react";
import { clamp, useReducedMotion, useScrollProgress } from "@/lib/motion";

/**
 * Scroll-scrubbed image sequence — a 3D render taken apart frame by frame.
 *
 * This is the receiver for the rendered assets. Nothing here needs the frames
 * to exist yet: with `frameCount = 0` it renders the poster and stays quiet,
 * so the page is shippable today and the sequence drops in later without a
 * rewrite. See `docs/ASSET-SPEC_landing-3d.md` for exactly what to render.
 *
 * Why canvas rather than 120 stacked <img> tags with opacity: the browser
 * would keep every one of them in the layer tree and composite them on each
 * frame. One canvas draws exactly one bitmap per frame regardless of how
 * long the sequence is.
 *
 * Loading is deliberate about not being a bandwidth ambush:
 *   - frames are fetched only once the section is near the viewport,
 *   - they arrive in scroll order so early scrubbing works immediately,
 *   - whatever has arrived is what gets drawn; a gap falls back to the
 *     nearest loaded frame rather than flashing empty.
 */

type Props = {
  /** `(i) => url`, i is 1-based. */
  frameUrl: (i: number) => string;
  /** Total frames. 0 disables the sequence and shows the poster only. */
  frameCount: number;
  /** Shown before frames load, under reduced motion, and on failure. */
  posterUrl: string;
  /** Intrinsic pixel size of a frame — sets the canvas backing store. */
  width: number;
  height: number;
  /** How tall the scroll track is. More = slower, more deliberate scrub. */
  scrollHeight?: string;
  children?: React.ReactNode;
};

export default function FrameSequence({
  frameUrl,
  frameCount,
  posterUrl,
  width,
  height,
  scrollHeight = "260svh",
  children,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const progress = useScrollProgress(trackRef);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  const enabled = frameCount > 0 && !reduced;

  // ---- fetch frames, in scroll order, only when near the viewport --------
  useEffect(() => {
    if (!enabled) return;
    const track = trackRef.current;
    if (!track) return;

    framesRef.current = new Array(frameCount).fill(null);
    let cancelled = false;
    let started = false;

    const load = () => {
      if (started) return;
      started = true;

      let i = 0;
      const CONCURRENCY = 6;

      const next = () => {
        if (cancelled || i >= frameCount) return;
        const index = i++;
        const img = new Image();
        img.decoding = "async";
        img.src = frameUrl(index + 1);
        img.onload = () => {
          if (cancelled) return;
          framesRef.current[index] = img;
          if (index === 0) setReady(true);
          next();
        };
        // A missing frame must not stall the queue behind it.
        img.onerror = next;
      };

      for (let k = 0; k < CONCURRENCY; k++) next();
    };

    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && load(),
      { rootMargin: "80% 0px" }
    );
    io.observe(track);

    return () => {
      cancelled = true;
      io.disconnect();
      framesRef.current = [];
    };
  }, [enabled, frameCount, frameUrl]);

  // ---- draw the frame for the current scroll position -------------------
  useEffect(() => {
    if (!enabled || !ready) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const want = Math.round(clamp(progress) * (frameCount - 1));

    // Walk back to the nearest frame that has actually arrived, so an
    // incomplete download degrades into a slightly stale frame rather than
    // a blank canvas.
    let img: HTMLImageElement | null = null;
    for (let i = want; i >= 0; i--) {
      const f = framesRef.current[i];
      if (f) {
        img = f;
        break;
      }
    }
    if (!img) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, [progress, ready, enabled, frameCount]);

  return (
    <div ref={trackRef} style={{ height: reduced ? "auto" : scrollHeight }} className="relative">
      <div
        className={
          reduced
            ? "relative flex min-h-[60svh] items-center justify-center overflow-hidden"
            : "sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden"
        }
      >
        {/* Poster: the truth until frames prove otherwise. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ opacity: ready && enabled ? 0 : 1, transition: "opacity .4s ease" }}
        />

        {enabled && (
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-contain"
            style={{ opacity: ready ? 1 : 0, transition: "opacity .4s ease" }}
          />
        )}

        {children}
      </div>
    </div>
  );
}
