// Espace propriétaire : connexion, tableau de bord et conversation avec le Chef.
// Non référencé dans la navigation ; accessible sur /admin.
import { useEffect, useRef, useState } from 'react';
import { LogOut, RefreshCw, Send, CheckCircle2, PackageCheck, Trash2, ChefHat, MessageSquare, LayoutDashboard } from 'lucide-react';
import SEO from '../components/SEO';
import { useSite } from '../site/SiteProvider';

async function api(path, opts = {}) {
  const r = await fetch(path, { credentials: 'same-origin', headers: { 'content-type': 'application/json' }, ...opts });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Erreur');
  return data;
}

function Login({ onOk }) {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: pwd }) }); onOk(); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-bakery-dark flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm bg-bakery-cream rounded-4xl p-8 shadow-warm">
        <div className="w-12 h-12 rounded-2xl bg-bakery-dark text-bakery-honey flex items-center justify-center mb-5"><ChefHat /></div>
        <h1 className="font-serif text-3xl text-bakery-dark mb-1">Espace équipe</h1>
        <p className="text-sm text-bakery-brown/70 mb-6">Le même mot de passe que pour le bot Telegram.</p>
        <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Mot de passe" autoFocus className="w-full px-4 py-3 rounded-xl border border-bakery-sand bg-white outline-none focus:border-bakery-orange mb-3" />
        {err && <p className="text-sm text-red-700 mb-3">{err}</p>}
        <button disabled={busy} className="w-full bg-bakery-dark hover:bg-bakery-orange text-bakery-light py-3 rounded-xl font-medium transition-colors disabled:opacity-60">{busy ? 'Connexion…' : 'Entrer'}</button>
      </form>
    </div>
  );
}

function OrderRow({ o, onAction }) {
  const s = o.statut;
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-bakery-sand last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs text-bakery-orange">{o.numero} · <span className="text-bakery-brown/70">{s}</span></p>
        <p className="font-medium text-bakery-dark truncate">{o.articles}</p>
        <p className="text-xs text-bakery-brown/70">{o.retrait} · {o.client}</p>
      </div>
      {['confirmée', 'prête'].includes(s) && (
        <div className="flex gap-2 shrink-0">
          {s === 'confirmée' && <button onClick={() => onAction(o.numero, 'prete')} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-bakery-honey/30 text-bakery-brown hover:bg-bakery-honey"><PackageCheck size={14} /> Prête</button>}
          <button onClick={() => onAction(o.numero, 'retiree')} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-800 hover:bg-green-200"><CheckCircle2 size={14} /> Retirée</button>
        </div>
      )}
    </li>
  );
}

