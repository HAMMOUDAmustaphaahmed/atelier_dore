import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Croissant, PhoneCall } from 'lucide-react';
import { useSite } from '../site/SiteProvider';
import { LEA_EVENT } from '../lib/lea';

const QUICK_REPLIES = [
  'Vos horaires ?',
  'Où êtes-vous ?',
  "Un gâteau d'anniversaire",
  'Je veux commander',
];

const WELCOME = {
  from: 'bot',
  text: "Bonjour, je suis Léa 👋 Je peux vous renseigner sur nos produits, nos horaires, et préparer votre commande ou votre gâteau d'événement.",
};

const LIMIT_TEXT = "Nous avons atteint la limite de cette conversation. Pour continuer, appelez-nous ou écrivez-nous via le formulaire — l'équipe vous répond sous 24 h.";

function contactCta() {
  return { label: 'Ouvrir le formulaire de contact', to: '/contact', state: { subject: 'info' } };
}

// Récapitulatif de commande façon ticket de caisse, affiché après create_order.
function Ticket({ ticket }) {
  return (
    <div className="mt-3 -mx-1 bg-bakery-light border border-dashed border-bakery-gold/60 rounded-lg px-3 py-2.5 font-mono text-[0.7rem] text-bakery-dark">
      <div className="flex justify-between font-semibold tracking-wider mb-1.5">
        <span>{ticket.type === 'devis' ? 'DEVIS' : 'COMMANDE'}</span>
        <span>{ticket.numero}</span>
      </div>
      <ul className="space-y-0.5 border-t border-dashed border-bakery-gold/40 pt-1.5">
        {ticket.articles.map((a, i) => (
          <li key={i} className="flex justify-between gap-2">
            <span className="truncate">{a.quantite} × {a.produit}</span>
            {a.prix_unitaire && <span className="shrink-0">{a.prix_unitaire}</span>}
          </li>
        ))}
      </ul>
      <div className="border-t border-dashed border-bakery-gold/40 mt-1.5 pt-1.5 space-y-0.5">
        <p className="flex justify-between"><span>Tarif</span><span className="font-semibold">{ticket.total}</span></p>
        <p>Retrait : {ticket.retrait}</p>
        {ticket.confirmation_avant && <p className="text-bakery-orange">À valider par email avant le {ticket.confirmation_avant}</p>}
      </div>
    </div>
  );
}

/**
 * Lit un flux SSE (`data: {...}\n\n`) et appelle `onEvent` pour chaque événement.
 */
async function readSse(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = chunk.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      try {
        onEvent(JSON.parse(line.slice(6)));
      } catch {
        /* ligne invalide : ignorée */
      }
    }
  }
}

