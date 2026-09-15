// « Le Chef » : l'agent du propriétaire de la boulangerie. Même moteur que Léa
// (runTurn), mais des outils d'action : commandes, ardoise, fermetures, emails,
// statistiques… et le pilotage complet du site (textes, coordonnées, horaires,
// palette, produits, images). Accessible uniquement après autorisation
// (Telegram : /start <mot de passe> ; web : /admin).

import { store } from './store.js';
import { env } from './env.js';
import { runTurn } from './llm.js';
import { buildCatalogue } from './catalogue.js';
import { formatPickup, publicOrder, ORDER_STATUS } from './orders.js';
import { sendCancelled, sendCustomEmail } from './emails.js';
import { getSettings, updateSettings, IMAGE_SLOTS, PALETTE_PRESETS, PALETTE_DEFAULT, CATEGORIES, ICONS_DISPONIBLES, FONT_PRESETS, isHex, resolveImageUrl } from './settings.js';
import { CONTENT, CONTENT_PAGES } from '../../src/data/content.js';
import { parisNow, AFFICHER_PRIX, horairesAffichage } from '../../src/data/infos.js';

const STATUS_LABEL = { en_attente: 'en attente de validation', confirmee: 'confirmée', prete: 'prête', retiree: 'retirée', annulee: 'annulée', expiree: 'expirée' };
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export async function buildChefSystem() {
  const s = await getSettings();
  return `Tu es « le Chef », assistant de gestion de ${s.nom} (boulangerie-pâtisserie, ${s.boutique.ville}). Tu parles au propriétaire ou à son équipe, jamais aux clients. Tu agis via tes outils.

Règles :
- Vérité : n'annonce une action que si l'outil répond ok:true. Sinon dis-le et corrige (bon outil, bons champs).
- Confirmation « oui » explicite requise avant : annuler une commande, envoyer un email, supprimer un produit. Tout le reste se fait directement, puis résume en une phrase.
- Quel outil : nom/slogan/coordonnées/GPS → set_info · n'importe quel texte du site (titres, paragraphes, boutons, avis, FAQ, frise…) → list_content pour trouver la clé puis set_content · polices → set_fonts · horaires/fournées → set_hours · couleurs → set_palette (list_palettes pour les palettes prêtes) · produits → manage_product · photo [PHOTO : url] → set_image (si l'emplacement n'est pas dit : list_image_slots puis propose 2-3 emplacements et attends). Si le propriétaire veut changer une image sans l'avoir envoyée, demande-lui d'envoyer la photo directement dans la conversation (jamais « donne-moi une URL ») ; une URL reste acceptée si c'est lui qui la propose · pains épuisés/note → set_board · fermetures → manage_closure · commandes → list_orders / get_order / production_plan / update_order_status · clients → send_email_to_client · formulaire → list_contact_requests.
- Ne devine jamais un numéro de commande (list_orders).
- Français, tutoiement, ton direct, messages courts avec tirets et quelques emojis (🥐📦✅⚠️). Pas de tableaux ni de titres #. Dates depuis le contexte fourni (heure de Paris).
${AFFICHER_PRIX ? '' : "- Le site n'affiche pas de prix."}

Boutique : ${s.boutique.adresse}, ${s.boutique.codePostal} ${s.boutique.ville} · ${s.boutique.telephone} · ${s.boutique.email}. Horaires : ${horairesAffichage(s.horaires).map((h) => `${h.jour} ${h.heures}`).join(' · ')}. Fournées : ${s.fournees.map((f) => `${f} h`).join(', ')}.`;
}

const PERIODES = ['aujourdhui', 'demain', 'apres_demain', 'semaine', 'semaine_passee', 'mois', 'mois_passe', 'en_attente', 'a_venir', 'passees', 'dates'];

