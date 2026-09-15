import { Fragment, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, Mail, Clock, ChevronDown, Send, CheckCircle2,
  Info, ShoppingBag, PartyPopper, HelpCircle, ArrowLeft, ArrowRight,
} from 'lucide-react';
import SEO from '../components/SEO';
import Reveal from '../components/Reveal';
import MapBoutique from '../components/MapBoutique';
import { StatusPill } from '../components/Navbar';
import { horairesAffichage } from '../data/infos';
import { useSite, useText } from '../site/SiteProvider';



const SUBJECTS = [
  { key: 'info', label: 'Information générale', icon: Info, desc: 'Une question sur nos produits, nos horaires…' },
  { key: 'commande', label: 'Commande de pâtisserie', icon: ShoppingBag, desc: 'Réserver un gâteau ou une quantité pour un jour précis.' },
  { key: 'evenement', label: 'Gâteau d\'événement', icon: PartyPopper, desc: 'Mariage, anniversaire, fiançailles…' },
  { key: 'autre', label: 'Autre demande', icon: HelpCircle, desc: 'Réclamation, presse, partenariat…' },
];

const EVENT_TYPES = ['Mariage', 'Anniversaire', 'Fiançailles', 'Autre événement'];

// Accepte une clé exacte ('evenement', 'commande', 'info', 'autre') ou un libellé libre.
function matchSubjectKey(hint) {
  if (!hint) return null;
  if (SUBJECTS.some((s) => s.key === hint)) return hint;
  const h = hint.toLowerCase();
  if (h.includes('vénement') || h.includes('event') || h.includes('traiteur')) return 'evenement';
  if (h.includes('command')) return 'commande';
  return null;
}

const EMPTY_FORM = {
  nom: '', email: '', telephone: '', message: '',
  eventType: EVENT_TYPES[0], eventDate: '', guests: '', budget: 250,
};

function FloatingInput({ label, type = 'text', name, value, onChange, textarea = false, required = false }) {
  const Comp = textarea ? 'textarea' : 'input';
  return (
    <label className="relative block group">
      <Comp
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        rows={textarea ? 4 : undefined}
        placeholder=" "
        className="peer w-full px-4 pt-6 pb-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-bakery-orange focus:border-transparent outline-none transition-all resize-none"
      />
      <span className="pointer-events-none absolute left-4 top-4 text-gray-400 text-base transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-bakery-orange peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs">
        {label}
      </span>
    </label>
  );
}

const STEP_LABELS = ['Objet', 'Détails', 'Envoyé'];

