import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Leaf, Wheat, HeartHandshake, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import ParallaxImage from '../components/ParallaxImage';
import Reveal from '../components/Reveal';
import Marquee from '../components/home/Marquee';
import { openLea } from '../lib/lea';
import { useSite } from '../site/SiteProvider';

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

const MILESTONES = [
  { year: '2004', title: 'Le premier four', text: "Un fournil de 30 m² rue de la Boulangerie, un four à bois d'occasion et un levain hérité d'un maître boulanger lyonnais." },
  { year: '2009', title: 'Le laboratoire pâtisserie', text: 'Ouverture du labo au sous-sol : éclairs, tartes de saison et les premiers gâteaux de mariage.' },
  { year: '2015', title: '100 % bio', text: 'Toutes nos farines deviennent biologiques, meulées à moins de 100 km de Paris.' },
  { year: '2021', title: "L'engagement anti-gaspillage", text: 'Chaque soir, les invendus partent aux associations du quartier. Plus rien ne se jette.' },
  { year: "Aujourd'hui", title: 'Léa au comptoir', text: 'Une assistante qui prend vos commandes en ligne, avec la même attention qu\'au comptoir.' },
];

export default function Histoire() {
  const { images: img, nom } = useSite();
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
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-bakery-honey font-semibold tracking-[0.25em] uppercase text-xs">Depuis 2004</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="font-serif text-display-xl text-bakery-light mt-3 max-w-4xl text-balance">
            Le temps, notre seul ingrédient secret
          </motion.h1>
        </div>
      </section>

      <Marquee dark />

      {/* Chiffres */}
      <section className="py-20 bg-bakery-cream border-b border-bakery-sand">
        <div className="container mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <Counter value={20} suffix=" ans" label="de levain entretenu chaque jour" />
          <Counter value={3} label="fournées quotidiennes" />
          <Counter value={100} suffix=" %" label="de farines biologiques" />
          <Counter value={48} suffix=" h" label="de fermentation pour la boule au levain" />
        </div>
      </section>

      {/* Récit */}
      <section className="py-24 container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-28">
          <Reveal x={-40}>
            <span className="text-bakery-orange font-semibold tracking-[0.2em] uppercase text-xs">Des racines profondes</span>
            <h2 className="font-serif text-display-sm text-bakery-dark mt-3 mb-6 text-balance">Ramener le vrai goût du pain au cœur du quartier</h2>
            <p className="text-bakery-brown/80 mb-4 leading-relaxed text-pretty">
              Tout a commencé il y a deux décennies avec une simple idée. L'Atelier Doré est né de cette passion pour l'authenticité et le respect des traditions boulangères françaises.
            </p>
            <p className="text-bakery-brown/80 leading-relaxed text-pretty">
              Nous avons construit notre réputation sur un élément essentiel : le temps. Le temps de laisser la pâte lever, le temps de sélectionner les meilleurs producteurs, le temps de partager un sourire avec chaque client.
            </p>
          </Reveal>
          <Reveal x={40} delay={0.1}>
            <ParallaxImage src={img.histoire_petrissage} alt="Pétrissage" className="rounded-4xl shadow-warm aspect-[4/3]" strength={40} />
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          <Reveal x={40} delay={0.1} className="md:order-2">
            <span className="text-bakery-orange font-semibold tracking-[0.2em] uppercase text-xs">Un engagement éthique</span>
            <h2 className="font-serif text-display-sm text-bakery-dark mt-3 mb-6 text-balance">Nourrir le corps autant que le quartier</h2>
            <ul className="space-y-4">
              {[
                { icon: Wheat, t: 'Farines 100 % bio', d: 'Moulins situés à moins de 100 km de notre atelier.' },
                { icon: Leaf, t: 'Fermes responsables', d: 'Beurre, œufs et lait issus de fermes éthiques.' },
                { icon: HeartHandshake, t: 'Zéro invendu jeté', d: 'Redistribution quotidienne aux associations locales.' },
              ].map((f) => (
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
          <Reveal className="mb-14"><h2 className="font-serif text-display-sm text-balance">Vingt ans en cinq dates</h2></Reveal>
          <ol className="relative border-l border-white/15 pl-8 space-y-12">
            {MILESTONES.map((m, i) => (
              <Reveal key={m.year} delay={i * 0.05} className="relative">
                <span className="absolute -left-[2.35rem] top-1.5 w-3 h-3 rounded-full bg-bakery-honey ring-4 ring-bakery-dark" />
                <span className="font-serif italic text-bakery-honey text-xl">{m.year}</span>
                <h3 className="font-serif text-2xl mt-1 mb-2">{m.title}</h3>
                <p className="text-bakery-light/65 leading-relaxed text-pretty max-w-2xl">{m.text}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={0.2} className="mt-16">
            <button onClick={() => openLea()} className="inline-flex items-center gap-2 bg-bakery-honey hover:bg-bakery-light text-bakery-dark px-7 py-3.5 rounded-full font-semibold transition-colors">
              Goûter, c'est adopter — commander avec Léa <ArrowRight size={18} />
            </button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
