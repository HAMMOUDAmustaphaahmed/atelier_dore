import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Leaf, Wheat, HeartHandshake, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import ParallaxImage from '../components/ParallaxImage';
import Reveal from '../components/Reveal';
import Marquee from '../components/home/Marquee';
import { openLea } from '../lib/lea';
import { useSite, useText } from '../site/SiteProvider';

function Counter({ value, suffix = '', label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0px' });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 20 });
  const text = useTransform(spring, (v) => Math.round(v).toLocaleString('fr-FR'));
  useEffect(() => { if (inView) mv.set(value); }, [inView, value, mv]);
  return (
    <div ref={ref} className="text-center sm:text-left">
      <p className="font-serif text-display-sm text-bakery-dark tabular-nums"><motion.span>{text}</motion.span>{suffix}</p>
      <p className="text-sm text-bakery-brown/70 mt-1">{label}</p>
    </div>
  );
}



export default function Histoire() {
  const { images: img, nom } = useSite();
  const t = useText();
  const MILESTONES = [1, 2, 3, 4, 5].map((i) => ({ year: t(`histoire_date_${i}`), title: t(`histoire_date_${i}_titre`), text: t(`histoire_date_${i}_texte`) })).filter((m) => m.title);
  const CHIFFRES = [1, 2, 3, 4].map((i) => ({ value: Number(t(`histoire_chiffre_${i}`)) || 0, suffix: t(`histoire_chiffre_${i}_suffixe`), label: t(`histoire_chiffre_${i}_texte`) }));
  const ENGAGEMENTS = [[Wheat, 1], [Leaf, 2], [HeartHandshake, 3]].map(([icon, i]) => ({ icon, t: t(`histoire_engagement_${i}_titre`), d: t(`histoire_engagement_${i}_texte`) }));
  return (
    <div className="bg-bakery-light min-h-screen">
      <SEO
        title="Notre histoire"
        description={`L'histoire de ${nom}, une boulangerie engagée pour la qualité, le bio et le circuit court.`}
        keywords="histoire, artisanat, savoir-faire, ingrédients locaux, bio"
      />

      {/* Hero */}
      <section className="relative h-[70svh] min-h-[420px] flex items-end overflow-hidden">
        <ParallaxImage
          src={img.histoire_hero}
          alt="Atelier de boulangerie"
          className="absolute inset-0 w-full h-full"
          strength={70}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bakery-dark via-bakery-dark/40 to-bakery-dark/20" />
        <div className="container mx-auto px-6 relative z-10 pb-16">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-bakery-honey font-semibold tracking-[0.25em] uppercase text-xs">{t('histoire_kicker')}</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="font-serif text-display-xl text-bakery-light mt-3 max-w-4xl text-balance">
            {t('histoire_titre')}
          </motion.h1>
        </div>
      </section>

      <Marquee dark />

      {/* Chiffres */}
      <section className="py-20 bg-bakery-cream border-b border-bakery-sand">
        <div className="container mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {CHIFFRES.map((c, i) => <Counter key={i} value={c.value} suffix={c.suffix} label={c.label} />)}
        </div>
      </section>

      {/* Récit */}
      <section className="py-24 container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-28">
          <Reveal x={-40}>
            <span className="text-bakery-orange font-semibold tracking-[0.2em] uppercase text-xs">{t('histoire_racines_kicker')}</span>
            <h2 className="font-serif text-display-sm text-bakery-dark mt-3 mb-6 text-balance">{t('histoire_racines_titre')}</h2>
            <p className="text-bakery-brown/80 mb-4 leading-relaxed text-pretty">{t('histoire_racines_texte_1')}</p>
            <p className="text-bakery-brown/80 leading-relaxed text-pretty">{t('histoire_racines_texte_2')}</p>
          </Reveal>
          <Reveal x={40} delay={0.1}>
            <ParallaxImage src={img.histoire_petrissage} alt="Pétrissage" className="rounded-4xl shadow-warm aspect-[4/3]" strength={40} />
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          <Reveal x={40} delay={0.1} className="md:order-2">
            <span className="text-bakery-orange font-semibold tracking-[0.2em] uppercase text-xs">{t('histoire_engagement_kicker')}</span>
            <h2 className="font-serif text-display-sm text-bakery-dark mt-3 mb-6 text-balance">{t('histoire_engagement_titre')}</h2>
            <ul className="space-y-4">
              {ENGAGEMENTS.map((f) => (
                <li key={f.t} className="flex gap-4 items-start">
                  <span className="w-10 h-10 rounded-xl bg-bakery-orange/10 text-bakery-orange flex items-center justify-center shrink-0"><f.icon size={18} /></span>
                  <div><p className="font-semibold text-bakery-dark">{f.t}</p><p className="text-sm text-bakery-brown/75">{f.d}</p></div>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal x={-40} className="md:order-1">
            <ParallaxImage src={img.histoire_ingredients} alt="Ingrédients" className="rounded-4xl shadow-warm aspect-[4/3]" strength={40} />
          </Reveal>
        </div>
      </section>

      {/* Frise */}
      <section className="py-24 bg-bakery-dark text-bakery-light relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <Reveal className="mb-14"><h2 className="font-serif text-display-sm text-balance">{t('histoire_frise_titre')}</h2></Reveal>
          <ol className="relative border-l border-white/15 pl-8 space-y-12">
            {MILESTONES.map((m, i) => (
              <Reveal key={i} delay={i * 0.05} className="relative">
                <span className="absolute -left-[2.35rem] top-1.5 w-3 h-3 rounded-full bg-bakery-honey ring-4 ring-bakery-dark" />
                <span className="font-serif italic text-bakery-honey text-xl">{m.year}</span>
                <h3 className="font-serif text-2xl mt-1 mb-2">{m.title}</h3>
                <p className="text-bakery-light/65 leading-relaxed text-pretty max-w-2xl">{m.text}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={0.2} className="mt-16">
            <button onClick={() => openLea()} className="inline-flex items-center gap-2 bg-bakery-honey hover:bg-bakery-light text-bakery-dark px-7 py-3.5 rounded-full font-semibold transition-colors">
              {t('histoire_bouton')} <ArrowRight size={18} />
            </button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
