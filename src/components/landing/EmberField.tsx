"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion";

type Props = {
  particleCount?: number;
  className?: string;
  speed?: number;
  colorScheme?: "gold-maroon" | "gold-only";
};

type Particle = {
  x: number;
  y: number;
  size: number;
  baseSize: number;
  vy: number;
  vx: number;
  alpha: number;
  maxAlpha: number;
  phase: number;
  color: string;
};

export default function EmberField({
  particleCount = 35,
  className = "absolute inset-0 pointer-events-none",
  speed = 1,
  colorScheme = "gold-maroon",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", onResize);

    const colors =
      colorScheme === "gold-maroon"
        ? [
            "rgba(253, 190, 2, ",   // Gold #FDBE02
            "rgba(255, 215, 0, ",   // Bright Gold
            "rgba(224, 86, 36, ",   // Ember Orange #E05624
            "rgba(131, 2, 28, ",    // Maroon #83021C
          ]
        : [
            "rgba(253, 190, 2, ",
            "rgba(255, 220, 100, ",
            "rgba(255, 175, 50, ",
          ];

    const particles: Particle[] = Array.from({ length: particleCount }, () => {
      const baseSize = Math.random() * 2.2 + 0.8;
      const maxAlpha = Math.random() * 0.7 + 0.3;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: baseSize,
        baseSize,
        vy: -(Math.random() * 0.45 + 0.2) * speed,
        vx: (Math.random() - 0.5) * 0.25 * speed,
        alpha: Math.random() * maxAlpha,
        maxAlpha,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });

    let running = true;
    let animId: number;
    let time = 0;

    // IntersectionObserver to pause loop when scrolled out of view
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (!running) {
          running = true;
          loop();
        }
      } else {
        running = false;
        cancelAnimationFrame(animId);
      }
    });

    observer.observe(canvas);

    const loop = () => {
      if (!running) return;
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.y += p.vy;
        p.x += p.vx + Math.sin(time + p.phase) * 0.3;

        // Reset if went above top
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
          p.alpha = 0;
        }

        // Smooth fade-in and fade-out based on height position
        const heightProgress = p.y / height;
        const fade = Math.sin(heightProgress * Math.PI);
        const currentAlpha = p.maxAlpha * fade * (0.7 + 0.3 * Math.sin(time * 2 + p.phase));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0, currentAlpha)})`;
        ctx.shadowBlur = p.size * 3;
        ctx.shadowColor = p.color.includes("253") ? "rgba(253, 190, 2, 0.8)" : "rgba(224, 86, 36, 0.5)";
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, [particleCount, speed, colorScheme, reduced]);

  if (reduced) return null;

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