export default function Contact() {
  const { boutique: BOUTIQUE, horaires, nom } = useSite();
  const t = useText();
  const FAQ = [1, 2, 3, 4].map((i) => ({ q: t(`faq_${i}_q`), r: t(`faq_${i}_r`) })).filter((f) => f.q);
  const HORAIRES = horairesAffichage(horaires);
  const location = useLocation();
  const preselected = matchSubjectKey(location.state?.subject);

  const [step, setStep] = useState(preselected ? 2 : 1);
  const [subject, setSubject] = useState(preselected);
  // Léa (chatbot) peut pré-remplir le message avec le récapitulatif de la demande.
  const [form, setForm] = useState({ ...EMPTY_FORM, message: location.state?.message || '' });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const updateField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const chooseSubject = (key) => {
    setSubject(key);
    setStep(2);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setSendError(null);
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject, ...form, website: e.target.elements.website?.value || '' }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Envoi impossible pour le moment.');
      setStep(3);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const restart = () => {
    setStep(1);
    setSubject(null);
    setSendError(null);
    setForm(EMPTY_FORM);
  };

  const subjectMeta = SUBJECTS.find((s) => s.key === subject);

  return (
    <div className="pt-36 pb-20 bg-bakery-light min-h-screen overflow-hidden relative grain">
      <SEO
        title="Contact & Commandes"
        description={`Contactez ${nom} pour une commande spéciale, un événement ou simplement pour venir nous voir.`}
        keywords="contact, commander, adresse, horaires, boulangerie, gâteau événement"
      />
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <Reveal className="text-center mb-10">
          <span className="text-bakery-orange font-semibold tracking-[0.2em] uppercase text-xs">{t('contact_kicker')}</span>
          <h1 className="font-serif text-display text-bakery-dark mt-3 mb-6 text-balance">{t('contact_titre')}</h1>
          <p className="text-bakery-brown/80 text-lg max-w-2xl mx-auto text-pretty">{t('contact_texte')}</p>
        </Reveal>

        <Reveal delay={0.1} className="flex justify-center mb-16"><StatusPill /></Reveal>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Formulaire multi-étapes */}
          <Reveal x={-30} className="bg-bakery-cream p-8 rounded-4xl shadow-warm border border-bakery-sand relative z-10">
            {/* Indicateur de progression */}
            <div className="flex items-center gap-2 mb-8">
              {STEP_LABELS.map((label, i) => {
                const n = i + 1;
                const active = step >= n;
                return (
                  <Fragment key={label}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${active ? 'bg-bakery-orange text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {n}
                      </div>
                      <span className={`text-xs font-medium hidden sm:inline ${active ? 'text-bakery-dark' : 'text-gray-400'}`}>{label}</span>
                    </div>
                    {n < STEP_LABELS.length && (
                      <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > n ? 'bg-bakery-orange' : 'bg-gray-100'}`} />
                    )}
                  </Fragment>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <h2 className="text-2xl font-serif font-bold mb-2 text-bakery-brown">Quel est l'objet de votre demande ?</h2>
                  <p className="text-gray-500 text-sm mb-6">Choisissez une catégorie pour un formulaire adapté à votre besoin.</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {SUBJECTS.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => chooseSubject(s.key)}
                        className="text-left p-5 rounded-2xl border-2 border-gray-100 hover:border-bakery-orange hover:bg-bakery-orange/5 transition-colors group"
                      >
                        <s.icon className="text-bakery-orange mb-3 group-hover:scale-110 transition-transform" size={26} />
                        <p className="font-semibold text-bakery-dark mb-1">{s.label}</p>
                        <p className="text-xs text-gray-500">{s.desc}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.form
                  key="s2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                  onSubmit={onSubmit}
                  className="space-y-5"
                >
                  <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-bakery-orange transition-colors mb-1">
                    <ArrowLeft size={14} /> Changer l'objet
                  </button>

                  {subjectMeta && (
                    <div className="flex items-center gap-2 text-bakery-orange bg-bakery-orange/10 rounded-lg px-4 py-2.5 text-sm font-medium mb-2">
                      <subjectMeta.icon size={16} /> {subjectMeta.label}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-5">
                    <FloatingInput label="Nom" name="nom" value={form.nom} onChange={updateField} required />
                    <FloatingInput label="Email" name="email" type="email" value={form.email} onChange={updateField} required />
                  </div>
                  <FloatingInput label="Téléphone (optionnel)" name="telephone" type="tel" value={form.telephone} onChange={updateField} />

                  {/* Champs spécifiques aux gâteaux d'événement */}
                  {subject === 'evenement' && (
                    <div className="rounded-2xl border border-bakery-gold/30 bg-bakery-gold/5 p-5 space-y-5">
                      <p className="text-sm font-semibold text-bakery-brown flex items-center gap-2">
                        <PartyPopper size={16} className="text-bakery-orange" /> Détails de votre événement
                      </p>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-xs text-gray-500 block mb-1.5">Type d'événement</span>
                          <select
                            name="eventType"
                            value={form.eventType}
                            onChange={updateField}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-bakery-orange outline-none text-sm"
                          >
                            {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-xs text-gray-500 block mb-1.5">Date souhaitée</span>
                          <input
                            type="date" name="eventDate" value={form.eventDate} onChange={updateField}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-bakery-orange outline-none text-sm"
                          />
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-xs text-gray-500 block mb-1.5">Nombre d'invités approximatif</span>
                        <input
                          type="number" min="1" name="guests" value={form.guests} onChange={updateField}
                          placeholder="Ex. 50"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-bakery-orange outline-none text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-gray-500 flex justify-between mb-2">
                          <span>Budget indicatif</span>
                          <span className="font-semibold text-bakery-orange">{form.budget}€</span>
                        </span>
                        <input
                          type="range" min="50" max="1000" step="10" name="budget"
                          value={form.budget}
                          onChange={updateField}
                          className="w-full accent-bakery-orange"
                        />
                        <div className="flex justify-between text-[0.65rem] text-gray-400 mt-1">
                          <span>50€</span><span>1000€+</span>
                        </div>
                      </label>
                    </div>
                  )}

                  <FloatingInput label="Message" name="message" value={form.message} onChange={updateField} textarea required />

                  {/* Honeypot anti-spam : invisible pour les humains, rempli par les bots */}
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                  {sendError && (
                    <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                      {sendError} Vous pouvez aussi nous appeler au {BOUTIQUE.telephone}.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 bg-bakery-orange hover:bg-bakery-brown text-white font-semibold py-4 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {sending ? 'Envoi en cours…' : 'Envoyer la demande'} <Send size={18} />
                  </button>
                </motion.form>
              )}

              {step === 3 && (
                <motion.div
                  key="s3"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center py-10"
                >
                  <CheckCircle2 className="text-green-600 mb-4" size={52} />
                  <p className="text-xl font-serif font-semibold text-bakery-dark mb-2">Message envoyé !</p>
                  <p className="text-gray-500 mb-6">Nous vous répondrons sous 24h ouvrées{subject === 'evenement' ? ' avec une proposition adaptée à votre événement.' : '.'}</p>
                  <button onClick={restart} className="text-bakery-orange font-medium hover:text-bakery-brown transition-colors flex items-center gap-1.5">
                    Envoyer un autre message <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </Reveal>

          {/* Info */}
          <Reveal x={30} delay={0.1} className="space-y-8">
            <div className="bg-bakery-dark text-bakery-light p-8 rounded-4xl shadow-warm">
              <h2 className="text-2xl font-serif mb-8 text-bakery-honey">Informations pratiques</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <MapPin className="text-bakery-orange shrink-0 mt-1" />
                  <div>
                    <strong className="block text-lg mb-1">Notre Adresse</strong>
                    <span className="text-gray-300">{BOUTIQUE.adresse}<br/>{BOUTIQUE.codePostal} {BOUTIQUE.ville}, {BOUTIQUE.pays}</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Phone className="text-bakery-orange shrink-0 mt-1" />
                  <div>
                    <strong className="block text-lg mb-1">Téléphone</strong>
                    <a href={`tel:${BOUTIQUE.telephone.replace(/\s/g, '')}`} className="text-gray-300 hover:text-white transition-colors">{BOUTIQUE.telephone}</a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Mail className="text-bakery-orange shrink-0 mt-1" />
                  <div>
                    <strong className="block text-lg mb-1">Email</strong>
                    <a href={`mailto:${BOUTIQUE.email}`} className="text-gray-300 hover:text-white transition-colors">{BOUTIQUE.email}</a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Clock className="text-bakery-orange shrink-0 mt-1" />
                  <div>
                    <strong className="block text-lg mb-1">Horaires d'ouverture</strong>
                    <div className="text-gray-300 grid grid-cols-2 gap-x-4 gap-y-1">
                      {HORAIRES.map((h) => (
                        <Fragment key={h.jour}>
                          <span className={h.heures === 'Fermé' ? 'text-bakery-orange font-medium' : ''}>{h.jour}:</span>
                          <span className={h.heures === 'Fermé' ? 'text-bakery-orange font-medium' : ''}>{h.heures}</span>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl overflow-hidden border border-bakery-sand shadow-warm-sm">
              <MapBoutique className="h-72" coords={BOUTIQUE.coords} nom={nom} boutique={BOUTIQUE} />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${BOUTIQUE.adresse}, ${BOUTIQUE.codePostal} ${BOUTIQUE.ville}`)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-between px-5 py-3.5 bg-bakery-cream text-sm font-medium text-bakery-dark hover:text-bakery-orange transition-colors"
              >
                <span>{BOUTIQUE.adresse}, {BOUTIQUE.codePostal} {BOUTIQUE.ville}</span>
                <span className="inline-flex items-center gap-1">Itinéraire <ArrowRight size={14} /></span>
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="max-w-3xl mx-auto mt-24">
          <h2 className="font-serif text-display-sm text-bakery-dark text-center mb-10">{t('faq_titre')}</h2>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={i} className="bg-bakery-cream rounded-2xl border border-bakery-sand shadow-warm-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-medium text-bakery-dark">{f.q}</span>
                  <ChevronDown className={`text-bakery-orange shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }} className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-gray-600 leading-relaxed">{f.r}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
