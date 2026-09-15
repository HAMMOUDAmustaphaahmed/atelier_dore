import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useBoutique } from '../../hooks/useBoutique';
import { useSite, useText } from '../../site/SiteProvider';
import { openLea } from '../../lib/lea';
import Reveal from '../Reveal';

// L'ardoise du jour : les pains de la fournée, écrits à la craie.
export default function Ardoise() {
  const { nextBatch } = useBoutique();
  const t = useText();
  const { produits, board } = useSite();
  const dispo = new Map((board?.items || []).map((i) => [i.nom, i.disponible !== false]));
  const pains = produits.pains.filter((p) => p.disponible !== false);
  const date = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <section className="py-24 bg-bakery-light relative grain">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <Reveal className="lg:col-span-5">
            <span className="text-bakery-orange font-semibold tracking-[0.2em] uppercase text-xs">{t('ardoise_kicker')}</span>
            <h2 className="font-serif text-display-sm text-bakery-dark mt-3 mb-5 text-balance">{t('ardoise_titre')}</h2>
            <p className="text-bakery-brown/80 leading-relaxed text-pretty mb-8">{t('ardoise_texte')}</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => openLea('Je voudrais réserver du pain pour aujourd\'hui')} className="bg-bakery-dark hover:bg-bakery-orange text-bakery-light px-6 py-3 rounded-full font-medium transition-colors">
                {t('ardoise_bouton')}
              </button>
              <Link to="/menu" className="inline-flex items-center border border-bakery-brown/30 hover:border-bakery-dark text-bakery-dark px-6 py-3 rounded-full font-medium transition-colors">
                Toute la carte
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.1} x={30} className="lg:col-span-7">
            <motion.div
              whileHover={{ rotate: -0.6 }}
              className="chalkboard relative rounded-2xl p-7 sm:p-10 shadow-warm border-[10px] border-[#5a3a22] rotate-[0.8deg]"
              style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.35), 0 30px 60px -20px rgba(27,21,18,0.5)' }}
            >
              <div className="absolute -top-5 left-8 w-14 h-5 bg-bakery-sand/80 rounded-sm rotate-[-4deg] shadow" aria-hidden="true" />
              <div className="flex items-baseline justify-between gap-4 mb-6">
                <h3 className="chalk font-hand text-4xl sm:text-5xl">{t('ardoise_entete')}</h3>
                <span className="chalk font-hand text-xl capitalize opacity-80">{date}</span>
              </div>
              <ul className="space-y-3">
                {pains.map((p, i) => (
                  <motion.li
                    key={p.name}
                    initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.08 }}
                    className="flex items-end gap-3 chalk font-hand text-2xl sm:text-[1.7rem]"
                  >
                    <span className={dispo.get(p.name) === false ? 'line-through opacity-50' : ''}>{p.name}</span>
                    <span className="flex-1 border-b border-dotted border-white/30 mb-2" />
                    <span className="opacity-80 text-xl">{dispo.get(p.name) === false ? 'épuisé' : 'fournée du jour'}</span>
                  </motion.li>
                ))}
              </ul>
              {board?.note && <p className="chalk font-hand text-2xl mt-5 text-bakery-honey">✎ {board.note}</p>}
              <div className="mt-8 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
                <p className="chalk font-hand text-2xl">
                  Prochaine fournée : <span className="chalk-underline">{nextBatch ? (nextBatch.today ? `${nextBatch.hour} (${nextBatch.label})` : nextBatch.label) : '—'}</span>
                </p>
                <p className="chalk font-hand text-lg opacity-70">{t('ardoise_pied')}</p>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
