import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "./useSmoothScroll";

const HEADER_OFFSET = 88; // hauteur du header fixe

export function useScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Laisse le temps à la page (lazy) de se monter avant de cibler l'ancre.
      const id = setTimeout(() => {
        const el = document.querySelector(hash);
        const lenis = getLenis();
        if (el && lenis) lenis.scrollTo(el, { offset: -HEADER_OFFSET, duration: 1.2 });
        else if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior: "smooth" });
        else window.scrollTo({ top: 0, left: 0 });
      }, 250);
      return () => clearTimeout(id);
    }
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo({ top: 0, left: 0 });
  }, [pathname, hash]);

  useEffect(() => {
    // Les pages ont des hauteurs différentes : on recalcule les positions
    // des animations GSAP ScrollTrigger après le montage de la nouvelle page.
    const id = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(id);
  }, [pathname]);
}