function Dashboard({ data, reload }) {
  const act = async (numero, statut) => { await api('/api/admin/overview', { method: 'POST', body: JSON.stringify({ action: 'statut', numero, statut }) }); reload(); };
  const traite = async (id) => { await api('/api/admin/overview', { method: 'POST', body: JSON.stringify({ action: 'contact_traite', id }) }); reload(); };
  const Card = ({ title, count, children }) => (
    <section className="bg-bakery-cream rounded-3xl border border-bakery-sand p-5">
      <h2 className="font-serif text-xl text-bakery-dark mb-3 flex items-center justify-between">{title}{count !== undefined && <span className="text-sm font-sans text-bakery-brown/60">{count}</span>}</h2>
      {children}
    </section>
  );
  const epuises = (data.board.items || []).filter((i) => i.disponible === false).map((i) => i.nom);
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card title="Aujourd'hui" count={data.aujourdhui.nombre}>
        {data.aujourdhui.nombre ? <ul>{data.aujourdhui.commandes.map((o) => <OrderRow key={o.numero} o={o} onAction={act} />)}</ul> : <p className="text-sm text-bakery-brown/60">Aucune commande à préparer.</p>}
      </Card>
      <Card title="Demain" count={data.demain.nombre}>
        {data.demain.nombre ? <ul>{data.demain.commandes.map((o) => <OrderRow key={o.numero} o={o} onAction={act} />)}</ul> : <p className="text-sm text-bakery-brown/60">Rien de prévu.</p>}
      </Card>
      <Card title="En attente de validation" count={data.attente.nombre}>
        {data.attente.nombre ? <ul>{data.attente.commandes.map((o) => <OrderRow key={o.numero} o={o} onAction={act} />)}</ul> : <p className="text-sm text-bakery-brown/60">Toutes les commandes sont validées.</p>}
      </Card>
      <Card title="Cette semaine" count={data.semaine.nombre}>
        <p className="text-sm text-bakery-brown/80">{Object.entries(data.semaine.par_statut || {}).map(([k, v]) => `${v} ${k}`).join(' · ') || 'Aucune commande.'}</p>
        <p className="text-sm text-bakery-brown/80 mt-2">7 derniers jours : {data.stats.commandes_total} commandes · Léa : {data.stats.lea.requetes} requêtes, {data.stats.lea.tokens.toLocaleString('fr-FR')} tokens</p>
        {data.stats.produits_les_plus_commandes?.length > 0 && <p className="text-xs text-bakery-brown/60 mt-2">Top : {data.stats.produits_les_plus_commandes.slice(0, 4).map((p) => `${p.produit} (${p.quantite})`).join(', ')}</p>}
      </Card>
      <Card title="Ardoise du jour">
        <p className="text-sm text-bakery-brown/80">{epuises.length ? `Épuisés : ${epuises.join(', ')}` : 'Tous les pains disponibles.'}</p>
        {data.board.note && <p className="text-sm text-bakery-dark mt-1">✎ {data.board.note}</p>}
        {data.closures?.length > 0 && <p className="text-sm text-bakery-orange mt-2">Fermetures : {data.closures.map((c) => `${c.day}${c.motif ? ` (${c.motif})` : ''}`).join(', ')}</p>}
        <p className="text-xs text-bakery-brown/50 mt-3">Modifiable en parlant au Chef (« plus de pain aux noix aujourd'hui »).</p>
      </Card>
      <Card title="Demandes de contact" count={data.contacts.length}>
        {data.contacts.length ? (
          <ul className="space-y-3">
            {data.contacts.slice(0, 6).map((c) => (
              <li key={c.id} className="text-sm border-b border-bakery-sand last:border-0 pb-3">
                <p className="font-medium text-bakery-dark">{c.nom} · <span className="text-bakery-brown/60">{c.objet}</span></p>
                <p className="text-bakery-brown/80 line-clamp-2">{c.message}</p>
                <div className="flex gap-3 mt-1 text-xs"><a href={`mailto:${c.email}`} className="text-bakery-orange font-semibold">Répondre</a><button onClick={() => traite(c.id)} className="text-bakery-brown/60 hover:text-bakery-dark">Marquer traitée</button></div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-bakery-brown/60">Rien à traiter.</p>}
      </Card>
    </div>
  );
}

function ChefChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => { api('/api/admin/chat').then((d) => setMessages(d.messages)).catch(() => {}); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput(''); setBusy(true);
    setMessages((m) => [...m, { from: 'user', text }, { from: 'bot', text: '' }]);
    const patch = (fn) => setMessages((m) => { const c = m.slice(); c[c.length - 1] = { ...c[c.length - 1], ...fn(c[c.length - 1]) }; return c; });
    try {
      const r = await fetch('/api/admin/chat', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text }) });
      const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let i; while ((i = buf.indexOf('\n\n')) !== -1) {
          const line = buf.slice(0, i); buf = buf.slice(i + 2);
          if (!line.startsWith('data: ')) continue;
          const ev = JSON.parse(line.slice(6));
          if (ev.type === 'text') patch((m) => ({ text: m.text + ev.delta }));
          else if (ev.type === 'replace') patch(() => ({ text: ev.text }));
          else if (ev.type === 'error') patch(() => ({ text: `⚠️ ${ev.message}` }));
        }
      }
    } catch (e) { patch(() => ({ text: `⚠️ ${e.message}` })); } finally { setBusy(false); }
  };

  const reset = async () => { await api('/api/admin/chat', { method: 'DELETE' }); setMessages([]); };
  const suggestions = ["Qu'est-ce que je prépare demain ?", 'Les commandes du mois', 'Plus de pain aux noix aujourd\'hui', 'Passe le site en palette terracotta', 'Résume ce que demandent les clients à Léa'];

  return (
    <div className="bg-bakery-cream rounded-3xl border border-bakery-sand flex flex-col h-[70vh]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-bakery-sand">
        <p className="font-serif text-lg text-bakery-dark flex items-center gap-2"><ChefHat size={18} /> Le Chef</p>
        <button onClick={reset} className="text-xs text-bakery-brown/60 hover:text-bakery-dark inline-flex items-center gap-1"><Trash2 size={12} /> Nouvelle conversation</button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-bakery-brown/70">
            <p className="mb-3">Bonjour ! Demandez-moi les commandes, modifiez l'ardoise, les horaires, les couleurs ou les produits du site… Quelques idées :</p>
            <div className="flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} onClick={() => setInput(s)} className="text-xs border border-bakery-sand bg-white px-3 py-1.5 rounded-full hover:border-bakery-orange">{s}</button>)}</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${m.from === 'user' ? 'bg-bakery-dark text-bakery-light rounded-br-sm' : 'bg-white border border-bakery-sand text-bakery-dark rounded-bl-sm'}`}>{m.text || (busy ? '…' : '')}</p>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 p-3 border-t border-bakery-sand">
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={busy} placeholder="Parlez au Chef…" className="flex-1 px-4 py-2.5 rounded-full border border-bakery-sand bg-white outline-none focus:border-bakery-orange text-sm" />
        <button disabled={busy || !input.trim()} className="w-10 h-10 rounded-full bg-bakery-dark text-bakery-light flex items-center justify-center disabled:opacity-40"><Send size={16} /></button>
      </form>
    </div>
  );
}

