// Canal Telegram du Chef. Un seul point d'entrée : handleUpdate(update),
// utilisé par le webhook (/api/telegram, production Vercel) et par le script
// de polling local (scripts/telegram-dev.mjs).
//
// Deux vitesses :
//  - commandes, boutons et actions inline → réponses immédiates SANS modèle ;
//  - texte libre / photos → le Chef (IA), avec accusé de réception si c'est long.

import { env } from './env.js';
import { store } from './store.js';
import { chefTurn, programmeDuJour, executeChefTool } from './chef.js';
import { uploadImage, getSettings, IMAGE_SLOTS } from './settings.js';
import { parisNow, horairesAffichage } from '../../src/data/infos.js';

const API = () => `https://api.telegram.org/bot${env.telegramToken}`;

export async function tg(method, payload) {
  const r = await fetch(`${API()}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await r.json().catch(() => ({}));
  if (!data.ok && method !== 'deleteMessage') console.error('telegram', method, data.description);
  return data;
}

// Clavier de raccourcis affiché sous la zone de saisie.
export const KEYBOARD = {
  keyboard: [
    [{ text: '📦 Commandes du jour' }, { text: '🥖 Programme de demain' }],
    [{ text: '⏳ En attente' }, { text: '🗓 Cette semaine' }],
    [{ text: '🪧 Ardoise' }, { text: '📊 Stats' }],
    [{ text: '✉️ Contacts' }, { text: '🖼 Images' }],
    [{ text: '⚙️ Site' }, { text: '❓ Aide' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: 'Parlez au Chef…',
};

export const BOT_COMMANDS = [
  { command: 'start', description: 'Démarrer et se connecter' },
  { command: 'aide', description: 'Tout ce que le Chef sait faire' },
  { command: 'jour', description: "Programme d'aujourd'hui" },
  { command: 'demain', description: 'Programme de demain' },
  { command: 'commandes', description: 'Commandes à venir' },
  { command: 'semaine', description: 'Commandes des 7 prochains jours' },
  { command: 'attente', description: 'Commandes non validées' },
  { command: 'ardoise', description: 'Ardoise du jour' },
  { command: 'stats', description: 'Statistiques de la semaine' },
  { command: 'contacts', description: 'Demandes de contact' },
  { command: 'images', description: 'Emplacements des images' },
  { command: 'site', description: 'Réglages du site' },
  { command: 'reset', description: 'Nouvelle conversation' },
];

export const AIDE = `👨‍🍳 Le Chef — votre assistant de gestion

Les boutons et commandes répondent instantanément. Pour tout le reste, parlez-moi normalement.

📦 Commandes
• « Qu'est-ce que je prépare demain ? »
• « Les commandes du mois » / « entre le 1er et le 15 octobre »
• « Marque AD-7K3P9Q comme prête » (ou les boutons sous chaque commande)
• « Annule la commande de Marie et préviens-la » (je demande confirmation)

🪧 Ardoise & fermetures
• « Plus de pain aux noix aujourd'hui »
• « Ajoute une note : fougasse aux olives en plus »
• « On est fermés le 25 décembre »

🌐 Le site — tout est modifiable
• Nom, slogan, adresse, téléphone, email, Instagram, position GPS
• N'importe quel texte : « change le titre de l'accueil en … », « remplace l'avis n°2 par … », « la FAQ 3 dit … »
• Horaires : « ouvert du lundi au samedi 6h30–19h, fermé le dimanche »
• Couleurs : « palette terracotta », « des couleurs plus chaudes »
• Police : « mets la police Playfair »
• Produits : « ajoute une pâtisserie : Flan vanille, … », « masque le kouign-amann »
• Photos : envoyez une photo 📷 avec ou sans légende, je la place où vous voulez

✉️ Clients
• « Réponds à la demande de M. Dupont : … » (je rédige, vous validez)
• « Qu'est-ce que les clients demandent à Léa ? »

Commandes : /jour /demain /commandes /semaine /attente /ardoise /stats /contacts /images /site /reset`;

// ---------------------------------------------------------------------------
// Mise en forme
// ---------------------------------------------------------------------------
export function toTelegramHtml(text) {
  let t = String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  t = t.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>');
  t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  t = t.replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1<i>$2</i>');
  t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  t = t.replace(/^\s*[-•]\s+/gm, '• ');
  return t;
}

export async function send(chatId, text, extra = {}) {
  const chunks = [];
  let rest = toTelegramHtml(text || '…');
  while (rest.length > 3900) {
    let cut = rest.lastIndexOf('\n', 3900);
    if (cut < 2000) cut = 3900;
    chunks.push(rest.slice(0, cut)); rest = rest.slice(cut);
  }
  chunks.push(rest);
  let last = null;
  for (const [i, c] of chunks.entries()) {
    const isLast = i === chunks.length - 1;
    const payload = { chat_id: chatId, text: c, parse_mode: 'HTML', reply_markup: isLast ? (extra.reply_markup || KEYBOARD) : undefined };
    let r = await tg('sendMessage', payload);
    if (!r.ok) r = await tg('sendMessage', { ...payload, parse_mode: undefined, text: c.replace(/<[^>]+>/g, '') });
    last = r;
  }
  return last;
}

const STATUT_EMOJI = { 'en attente de validation': '⏳', confirmée: '✅', prête: '🥐', retirée: '📦', annulée: '✖️', expirée: '⌛' };

// Liste de commandes + boutons inline (Prête / Retirée) sans passer par le modèle.
async function sendOrders(chatId, title, periode, opts = {}) {
  const { result } = await executeChefTool('list_orders', { periode, ...opts });
  const data = JSON.parse(result);
  if (!data.nombre) return send(chatId, `${title}\n\nAucune commande.`);
  const lines = [`${title} — ${data.nombre} commande${data.nombre > 1 ? 's' : ''}`];
  const buttons = [];
  for (const o of data.commandes) {
    lines.push('', `${STATUT_EMOJI[o.statut] || '•'} <b>${o.numero}</b> · ${o.statut}\n🕒 ${o.retrait}\n👤 ${o.client}\n🧺 ${o.articles}${o.remarques ? `\n📝 ${o.remarques}` : ''}`);
    if (o.statut === 'confirmée') buttons.push([{ text: `🥐 Prête ${o.numero}`, callback_data: `st:prete:${o.numero}` }, { text: `📦 Retirée ${o.numero}`, callback_data: `st:retiree:${o.numero}` }]);
    else if (o.statut === 'prête') buttons.push([{ text: `📦 Retirée ${o.numero}`, callback_data: `st:retiree:${o.numero}` }]);
    else if (o.statut === 'en attente de validation') buttons.push([{ text: `✅ Confirmer ${o.numero} (téléphone)`, callback_data: `st:confirmee:${o.numero}` }]);
  }
  if (data.note) lines.push('', data.note);
  const html = lines.join('\n');
  // envoi direct (déjà en HTML) : on contourne la conversion markdown
  const r = await tg('sendMessage', { chat_id: chatId, text: html, parse_mode: 'HTML', reply_markup: buttons.length ? { inline_keyboard: buttons.slice(0, 30) } : KEYBOARD });
  if (!r.ok) await send(chatId, html.replace(/<[^>]+>/g, ''));
}

async function sendBoard(chatId) {
  const b = JSON.parse((await executeChefTool('get_board', {})).result);
  const dispo = (b.items || []).filter((i) => i.disponible !== false).map((i) => i.nom);
  const epuise = (b.items || []).filter((i) => i.disponible === false).map((i) => i.nom);
  const lines = ['🪧 Ardoise du jour', '', `Disponibles : ${dispo.join(', ') || '—'}`];
  if (epuise.length) lines.push(`Épuisés : ${epuise.join(', ')}`);
  if (b.note) lines.push(`Note : ${b.note}`);
  lines.push('', 'Pour modifier : « plus de pain aux noix », « ajoute une note : … », « tout est disponible ».');
  return send(chatId, lines.join('\n'));
}

async function sendStats(chatId) {
  const st = JSON.parse((await executeChefTool('stats', { jours: 7 })).result);
  const lines = ['📊 7 derniers jours', '', `Commandes : ${st.commandes_total}`];
  for (const [k, v] of Object.entries(st.par_statut || {})) lines.push(`• ${v} ${k}`);
  if (st.produits_les_plus_commandes?.length) { lines.push('', 'Top produits :'); for (const p of st.produits_les_plus_commandes.slice(0, 5)) lines.push(`• ${p.quantite} × ${p.produit}`); }
  lines.push('', `Léa : ${st.lea.requetes} requêtes · ${Number(st.lea.tokens).toLocaleString('fr-FR')} tokens`);
  return send(chatId, lines.join('\n'));
}

async function sendContacts(chatId) {
  const { demandes } = JSON.parse((await executeChefTool('list_contact_requests', {})).result);
  if (!demandes.length) return send(chatId, '✉️ Aucune demande de contact à traiter.');
  const lines = [`✉️ ${demandes.length} demande${demandes.length > 1 ? 's' : ''} à traiter`];
  const buttons = [];
  for (const c of demandes.slice(0, 10)) {
    lines.push('', `<b>#${c.id} · ${c.objet}</b>\n👤 ${c.nom} · ${c.email}${c.telephone ? ` · ${c.telephone}` : ''}\n💬 ${String(c.message).slice(0, 300)}`);
    buttons.push([{ text: `✔️ Traitée #${c.id}`, callback_data: `ct:${c.id}` }]);
  }
  lines.push('', 'Pour répondre : « réponds à #12 : … » (je rédige, vous validez).');
  const r = await tg('sendMessage', { chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
  if (!r.ok) await send(chatId, lines.join('\n').replace(/<[^>]+>/g, ''));
}

async function sendImages(chatId) {
  const s = await getSettings();
  const lines = ['🖼 Emplacements des images', ''];
  for (const [slot, v] of Object.entries(IMAGE_SLOTS)) lines.push(`${s.images[slot] !== v.defaut ? '🟢' : '⚪️'} ${slot} — ${v.label}`);
  lines.push('', '🟢 = photo personnalisée. Envoyez une photo avec une légende (« pour hero ») ou sans, je vous propose où la mettre.');
  return send(chatId, lines.join('\n'));
}

async function sendSite(chatId) {
  const s = await getSettings();
  const lines = [
    `⚙️ ${s.nom} — ${s.slogan}`, '',
    `📍 ${s.boutique.adresse}, ${s.boutique.codePostal} ${s.boutique.ville}`, `📞 ${s.boutique.telephone} · ✉️ ${s.boutique.email}`,
    `🕒 ${horairesAffichage(s.horaires).map((h) => `${h.jour} ${h.heures}`).join(' · ')}`, `🔥 Fournées : ${s.fournees.map((f) => `${f} h`).join(', ')}`,
    `🎨 Palette : orange ${s.palette.orange}, or ${s.palette.honey}, fond ${s.palette.light} · Police : ${s.police}`,
    `🥖 Produits : ${Object.entries(s.produits).map(([c, l]) => `${l.filter((p) => p.disponible !== false).length} ${c}`).join(', ')}`,
    `✍️ Textes personnalisés : ${Object.keys(s.textes || {}).length} · Configuration v${s.version}`, '',
    'Dites-moi ce que vous voulez changer : nom, slogan, horaires, couleurs, police, textes, produits, photos…',
  ];
  return send(chatId, lines.join('\n'));
}

async function ensureCommandsRegistered() {
  await tg('setMyCommands', { commands: BOT_COMMANDS, language_code: 'fr' });
  await tg('setMyCommands', { commands: BOT_COMMANDS });
}

async function downloadPhoto(fileId) {
  const info = await tg('getFile', { file_id: fileId });
  const path = info?.result?.file_path;
  if (!path) throw new Error('Fichier Telegram introuvable');
  const r = await fetch(`https://api.telegram.org/file/bot${env.telegramToken}/${path}`);
  if (!r.ok) throw new Error('Téléchargement Telegram impossible');
  const buffer = Buffer.from(await r.arrayBuffer());
  const contentType = path.endsWith('.png') ? 'image/png' : path.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  return { buffer, contentType };
}

// ---------------------------------------------------------------------------
// Actions inline (boutons sous les messages) — sans modèle
// ---------------------------------------------------------------------------
async function handleCallback(cb) {
  const chatId = cb.message?.chat?.id;
  const key = `telegram:${chatId}`;
  const data = String(cb.data || '');
  if (!(await store().getChefChat(key))) return tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Non autorisé.' });
  try {
    if (data.startsWith('st:')) {
      const [, statut, numero] = data.split(':');
      const r = JSON.parse((await executeChefTool('update_order_status', { numero, statut })).result);
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: r.ok ? `${numero} → ${r.statut}` : r.erreur || 'Erreur' });
      if (r.ok) await tg('sendMessage', { chat_id: chatId, text: `${statut === 'prete' ? '🥐' : '📦'} ${numero} marquée ${r.statut}.`, reply_markup: KEYBOARD });
      return;
    }
    if (data.startsWith('ct:')) {
      const id = Number(data.slice(3));
      await executeChefTool('mark_contact_handled', { id });
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: `Demande #${id} traitée` });
      return;
    }
    await tg('answerCallbackQuery', { callback_query_id: cb.id });
  } catch (e) {
    await tg('answerCallbackQuery', { callback_query_id: cb.id, text: `Erreur : ${e.message}` });
  }
}