export const CHEF_TOOLS = [{"name":"list_orders","description":"Liste les commandes. periode: aujourdhui|demain|apres_demain|semaine|semaine_passee|mois|mois_passe|en_attente|a_venir|passees|dates (du/au AAAA-MM-JJ). Par défaut confirmées+prêtes ; statut pour filtrer ; tous_statuts pour tout.","input_schema":{"type":"object","properties":{"periode":{"type":"string","enum":PERIODES},"du":{"type":"string"},"au":{"type":"string"},"statut":{"type":"string","enum":Object.keys(STATUS_LABEL)},"tous_statuts":{"type":"boolean"}},"required":["periode"],"additionalProperties":false}},{"name":"get_order","description":"Détail d'une commande (AD-XXXXXX).","input_schema":{"type":"object","properties":{"numero":{"type":"string"}},"required":["numero"],"additionalProperties":false}},{"name":"production_plan","description":"Production agrégée + retraits pour une date (AAAA-MM-JJ).","input_schema":{"type":"object","properties":{"date":{"type":"string"}},"required":["date"],"additionalProperties":false}},{"name":"update_order_status","description":"Statut: confirmee (validation manuelle, ex. par téléphone) | prete | retiree | annulee (annulation = email au client, confirmation requise ; motif = phrase pour le client).","input_schema":{"type":"object","properties":{"numero":{"type":"string"},"statut":{"type":"string","enum":["confirmee","prete","retiree","annulee"]},"motif":{"type":"string"}},"required":["numero","statut"],"additionalProperties":false}},{"name":"send_email_to_client","description":"Email à un client (numero de commande ou email). Après « oui » explicite.","input_schema":{"type":"object","properties":{"numero":{"type":"string"},"email":{"type":"string"},"sujet":{"type":"string"},"message":{"type":"string","description":"texte complet, signé par la boulangerie"}},"required":["sujet","message"],"additionalProperties":false}},{"name":"get_board","description":"Ardoise du jour (pains disponibles/épuisés, note).","input_schema":{"type":"object","properties":{"date":{"type":"string","description":"AAAA-MM-JJ, défaut aujourd'hui"}},"additionalProperties":false}},{"name":"set_board","description":"Met à jour l'ardoise : items [{nom, disponible}] (non cités = disponibles), note.","input_schema":{"type":"object","properties":{"date":{"type":"string"},"items":{"type":"array","items":{"type":"object","properties":{"nom":{"type":"string"},"disponible":{"type":"boolean"}},"required":["nom","disponible"],"additionalProperties":false}},"note":{"type":"string"}},"additionalProperties":false}},{"name":"manage_closure","description":"Fermeture exceptionnelle : ajouter | retirer | lister.","input_schema":{"type":"object","properties":{"action":{"type":"string","enum":["ajouter","retirer","lister"]},"date":{"type":"string","description":"AAAA-MM-JJ"},"motif":{"type":"string"}},"required":["action"],"additionalProperties":false}},{"name":"list_contact_requests","description":"Demandes du formulaire de contact (non traitées par défaut).","input_schema":{"type":"object","properties":{"toutes":{"type":"boolean"}},"additionalProperties":false}},{"name":"mark_contact_handled","description":"Marque une demande de contact traitée.","input_schema":{"type":"object","properties":{"id":{"type":"integer"}},"required":["id"],"additionalProperties":false}},{"name":"stats","description":"Statistiques sur N jours (commandes, produits, activité de Léa).","input_schema":{"type":"object","properties":{"jours":{"type":"integer"}},"additionalProperties":false}},{"name":"customer_insights","description":"Derniers messages clients à Léa (pour synthèse).","input_schema":{"type":"object","properties":{"jours":{"type":"integer"}},"additionalProperties":false}},{"name":"get_settings","description":"Configuration actuelle du site (résumé).","input_schema":{"type":"object","properties":{},"additionalProperties":false}},{"name":"set_info","description":"Nom, slogan, coordonnées, réseaux. Ne passer que les champs à changer.","input_schema":{"type":"object","properties":{"nom":{"type":"string"},"slogan":{"type":"string"},"adresse":{"type":"string"},"codePostal":{"type":"string"},"ville":{"type":"string"},"telephone":{"type":"string"},"email":{"type":"string"},"instagram":{"type":"string"},"facebook":{"type":"string"},"latitude":{"type":"number"},"longitude":{"type":"number"}},"additionalProperties":false}},{"name":"list_content","description":"Textes modifiables du site (clé, page, libellé, valeur actuelle). Filtrer par page (accueil|carte|histoire|contact|global) ou recherche (mot dans le libellé/valeur).","input_schema":{"type":"object","properties":{"page":{"type":"string"},"recherche":{"type":"string"}},"additionalProperties":false}},{"name":"set_content","description":"Modifie des textes du site : valeurs = {cle: nouvelle valeur} (clés de list_content). Valeur vide = retour au texte d'origine.","input_schema":{"type":"object","properties":{"valeurs":{"type":"object","additionalProperties":{"type":"string"}}},"required":["valeurs"],"additionalProperties":false}},{"name":"set_fonts","description":"Police du site : fraunces (défaut) | playfair | cormorant | dm-serif | lora.","input_schema":{"type":"object","properties":{"police":{"type":"string","enum":["fraunces","playfair","cormorant","dm-serif","lora"]}},"required":["police"],"additionalProperties":false}},{"name":"set_hours","description":"Horaires : plages [{jours:[lundi…dimanche|tous], ouverture:\"HH:MM\", fermeture:\"HH:MM\"} ou {jours, ferme:true}] ; fournees [7,11,16].","input_schema":{"type":"object","properties":{"plages":{"type":"array","items":{"type":"object","properties":{"jours":{"type":"array","items":{"type":"string"}},"ouverture":{"type":"string"},"fermeture":{"type":"string"},"ferme":{"type":"boolean"}},"required":["jours"],"additionalProperties":false}},"fournees":{"type":"array","items":{"type":"number"}}},"additionalProperties":false}},{"name":"list_palettes","description":"Palettes prêtes et rôle de chaque couleur.","input_schema":{"type":"object","properties":{},"additionalProperties":false}},{"name":"set_palette","description":"Couleurs du site : preset (nom de palette prête) ou couleurs {role:\"#rrggbb\"} (light,cream,sand,gold,honey,brown,crust,dark,ember,orange) ou reinitialiser.","input_schema":{"type":"object","properties":{"preset":{"type":"string"},"couleurs":{"type":"object","additionalProperties":{"type":"string"}},"reinitialiser":{"type":"boolean"}},"additionalProperties":false}},{"name":"manage_product","description":"Produits : lister | ajouter | modifier | supprimer (confirmation) | masquer | afficher. categorie: pains|viennoiseries|patisseries|gateaux|evenements. nom = produit visé ; pour modifier : nouveau_nom, description, icone, image, tags.","input_schema":{"type":"object","properties":{"action":{"type":"string","enum":["lister","ajouter","modifier","supprimer","masquer","afficher"]},"categorie":{"type":"string","enum":CATEGORIES},"nom":{"type":"string"},"nouveau_nom":{"type":"string"},"description":{"type":"string"},"icone":{"type":"string","enum":ICONS_DISPONIBLES},"image":{"type":"string","description":"URL de photo reçue"},"tags":{"type":"array","items":{"type":"string"}}},"required":["action"],"additionalProperties":false}},{"name":"list_image_slots","description":"Emplacements d'images du site et image actuelle.","input_schema":{"type":"object","properties":{},"additionalProperties":false}},{"name":"set_image","description":"Place une image (url reçue via [PHOTO : url]) dans un emplacement (slot), ou reinitialiser.","input_schema":{"type":"object","properties":{"slot":{"type":"string"},"url":{"type":"string"},"reinitialiser":{"type":"boolean"}},"required":["slot"],"additionalProperties":false}}];

