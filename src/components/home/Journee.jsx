import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Wheat, Flame, DoorOpen, Sun, Moon } from 'lucide-react';
import Reveal from '../Reveal';
import { useBoutique } from '../../hooks/useBoutique';
import { useText, useSite } from '../../site/SiteProvider';

gsap.registerPlugin(ScrollTrigger);

// Une journée à l'Atelier : la ligne se dessine au fil du scroll, l'étape en cours pulse.
const STEP_META = [
  { h: 4, label: '4 h', icon: Wheat },
  { h: 6, label: '6 h', icon: Flame },
  { h: 'open', icon: DoorOpen },
  { h: 11, label: '11 h', icon: Sun },
  { h: 16, label: '16 h', icon: Flame },
  { h: 'close', icon: Moon },
];
const fmtH = (d) => { const h = Math.floor(d); const m = Math.round((d - h) * 60); return `${h} h${m ? ` ${String(m).padStart(2, '0')}` : ''}`; };

export default function Journee() {
  const lineRef = useRef(null);
  const wrapRef = useRef(null);
  const { now } = useBoutique();
  const t = useText();
  const { horaires } = useSite();
  const plage = horaires?.[now.day] || [7, 17];
  const STEPS = STEP_META.map((m, i) => {
    const h = m.h === 'open' ? plage[0] : m.h === 'close' ? plage[1] : m.h;
    return { h, label: m.label || fmtH(h), icon: m.icon, title: t(`journee_${i + 1}_titre`), text: t(`journee_${i + 1}_texte`) };
  });
  const currentIdx = STEPS.reduce((acc, s, i) => (now.decimal >= s.h ? i : acc), -1);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(lineRef.current, { scaleY: 0 }, {
        scaleY: 1, ease: 'none', transformOrigin: 'top',
        scrollTrigger: { trigger: wrapRef.current, start: 'top 70%', end: 'bottom 60%', scrub: 0.5 },
      });
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="py-24 bg-bakery-cream relative grain">
      <div className="container mx-auto px-6 relative z-10">
        <Reveal className="max-w-2xl mb-16">
          <span className="text-bakery-orange font-semibold tracking-[0.2em] uppercase text-xs">{t('journee_kicker')}</span>
          <h2 className="font-serif text-display-sm text-bakery-dark mt-3 text-balance">{t('journee_titre')}</h2>
        </Reveal>

        <div ref={wrapRef} className="relative max-w-3xl mx-auto">
          <div className="absolute left-[1.35rem] sm:left-1/2 top-0 bottom-0 w-px bg-bakery-sand" aria-hidden="true" />
          <div ref={lineRef} className="absolute left-[1.35rem] sm:left-1/2 top-0 bottom-0 w-px bg-bakery-orange" aria-hidden="true" />

          <ol className="space-y-12">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const left = i % 2 === 0;
              const active = i === currentIdx;
              return (
                <li key={i} className={`relative sm:grid sm:grid-cols-2 sm:gap-12 pl-16 sm:pl-0 ${left ? '' : ''}`}>
                  <span className={`absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-0 w-11 h-11 rounded-full flex items-center justify-center border-2 bg-bakery-cream z-10 ${
                    active ? 'border-bakery-orange text-bakery-orange shadow-[0_0_0_8px_rgba(201,98,43,0.12)]' : 'border-bakery-sand text-bakery-brown'
                  }`}>
                    <Icon size={18} />
                    {active && <span className="absolute inset-0 rounded-full border-2 border-bakery-orange animate-ping opacity-40" />}
                  </span>
                  <Reveal x={left ? -20 : 20} className={`${left ? 'sm:col-start-1 sm:text-right sm:pr-12' : 'sm:col-start-2 sm:pl-12'}`}>
                    <span className="font-serif italic text-bakery-orange text-lg">{s.label}</span>
                    <h3 className="font-serif text-2xl text-bakery-dark mt-1 mb-2">{s.title}</h3>
                    <p className="text-bakery-brown/80 leading-relaxed text-pretty">{s.text}</p>
                    {active && <span className="inline-block mt-3 text-[0.65rem] uppercase tracking-[0.2em] font-semibold text-bakery-orange">En ce moment</span>}
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