// ---------------------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------------------
export async function handleUpdate(update) {
  if (update?.callback_query) return handleCallback(update.callback_query);
  const msg = update?.message || update?.edited_message;
  if (!msg || !msg.chat) return;
  const chatId = msg.chat.id;
  const key = `telegram:${chatId}`;
  const text = (msg.text || msg.caption || '').trim();
  const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || msg.chat.title || 'Propriétaire';

  try {
    // --- Authentification : /start <mot de passe>
    const chat = await store().getChefChat(key);
    if (/^\/start\b/.test(text)) {
      const pwd = text.replace(/^\/start\s*/, '').trim();
      if (!chat) {
        if (!env.adminPassword) return send(chatId, "⚠️ ADMIN_PASSWORD n'est pas configuré sur le serveur.");
        if (pwd !== env.adminPassword) return tg('sendMessage', { chat_id: chatId, text: `Bonjour ${name} 👋 Ce bot est réservé à l'équipe de la boulangerie.\nPour vous connecter, envoyez :\n/start VOTRE_MOT_DE_PASSE` });
        await store().authorizeChefChat(key, name);
        await ensureCommandsRegistered();
        const s = await getSettings();
        await send(chatId, `✅ Bienvenue ${name} ! Vous êtes connecté au Chef de ${s.nom}.\n\nJe gère les commandes, l'ardoise, les clients et tout le site web. Les boutons ci-dessous répondent instantanément ; pour le reste, parlez-moi.\n\n${AIDE}`);
        return;
      }
      return send(chatId, `Re-bonjour ${name} 👋 Je suis prêt. /aide pour tout voir.`);
    }
    if (!chat) return tg('sendMessage', { chat_id: chatId, text: `Ce bot est réservé à l'équipe de la boulangerie. Connectez-vous avec :\n/start VOTRE_MOT_DE_PASSE` });

    // --- Raccourcis instantanés (sans modèle)
    const cmd = /^\/(\w+)/.exec(text)?.[1]?.toLowerCase();
    const is = (c, ...labels) => cmd === c || labels.includes(text);
    if (is('aide', '❓ Aide') || cmd === 'help') return send(chatId, AIDE);
    if (is('reset')) { await store().clearChefMessages(key); return send(chatId, '🧹 Conversation remise à zéro. Je vous écoute.'); }
    if (is('jour', '📦 Commandes du jour')) { await send(chatId, await programmeDuJour()); return sendOrders(chatId, "📦 Aujourd'hui", 'aujourdhui'); }
    if (is('demain', '🥖 Programme de demain')) return send(chatId, await programmeDuJour(parisNow(new Date(Date.now() + 86_400_000)).isoDate));
    if (is('commandes')) return sendOrders(chatId, '📦 Commandes à venir', 'a_venir');
    if (is('semaine', '🗓 Cette semaine')) return sendOrders(chatId, '🗓 7 prochains jours', 'semaine');
    if (is('attente', '⏳ En attente')) return sendOrders(chatId, '⏳ En attente de validation par email', 'en_attente');
    if (is('ardoise', '🪧 Ardoise')) return sendBoard(chatId);
    if (is('stats', '📊 Stats')) return sendStats(chatId);
    if (is('contacts', '✉️ Contacts')) return sendContacts(chatId);
    if (is('images', '🖼 Images')) return sendImages(chatId);
    if (is('site', '⚙️ Site')) return sendSite(chatId);

    // --- Photo : téléversement puis transmission au Chef
    let prompt = text;
    if (msg.photo?.length || (msg.document && /^image\//.test(msg.document.mime_type || ''))) {
      await tg('sendChatAction', { chat_id: chatId, action: 'upload_photo' });
      const fileId = msg.document ? msg.document.file_id : msg.photo[msg.photo.length - 1].file_id;
      try {
        const { buffer, contentType } = await downloadPhoto(fileId);
        const url = await uploadImage(buffer, { name: msg.document?.file_name || 'photo', contentType });
        prompt = `[PHOTO : ${url}] ${text || '(sans légende — propose-moi où placer cette photo sur le site)'}`;
        await tg('sendMessage', { chat_id: chatId, text: '📷 Photo enregistrée. Je regarde où la placer…' });
      } catch (e) {
        return send(chatId, `⚠️ Impossible d'enregistrer la photo : ${e.message}`);
      }
    }
    if (!prompt) return send(chatId, "Je n'ai pas compris ce message. /aide pour voir ce que je sais faire.");

    // --- Le Chef (IA) avec indicateur d'attente si c'est long
    await tg('sendChatAction', { chat_id: chatId, action: 'typing' });
    let waitMsg = null;
    const timer = setTimeout(async () => {
      waitMsg = await tg('sendMessage', { chat_id: chatId, text: '⏳ Je m\'en occupe, encore quelques secondes (le service gratuit limite la vitesse)…' });
      tg('sendChatAction', { chat_id: chatId, action: 'typing' });
    }, 6000);
    let reply;
    try { reply = await chefTurn(key, prompt); } finally { clearTimeout(timer); }
    if (waitMsg?.result?.message_id) await tg('deleteMessage', { chat_id: chatId, message_id: waitMsg.result.message_id });
    await send(chatId, reply);
  } catch (e) {
    console.error('telegram handleUpdate', e);
    if (e?.status === 429) return send(chatId, "⏳ Le service IA gratuit est saturé pour l'instant (limite de tokens par minute). Réessayez dans une minute — les boutons rapides, eux, fonctionnent toujours.");
    await send(chatId, `⚠️ Une erreur est survenue : ${e.message}`);
  }
}

/** Diffuse un message à toutes les conversations Telegram autorisées (cron du matin). */
export async function broadcast(text) {
  const chats = (await store().listChefChats()).filter((c) => c.chat_id.startsWith('telegram:'));
  for (const c of chats) await send(c.chat_id.replace('telegram:', ''), text);
  return chats.length;
}
