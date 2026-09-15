import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ShieldCheck, Clock, Mail } from 'lucide-react';
import Reveal from '../Reveal';
import { openLea, teaseLea } from '../../lib/lea';

// Le comptoir : quand on arrive devant, Léa se manifeste (bulle près du bouton).
export default function Comptoir() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done) { done = true; teaseLea('Je vous sers quelque chose ? 🥐'); }
    }, { threshold: 0.45 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-24 bg-bakery-dark text-bakery-light relative overflow-hidden">
      {/* lueur du four en arrière-plan */}
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[70vw] h-[50vh] rounded-full bg-bakery-orange/25 blur-3xl animate-emberGlow" aria-hidden="true" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <span className="text-bakery-honey font-semibold tracking-[0.2em] uppercase text-xs">Au comptoir</span>
            <h2 className="font-serif text-display-sm mt-3 mb-5 text-balance">Léa prend votre commande, comme au comptoir</h2>
            <p className="text-bakery-light/70 leading-relaxed text-pretty mb-8">
              Dites-lui ce qui vous ferait plaisir : elle connaît la carte, vérifie le créneau de retrait, note vos envies (une inscription sur le gâteau, une allergie) et vous envoie un email à valider. Un rappel arrive la veille.
            </p>
            <ul className="grid sm:grid-cols-3 gap-4 mb-9 text-sm">
              {[
                { icon: Clock, t: 'Créneaux vérifiés', d: 'Horaires et délais respectés' },
                { icon: Mail, t: 'Email à valider', d: 'Aucune commande fantôme' },
                { icon: ShieldCheck, t: 'Paiement en boutique', d: 'Rien à régler en ligne' },
              ].map((f) => (
                <li key={f.t} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <f.icon size={18} className="text-bakery-honey mb-2" />
                  <p className="font-semibold">{f.t}</p>
                  <p className="text-bakery-light/60 text-xs mt-0.5">{f.d}</p>
                </li>
              ))}
            </ul>
            <button onClick={() => openLea()} className="inline-flex items-center gap-2 bg-bakery-honey hover:bg-bakery-light text-bakery-dark px-7 py-3.5 rounded-full font-semibold transition-colors shadow-glow">
              <MessageCircle size={18} /> Parler à Léa
            </button>
          </Reveal>

          {/* Mise en scène d'une conversation */}
          <Reveal delay={0.1} x={30}>
            <div className="relative max-w-md mx-auto">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-bakery-honey/20 to-transparent blur-2xl" aria-hidden="true" />
              <div className="relative rounded-4xl bg-bakery-ember border border-white/10 p-5 space-y-3 shadow-warm">
                {[
                  { me: true, t: 'Bonjour ! Un fraisier pour 6 personnes samedi, c\'est possible ?' },
                  { me: false, t: 'Bien sûr 🥐 Samedi nous sommes ouverts de 7 h à 17 h. À quelle heure passeriez-vous le chercher ?' },
                  { me: true, t: 'Vers 11 h. Et vous pouvez écrire « Joyeux anniversaire Léo » dessus ?' },
                  { me: false, t: 'Avec plaisir, c\'est noté. Il me faut juste votre nom, votre email et un téléphone, et je vous enregistre ça.' },
                ].map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.35 }}
                    className={`flex ${m.me ? 'justify-end' : 'justify-start'}`}
                  >
                    <p className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.me ? 'bg-bakery-orange text-white rounded-br-sm' : 'bg-white/10 text-bakery-light rounded-bl-sm'}`}>{m.t}</p>
                  </motion.div>
                ))}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.9 }}
                  className="mx-auto w-fit bg-bakery-light text-bakery-dark font-mono text-[0.68rem] px-4 py-2 rounded-lg border border-dashed border-bakery-gold/60 mt-2">
                  COMMANDE · AD-7K3P9Q · samedi 11 h · à valider par email
                </motion.div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
