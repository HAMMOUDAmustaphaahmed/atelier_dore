// Bandeau défilant (CSS pur) : un rappel des produits et des valeurs, façon enseigne.
const ITEMS = [
  'Levain naturel', 'Cuit au feu de bois', 'Farines bio & locales', 'Beurre AOP Charentes-Poitou',
  'Trois fournées par jour', 'Gâteaux sur-mesure', 'Depuis 2004', 'Invendus redistribués',
];

export default function Marquee({ dark = false }) {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className={`overflow-hidden py-4 border-y ${dark ? 'bg-bakery-dark border-white/10 text-bakery-honey' : 'bg-bakery-cream border-bakery-sand text-bakery-brown'}`} aria-hidden="true">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-6 pr-6 font-serif italic text-lg whitespace-nowrap">
            {t}
            <span className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-bakery-honey/60' : 'bg-bakery-orange/60'}`} />
          </span>
        ))}
      </div>
    </div>
  );
}
