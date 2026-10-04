"use client";

import { useEffect } from "react";

/**
 * The landing page's single motion conductor.
 *
 * Every section is a server component with plain markup; this is the only
 * client code on the page. It loads GSAP after the page is already visible
 * (dynamic import), then wires the reveals by data attribute:
 *
 *   data-reveal="lines"  SplitText lines rise out of their masks   (Elsye E12)
 *   data-reveal="fade"   rise 24 px + fade, batched                (Elsye E03)
 *   data-reveal="clip"   bottom-up clip-path reveal                (Elsye E16)
 *   data-reveal="rule"   hairline draws left to right              (Elsye E06)
 *   data-reveal="meter"  steward meter grows to its value
 *   data-count           counts up once, on entry                  (Elsye E10)
 *   data-ritme           the page's one pinned sequence, desktop   (house §4)
 *   data-hero            depth exit while scrolling away           (Elsye E07–E09)
 *   data-magnetic        ≤ 6 px pull toward the pointer, desktop   (Bohdan D4)
 *
 * Budget (DEX-MOTION-LANGUAGE §1.5): nothing runs while the page is still.
 * Entry is detected with IntersectionObserver and scroll-linked motion with
 * a passive scroll listener — no ScrollTrigger, because ScrollTrigger keeps
 * an empty requestAnimationFrame loop alive for as long as it is enabled
 * (measured 4 Oct: ~60 calls/s while idle). GSAP's own ticker sleeps once
 * its tweens finish; smooth scroll only drives frames while it is moving.
 * prefers-reduced-motion: none of this is loaded; everything is visible.
 */