// ---------------------------------------------------------------------------
// Utilitaires dates (heure de Paris)
// ---------------------------------------------------------------------------
function parisDayBounds(dayIso) {
  const [y, m, d] = dayIso.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, 0);
  const wall = parisNow(new Date(guess));
  const [wy, wm, wd] = wall.isoDate.split('-').map(Number);
  const offset = Date.UTC(wy, wm - 1, wd, wall.hour, wall.minute) - guess;
  const start = guess - offset;
  return { fromIso: new Date(start).toISOString(), toIso: new Date(start + 86_400_000).toISOString() };
}
const addDays = (dayIso, n) => { const [y, m, d] = dayIso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const monthStart = (dayIso) => dayIso.slice(0, 8) + '01';
const nextMonthStart = (dayIso) => { const [y, m] = dayIso.split('-').map(Number); return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10); };
const prevMonthStart = (dayIso) => { const [y, m] = dayIso.split('-').map(Number); return new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10); };
const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const toDecimal = (hhmm) => { const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || ''); return m ? Number(m[1]) + Number(m[2]) / 60 : null; };

function brief(o) {
  return {
    numero: o.numero,
    statut: STATUS_LABEL[o.status] || o.status,
    retrait: formatPickup(o.pickup_at),
    client: `${o.client?.nom} · ${o.client?.telephone}`,
    articles: (o.articles || []).map((a) => `${a.quantite} × ${a.produit}${a.notes ? ` (${a.notes})` : ''}`).join(', '),
    ...(o.evenement ? { evenement: o.evenement } : {}),
    ...(o.notes ? { remarques: o.notes } : {}),
  };
}

