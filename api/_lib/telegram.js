// Canal Telegram du Chef. Un seul point d'entrée : handleUpdate(update),
// utilisé par le webhook (/api/telegram, production Vercel) et par le script
// de polling local (scripts/telegram-dev.mjs).

import { env } from './env.js';
import { store } from './store.js';
import { chefTurn, programmeDuJour, executeChefTool } from './chef.js';
import { uploadImage, getSettings } from './settings.js';
import { parisNow } from '../../src/data/infos.js';

const API = () => `https://api.telegram.org/bot${env.telegramToken}`;

export async function tg(method, payload) {
  const r = await fetch(`${API()}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await r.json().catch(() => ({}));
  if (!data.ok) console.error('telegram', method, data.description);
  return data;
}

// Clavier de raccourcis affiché sous la zone de saisie.
export const KEYBOARD = {
  keyboard: [
    [{ text: '📦 Commandes du jour' }, { text: '🥖 Programme de demain' }],
    [{ text: '🪧 Ardoise' }, { text: '⏳ En attente' }],
    [{ text: '📊 Stats de la semaine' }, { text: '✉️ Demandes de contact' }],
    [{ text: '🖼 Images du site' }, { text: '⚙️ Réglages du site' }],
    [{ text: '❓ Aide' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: 'Parlez au Chef…',
};

// Correspondance bouton / commande → message envoyé au Chef (ou action directe).
const SHORTCUTS = {
  '📦 Commandes du jour': "Donne-moi les commandes d'aujourd'hui, avec les heures de retrait.",
  '🥖 Programme de demain': '__programme_demain__',
  '🪧 Ardoise': "Montre-moi l'ardoise du jour et rappelle-moi comment la modifier.",
  '⏳ En attente': 'Quelles commandes sont en attente de validation par email ?',
  '📊 Stats de la semaine': 'Donne-moi les statistiques des 7 derniers jours.',
  '✉️ Demandes de contact': 'Liste les demandes de contact non traitées.',
  '🖼 Images du site': "Liste les emplacements d'images du site et dis-moi lesquels ont une photo personnalisée.",
  '⚙️ Réglages du site': 'Résume la configuration actuelle du site (nom, horaires, palette, produits) et dis-moi ce que je peux changer.',
};

export const BOT_COMMANDS = [
  { command: 'start', description: 'Démarrer et se connecter' },
  { command: 'aide', description: 'Tout ce que le Chef sait faire' },
  { command: 'jour', description: "Programme d'aujourd'hui" },
  { command: 'demain', description: 'Programme de demain' },
  { command: 'commandes', description: 'Commandes à venir' },
  { command: 'attente', description: 'Commandes non validées' },
  { command: 'ardoise', description: 'Ardoise du jour' },
  { command: 'stats', description: 'Statistiques de la semaine' },
  { command: 'contacts', description: 'Demandes de contact' },
  { command: 'images', description: 'Emplacements des images' },
  { command: 'site', description: 'Réglages du site' },
  { command: 'reset', description: 'Repartir sur une conversation vide' },
];

export const AIDE = `👨‍🍳 Le Chef — votre assistant de gestion

Parlez-moi normalement, je comprends le français. Exemples :

📦 Commandes
• « Qu'est-ce que je prépare demain ? »
• « Les commandes de la semaine » / « du mois » / « entre le 1er et le 15 octobre »
• « Détail de la commande AD-7K3P9Q »
• « Marque AD-7K3P9Q comme prête » / « retirée »
• « Annule la commande de Marie et préviens-la » (je demande confirmation)

🪧 Ardoise & fermetures
• « Plus de pain aux noix aujourd'hui »
• « Ajoute une fougasse aux olives sur l'ardoise »
• « On est fermés le 25 décembre »

🌐 Le site web
• « Change le nom en Maison Doré »
• « Mets le slogan : Le pain comme autrefois »
• « Ouvert du lundi au samedi 6h30–19h, fermé le dimanche »
• « Passe le site en palette terracotta » / « des couleurs plus chaudes »
• « Ajoute une pâtisserie : Flan vanille, crème onctueuse sur pâte brisée »
• « Masque le kouign-amann » / « supprime le pain suisse »
• Envoyez une photo 📷 avec une légende (« pour la carte croissant ») — ou sans, je vous propose où la mettre

✉️ Clients
• « Réponds à la demande de devis de M. Dupont : on propose 3 étages, dégustation samedi » (je rédige, vous validez)
• « Qu'est-ce que les clients demandent à Léa ces jours-ci ? »

Commandes rapides : /jour /demain /commandes /attente /ardoise /stats /contacts /images /site /reset
Les boutons sous la zone de saisie font la même chose.`;

async function ensureCommandsRegistered() {
  // Enregistre le menu de commandes (idempotent, léger).
  await tg('setMyCommands', { commands: BOT_COMMANDS, language_code: 'fr' });
  await tg('setMyCommands', { commands: BOT_COMMANDS });
}

// Markdown léger produit par le modèle → HTML Telegram (gras, italique, code).
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
  // Telegram limite à 4096 caractères : on découpe proprement.
  const chunks = [];
  let rest = toTelegramHtml(text || '…');
  while (rest.length > 3900) {
    let cut = rest.lastIndexOf('\n', 3900);
    if (cut < 2000) cut = 3900;
    chunks.push(rest.slice(0, cut)); rest = rest.slice(cut);
  }
  chunks.push(rest);
  for (const [i, c] of chunks.entries()) {
    const payload = { chat_id: chatId, text: c, parse_mode: 'HTML', ...(i === chunks.length - 1 ? { reply_markup: KEYBOARD, ...extra } : {}) };
    const r = await tg('sendMessage', payload);
    if (!r.ok) await tg('sendMessage', { ...payload, parse_mode: undefined, text: c.replace(/<[^>]+>/g, '') }); // repli texte brut
  }
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

/** Traite une mise à jour Telegram (message texte, commande, photo). */
export async function handleUpdate(update) {
  const msg = update?.message || update?.edited_message;
  if (!msg || !msg.chat) return;
  const chatId = msg.chat.id;
  const key = `telegram:${chatId}`;
  const text = (msg.text || msg.caption || '').trim();
  const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || msg.chat.title || 'Propriétaire';

  try {
    // --- Authentification : /start <mot de passe> (une seule fois par conversation)
    const chat = await store().getChefChat(key);
    if (/^\/start\b/.test(text)) {
      const pwd = text.replace(/^\/start\s*/, '').trim();
      if (!chat) {
        if (!env.adminPassword) return send(chatId, "⚠️ ADMIN_PASSWORD n'est pas configuré sur le serveur.");
        if (pwd !== env.adminPassword) return tg('sendMessage', { chat_id: chatId, text: `Bonjour ${name} 👋 Ce bot est réservé à l'équipe de la boulangerie.\nPour vous connecter, envoyez :\n/start VOTRE_MOT_DE_PASSE` });
        await store().authorizeChefChat(key, name);
        await ensureCommandsRegistered();
        const s = await getSettings();
        await send(chatId, `✅ Bienvenue ${name} ! Vous êtes connecté au Chef de ${s.nom}.\n\nJe gère les commandes, l'ardoise, les clients et le site web. Utilisez les boutons ci-dessous, les commandes du menu, ou parlez-moi simplement.\n\n${AIDE}`);
        return;
      }
      return send(chatId, `Re-bonjour ${name} 👋 Je suis prêt. Tapez /aide pour voir tout ce que je sais faire.`);
    }
    if (!chat) {
      return tg('sendMessage', { chat_id: chatId, text: `Ce bot est réservé à l'équipe de la boulangerie. Connectez-vous avec :\n/start VOTRE_MOT_DE_PASSE` });
    }

    // --- Commandes rapides
    const cmd = /^\/(\w+)/.exec(text)?.[1]?.toLowerCase();
    if (cmd === 'aide' || cmd === 'help' || text === '❓ Aide') return send(chatId, AIDE);
    if (cmd === 'reset') { await store().clearChefMessages(key); return send(chatId, '🧹 Conversation remise à zéro. Je vous écoute.'); }
    if (cmd === 'jour') return send(chatId, await programmeDuJour());
    if (cmd === 'demain' || text === '🥖 Programme de demain') {
      const tomorrow = parisNow(new Date(Date.now() + 86_400_000)).isoDate;
      return send(chatId, await programmeDuJour(tomorrow));
    }
    const mapped = {
      commandes: 'Liste les commandes à venir.', attente: 'Quelles commandes sont en attente de validation par email ?',
      ardoise: SHORTCUTS['🪧 Ardoise'], stats: SHORTCUTS['📊 Stats de la semaine'], contacts: SHORTCUTS['✉️ Demandes de contact'],
      images: SHORTCUTS['🖼 Images du site'], site: SHORTCUTS['⚙️ Réglages du site'],
    }[cmd];
    let prompt = mapped || SHORTCUTS[text] || text;

    // --- Photo : téléversement puis transmission au Chef avec l'URL
    if (msg.photo?.length || (msg.document && /^image\//.test(msg.document.mime_type || ''))) {
      await tg('sendChatAction', { chat_id: chatId, action: 'upload_photo' });
      const fileId = msg.document ? msg.document.file_id : msg.photo[msg.photo.length - 1].file_id;
      try {
        const { buffer, contentType } = await downloadPhoto(fileId);
        const url = await uploadImage(buffer, { name: msg.document?.file_name || 'photo', contentType });
        prompt = `[PHOTO : ${url}] ${text || "(sans légende — propose-moi où placer cette photo sur le site)"}`;
      } catch (e) {
        return send(chatId, `⚠️ Impossible d'enregistrer la photo : ${e.message}`);
      }
    }

    if (!prompt) return send(chatId, 'Je n\'ai pas compris ce message. Tapez /aide pour voir ce que je sais faire.');

    await tg('sendChatAction', { chat_id: chatId, action: 'typing' });
    const reply = await chefTurn(key, prompt);
    await send(chatId, reply);
  } catch (e) {
    console.error('telegram handleUpdate', e);
    await send(chatId, `⚠️ Une erreur est survenue : ${e.message}`);
  }
}

/** Diffuse un message à toutes les conversations Telegram autorisées (cron du matin). */
export async function broadcast(text) {
  const chats = (await store().listChefChats()).filter((c) => c.chat_id.startsWith('telegram:'));
  for (const c of chats) await send(c.chat_id.replace('telegram:', ''), text);
  return chats.length;
}

export { executeChefTool };