export default function LandingMotion() {
  useEffect(() => {
    const html = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      html.classList.remove("lp-js", "lp-ready");
      return;
    }
    // Client-side navigation back to "/" does not re-run the inline script.
    html.classList.add("lp-js");

    let cancelled = false;
    const cleanups: Array<() => void> = [];
    const listen = <K extends keyof WindowEventMap>(
      type: K,
      fn: (e: WindowEventMap[K]) => void,
      opts?: AddEventListenerOptions
    ) => {
      window.addEventListener(type, fn, opts);
      cleanups.push(() => window.removeEventListener(type, fn, opts));
    };

    (async () => {
      const [{ gsap }, { SplitText }] = await Promise.all([import("gsap"), import("gsap/SplitText")]);
      if (cancelled) return;
      gsap.registerPlugin(SplitText);

      const EXPO = "expo.out";
      const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const desktop = window.matchMedia("(min-width: 1024px)");
      const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);
      const $$ = (sel: string) => gsap.utils.toArray<HTMLElement>(sel);
      const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
      const byDomOrder = (a: Element, b: Element) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

      /* ---------------- Entry: one observer, fires once per element. -------- */
      const onEnter = new Map<Element, () => void>();
      const batches: Record<string, (els: HTMLElement[]) => void> = {};
      const io = new IntersectionObserver(
        (entries) => {
          const groups: Record<string, HTMLElement[]> = {};
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const el = e.target as HTMLElement;
            io.unobserve(el);
            const kind = el.dataset.reveal;
            if (kind && batches[kind]) (groups[kind] ??= []).push(el);
            const fn = onEnter.get(el);
            if (fn) {
              onEnter.delete(el);
              fn();
            }
          }
          for (const [kind, els] of Object.entries(groups)) batches[kind](els.sort(byDomOrder));
        },
        { rootMargin: "0px 0px -8% 0px" }
      );
      cleanups.push(() => io.disconnect());

      // Setup runs in slices with a yield between them, so a slow phone never
      // sees one long task from motion (budget: none over 200 ms). Content
      // stays behind the lp-js guard until the last slice lifts it.
      const ctx = gsap.context(() => {});
      cleanups.push(() => ctx.revert());
      const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));

      await yieldToMain();
      if (cancelled) return;
      ctx.add(() => {
        /* Lines: hidden now, split only when about a screen away (measuring
           lines forces layout; doing all of them at once was a 400–500 ms
           task on a throttled phone), played on entry. autoSplit re-splits on
           resize and after fonts load; once revealed, a re-split simply
           leaves the new lines in place. */
        const tweens = new Map<Element, gsap.core.Tween>();
        const splitDone = new WeakSet<Element>();
        // Splits happen later, from observer callbacks — ctx.add() records
        // them in the context so leaving the page reverts them (and drops
        // autoSplit's ResizeObserver and fonts listener with them).
        const split = (el: HTMLElement) => {
          if (splitDone.has(el)) return;
          splitDone.add(el);
          ctx.add(() => {
            SplitText.create(el, {
              type: "lines",
              mask: "lines",
              autoSplit: true,
              onSplit(self) {
                if (el.dataset.revealed) return;
                const tw = gsap.from(self.lines, {
                  yPercent: 110,
                  duration: 1.05,
                  ease: EXPO,
                  stagger: 0.08,
                  paused: true,
                });
                tweens.set(el, tw);
                return tw;
              },
            });
            gsap.set(el, { visibility: "visible" });
          });
        };
        const ahead = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue;
              ahead.unobserve(e.target);
              split(e.target as HTMLElement);
            }
          },
          { rootMargin: "100% 0px 100% 0px" }
        );
        cleanups.push(() => ahead.disconnect());
        $$('[data-reveal="lines"]').forEach((el) => {
          gsap.set(el, { visibility: "hidden" });
          onEnter.set(el, () => {
            split(el); // no-op if the look-ahead already split it
            el.dataset.revealed = "1";
            tweens.get(el)?.play();
          });
          ahead.observe(el);
          io.observe(el);
        });
      });

      await yieldToMain();
      if (cancelled) return;
      ctx.add(() => {
        /* Fade, clip, rule: hidden now, revealed as a staggered batch. */
        const fades = $$('[data-reveal="fade"]');
        gsap.set(fades, { autoAlpha: 0, y: 24 });
        batches.fade = (els) =>
          gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.95, ease: EXPO, stagger: 0.08, overwrite: true });

        const clips = $$('[data-reveal="clip"]');
        gsap.set(clips, { clipPath: "inset(100% 0% 0% 0%)" });
        batches.clip = (els) =>
          gsap.to(els, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.15, ease: EXPO, stagger: 0.1 });

        const rules = $$('[data-reveal="rule"]');
        gsap.set(rules, { scaleX: 0, transformOrigin: "left center" });
        batches.rule = (els) => gsap.to(els, { scaleX: 1, duration: 1.3, ease: EXPO, stagger: 0.1 });

        [...fades, ...clips, ...rules].forEach((el) => io.observe(el));

        $$('[data-reveal="meter"]').forEach((el) => {
          const tw = gsap.from(el, { scaleX: 0, transformOrigin: "left center", duration: 1.4, ease: EXPO, paused: true });
          onEnter.set(el, () => tw.play());
          io.observe(el);
        });

        /* Counters: the server rendered the real number; count up to it. */
        $$("[data-count]").forEach((el) => {
          const target = Number(el.dataset.count);
          if (!Number.isFinite(target) || target <= 0) return;
          const state = { v: 0 };
          el.textContent = "0";
          onEnter.set(el, () =>
            gsap.to(state, {
              v: target,
              duration: 1.8,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = String(Math.round(state.v));
              },
            })
          );
          io.observe(el);
        });
      });

      await yieldToMain();
      if (cancelled) return;

      /* ---------------- Scroll-linked: one passive listener. ---------------- */
      const nav = $("[data-nav]");
      const hero = $("[data-hero]");
      const title = $("[data-hero-title]");
      const crest = $("[data-hero-crest]");
      const ritme = $("[data-ritme]");
      const track = $("[data-ritme-track]");
      const bar = $("[data-ritme-progress]");
      let distance = 0;
      let pinned = false;
      let lastY = window.scrollY;
      let frame = 0;

      const measureRitme = () => {
        if (!ritme || !track || !track.parentElement) return;
        pinned = desktop.matches;
        ritme.classList.toggle("is-pinned", pinned);
        if (!pinned) {
          ritme.style.height = "";
          gsap.set(track, { x: 0 });
          return;
        }
        distance = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
        ritme.style.height = `${window.innerHeight + distance}px`;
      };

      const update = () => {
        frame = 0;
        // Read every measurement first, then write — interleaving the two
        // forces a fresh layout per read.
        const y = window.scrollY;
        const vh = window.innerHeight;
        const heroRect = hero && title && crest ? hero.getBoundingClientRect() : null;
        const ritmeRect = pinned && ritme && track ? ritme.getBoundingClientRect() : null;

        if (nav) {
          nav.classList.toggle("is-scrolled", y > 24);
          if (Math.abs(y - lastY) > 4) nav.classList.toggle("is-hidden", y > lastY && y > 360);
        }
        lastY = y;

        if (heroRect && heroRect.bottom > 0) {
          const p = clamp01(-heroRect.top / heroRect.height);
          gsap.set(title, { yPercent: -16 * p, opacity: 1 - 0.8 * p });
          gsap.set(crest, { yPercent: 14 * p, scale: 1 - 0.06 * p });
        }

        if (ritmeRect && ritmeRect.top < vh && ritmeRect.bottom > 0) {
          const p = clamp01(-ritmeRect.top / Math.max(1, distance));
          gsap.set(track, { x: -distance * p });
          if (bar) gsap.set(bar, { scaleX: p, transformOrigin: "left center" });
        }
      };
      const request = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      listen("scroll", request, { passive: true });
      listen("resize", () => {
        measureRitme();
        request();
      });
      cleanups.push(() => {
        if (frame) cancelAnimationFrame(frame);
        if (ritme) {
          ritme.classList.remove("is-pinned");
          ritme.style.height = "";
        }
      });
      measureRitme();
      update();

      /* ---------------- Magnetic buttons (Bohdan D4), ≤ 6 px. -------------- */
      if (finePointer) {
        $$("[data-magnetic]").forEach((el) => {
          const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
          const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            xTo(((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 6);
            yTo(((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * 6);
          };
          const leave = () => {
            xTo(0);
            yTo(0);
          };
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerleave", leave);
          });
        });
      }

      /* ---------------- Ambient CSS loops pause off screen. ---------------- */
      const ambient = new IntersectionObserver(
        (entries) => {
          for (const e of entries) e.target.classList.toggle("is-offscreen", !e.isIntersecting);
        },
        { rootMargin: "60px 0px" }
      );
      document.querySelectorAll("[data-hero]").forEach((el) => ambient.observe(el));
      cleanups.push(() => ambient.disconnect());

      // GSAP owns every hidden state now; lift the pre-paint guard.
      html.classList.add("lp-ready");

      document.fonts?.ready.then(() => {
        if (!cancelled) {
          measureRitme();
          request();
        }
      });

      /* ---------------- Smooth scroll: desktop pointers, frames only while moving. */
      if (finePointer) {
        const { default: Lenis } = await import("lenis");
        if (cancelled) return;
        const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: false });
        let lf = 0;
        let running = false;
        const loop = (t: number) => {
          lenis.raf(t);
          if (lenis.isScrolling) lf = requestAnimationFrame(loop);
          else running = false;
        };
        const kick = () => {
          if (running) return;
          running = true;
          // Lenis measures time between raf() calls; after an idle stretch
          // that gap would make the first frame jump straight to the target.
          // time = 0 makes the first frame's delta zero (lenis.mjs raf()).
          lenis.time = 0;
          lf = requestAnimationFrame(loop);
        };
        listen("wheel", kick, { passive: true });

        const onClick = (e: MouseEvent) => {
          const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
          // e.detail === 0: activated from the keyboard (skip link, Tab+Enter)
          // — leave it native so focus moves with it (WCAG 2.4.1).
          if (!a || e.defaultPrevented || e.detail === 0 || e.button !== 0 || e.metaKey || e.ctrlKey) return;
          const id = a.getAttribute("href")!.slice(1);
          const target = id ? document.getElementById(id) : null;
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target, { offset: -8, duration: 1.4 });
          kick();
          if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          history.replaceState(null, "", `#${id}`);
        };
        document.addEventListener("click", onClick);

        cleanups.push(() => {
          cancelAnimationFrame(lf);
          document.removeEventListener("click", onClick);
          lenis.destroy();
        });
      }
    })().catch(() => {
      // Chunk failed to load: show everything rather than wait for the failsafe.
      html.classList.remove("lp-js", "lp-ready");
    });

    return () => {
      cancelled = true;
      cleanups.reverse().forEach((fn) => fn());
      html.classList.remove("lp-js", "lp-ready");
    };
  }, []);

  return null;
}
