import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { openLea } from '../../lib/lea';
import { useSite } from '../../site/SiteProvider';

gsap.registerPlugin(ScrollTrigger);

// La vitrine : on "longe" le comptoir en scrollant. Défilement horizontal piloté par
// le scroll vertical — position: sticky en CSS, GSAP n'anime qu'un transform
// (jamais de pin: true, incompatible avec le démontage React).
const ITEMS = [
  { name: 'Pain au levain', tag: 'Signature', desc: 'Fermentation lente de 48 h, croûte épaisse, mie dense et parfumée.' },
  { name: 'Croissant pur beurre', tag: 'Chaque matin', desc: 'Beurre AOP Charentes-Poitou, 27 couches de feuilletage.' },
  { name: 'Tartelette framboise', tag: 'Pâtisserie', desc: 'Sablé breton, crème diplomate et fruits frais du marché.' },
  { name: 'Paris-Brest', tag: 'Classique', desc: 'Pâte à choux et mousseline au praliné noisette maison.' },
  { name: 'Wedding cake', tag: 'Sur-mesure', desc: 'Étages, dégustation offerte, coordination avec votre thème.' },
  { name: 'Kouign-amann', tag: 'Bretagne', desc: 'Beurre salé de Guérande, caramélisé au four.' },
];

export default function Vitrine() {
  const { images } = useSite();
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const track = trackRef.current;
      const distance = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      return () => tween.scrollTrigger?.kill();
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-bakery-dark text-bakery-light md:h-[calc(100vh+1400px)]">
      <div className="md:sticky md:top-0 md:h-screen overflow-hidden flex flex-col justify-center py-16 md:py-0">
        <div className="container mx-auto px-6 mb-8 md:mb-10 flex items-end justify-between gap-6">
          <div>
            <span className="text-bakery-honey font-semibold tracking-[0.2em] uppercase text-xs">La vitrine</span>
            <h2 className="font-serif text-display-sm mt-3 text-balance">Longez le comptoir</h2>
          </div>
          <p className="hidden md:block text-bakery-light/60 text-sm max-w-xs text-right">Faites défiler pour avancer le long de la vitrine — comme en boutique, le nez collé à la vitre.</p>
        </div>

        <div ref={trackRef} className="flex gap-5 md:gap-8 px-6 md:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none pb-4 md:pb-0 will-change-transform">
          {ITEMS.map((it, i) => (
            <article
              key={it.name}
              className="group relative shrink-0 w-[78vw] sm:w-[52vw] md:w-[30rem] aspect-[4/5] md:aspect-[5/6] rounded-4xl overflow-hidden snap-start bg-bakery-ember"
              style={{ transform: `translateY(${i % 2 ? 24 : 0}px)` }}
            >
              <img src={images[`vitrine_${i + 1}`]} alt={it.name} loading="lazy" width="900" height="1080" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-bakery-dark via-bakery-dark/30 to-transparent" />
              <span className="absolute top-5 left-5 text-[0.65rem] uppercase tracking-[0.2em] font-semibold bg-bakery-honey text-bakery-dark px-3 py-1.5 rounded-full">{it.tag}</span>
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <h3 className="font-serif text-3xl md:text-4xl tracking-tight mb-2">{it.name}</h3>
                <p className="text-bakery-light/75 text-sm md:text-base max-w-xs mb-5">{it.desc}</p>
                <button
                  onClick={() => openLea(`Je voudrais commander : ${it.name}`)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-bakery-honey hover:text-bakery-light transition-colors"
                >
                  Commander avec Léa <ArrowUpRight size={16} />
                </button>
              </div>
            </article>
          ))}
          <div className="shrink-0 w-[10vw]" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