// ---------------------------------------------------------------------------
// Exécution des outils
// ---------------------------------------------------------------------------
export async function executeChefTool(name, input, ctx = {}) {
  const today = parisNow().isoDate;
  const s = store();
  const J = (o) => ({ result: JSON.stringify(o) });
  const settings = await getSettings();

  switch (name) {
    // ----- Commandes -----
    case 'list_orders': {
      const p = input?.periode;
      const active = ['confirmee', 'prete'];
      const statuses = input?.tous_statuts ? undefined : input?.statut ? [input.statut] : active;
      let f = { statuses };
      const range = (a, b) => ({ fromIso: parisDayBounds(a).fromIso, toIso: parisDayBounds(b).fromIso });
      if (p === 'aujourdhui') f = { ...parisDayBounds(today), statuses };
      else if (p === 'demain') f = { ...parisDayBounds(addDays(today, 1)), statuses };
      else if (p === 'apres_demain') f = { ...parisDayBounds(addDays(today, 2)), statuses };
      else if (p === 'semaine') f = { ...range(today, addDays(today, 7)), statuses };
      else if (p === 'semaine_passee') f = { ...range(addDays(today, -7), today), statuses: input?.tous_statuts || input?.statut ? statuses : undefined };
      else if (p === 'mois') f = { ...range(monthStart(today), nextMonthStart(today)), statuses: input?.tous_statuts || input?.statut ? statuses : undefined };
      else if (p === 'mois_passe') f = { ...range(prevMonthStart(today), monthStart(today)), statuses: input?.tous_statuts || input?.statut ? statuses : undefined };
      else if (p === 'en_attente') f = { fromIso: new Date().toISOString(), statuses: ['en_attente'] };
      else if (p === 'a_venir') f = { fromIso: new Date().toISOString(), statuses: input?.statut ? [input.statut] : ['en_attente', ...active] };
      else if (p === 'passees') f = { fromIso: parisDayBounds(addDays(today, -7)).fromIso, toIso: new Date().toISOString(), statuses: input?.statut ? [input.statut] : undefined };
      else if (p === 'dates') {
        if (!isDay(input?.du) || !isDay(input?.au)) return J({ erreur: 'Pour periode=dates, fournis du et au au format AAAA-MM-JJ.' });
        f = { ...range(input.du, addDays(input.au, 1)), statuses: input?.tous_statuts || input?.statut ? statuses : undefined };
      }
      const list = await s.listOrders({ ...f, limit: 500 });
      const parStatut = {};
      for (const o of list) parStatut[STATUS_LABEL[o.status]] = (parStatut[STATUS_LABEL[o.status]] || 0) + 1;
      return J({ periode: p, nombre: list.length, par_statut: parStatut, commandes: list.slice(0, 30).map(brief), ...(list.length > 30 ? { note: `${list.length - 30} commandes supplémentaires non listées` } : {}) });
    }

    case 'get_order': {
      const o = await s.getOrderByNumero(String(input?.numero || '').toUpperCase().trim());
      return J(o ? { ...publicOrder(o), statut: STATUS_LABEL[o.status], telephone: o.client.telephone, notes: o.notes, cree_le: o.created_at } : { erreur: 'Commande introuvable.' });
    }

    case 'production_plan': {
      const day = input?.date || today;
      const list = await s.listOrders({ ...parisDayBounds(day), statuses: ['confirmee', 'prete'] });
      const agg = new Map();
      for (const o of list) for (const a of o.articles || []) {
        const cur = agg.get(a.produit) || { produit: a.produit, quantite: 0, notes: [] };
        cur.quantite += a.quantite;
        if (a.notes) cur.notes.push(`${o.numero} : ${a.notes}`);
        agg.set(a.produit, cur);
      }
      return J({ date: day, commandes: list.length, production: [...agg.values()].sort((a, b) => b.quantite - a.quantite), retraits: list.map((o) => ({ heure: formatPickup(o.pickup_at).split(' à ')[1], numero: o.numero, client: o.client?.nom, statut: STATUS_LABEL[o.status] })) });
    }

    case 'update_order_status': {
      const o = await s.getOrderByNumero(String(input?.numero || '').toUpperCase().trim());
      if (!o) return J({ ok: false, erreur: 'Commande introuvable.' });
      if (input.statut === 'annulee') {
        if (o.status === 'annulee') return J({ ok: false, erreur: 'Déjà annulée.' });
        const u = await s.updateOrder(o.id, { status: ORDER_STATUS.CANCELLED, cancelled_at: new Date().toISOString() });
        try { await sendCancelled(u, { motif: input.motif }); } catch (e) { return J({ ok: true, statut: 'annulée', avertissement: `Email non envoyé : ${e.message}` }); }
        return J({ ok: true, statut: 'annulée', email_client: 'envoyé' });
      }
      if (input.statut === 'confirmee') {
        if (!['en_attente', 'expiree'].includes(o.status)) return J({ ok: false, erreur: `Déjà ${STATUS_LABEL[o.status]}.` });
        await s.updateOrder(o.id, { status: 'confirmee', confirmed_at: new Date().toISOString() });
        return J({ ok: true, numero: o.numero, statut: 'confirmée (manuellement)' });
      }
      if (!['confirmee', 'prete', 'retiree'].includes(o.status)) return J({ ok: false, erreur: `Impossible : la commande est ${STATUS_LABEL[o.status]}.` });
      await s.updateOrder(o.id, input.statut === 'prete' ? { status: 'prete', ready_at: new Date().toISOString() } : { status: 'retiree', picked_up_at: new Date().toISOString() });
      return J({ ok: true, numero: o.numero, statut: STATUS_LABEL[input.statut] });
    }

    case 'send_email_to_client': {
      let email = String(input?.email || '').trim().toLowerCase();
      let nom = '';
      if (input?.numero) {
        const o = await s.getOrderByNumero(String(input.numero).toUpperCase().trim());
        if (!o) return J({ ok: false, erreur: 'Commande introuvable.' });
        email = o.client.email; nom = o.client.nom;
      }
      if (!email) return J({ ok: false, erreur: 'Aucun destinataire.' });
      try { await sendCustomEmail({ to: email, nom, sujet: input.sujet, message: input.message }); return J({ ok: true, envoye_a: email }); }
      catch (e) { return J({ ok: false, erreur: e.message }); }
    }

    // ----- Ardoise / fermetures -----
    case 'get_board': {
      const day = input?.date || today;
      const b = await s.getBoard(day);
      return J(b || { date: day, items: settings.produits.pains.filter((p) => p.disponible !== false).map((p) => ({ nom: p.name, disponible: true })), note: null, info: 'Ardoise par défaut (tous les pains disponibles).' });
    }
    case 'set_board': {
      const day = input?.date || today;
      const painsList = settings.produits.pains.filter((p) => p.disponible !== false);
      const known = new Map(painsList.map((p) => [p.name.toLowerCase(), p.name]));
      const items = []; const seen = new Set();
      for (const it of input?.items || []) {
        const nom = known.get(String(it.nom).toLowerCase()) || String(it.nom).trim();
        if (!nom || seen.has(nom)) continue;
        seen.add(nom); items.push({ nom, disponible: !!it.disponible });
      }
      for (const p of painsList) if (!seen.has(p.name)) items.push({ nom: p.name, disponible: true });
      return J({ ok: true, ardoise: await s.setBoard(day, items, input?.note || null) });
    }
    case 'manage_closure': {
      if (input.action === 'lister') return J({ fermetures: await s.listClosures(today) });
      if (!isDay(input?.date)) return J({ ok: false, erreur: 'Date attendue au format AAAA-MM-JJ.' });
      if (input.action === 'ajouter') { await s.addClosure(input.date, input.motif); return J({ ok: true, fermeture: input.date, motif: input.motif || null }); }
      await s.removeClosure(input.date); return J({ ok: true, reouverture: input.date });
    }

    // ----- Contact / stats -----
    case 'list_contact_requests':
      return J({ demandes: (await s.listContacts({ onlyOpen: !input?.toutes })).map((c) => ({ id: c.id, recu_le: c.created_at, objet: c.subject, nom: c.nom, email: c.email, telephone: c.telephone, message: c.message, evenement: c.evenement, traitee: !!c.handled_at })) });
    case 'mark_contact_handled':
      await s.markContactHandled(Number(input.id)); return J({ ok: true });
    case 'stats': {
      const jours = Number(input?.jours) || 7;
      const list = await s.listOrders({ fromIso: parisDayBounds(addDays(today, -jours)).fromIso, limit: 1000 });
      const parStatut = {}; const produits = new Map();
      for (const o of list) {
        parStatut[STATUS_LABEL[o.status]] = (parStatut[STATUS_LABEL[o.status]] || 0) + 1;
        if (['confirmee', 'prete', 'retiree'].includes(o.status)) for (const a of o.articles || []) produits.set(a.produit, (produits.get(a.produit) || 0) + a.quantite);
      }
      const usage = await s.usageSince(addDays(today, -jours));
      const tokens = usage.reduce((n, u) => n + Number(u.input_tokens) + Number(u.cache_read_tokens) + Number(u.cache_write_tokens) + Number(u.output_tokens), 0);
      return J({ periode_jours: jours, commandes_total: list.length, par_statut: parStatut, produits_les_plus_commandes: [...produits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([p, q]) => ({ produit: p, quantite: q })), lea: { requetes: usage.reduce((n, u) => n + Number(u.requests), 0), tokens, modele: env.model } });
    }
    case 'customer_insights': {
      const jours = Number(input?.jours) || 2;
      const rows = await s.recentCustomerMessages(new Date(Date.now() - jours * 86_400_000).toISOString());
      const clients = rows.filter((r) => r.role === 'user').map((r) => r.display_text).slice(-120);
      return J({ jours, nombre_messages_clients: clients.length, messages: clients, catalogue: buildCatalogue(settings).map((p) => p.nom) });
    }

    // ----- Site -----
    case 'get_settings':
      return J({
        nom: settings.nom, slogan: settings.slogan, textes: settings.textes, boutique: settings.boutique,
        horaires: horairesAffichage(settings.horaires), fournees: settings.fournees, palette: settings.palette,
        images: Object.fromEntries(Object.entries(IMAGE_SLOTS).map(([k, v]) => [k, { emplacement: v.label, personnalisee: settings.images[k] !== v.defaut }])),
        produits: Object.fromEntries(CATEGORIES.map((c) => [c, (settings.produits[c] || []).map((p) => `${p.name}${p.disponible === false ? ' (masqué)' : ''}${p.image ? ' 🖼' : ''}`)])),
        police: settings.police,
        textes_modifies: Object.keys(settings.textes || {}).length,
        version: settings.version,
      });

    case 'list_content': {
      const page = input?.page && CONTENT_PAGES.includes(input.page) ? input.page : null;
      const q = String(input?.recherche || '').toLowerCase().trim();
      const rows = Object.entries(CONTENT)
        .filter(([, v]) => !page || v.page === page)
        .map(([key, v]) => ({ cle: key, page: v.page, libelle: v.label, valeur: settings.textes?.[key] || v.defaut, modifie: !!settings.textes?.[key] }))
        .filter((r) => !q || r.libelle.toLowerCase().includes(q) || String(r.valeur).toLowerCase().includes(q) || r.cle.includes(q));
      return J({ nombre: rows.length, textes: rows.slice(0, 60), ...(rows.length > 60 ? { note: 'Affine avec page ou recherche pour voir le reste.' } : {}) });
    }

    case 'set_content': {
      const valeurs = input?.valeurs || {};
      const textes = {}; const inconnues = [];
      for (const [k, v] of Object.entries(valeurs)) {
        if (!CONTENT[k]) { inconnues.push(k); continue; }
        textes[k] = v === null || v === undefined ? '' : String(v).trim().slice(0, 600);
      }
      if (!Object.keys(textes).length) return J({ ok: false, erreur: `Aucune clé valide${inconnues.length ? ` (inconnues : ${inconnues.join(', ')})` : ''}. Utilise list_content pour trouver les clés.` });
      const next = await updateSettings({ textes });
      return J({ ok: true, modifie: Object.keys(textes).map((k) => ({ cle: k, libelle: CONTENT[k].label, valeur: next.textes[k] || CONTENT[k].defaut })), ...(inconnues.length ? { ignorees: inconnues } : {}) });
    }

    case 'set_fonts': {
      if (!FONT_PRESETS.includes(input?.police)) return J({ ok: false, erreur: `Police inconnue. Choix : ${FONT_PRESETS.join(', ')}.` });
      await updateSettings({ police: input.police });
      return J({ ok: true, police: input.police });
    }

    case 'set_info': {
      const patch = {};
      if (input.nom) patch.nom = String(input.nom).trim().slice(0, 60);
      if (input.slogan) patch.slogan = String(input.slogan).trim().slice(0, 120);
      const b = {};
      for (const k of ['adresse', 'codePostal', 'ville', 'telephone', 'email', 'instagram', 'facebook']) if (input[k] !== undefined) b[k] = String(input[k]).trim().slice(0, 200);
      if (Number.isFinite(input.latitude) && Number.isFinite(input.longitude)) b.coords = [Number(input.latitude), Number(input.longitude)];
      if (Object.keys(b).length) patch.boutique = b;
      if (!Object.keys(patch).length) return J({ ok: false, erreur: 'Aucun champ fourni. Champs : nom, slogan, adresse, codePostal, ville, telephone, email, instagram, facebook.' });
      const next = await updateSettings(patch);
      return J({ ok: true, modifie: Object.keys(patch), nom: next.nom, slogan: next.slogan, boutique: next.boutique });
    }

    case 'set_texts': {
      const TEXT_KEYS = ['hero_kicker', 'hero_titre', 'hero_titre_accent', 'hero_sous_titre', 'intro_titre', 'intro_texte', 'footer_accroche', 'footer_accroche_accent', 'footer_description'];
      const textes = {}; const patch = {};
      for (const [k, v] of Object.entries(input || {})) {
        if (typeof v !== 'string' || !v.trim()) continue;
        if (TEXT_KEYS.includes(k)) textes[k] = v.trim().slice(0, 400);
        else if (k === 'slogan') patch.slogan = v.trim().slice(0, 120);
        else if (k === 'nom') patch.nom = v.trim().slice(0, 60);
      }
      if (Object.keys(textes).length) patch.textes = textes;
      if (!Object.keys(patch).length) return J({ ok: false, erreur: `Aucun texte fourni. Passe un ou plusieurs champs parmi : ${TEXT_KEYS.join(', ')} (ou slogan / nom) avec leur nouvelle valeur.` });
      const next = await updateSettings(patch);
      return J({ ok: true, modifie: Object.keys(patch), nom: next.nom, slogan: next.slogan, textes: next.textes });
    }

    case 'set_hours': {
      const patch = {};
      if (Array.isArray(input.fournees) && input.fournees.length) {
        const fl = input.fournees.map(Number).filter((n) => n >= 0 && n < 24).sort((x, y) => x - y);
        if (fl.length) patch.fournees = fl;
      }
      // Compatibilité : jours/ouverture/fermeture/ferme au premier niveau = une plage.
      const plages = Array.isArray(input.plages) && input.plages.length ? input.plages : input.jours ? [input] : [];
      if (plages.length) {
        const horaires = { ...settings.horaires };
        for (const pl of plages) {
          const list = (pl.jours || []).map((j) => String(j).toLowerCase().trim());
          const days = list.includes('tous') ? [0, 1, 2, 3, 4, 5, 6] : list.map((j) => JOURS.indexOf(j)).filter((i) => i >= 0);
          if (!days.length) return J({ ok: false, erreur: `Jours non reconnus : ${list.join(', ')} (lundi … dimanche, ou tous).` });
          if (pl.ferme) { for (const dd of days) horaires[dd] = null; continue; }
          const o = toDecimal(pl.ouverture), cl = toDecimal(pl.fermeture);
          if (o === null || cl === null || cl <= o) return J({ ok: false, erreur: 'Heures attendues au format HH:MM, fermeture après ouverture.' });
          for (const dd of days) horaires[dd] = [o, cl];
        }
        patch.horaires = horaires;
      }
      if (!Object.keys(patch).length) return J({ ok: false, erreur: 'Rien à changer : fournis plages et/ou fournees.' });
      const next = await updateSettings(patch);
      return J({ ok: true, horaires: horairesAffichage(next.horaires), fournees: next.fournees });
    }

    case 'list_palettes':
      return J({
        roles: { light: 'fond général (crème)', cream: 'fond des cartes', sand: 'bordures et fonds doux', gold: 'or profond (titres/prix)', honey: 'or clair sur fond sombre (boutons du hero, accents)', brown: 'texte secondaire, croûte', crust: 'accent brun', dark: 'fond sombre (header du chat, sections sombres)', ember: 'surfaces sombres', orange: 'couleur d\'action (boutons, liens)' },
        palettes: Object.fromEntries(Object.entries(PALETTE_PRESETS).map(([k, v]) => [k, { orange: v.orange, honey: v.honey, dark: v.dark, light: v.light }])),
        actuelle: settings.palette,
      });

    case 'set_palette': {
      let palette;
      if (input.reinitialiser) palette = PALETTE_DEFAULT;
      else if (input.preset) {
        const key = Object.keys(PALETTE_PRESETS).find((k) => k.toLowerCase() === String(input.preset).toLowerCase().trim());
        if (!key) return J({ ok: false, erreur: `Palette inconnue. Disponibles : ${Object.keys(PALETTE_PRESETS).join(', ')}.` });
        palette = PALETTE_PRESETS[key];
      } else if (input.couleurs) {
        palette = { ...settings.palette };
        const bad = [];
        for (const [k, v] of Object.entries(input.couleurs)) { if (!(k in PALETTE_DEFAULT)) bad.push(k); else if (!isHex(v)) bad.push(`${k}=${v}`); else palette[k] = v.toLowerCase(); }
        if (bad.length) return J({ ok: false, erreur: `Valeurs invalides : ${bad.join(', ')} (rôles : ${Object.keys(PALETTE_DEFAULT).join(', ')} ; format #rrggbb).` });
      } else return J({ ok: false, erreur: 'Indique preset, couleurs ou reinitialiser.' });
      const next = await updateSettings({ palette });
      return J({ ok: true, palette: next.palette });
    }

    case 'manage_product': {
      const cat = input.categorie;
      if (input.action === 'lister') {
        const cats = cat ? [cat] : CATEGORIES;
        return J(Object.fromEntries(cats.map((c) => [c, (settings.produits[c] || []).map((p) => ({ nom: p.name, description: p.desc, icone: p.icon, masque: p.disponible === false, image: p.image || null, tags: p.tags }))])));
      }
      if (!CATEGORIES.includes(cat)) return J({ ok: false, erreur: `Catégorie requise : ${CATEGORIES.join(', ')}.` });
      const list = (settings.produits[cat] || []).map((p) => ({ ...p }));
      const idx = list.findIndex((p) => p.name.toLowerCase() === String(input.nom || '').toLowerCase().trim());
      if (input.action === 'ajouter') {
        if (!input.nom || !input.description) return J({ ok: false, erreur: 'nom et description requis.' });
        if (idx >= 0) return J({ ok: false, erreur: 'Ce produit existe déjà dans cette catégorie (utilise modifier).' });
        let image;
        if (input.image) { try { image = (await resolveImageUrl(input.image)).url; } catch (e) { return J({ ok: false, erreur: `Image : ${e.message}` }); } }
        list.push({ name: String(input.nom).trim().slice(0, 60), desc: String(input.description).trim().slice(0, 200), icon: input.icone || (cat === 'pains' ? 'campagne' : cat === 'viennoiseries' ? 'croissant' : cat === 'evenements' ? 'anniversaire' : 'cakeslice'), ...(image ? { image } : {}), ...(input.tags ? { tags: input.tags } : {}), disponible: true });
      } else {
        if (idx < 0) return J({ ok: false, erreur: `Produit « ${input.nom} » introuvable dans ${cat}. Produits : ${list.map((p) => p.name).join(', ')}.` });
        if (input.action === 'supprimer') list.splice(idx, 1);
        else if (input.action === 'masquer') list[idx].disponible = false;
        else if (input.action === 'afficher') list[idx].disponible = true;
        else {
          if (input.nouveau_nom) list[idx].name = String(input.nouveau_nom).trim().slice(0, 60);
          if (input.description) list[idx].desc = String(input.description).trim().slice(0, 200);
          if (input.icone) list[idx].icon = input.icone;
          if (input.image) {
            try { list[idx].image = (await resolveImageUrl(input.image)).url; }
            catch (e) { return J({ ok: false, erreur: `Image : ${e.message}` }); }
          }
          if (input.tags) list[idx].tags = input.tags;
        }
      }
      const next = await updateSettings({ produits: { [cat]: list } });
      return J({ ok: true, categorie: cat, produits: next.produits[cat].map((p) => `${p.name}${p.disponible === false ? ' (masqué)' : ''}`) });
    }

    case 'list_image_slots':
      return J({ emplacements: Object.entries(IMAGE_SLOTS).map(([slot, v]) => ({ slot, emplacement: v.label, page: v.page, image_actuelle: settings.images[slot], personnalisee: settings.images[slot] !== v.defaut })) });

    case 'set_image': {
      const slot = String(input.slot || '').trim();
      if (!IMAGE_SLOTS[slot]) return J({ ok: false, erreur: `Emplacement inconnu. Disponibles : ${Object.keys(IMAGE_SLOTS).join(', ')}.` });
      let url = input.reinitialiser ? IMAGE_SLOTS[slot].defaut : String(input.url || '').trim();
      if (!/^https?:\/\//.test(url)) return J({ ok: false, erreur: "URL invalide. Demande au propriétaire d'envoyer la photo directement dans Telegram." });
      let source = 'photo';
      if (!input.reinitialiser && !url.includes('/storage/v1/object/public/site/')) {
        // URL externe : on vérifie que c'est une image (ou on prend l'image principale
        // d'une page web) et on la ré-héberge chez nous.
        try { ({ url, source } = await resolveImageUrl(url)); }
        catch (e) { return J({ ok: false, erreur: `${e.message} Propose au propriétaire d'envoyer la photo directement dans Telegram (elle sera placée automatiquement).` }); }
      }
      await updateSettings({ images: { [slot]: url } });
      return J({ ok: true, slot, emplacement: IMAGE_SLOTS[slot].label, url, ...(source === 'page' ? { note: "L'adresse était une page web : j'ai pris sa photo principale." } : {}) });
    }

    default:
      return J({ erreur: `Outil inconnu : ${name}` });
  }
}

// ---------------------------------------------------------------------------
// Un tour de conversation avec le Chef (historique en base par chat_id)
// ---------------------------------------------------------------------------
const MAX_ROUNDS = 6;

// Certains modèles (gpt-oss sur Groq) partent parfois en boucle de « … / Oops… » :
// on retire ces lignes vides de sens et on garde le contenu utile.
export function tidy(text) {
  const lines = String(text || '').split('\n');
  const junk = /^\s*(?:[.…·\-—_*]+|(?:oops|okay|ok|sorry|the|we|probably|hmm)[\s.…!?]*|sorry[^\n]{0,40}(?:corrompu|mélangé)[^\n]*)\s*$/i;
  const kept = lines.filter((l) => !junk.test(l));
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function chefContext(now = new Date()) {
  const p = parisNow(now);
  return `[Contexte : nous sommes le ${p.label} (Paris), date ISO ${p.isoDate}.]`;
}

// Sous-ensemble d'outils selon le sujet du message (moins de tokens par requête).
const TOOL_GROUPS = {
  commandes: ['list_orders', 'get_order', 'production_plan', 'update_order_status', 'send_email_to_client', 'stats'],
  ardoise: ['get_board', 'set_board', 'manage_closure', 'manage_product'],
  site: ['get_settings', 'set_info', 'list_content', 'set_content', 'set_fonts', 'set_hours', 'list_palettes', 'set_palette', 'manage_product', 'list_image_slots', 'set_image'],
  clients: ['list_contact_requests', 'mark_contact_handled', 'send_email_to_client', 'customer_insights', 'stats', 'get_order', 'list_orders'],
};
const TOPIC_WORDS = {
  commandes: /command|prépar|prepar|retrait|retir|prêt|pret|annul|product|livr|client|numéro|numero|ad-[a-z0-9]{4}|semaine|mois|demain|aujourd|stat|chiffre|combien/i,
  ardoise: /ardoise|épuis|epuis|plus de |rupture|dispo|ferm|férié|ferie|congé|conge|note|pain|fougasse/i,
  site: /site|texte|titre|slogan|nom |nom$|adresse|téléphone|telephone|mail|instagram|facebook|horaire|ouvert|fournée|fournee|couleur|palette|police|typo|produit|ajoute|supprime|masque|modifie|change|photo|image|\[photo|accueil|page|bouton|avis|faq|histoire|carte|gps|latitude|coordonn|frise|paragraphe/i,
  clients: /contact|demande|devis|répond|repond|email|mail|client|léa|lea|synth|résum|resum|stat/i,
};
export function selectTools(text, history = '') {
  const probe = `${text} ${history}`;
  const names = new Set();
  for (const [topic, re] of Object.entries(TOPIC_WORDS)) if (re.test(probe)) TOOL_GROUPS[topic].forEach((n) => names.add(n));
  if (!names.size) return CHEF_TOOLS;
  return CHEF_TOOLS.filter((t) => names.has(t.name));
}

// Allège l'historique : résultats d'outils des anciens tours remplacés par un
// résumé court (ils sont volumineux et inutiles pour la suite).
function trimHistory(messages, keepTurns = 2) {
  const userTextIdx = messages.map((m, i) => (m.role === 'user' && !(Array.isArray(m.content) && m.content.some((b) => b.type === 'tool_result')) ? i : -1)).filter((i) => i >= 0);
  const cutoff = userTextIdx.length > keepTurns ? userTextIdx[userTextIdx.length - keepTurns] : 0;
  return messages.map((m, i) => {
    if (i >= cutoff || m.role !== 'user' || !Array.isArray(m.content)) return m;
    return { ...m, content: m.content.map((b) => (b.type === 'tool_result' ? { ...b, content: '(résultat omis — ancien tour)' } : b)) };
  });
}

export async function chefTurn(chatId, text, onText = () => {}) {
  const s = store();
  await s.saveChefMessage(chatId, { role: 'user', kind: 'text', content: text, displayText: text });
  const rows = (await s.loadChefMessages(chatId, 40));

  const firstUser = rows.findIndex((r) => r.role === 'user' && r.kind === 'text');
  const messages = rows.slice(firstUser).map((r) => ({ role: r.role, content: r.content }));
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'assistant' && Array.isArray(m.content) && m.content.some((b) => b.type === 'tool_use')) {
      const next = messages[i + 1];
      const answered = next && next.role === 'user' && Array.isArray(next.content) && next.content.some((b) => b.type === 'tool_result');
      if (!answered) messages.splice(i, 1);
    }
  }
  const last = messages[messages.length - 1];
  last.content = [{ type: 'text', text: last.content }, { type: 'text', text: chefContext() }];
  const history = trimHistory(messages.slice(0, -1));
  history.push(last);
  messages.length = 0; messages.push(...history);

  // Le tour précédent compte pour le choix des outils (« oui » après une proposition).
  const prevUser = rows.filter((r) => r.role === 'user' && r.kind === 'text').slice(-3, -1).map((r) => r.display_text).join(' ');
  const tools = selectTools(text, prevUser);

  const system = await buildChefSystem();
  let fullText = '';
  for (let round = 0; round <= MAX_ROUNDS; round++) {
    const message = await runTurn({ system, tools, messages, maxTokens: 1500, model: env.chefModel || undefined, onText: (d) => { fullText += d; onText(d); } });
    const toolUses = message.content.filter((b) => b.type === 'tool_use');
    const textOnly = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    if (message.stop_reason !== 'tool_use' || !toolUses.length || round === MAX_ROUNDS) {
      const display = tidy(fullText || textOnly) || '(pas de réponse)';
      await s.saveChefMessage(chatId, { role: 'assistant', kind: 'text', content: message.content.length ? message.content : [{ type: 'text', text: display }], displayText: display });
      return display;
    }
    await s.saveChefMessage(chatId, { role: 'assistant', kind: 'tool', content: message.content, displayText: null });
    messages.push({ role: 'assistant', content: message.content });
    const results = [];
    for (const tu of toolUses) {
      const { result } = await executeChefTool(tu.name, tu.input, { chatId });
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: result });
    }
    await s.saveChefMessage(chatId, { role: 'user', kind: 'tool', content: results, displayText: null });
    messages.push({ role: 'user', content: results });
  }
  return tidy(fullText);
}