export default function Admin() {
  const { nom } = useSite();
  const [auth, setAuth] = useState(null);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('board');
  const [err, setErr] = useState(null);

  const load = () => api('/api/admin/overview').then((d) => { setData(d); setErr(null); }).catch((e) => setErr(e.message));
  useEffect(() => { api('/api/admin/login').then((d) => setAuth(d.admin)).catch(() => setAuth(false)); }, []);
  useEffect(() => { if (auth) load(); }, [auth]);

  if (auth === null) return <div className="min-h-screen bg-bakery-dark" />;
  if (!auth) return <Login onOk={() => setAuth(true)} />;

  return (
    <div className="min-h-screen bg-bakery-light pt-28 pb-16">
      <SEO title="Espace équipe" description="Gestion de la boulangerie." keywords="" />
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-bakery-orange font-semibold tracking-[0.2em] uppercase text-xs">Espace équipe</span>
            <h1 className="font-serif text-display-sm text-bakery-dark">{nom}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTab('board')} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${tab === 'board' ? 'bg-bakery-dark text-bakery-light' : 'bg-bakery-cream border border-bakery-sand text-bakery-brown'}`}><LayoutDashboard size={14} /> Tableau de bord</button>
            <button onClick={() => setTab('chef')} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${tab === 'chef' ? 'bg-bakery-dark text-bakery-light' : 'bg-bakery-cream border border-bakery-sand text-bakery-brown'}`}><MessageSquare size={14} /> Le Chef</button>
            <button onClick={load} aria-label="Actualiser" className="w-9 h-9 rounded-full bg-bakery-cream border border-bakery-sand flex items-center justify-center text-bakery-brown hover:text-bakery-dark"><RefreshCw size={14} /></button>
            <button onClick={async () => { await api('/api/admin/login', { method: 'DELETE' }); setAuth(false); }} aria-label="Se déconnecter" className="w-9 h-9 rounded-full bg-bakery-cream border border-bakery-sand flex items-center justify-center text-bakery-brown hover:text-bakery-dark"><LogOut size={14} /></button>
          </div>
        </div>
        {err && <p className="text-sm text-red-700 mb-4">{err}</p>}
        {tab === 'board' ? (data ? <Dashboard data={data} reload={load} /> : <p className="text-sm text-bakery-brown/60">Chargement…</p>) : <ChefChat />}
        {data && <p className="text-xs text-bakery-brown/50 mt-6">Modèle : {data.llm.provider} · {data.llm.model} · configuration v{data.site.version}</p>}
      </div>
    </div>
  );
}
