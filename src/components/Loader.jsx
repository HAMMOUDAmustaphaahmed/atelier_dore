import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flame, DoorOpen } from "lucide-react";

const DURATION = 2.6;      // secondes de "cuisson"
const AUTO_OPEN_AFTER = 7; // secondes avant ouverture automatique si l'on ne clique pas

// Étapes de couleur du pain : pâle -> doré -> bien cuit, comme une vraie cuisson.
const BREAD_COLORS = ["#efe1c2", "#e3b45e", "#c9822e", "#8f5a22"];

function formatTime(s) {
  const clamped = Math.max(s, 0);
  const whole = Math.floor(clamped);
  const tenth = Math.floor((clamped - whole) * 10);
  return `00:0${whole}.${tenth}`;
}

export default function Loader({ onDone }) {
  const [phase, setPhase] = useState("cuisson"); // cuisson → porte → ouverture
  const timerRef = useRef(null);
  const dialRef = useRef(null);
  const breadRef = useRef(null);
  const glowRef = useRef(null);
  const flashRef = useRef(null);
  const leftDoorRef = useRef(null);
  const rightDoorRef = useRef(null);
  const contentRef = useRef(null);
  const dingRef = useRef(null);
  const doorBtnRef = useRef(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Cuisson : chrono (écrit directement dans le DOM, sans re-rendu), cadran, couleur du pain, halo.
  useEffect(() => {
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const remaining = Math.max(DURATION - (now - start) / 1000, 0);
      if (timerRef.current) timerRef.current.textContent = formatTime(remaining);
      if (remaining > 0) raf = requestAnimationFrame(tick);
      else setPhase("porte");
    };
    raf = requestAnimationFrame(tick);

    const ctx = gsap.context(() => {
      gsap.to(dialRef.current, { rotate: 360 * 1.4, duration: DURATION, ease: "power1.in" });
      const colorTl = gsap.timeline();
      BREAD_COLORS.forEach((color, i) => {
        colorTl.to(breadRef.current, { color, duration: DURATION / BREAD_COLORS.length, ease: "none" }, i * (DURATION / BREAD_COLORS.length));
      });
      gsap.to(glowRef.current, { opacity: 0.9, scale: 1.25, duration: DURATION, ease: "power1.in" });
    });
    return () => { cancelAnimationFrame(raf); ctx.revert(); };
  }, []);

  // Fin de cuisson : flash + "Ding !" puis le bouton "Pousser la porte" apparaît.
  useEffect(() => {
    if (phase !== "porte") return;
    const ctx = gsap.context(() => {
      gsap.timeline()
        .to(flashRef.current, { opacity: 0.9, duration: 0.08 })
        .to(flashRef.current, { opacity: 0, duration: 0.35 })
        .fromTo(dingRef.current, { opacity: 0, scale: 0.4, y: 6 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(2)" }, "<")
        .to(dingRef.current, { opacity: 0, y: -10, duration: 0.3, delay: 0.6 })
        .fromTo(doorBtnRef.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, "-=0.1");
    });
    const auto = setTimeout(() => enter(), AUTO_OPEN_AFTER * 1000);
    return () => { clearTimeout(auto); ctx.revert(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const enter = () => {
    setPhase((p) => {
      if (p === "ouverture") return p;
      gsap.timeline()
        .to(contentRef.current, { opacity: 0, scale: 0.92, duration: 0.35, ease: "power2.in" })
        .to(leftDoorRef.current, { xPercent: -100, duration: 0.9, ease: "expo.inOut" }, "open")
        .to(rightDoorRef.current, { xPercent: 100, duration: 0.9, ease: "expo.inOut" }, "open")
        .call(() => onDoneRef.current?.());
      return "ouverture";
    });
  };

  const ready = phase !== "cuisson";

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-label="Entrée de la boutique">
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 100% at 50% 40%, #2c1f16 0%, #17100b 70%)" }} />
      <div ref={leftDoorRef} className="absolute inset-y-0 left-0 w-1/2 bg-bakery-dark grain" />
      <div ref={rightDoorRef} className="absolute inset-y-0 right-0 w-1/2 bg-bakery-dark grain" />

      <div ref={contentRef} className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6">
        <div className="absolute w-56 h-8 rounded-full bg-black/50 blur-xl" style={{ top: "calc(50% + 150px)" }} />

        <div ref={dingRef} className="absolute -right-2 top-[28%] sm:right-4 bg-bakery-honey text-bakery-dark font-serif font-bold text-sm px-4 py-1.5 rounded-full shadow-lg opacity-0">
          Ding !
        </div>

        {/* Corps du four */}
        <div
          className="relative w-52 sm:w-60 rounded-[28px] px-6 pt-8 pb-5 flex flex-col items-center shadow-2xl"
          style={{ background: "linear-gradient(155deg, #4a3527 0%, #382519 55%, #241408 100%)", border: "1px solid rgba(224,176,84,0.25)" }}
        >
          <div className="absolute top-1.5 left-4 right-4 h-px bg-white/10 rounded-full" />
          <span className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-black/40" />
          <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-black/40" />

          <div className="absolute -top-9 flex gap-3">
            {[0, 0.7, 1.4].map((d) => (
              <span key={d} className="block w-2 h-8 rounded-full bg-white/40 animate-steam" style={{ animationDelay: `${d}s` }} />
            ))}
          </div>

          <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center mb-5"
            style={{ background: "linear-gradient(145deg, #6b5847, #241a10)", boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.5)" }}>
            <div className="relative w-[86%] h-[86%] rounded-full overflow-hidden bg-[#0d0805]">
              <div ref={glowRef} className="absolute inset-0 rounded-full opacity-40"
                style={{ background: "radial-gradient(circle, rgba(230,140,40,0.9) 0%, rgba(120,50,10,0.2) 65%, transparent 100%)" }} />
              <div className="absolute inset-0 animate-flicker" style={{ background: "radial-gradient(circle at 50% 55%, rgba(255,180,80,0.25), transparent 60%)" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg ref={breadRef} viewBox="0 0 100 60" className="w-14 h-9 sm:w-16 sm:h-10" style={{ color: BREAD_COLORS[0] }}
                  fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 44C10 26 26 10 50 10s40 16 40 34c0 8-8 10-40 10S10 52 10 44Z" fill="currentColor" fillOpacity="0.25" />
                  <path d="M28 24 44 38 60 24" />
                  <path d="M20 38 44 52 68 38" />
                </svg>
              </div>
              <div className="absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 22%, transparent 40%)" }} />
            </div>
          </div>

          <div ref={flashRef} className="pointer-events-none absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-white opacity-0" style={{ top: "2.1rem" }} />

          <div className="w-full flex items-center justify-between gap-2.5">
            <div className="relative w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: "radial-gradient(circle at 35% 30%, #6b5847, #1c130b)" }}>
              <span className="block w-0.5 h-2.5 bg-bakery-honey/70 -translate-y-0.5 rotate-[35deg]" />
            </div>
            <div ref={dialRef} className="relative w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: "radial-gradient(circle at 35% 30%, #6b5847, #1c130b)" }}>
              <span className="block w-0.5 h-3 bg-bakery-honey -translate-y-1" />
            </div>
            <div className="flex-1 rounded-md px-2.5 py-1.5 text-center" style={{ background: "#0d0f0a", boxShadow: "inset 0 0 6px rgba(0,0,0,0.8)" }}>
              <span ref={timerRef} className="font-mono text-[0.72rem] sm:text-sm tracking-widest tabular-nums" style={{ color: "#f2c265", textShadow: "0 0 6px rgba(242,194,101,0.8)" }}>
                {ready ? "PRÊT" : formatTime(DURATION)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className={`block w-1.5 h-1.5 rounded-full ${ready ? "bg-green-500" : "bg-red-500 animate-blink"}`} />
              <Flame className="w-4 h-4 text-bakery-orange animate-pulseGlow" />
            </div>
          </div>

          <div className="flex gap-1.5 mt-4">
            {Array.from({ length: 5 }).map((_, i) => <span key={i} className="block w-6 h-1 rounded-full bg-black/40" />)}
          </div>
          <div className="flex gap-14 mt-3">
            <span className="block w-3 h-1.5 rounded-sm bg-black/50" />
            <span className="block w-3 h-1.5 rounded-sm bg-black/50" />
          </div>
        </div>

        <p className="font-serif text-bakery-light text-2xl tracking-tight" role="status" aria-live="polite">
          {ready ? "C'est prêt." : "L'Atelier Doré"}
        </p>

        {/* Porte de la boutique */}
        <div ref={doorBtnRef} className={`flex flex-col items-center gap-3 ${ready ? "" : "opacity-0 pointer-events-none"}`}>
          <button
            onClick={enter}
            className="group inline-flex items-center gap-3 bg-bakery-honey text-bakery-dark font-semibold px-7 py-3.5 rounded-full shadow-glow hover:bg-bakery-light transition-colors"
          >
            <DoorOpen size={18} className="group-hover:translate-x-0.5 transition-transform" />
            Pousser la porte
          </button>
        </div>
        {!ready && <p className="text-bakery-light/50 text-xs uppercase tracking-[0.2em]">Ça chauffe…</p>}
      </div>
    </div>
  );
}
