import { useText } from '../../site/SiteProvider';

// Bandeau défilant (CSS pur) : un rappel des produits et des valeurs, façon enseigne.
export default function Marquee({ dark = false }) {
  const t = useText();
  const items = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => t(`marquee_${i}`)).filter(Boolean);
  const row = [...items, ...items];
  return (
    <div className={`overflow-hidden py-4 border-y ${dark ? 'bg-bakery-dark border-white/10 text-bakery-honey' : 'bg-bakery-cream border-bakery-sand text-bakery-brown'}`} aria-hidden="true">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {row.map((txt, i) => (
          <span key={i} className="flex items-center gap-6 pr-6 font-serif italic text-lg whitespace-nowrap">
            {txt}
            <span className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-bakery-honey/60' : 'bg-bakery-orange/60'}`} />
          </span>
        ))}
      </div>
    </div>
  );
}
