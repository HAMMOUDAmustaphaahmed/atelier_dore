import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Bord "déchiré" façon croûte de pain qui se fend en deux.
const LEFT_CLIP =
  "polygon(0 0, 54% 0, 47% 6%, 59% 13%, 44% 21%, 61% 29%, 43% 38%, 60% 47%, 42% 56%, 61% 65%, 44% 74%, 60% 83%, 46% 91%, 55% 100%, 0 100%)";
const RIGHT_CLIP =
  "polygon(100% 0, 46% 0, 53% 6%, 41% 13%, 56% 21%, 39% 29%, 57% 38%, 40% 47%, 58% 56%, 39% 65%, 56% 74%, 40% 83%, 54% 91%, 45% 100%, 100% 100%)";

// Alvéoles de la mie : générées une fois (stables entre les rendus).
function makeCrumbs(n = 60) {
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  return Array.from({ length: n }, () => ({ cx: 20 + rnd() * 60, cy: 10 + rnd() * 80, r: 1 + rnd() * 3.5 }));
}

export default function BreadReveal({ image, kicker, title, subtitle, children, aside }) {
  const sectionRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const steamRef = useRef(null);
  const textRef = useRef(null);
  const crumbs = useMemo(() => makeCrumbs(), []);

  useEffect(() => {
    // Jamais de `pin: true` ici (pin-spacer incompatible avec le démontage React) :
    // la fixité vient de `position: sticky`, GSAP n'anime que transform/opacity.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      });
      tl.to(leftRef.current, { xPercent: -26, ease: 'none' }, 0)
        .to(rightRef.current, { xPercent: 26, ease: 'none' }, 0)
        .to(steamRef.current, { opacity: 1, y: -60, ease: 'none' }, 0)
        .to(textRef.current, { y: -30, opacity: 0.85, ease: 'none' }, 0.15);
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[220vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-bakery-dark">
        {/* Mie dorée révélée dans la fente */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 100% at 50% 45%, #e8b94a 0%, #c98a2e 42%, #7a4a1e 78%, #3a2414 100%)" }} />
          <svg className="absolute inset-0 w-full h-full opacity-70" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            {crumbs.map((c, i) => <ellipse key={i} cx={`${c.cx}%`} cy={`${c.cy}%`} rx={c.r} ry={c.r * 0.7} fill="rgba(60,30,10,0.35)" />)}
          </svg>
          <div ref={steamRef} className="absolute inset-x-0 top-0 h-1/2 opacity-0" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)" }} />
        </div>

        {/* Deux moitiés de croûte qui s'écartent */}
        <div ref={leftRef} className="absolute inset-0 will-change-transform" style={{ clipPath: LEFT_CLIP }}>
          <img src={image} alt="" fetchPriority="high" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-bakery-dark/45" />
        </div>
        <div ref={rightRef} className="absolute inset-0 will-change-transform" style={{ clipPath: RIGHT_CLIP }}>
          <img src={image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-bakery-dark/45" />
        </div>

        {/* Texte */}
        <div ref={textRef} className="relative z-10 h-full flex flex-col items-center justify-center text-center text-bakery-light px-6 pt-16">
          {kicker && (
            <span className="text-bakery-honey font-medium tracking-[0.25em] uppercase text-[0.7rem] sm:text-xs mb-6">{kicker}</span>
          )}
          <h1 className="font-serif text-display-xl font-medium max-w-5xl text-balance mb-6">{title}</h1>
          {subtitle && <p className="text-lg sm:text-xl text-bakery-light/80 max-w-2xl text-balance mb-10">{subtitle}</p>}
          {children}
        </div>

        {aside && <div className="absolute bottom-6 left-6 z-10 hidden md:block">{aside}</div>}

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-bakery-light/70">
          <span className="text-[0.65rem] tracking-[0.25em] uppercase">Défiler pour entrer</span>
          <span className="block w-px h-8 bg-bakery-light/40 animate-floaty" />
        </div>
      </div>
    </section>
  );
}
