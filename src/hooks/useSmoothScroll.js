import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let instance = null;
export function getLenis() { return instance; }

// Défilement fluide (Lenis) synchronisé avec GSAP ScrollTrigger.
// Respecte prefers-reduced-motion. Piloté par le ticker GSAP (une seule boucle rAF).
export function useSmoothScroll() {
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      touchMultiplier: 1.3,
    });
    instance = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const update = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      instance = null;
    };
  }, []);
}

/** Met le défilement en pause (loader, menu mobile) ou le relance. */
export function setScrollLocked(locked) {
  if (!instance) return;
  if (locked) instance.stop(); else instance.start();
}
