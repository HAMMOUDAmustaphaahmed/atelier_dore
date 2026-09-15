import { Plus } from 'lucide-react';
import {
  Baguette, PainCampagne, PainCereales, PainSeigle, Croissant, PainChocolat,
  ChaussonPommes, KouignAmann, Brioche, Eclair, TarteCitron, ParisBrest,
  Macarons, GateauAnniversaire, GateauMariage, GateauFiancailles, CakeSlice,
} from './icons/ProductIcons';
import { openLea } from '../lib/lea';

const ICONS = {
  baguette: Baguette, campagne: PainCampagne, cereales: PainCereales, seigle: PainSeigle,
  croissant: Croissant, chocolat: PainChocolat, chausson: ChaussonPommes, kouign: KouignAmann,
  brioche: Brioche, eclair: Eclair, citron: TarteCitron, parisbrest: ParisBrest, macarons: Macarons,
  anniversaire: GateauAnniversaire, mariage: GateauMariage, fiancailles: GateauFiancailles, cakeslice: CakeSlice,
};

export default function ProductCard({ item, dark = false, orderable = true }) {
  const Icon = ICONS[item.icon] || Baguette;
  const order = () => openLea(`Je voudrais commander : ${item.name}`);
  return (
    <article
      className={`group relative h-full flex flex-col p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
        dark ? 'bg-white/5 border-white/10 hover:border-bakery-honey/50' : 'bg-bakery-cream border-bakery-sand hover:border-bakery-orange/40 hover:shadow-warm-sm'
      }`}
    >
      {item.image && (
        <div className="-mx-6 -mt-6 mb-5 aspect-[4/3] overflow-hidden">
          <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        </div>
      )}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dark ? 'bg-bakery-honey/10' : 'bg-bakery-orange/10'} group-hover:scale-105 transition-transform`}>
          <Icon className={`w-9 h-9 ${dark ? 'text-bakery-honey' : 'text-bakery-orange'}`} />
        </div>
      </div>
      <h3 className={`font-serif text-xl tracking-tight mb-1.5 ${dark ? 'text-bakery-light' : 'text-bakery-dark'}`}>{item.name}</h3>
      <p className={`text-sm leading-relaxed flex-1 text-pretty ${dark ? 'text-bakery-light/65' : 'text-bakery-brown/75'}`}>{item.desc}</p>
      {orderable && (
        <button
          onClick={order}
          className={`mt-5 inline-flex items-center gap-1.5 self-start text-xs font-semibold px-3.5 py-2 rounded-full transition-colors ${
            dark ? 'bg-bakery-honey/15 text-bakery-honey hover:bg-bakery-honey hover:text-bakery-dark' : 'bg-bakery-dark text-bakery-light hover:bg-bakery-orange'
          }`}
          aria-label={`Commander ${item.name} avec Léa`}
        >
          <Plus size={14} /> Commander avec Léa
        </button>
      )}
    </article>
  );
}
