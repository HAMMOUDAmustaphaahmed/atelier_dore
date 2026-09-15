import { motion } from 'framer-motion';
import { ArrowRight, Star, PartyPopper, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import BreadReveal from '../components/BreadReveal';
import ParallaxImage from '../components/ParallaxImage';
import Reveal from '../components/Reveal';
import Marquee from '../components/home/Marquee';
import Ardoise from '../components/home/Ardoise';
import Vitrine from '../components/home/Vitrine';
import Journee from '../components/home/Journee';
import Comptoir from '../components/home/Comptoir';
import { GateauAnniversaire, GateauMariage, GateauFiancailles } from '../components/icons/ProductIcons';
import { avis } from '../data/products';
import { useBoutique } from '../hooks/useBoutique';
import { openLea } from '../lib/lea';
import { useSite } from '../site/SiteProvider';

function NextBatchWidget() {
  const { nextBatch, open, closesAt, opensAt } = useBoutique();
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-bakery-dark/60 backdrop-blur-md border border-white/10 px-4 py-3 text-left">
      <span className="relative w-10 h-10 rounded-full bg-bakery-orange/20 flex items-center justify-center text-bakery-honey">
        <Flame size={18} className="animate-pulseGlow" />
      </span>
      <div className="leading-tight">
        <p className="text-[0.62rem] uppercase tracking-[0.2em] text-bakery-light/60">Prochaine fournée</p>
        <p className="font-serif text-lg text-bakery-light">{nextBatch ? (nextBatch.today ? `${nextBatch.hour} · ${nextBatch.label}` : nextBatch.label) : '—'}</p>
        <p className="text-[0.7rem] text-bakery-light/60">{open ? `Ouvert jusqu'à ${closesAt}` : `Fermé · ouvre ${opensAt}`}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { textes: t, images: img, nom } = useSite();
  return (
    <>
      <SEO
        title="Accueil"
        description={`Boulangerie artisanale ${nom}. Pains au levain, pâtisseries créatives et viennoiseries pur beurre. Commandez avec Léa.`}
        keywords="boulangerie, pâtisserie, artisan, pain bio, croissant, Paris, gâteaux, commande en ligne"
      />

      {/* Hero — la croûte se fend et révèle la mie au fil du scroll */}
      <BreadReveal
        image={img.hero}
        kicker={t.hero_kicker}
        title={<>{t.hero_titre} <em className="text-bakery-honey not-italic font-light italic">{t.hero_titre_accent}</em></>}
        subtitle={t.hero_sous_titre}
        aside={<NextBatchWidget />}
      >
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => openLea()} className="bg-bakery-honey hover:bg-bakery-light text-bakery-dark px-7 py-4 rounded-full text-base font-semibold transition-colors shadow-glow">
            Commander avec Léa
          </button>
          <Link to="/menu" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-bakery-light border border-white/30 px-7 py-4 rounded-full text-base font-medium transition-colors">
            Découvrir la carte
          </Link>
        </div>
        <div className="md:hidden mt-8"><NextBatchWidget /></div>
      </BreadReveal>

      <Marquee />

      {/* Intro éditoriale avec parallax */}
      <section className="py-24 bg-bakery-light relative grain">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <Reveal className="lg:col-span-5 lg:col-start-2">
              <span className="text-bakery-orange font-semibold tracking-[0.2em] uppercase text-xs">Fait à la main, avec le temps</span>
              <h2 className="font-serif text-display-sm text-bakery-dark mt-3 mb-6 text-balance">{t.intro_titre}</h2>
              <p className="text-lg text-bakery-brown/80 leading-relaxed text-pretty mb-8">{t.intro_texte}</p>
              <Link to="/histoire" className="inline-flex items-center gap-2 text-bakery-dark font-semibold border-b-2 border-bakery-orange pb-0.5 hover:text-bakery-orange transition-colors">
                Lire notre histoire <ArrowRight size={18} />
              </Link>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-5 w-full">
              <div className="relative">
                <ParallaxImage
                  src={img.intro}
                  alt="Artisan boulanger façonnant la pâte"
                  className="rounded-4xl shadow-warm aspect-[4/5]"
                  strength={50}
                />
                <div className="absolute -bottom-6 -left-6 bg-bakery-cream rounded-2xl shadow-warm-sm border border-bakery-sand px-5 py-4 rotate-[-3deg]">
                  <p className="font-hand text-2xl text-bakery-dark leading-none">48 h</p>
                  <p className="text-xs text-bakery-brown/70 mt-1">de fermentation pour la boule au levain</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Ardoise />

      <Vitrine />

      {/* Signatures — bento */}
      <section className="py-24 bg-bakery-cream relative grain">
        <div className="container mx-auto px-6 relative z-10">
          <Reveal className="flex items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-bakery-orange font-semibold tracking-[0.2em] uppercase text-xs">Nos signatures</span>
              <h2 className="font-serif text-display-sm text-bakery-dark mt-3 text-balance">Succombez à la tentation</h2>
            </div>
            <Link to="/menu" className="hidden sm:inline-flex items-center gap-2 text-bakery-dark font-semibold hover:text-bakery-orange transition-colors">
              Toute la carte <ArrowRight size={18} />
            </Link>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-5 md:h-[42rem]">
            <BentoCard
              className="md:col-span-3 md:row-span-2"
              img={img.signature_1}
              title="Le pain au levain" desc="Notre classique : croûte épaisse, mie alvéolée, 48 h de patience." tag="Signature"
            />
            <BentoCard
              className="md:col-span-3"
              img={img.signature_2}
              title="Croissant pur beurre" desc="Feuilletage croustillant, cœur moelleux." tag="Chaque matin"
            />
            <BentoCard
              className="md:col-span-2"
              img={img.signature_3}
              title="Tartelette framboise" desc="Sablé breton, crème diplomate." tag="De saison"
            />
            <Reveal className="md:col-span-1 rounded-4xl bg-bakery-dark text-bakery-light p-6 flex flex-col justify-between min-h-[12rem]">
              <PartyPopper className="text-bakery-honey" />
              <div>
                <p className="font-serif text-2xl leading-tight">Un gâteau pour vos grands jours</p>
                <Link to="/menu#evenements" className="inline-flex items-center gap-1.5 text-bakery-honey text-sm font-semibold mt-3 hover:text-bakery-light">Découvrir <ArrowRight size={14} /></Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Journee />

      <Comptoir />

      {/* Gâteaux d'événement — teaser */}
      <section className="py-24 bg-bakery-light relative grain">
        <div className="container mx-auto px-6 relative z-10">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 text-bakery-orange font-semibold tracking-[0.2em] uppercase text-xs mb-3">
              <PartyPopper size={16} /> Célébrez avec nous
            </span>
            <h2 className="font-serif text-display-sm text-bakery-dark text-balance">Un gâteau pour chaque grand moment</h2>
            <p className="text-bakery-brown/80 mt-4 text-pretty">Mariages, anniversaires, fiançailles — nous créons des gâteaux sur-mesure, pensés avec vous. Dégustation offerte pour les mariages.</p>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto mb-12">
            {[
              { icon: GateauAnniversaire, label: 'Anniversaires', d: 'Du simple au multi-étages' },
              { icon: GateauMariage, label: 'Mariages', d: 'Wedding cakes à étages' },
              { icon: GateauFiancailles, label: 'Fiançailles', d: 'Créations élégantes' },
            ].map((e, i) => (
              <Reveal key={e.label} delay={i * 0.08} className="group bg-bakery-cream rounded-3xl border border-bakery-sand p-8 text-center shadow-warm-sm hover:-translate-y-1 hover:shadow-warm transition-all">
                <e.icon className="w-12 h-12 text-bakery-orange mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <p className="font-serif text-xl text-bakery-dark">{e.label}</p>
                <p className="text-sm text-bakery-brown/70 mt-1">{e.d}</p>
              </Reveal>
            ))}
          </div>
          <div className="text-center">
            <button onClick={() => openLea("Je voudrais un gâteau d'événement")} className="inline-flex items-center gap-2 bg-bakery-dark hover:bg-bakery-orange text-bakery-light px-8 py-4 rounded-full font-medium transition-colors">
              Demander un devis à Léa <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Avis — cartes empilées */}
      <section className="py-24 bg-bakery-dark text-bakery-light relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <Reveal className="text-center mb-12">
            <span className="text-bakery-honey font-semibold tracking-[0.2em] uppercase text-xs">Ils en parlent</span>
            <h2 className="font-serif text-display-sm mt-3">Le mot des habitués</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {avis.map((review, i) => (
              <motion.figure
                key={review.name}
                initial={{ opacity: 0, y: 30, rotate: i === 1 ? 0 : i === 0 ? -2 : 2 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className={`bg-bakery-ember border border-white/10 p-8 rounded-3xl ${i === 1 ? 'md:-translate-y-4' : ''}`}
              >
                <div className="flex text-bakery-honey mb-4">{[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}</div>
                <blockquote className="font-serif text-xl leading-snug mb-6">« {review.text} »</blockquote>
                <figcaption className="text-sm text-bakery-light/60">{review.name}</figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function BentoCard({ className = '', img, title, desc, tag }) {
  return (
    <Reveal className={`group relative rounded-4xl overflow-hidden min-h-[16rem] ${className}`}>
      <img src={img} alt={title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-bakery-dark/85 via-bakery-dark/20 to-transparent" />
      {tag && <span className="absolute top-5 left-5 text-[0.65rem] uppercase tracking-[0.2em] font-semibold bg-bakery-cream text-bakery-dark px-3 py-1.5 rounded-full">{tag}</span>}
      <div className="absolute inset-x-0 bottom-0 p-6 text-bakery-light">
        <h3 className="font-serif text-2xl tracking-tight">{title}</h3>
        <p className="text-bakery-light/75 text-sm mt-1">{desc}</p>
      </div>
    </Reveal>
  );
}