/** Programme du jour (texte prêt à envoyer), utilisé par le cron et la commande /jour. */
export async function programmeDuJour(dayIso = parisNow().isoDate) {
  const settings = await getSettings();
  const { result } = await executeChefTool('production_plan', { date: dayIso });
  const plan = JSON.parse(result);
  const closed = (await store().listClosures(dayIso)).find((c) => c.day === dayIso);
  const lines = [`🥐 Programme du ${new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${dayIso}T12:00:00Z`))} — ${settings.nom}`];
  if (closed) lines.push(`⚠️ Fermeture exceptionnelle${closed.motif ? ` (${closed.motif})` : ''}`);
  if (!plan.commandes) lines.push('Aucune commande confirmée pour ce jour.');
  else {
    lines.push(`📦 ${plan.commandes} commande${plan.commandes > 1 ? 's' : ''} à préparer :`);
    for (const p of plan.production) lines.push(`• ${p.quantite} × ${p.produit}${p.notes.length ? ` — ${p.notes.join(' ; ')}` : ''}`);
    lines.push('', '🕒 Retraits :');
    for (const r of plan.retraits) lines.push(`• ${r.heure} — ${r.numero} — ${r.client} (${r.statut})`);
  }
  const pending = await store().listOrders({ fromIso: new Date().toISOString(), statuses: ['en_attente'] });
  if (pending.length) lines.push('', `⏳ ${pending.length} commande${pending.length > 1 ? 's' : ''} en attente de validation par email.`);
  const contacts = await store().listContacts({ onlyOpen: true, limit: 10 });
  if (contacts.length) lines.push(`✉️ ${contacts.length} demande${contacts.length > 1 ? 's' : ''} de contact à traiter.`);
  return lines.join('\n');
}