export default function Chatbot() {
  const { nom, boutique: BOUTIQUE } = useSite();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [limit, setLimit] = useState(20);
  const [blocked, setBlocked] = useState(null); // message d'indisponibilité (quota IP, config…)
  const [tease, setTease] = useState(null);      // bulle d'invitation près du bouton
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const sessionLoaded = useRef(false);
  const pendingRef = useRef(null);               // message à envoyer dès que la session est prête
  const sendRef = useRef(null);

  // Commandes externes : openLea(message) / teaseLea(texte) — voir src/lib/lea.js
  useEffect(() => {
    const onCmd = (e) => {
      const { type, message, text } = e.detail || {};
      if (type === 'open') {
        setTease(null);
        setOpen(true);
        if (message) pendingRef.current = message;
      } else if (type === 'tease' && !open) {
        setTease(text);
      }
    };
    window.addEventListener(LEA_EVENT, onCmd);
    return () => window.removeEventListener(LEA_EVENT, onCmd);
  }, [open]);

  useEffect(() => {
    if (!tease) return;
    const id = setTimeout(() => setTease(null), 9000);
    return () => clearTimeout(id);
  }, [tease]);

  // À l'ouverture : on récupère la session (cookie) et l'historique — rien n'est
  // renvoyé à l'IA, donc aucun token consommé par un refresh.
  useEffect(() => {
    if (!open || sessionLoaded.current) return;
    sessionLoaded.current = true;
    setLoading(true);
    fetch('/api/session', { credentials: 'same-origin' })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setBlocked(data.error || 'Léa est indisponible pour le moment.');
          setMessages([WELCOME]);
          return;
        }
        setRemaining(data.remaining);
        setLimit(data.limit);
        const restored = data.messages.length ? data.messages : [WELCOME];
        setMessages(data.remaining === 0 ? [...restored, { from: 'bot', text: LIMIT_TEXT, cta: contactCta() }] : restored);
      })
      .catch(() => {
        setBlocked('Impossible de joindre Léa. Vérifiez votre connexion.');
        setMessages([WELCOME]);
      })
      .finally(() => {
        setLoading(false);
        if (pendingRef.current) { const m = pendingRef.current; pendingRef.current = null; setTimeout(() => sendRef.current?.(m), 50); }
      });
  }, [open]);

  // Session déjà chargée : un message en attente part immédiatement.
  useEffect(() => {
    if (open && !loading && sessionLoaded.current && pendingRef.current && !busy) {
      const m = pendingRef.current; pendingRef.current = null; sendRef.current?.(m);
    }
  }, [open, loading, busy]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy, open]);

  useEffect(() => {
    if (open && !busy) inputRef.current?.focus();
  }, [open, busy]);

  const exhausted = remaining === 0;
  const disabled = busy || loading || exhausted || !!blocked;

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [...m, { from: 'user', text: trimmed }, { from: 'bot', text: '', streaming: true }]);

    const patchLast = (patch) =>
      setMessages((m) => {
        const copy = m.slice();
        copy[copy.length - 1] = { ...copy[copy.length - 1], ...patch };
        return copy;
      });

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        if (['limit_reached', 'ip_limit', 'too_many_sessions'].includes(data.code)) {
          setRemaining(0);
          patchLast({ text: LIMIT_TEXT, streaming: false, cta: contactCta() });
        } else if (data.code === 'blocked') {
          patchLast({ text: data.error, streaming: false });
          setBlocked('Conversation clôturée : Léa est réservée aux questions sur la boulangerie.');
        } else {
          patchLast({ text: data.error || 'Léa a rencontré un problème. Réessayez dans un instant.', streaming: false, error: true });
        }
        return;
      }

      let acc = '';
      await readSse(r, (ev) => {
        if (ev.type === 'text') {
          acc += ev.delta;
          patchLast({ text: acc });
        } else if (ev.type === 'cta') {
          patchLast({ cta: ev.cta });
        } else if (ev.type === 'ticket') {
          patchLast({ ticket: ev.ticket });
        } else if (ev.type === 'replace') {
          acc = ev.text;
          patchLast({ text: acc });
        } else if (ev.type === 'done') {
          setRemaining(ev.remaining);
          patchLast({ streaming: false });
          if (ev.blocked) {
            setBlocked('Conversation clôturée : Léa est réservée aux questions sur la boulangerie.');
          } else if (ev.remaining === 0) {
            setMessages((m) => [...m, { from: 'bot', text: LIMIT_TEXT, cta: contactCta() }]);
          }
        } else if (ev.type === 'error') {
          patchLast({ text: acc || ev.message, streaming: false, error: !acc });
          if (typeof ev.remaining === 'number') setRemaining(ev.remaining);
        }
      });
      patchLast({ streaming: false });
    } catch {
      patchLast({ text: 'Connexion interrompue. Réessayez dans un instant.', streaming: false, error: true });
    } finally {
      setBusy(false);
    }
  };

  sendRef.current = send;

  return (
    <>
      <AnimatePresence>
        {tease && !open && (
          <motion.button
            initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
            onClick={() => { setTease(null); setOpen(true); }}
            className="fixed bottom-24 right-6 z-40 max-w-[240px] bg-bakery-cream text-bakery-dark text-sm text-left px-4 py-3 rounded-2xl rounded-br-sm shadow-warm border border-bakery-sand"
          >
            <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-bakery-orange font-semibold mb-1">Léa</span>
            {tease}
          </motion.button>
        )}
      </AnimatePresence>
      <motion.button
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
        onClick={() => { setTease(null); setOpen((v) => !v); }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-bakery-dark hover:bg-bakery-orange text-bakery-light shadow-warm flex items-center justify-center transition-colors"
        whileTap={{ scale: 0.92 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X size={24} />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <MessageCircle size={24} />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-bakery-honey border-2 border-bakery-light" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Discussion avec Léa"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-40 w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-bakery-cream rounded-3xl shadow-warm flex flex-col overflow-hidden border border-bakery-sand"
          >
            {/* Header */}
            <div className="bg-bakery-dark text-white px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-bakery-honey/20 flex items-center justify-center">
                <Croissant className="text-bakery-honey" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif font-semibold leading-tight">Léa</p>
                <p className="text-xs text-gray-300 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${blocked ? 'bg-gray-400' : 'bg-green-400'}`} /> {nom} · {blocked ? 'indisponible' : 'en ligne'}
                </p>
              </div>
              {remaining !== null && remaining <= 5 && (
                <span className="text-[0.65rem] text-bakery-gold/90 bg-white/10 px-2 py-1 rounded-full whitespace-nowrap" title={`${remaining} message(s) restant(s) sur ${limit}`}>
                  {remaining} / {limit}
                </span>
              )}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-bakery-light" aria-live="polite">
              {loading && messages.length === 0 && (
                <p className="text-xs text-gray-400 text-center">Connexion…</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.from === 'user'
                        ? 'bg-bakery-orange text-white rounded-br-sm'
                        : m.error
                          ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-sm'
                          : 'bg-white text-bakery-dark border border-gray-100 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {m.streaming && !m.text ? (
                      <span className="flex gap-1 py-1" aria-label="Léa écrit">
                        {[0, 1, 2].map((d) => (
                          <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                        ))}
                      </span>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    )}
                    {m.ticket && <Ticket ticket={m.ticket} />}
                    {m.cta && (
                      <Link
                        to={m.cta.to}
                        state={m.cta.state}
                        onClick={() => setOpen(false)}
                        className="inline-block mt-2 text-xs font-semibold text-bakery-orange bg-bakery-orange/10 hover:bg-bakery-orange hover:text-white transition-colors px-3 py-1.5 rounded-full"
                      >
                        {m.cta.label} →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {blocked && (
                <div className="text-xs text-gray-500 bg-white border border-gray-100 rounded-2xl px-4 py-3">
                  {blocked}
                  <a href={`tel:${BOUTIQUE.telephone.replace(/\s/g, '')}`} className="mt-2 flex items-center gap-1.5 text-bakery-orange font-semibold">
                    <PhoneCall size={12} /> {BOUTIQUE.telephone}
                  </a>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && !disabled && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs border border-bakery-orange/40 text-bakery-brown px-3 py-1.5 rounded-full hover:bg-bakery-orange hover:text-white hover:border-bakery-orange transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Saisie */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 border-t border-gray-100 p-3 bg-white"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 400))}
                maxLength={400}
                disabled={disabled}
                aria-label="Votre message"
                placeholder={exhausted ? 'Limite atteinte' : blocked ? 'Indisponible' : 'Écrivez votre message…'}
                className="flex-1 text-sm px-4 py-2.5 rounded-full border border-gray-200 outline-none focus:border-bakery-orange transition-colors disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                type="submit"
                aria-label="Envoyer"
                disabled={disabled || !input.trim()}
                className="w-10 h-10 rounded-full bg-bakery-orange hover:bg-bakery-brown text-white flex items-center justify-center transition-colors shrink-0 disabled:opacity-40 disabled:hover:bg-bakery-orange"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
