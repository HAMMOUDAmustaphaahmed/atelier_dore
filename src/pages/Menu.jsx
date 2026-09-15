import { useEffect, useState } from 'react';
import { PartyPopper, Info, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import Reveal from '../components/Reveal';
import ProductCard from '../components/ProductCard';
import { GateauAnniversaire, GateauMariage, GateauFiancailles } from '../components/icons/ProductIcons';
import { getLenis } from '../hooks/useSmoothScroll';
import { openLea } from '../lib/lea';
import { useBoutique } from '../hooks/useBoutique';
import { useSite } from '../site/SiteProvider';

const EVENT_ICONS = { anniversaire: GateauAnniversaire, mariage: GateauMariage, fiancailles: GateauFiancailles };

const SECTION_DEFS = [
  { id: 'pains', label: 'Pains', note: 'La sélection varie chaque jour selon la fournée — demandez conseil en boutique, ou réservez avec Léa.' },
  { id: 'viennoiseries', label: 'Viennoiseries' },
  { id: 'patisseries', label: 'Pâtisseries' },
  { id: 'gateaux', label: 'Gâteaux' },
  { id: 'evenements', label: 'Événements' },
];
const IDS = SECTION_DEFS.map((s) => s.id);

function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

function scrollTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(el, { offset: -140, duration: 1 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
}

export default function Menu() {
  const { produits } = useSite();
  const visible = (list) => (list || []).filter((p) => p.disponible !== false);
  const SECTIONS = SECTION_DEFS.map((d) => (d.id === 'evenements' ? d : { ...d, items: visible(produits[d.id]) }));
  const gateauxEvenement = visible(produits.evenements);
  const active = useScrollSpy(IDS);
  const { nextBatch } = useBoutique();

  return (
    <div className="bg-bakery-light min-h-screen">
      <SEO
        title="La carte"
        description="Découvrez la carte de L'Atelier Doré : pains artisanaux, viennoiseries croustillantes, pâtisseries raffinées et gâteaux d'événement sur-mesure."
        keywords="carte, menu, boulangerie, pâtisserie, croissant, baguette, gâteau anniversaire, gâteau mariage"
      />

      {/* En-tête */}
      <section className="pt-36 pb-12 relative grain">
        <div className="container mx-auto px-6 relative z-10">
          <Reveal className="max-w-3xl">
            <span className="text-bakery-orange font-semibold tracking-[0.2em] uppercase text-xs">La carte</span>
            <h1 className="font-serif text-display text-bakery-dark mt-3 mb-5 text-balance">Ce qui sort du four aujourd'hui</h1>
            <p className="text-lg text-bakery-brown/80 text-pretty max-w-2xl">
              Chaque jour, nos artisans préparent une sélection de produits frais. Tout se commande avec Léa, retrait en boutique.
              {nextBatch && <> Prochaine fournée : <strong className="text-bakery-dark">{nextBatch.today ? `${nextBatch.hour} (${nextBatch.label})` : nextBatch.label}</strong>.</>}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Navigation par catégories (sticky sous le header) */}
      <div className="sticky top-[4.5rem] z-30 py-2">
        <div className="container mx-auto px-6">
          <nav aria-label="Catégories" className="mask-fade-x overflow-x-auto">
            <ul className="flex gap-2 w-max mx-auto bg-bakery-cream/90 backdrop-blur-md border border-bakery-sand rounded-full p-1.5 shadow-warm-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    aria-current={active === s.id ? 'true' : undefined}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      active === s.id ? 'bg-bakery-dark text-bakery-light' : 'text-bakery-brown hover:bg-bakery-sand/60'
                    }`}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-6 pt-8">
        {SECTIONS.filter((s) => s.items && s.items.length).map((s, si) => (
          <section key={s.id} id={s.id} className="max-w-6xl mx-auto mb-24 scroll-mt-40">
            <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-3">
              <h2 className="font-serif text-display-sm text-bakery-dark"><span className="text-bakery-orange font-serif italic text-2xl mr-3">0{si + 1}</span>{s.label}</h2>
              <span className="text-sm text-bakery-brown/60">{s.items.length} produits</span>
            </Reveal>
            {s.note && (
              <Reveal delay={0.05} className="flex items-start gap-2 text-sm text-bakery-brown mb-8 bg-bakery-honey/15 border border-bakery-gold/30 rounded-2xl px-4 py-3 max-w-2xl">
                <Info size={16} className="text-bakery-orange shrink-0 mt-0.5" />
                <span>{s.note}</span>
              </Reveal>
            )}
            {!s.note && <div className="h-px bg-bakery-sand mb-8" />}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {s.items.map((item, i) => (
                <Reveal key={item.name} delay={(i % 3) * 0.06}><ProductCard item={item} /></Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Gâteaux d'événement — section immersive */}
      <section id="evenements" className="bg-bakery-dark text-bakery-light py-24 mt-8 relative overflow-hidden scroll-mt-32">
        <div className="absolute -top-40 right-0 w-[50vw] h-[50vw] rounded-full bg-bakery-orange/15 blur-3xl" aria-hidden="true" />
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <Reveal className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-bakery-honey font-semibold tracking-[0.2em] uppercase text-xs mb-4">
              <PartyPopper size={16} /> Célébrez avec nous
            </span>
            <h2 className="font-serif text-display-sm mb-4 text-balance">Des gâteaux pour vos plus beaux jours</h2>
            <p className="text-bakery-light/70 max-w-2xl mx-auto text-pretty">
              Anniversaires, mariages, fiançailles : nous imaginons avec vous une création unique. Devis sous 24 h, dégustation offerte pour les mariages.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {gateauxEvenement.map((ev, i) => {
              const Icon = EVENT_ICONS[ev.icon] || GateauAnniversaire;
              return (
                <Reveal key={ev.name} delay={i * 0.08} className="group bg-white/5 border border-white/10 rounded-3xl p-7 flex flex-col hover:border-bakery-honey/50 hover:bg-white/[0.07] transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-bakery-honey/10 flex items-center justify-center mb-5">
                    <Icon className="w-9 h-9 text-bakery-honey group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-serif text-2xl tracking-tight mb-2">{ev.name}</h3>
                  <p className="text-bakery-light/65 text-sm leading-relaxed flex-1 mb-5">{ev.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {(ev.tags || []).map((t) => <span key={t} className="text-xs bg-bakery-honey/15 text-bakery-honey px-3 py-1 rounded-full">{t}</span>)}
                  </div>
                  <button onClick={() => openLea(`Je voudrais un gâteau pour un événement : ${ev.name.toLowerCase()}`)} className="self-start text-sm font-semibold text-bakery-honey hover:text-bakery-light inline-flex items-center gap-1.5 transition-colors">
                    Demander un devis <ArrowRight size={14} />
                  </button>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.15} className="text-center">
            <button onClick={() => openLea("Je voudrais un gâteau d'événement sur-mesure")} className="inline-flex items-center gap-2 bg-bakery-honey hover:bg-bakery-light text-bakery-dark px-8 py-4 rounded-full text-lg font-semibold transition-colors shadow-glow">
              Composer mon gâteau avec Léa <ArrowRight size={20} />
            </button>
            <p className="text-bakery-light/50 text-sm mt-4">Réponse sous 24 h · Dégustation possible sur rendez-vous</p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
