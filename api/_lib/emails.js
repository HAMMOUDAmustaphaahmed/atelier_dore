// Emails transactionnels des commandes (Resend). Tout est en HTML inline simple,
// compatible avec les clients mail. `scheduledAt` (ISO) programme un envoi différé
// jusqu'à 30 jours — utilisé pour le rappel 24 h avant le retrait.

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env, assertEnv } from './env.js';
import { AFFICHER_PRIX } from '../../src/data/infos.js';
import { formatPickup, formatTotal, isQuote, REMINDER_HOURS_BEFORE } from './orders.js';
import { getSettings } from './settings.js';

// Infos boutique (nom, adresse, téléphone…) : lues dans la configuration, avec
// mise en cache 15 s — les templates ci-dessous les lisent via B().
let B = () => ({ nom: "L'Atelier Doré", adresse: '', codePostal: '', ville: '', telephone: '', email: '' });
async function refreshBoutique() {
  const s = await getSettings();
  const b = { nom: s.nom, ...s.boutique };
  B = () => b;
  return b;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let resend;
let smtp;
function client() {
  assertEnv(['resendKey']);
  if (!resend) resend = new Resend(env.resendKey);
  return resend;
}
function mailjet() {
  assertEnv(['mailjetKey', 'mailjetSecret', 'mailjetSender']);
  if (!smtp) smtp = nodemailer.createTransport({ host: 'in-v3.mailjet.com', port: 587, secure: false, auth: { user: env.mailjetKey, pass: env.mailjetSecret } });
  return smtp;
}
function gmail() {
  assertEnv(['gmailUser', 'gmailAppPassword']);
  if (!smtp) smtp = nodemailer.createTransport({ service: 'gmail', auth: { user: env.gmailUser, pass: env.gmailAppPassword } });
  return smtp;
}

/**
 * Envoi générique (utilisé aussi par le formulaire de contact).
 * { to, subject, html, replyTo?, scheduledAt? } → id du message ou null.
 * Gmail ne sait pas programmer un envoi : scheduledAt est ignoré (le cron s'en charge).
 */
export async function sendMail({ to, subject, html, replyTo, scheduledAt }) {
  await refreshBoutique();
  const from = env.emailProvider === 'gmail' ? `${B().nom} <${env.gmailUser}>` : env.emailProvider === 'mailjet' ? `${B().nom} <${env.mailjetSender}>` : env.emailFrom.replace("L'Atelier Doré", B().nom);
  if (env.emailProvider === 'gmail' || env.emailProvider === 'mailjet') {
    const transport = env.emailProvider === 'gmail' ? gmail() : mailjet();
    const info = await transport.sendMail({ from, to: Array.isArray(to) ? to.join(', ') : to, subject, html, ...(replyTo ? { replyTo } : {}) });
    return info?.messageId || null;
  }
  const { data, error } = await client().emails.send({ from, to: Array.isArray(to) ? to : [to], subject, html, ...(replyTo ? { replyTo } : {}), ...(scheduledAt ? { scheduledAt } : {}) });
  if (error) { const err = new Error(error.message || 'Envoi email impossible'); err.code = 'EMAIL'; throw err; }
  return data?.id || null;
}

export const canSchedule = () => env.emailProvider === 'resend';

const layout = (title, body) => `
  <div style="font-family:Inter,Arial,sans-serif;color:#2c1e16;max-width:600px;margin:0 auto;padding:24px">
    <p style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#5c4033;margin:0 0 4px">🥐 ${esc(B().nom)}</p>
    <h2 style="font-family:Georgia,serif;color:#2c1e16;margin:12px 0 18px">${title}</h2>
    ${body}
    <p style="color:#8a8a8a;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:12px">
      ${esc(B().nom)} · ${esc(B().adresse)}, ${esc(B().codePostal)} ${esc(B().ville)} · ${esc(B().telephone)} · ${esc(B().email)}
    </p>
  </div>`;

const button = (href, label, color = '#e67e22') =>
  `<a href="${esc(href)}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;margin:6px 8px 6px 0">${esc(label)}</a>`;

export function ticketHtml(order) {
  const rows = order.articles
    .map((a) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #f0e9dc">${esc(a.produit)}${a.notes ? `<br><span style="color:#8a8a8a;font-size:12px">${esc(a.notes)}</span>` : ''}</td><td style="padding:6px 8px;text-align:center;border-bottom:1px solid #f0e9dc">× ${a.quantite}</td>${AFFICHER_PRIX ? `<td style="padding:6px 8px;text-align:right;border-bottom:1px solid #f0e9dc">${esc(a.prix_unitaire)}</td>` : ''}</tr>`)
    .join('');
  const ev = order.evenement
    ? `<p style="margin:12px 0 0"><strong>Événement :</strong> ${esc(order.evenement.type || '—')}${order.evenement.invites ? ` · ${order.evenement.invites} invités` : ''}${order.evenement.budget ? ` · budget ≈ ${order.evenement.budget} €` : ''}${order.evenement.theme ? `<br>${esc(order.evenement.theme)}` : ''}</p>`
    : '';
  return `
    <div style="background:#fdfbf7;border:1px solid #eee3cc;border-radius:14px;padding:16px 18px">
      <p style="margin:0 0 10px"><strong>N° ${esc(order.numero)}</strong> · ${isQuote(order) ? 'demande de devis' : 'commande'}</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table>
      <p style="margin:12px 0 0"><strong>${AFFICHER_PRIX ? 'Total' : 'Tarif'} :</strong> ${esc(formatTotal(order))}</p>
      <p style="margin:6px 0 0"><strong>Retrait :</strong> ${esc(formatPickup(order.pickup_at))}</p>
      <p style="margin:6px 0 0"><strong>Client :</strong> ${esc(order.client.nom)} · ${esc(order.client.telephone)} · ${esc(order.client.email)}</p>
      ${ev}
      ${order.notes ? `<p style="margin:12px 0 0"><strong>Remarques :</strong> ${esc(order.notes)}</p>` : ''}
    </div>`;
}

async function send(payload) {
  return sendMail(payload);
}

// 1. Email de confirmation au client (lien à cliquer sous 48 h).
export async function sendConfirmationRequest(order, { confirmUrl, cancelUrl }) {
  await refreshBoutique();
  const quote = isQuote(order);
  return send({
    to: [order.client.email],
    subject: `${quote ? 'Confirmez votre demande de devis' : 'Confirmez votre commande'} ${order.numero} — ${B().nom}`,
    html: layout(
      `Bonjour ${esc(order.client.nom)}, un dernier clic !`,
      `<p>Léa a bien pris note de votre ${quote ? 'demande de gâteau d\'événement' : 'commande'}. Pour la <strong>valider</strong>, cliquez sur le bouton ci-dessous avant le <strong>${esc(formatPickup(order.confirm_expires_at))}</strong> — sans validation, elle sera annulée automatiquement.</p>
       <p style="margin:18px 0">${button(confirmUrl, quote ? 'Je confirme ma demande' : 'Je confirme ma commande')} ${button(cancelUrl, 'Annuler', '#9a9a9a')}</p>
       ${ticketHtml(order)}
       ${quote ? '<p style="margin-top:16px">Après validation, notre équipe vous recontacte sous 24 h ouvrées avec une proposition et un devis. Une dégustation est possible sur rendez-vous.</p>' : '<p style="margin-top:16px">Le règlement s\'effectue en boutique lors du retrait (carte, espèces, titres-restaurant).</p>'}
       <p style="color:#8a8a8a;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>`
    ),
  });
}

// 2. Confirmation effective (après le clic) + rappel de la date.
export async function sendConfirmed(order, { cancelUrl }) {
  await refreshBoutique();
  const quote = isQuote(order);
  return send({
    to: [order.client.email],
    subject: `${quote ? 'Demande' : 'Commande'} ${order.numero} confirmée — ${B().nom}`,
    html: layout(
      quote ? 'Votre demande est bien enregistrée' : 'Votre commande est confirmée 🎉',
      `<p>Merci ${esc(order.client.nom)} ! ${quote ? 'Notre équipe vous recontacte sous 24 h ouvrées.' : `Nous vous attendons le <strong>${esc(formatPickup(order.pickup_at))}</strong>.`} Vous recevrez un rappel la veille.</p>
       ${ticketHtml(order)}
       <p style="margin-top:16px">Un empêchement ? ${button(cancelUrl, 'Annuler cette commande', '#9a9a9a')}<br><span style="font-size:13px;color:#8a8a8a">ou appelez-nous au ${esc(B().telephone)}.</span></p>`
    ),
  });
}

// 3. Notification à la boulangerie.
export async function sendBakeryNotification(order) {
  await refreshBoutique();
  assertEnv(['bakeryEmail']);
  return send({
    to: [env.bakeryEmail],
    replyTo: order.client.email,
    subject: `[Site] ${isQuote(order) ? 'Devis' : 'Commande'} ${order.numero} confirmée — retrait ${formatPickup(order.pickup_at)}`,
    html: layout(
      `Nouvelle ${isQuote(order) ? 'demande de devis' : 'commande'} validée par le client`,
      `${ticketHtml(order)}<p style="margin-top:16px;font-size:13px;color:#8a8a8a">Répondre à cet email écrit directement au client.</p>`
    ),
  });
}

// 4. Rappel 24 h avant le retrait (programmé via scheduledAt).
export async function sendReminder(order, { scheduledAt } = {}) {
  await refreshBoutique();
  return send({
    to: [order.client.email],
    subject: `Rappel : ${isQuote(order) ? 'votre gâteau' : 'votre commande'} ${order.numero} vous attend demain — ${B().nom}`,
    html: layout(
      'À demain !',
      `<p>Bonjour ${esc(order.client.nom)}, petit rappel : votre ${isQuote(order) ? 'gâteau d\'événement' : 'commande'} est à retirer le <strong>${esc(formatPickup(order.pickup_at))}</strong> au ${esc(B().adresse)}, ${esc(B().codePostal)} ${esc(B().ville)}.</p>
       ${ticketHtml(order)}
       <p style="margin-top:16px;font-size:13px;color:#8a8a8a">Un empêchement ? Appelez-nous au ${esc(B().telephone)}.</p>`
    ),
    ...(scheduledAt ? { scheduledAt } : {}),
  });
}

// 5. Annulation.
export async function sendCancelled(order, { motif } = {}) {
  await refreshBoutique();
  return send({
    to: [order.client.email],
    subject: `${isQuote(order) ? 'Demande' : 'Commande'} ${order.numero} annulée — ${B().nom}`,
    html: layout(
      'Commande annulée',
      `<p>Votre ${isQuote(order) ? 'demande' : 'commande'} <strong>${esc(order.numero)}</strong> a été annulée.${motif ? ` ${esc(motif)}` : ''}</p>
       <p>Nous sommes désolés pour la gêne occasionnée. Pour toute question : ${esc(B().telephone)}. À bientôt à la boulangerie !</p>`
    ),
  });
}

// 6. Email libre rédigé par le Chef (réponse à un devis, information…).
export async function sendCustomEmail({ to, nom, sujet, message }) {
  await refreshBoutique();
  const paragraphs = String(message).split(/\n{2,}/).map((p) => `<p style="white-space:pre-wrap">${esc(p)}</p>`).join('');
  return send({
    to: [to],
    subject: `${sujet} — ${B().nom}`,
    html: layout(nom ? `Bonjour ${esc(nom)},` : 'Bonjour,', paragraphs),
  });
}

export async function cancelScheduledEmail(id) {
  if (!id || !canSchedule()) return;
  try {
    await client().emails.cancel(id);
  } catch (e) {
    console.warn('annulation email programmé impossible', e?.message);
  }
}

/**
 * Programme (ou envoie tout de suite) le rappel 24 h avant le retrait.
 * Resend accepte une programmation jusqu'à 30 jours : au-delà, le cron quotidien
 * rappellera cette fonction quand la date sera dans la fenêtre.
 * Retourne { emailId, scheduledAt } ou null si trop loin / déjà passé.
 */
export async function scheduleReminder(order, now = new Date()) {
  const pickup = new Date(order.pickup_at).getTime();
  const remindAt = pickup - REMINDER_HOURS_BEFORE * 3_600_000;
  if (pickup <= now.getTime()) return null;
  // Gmail : pas de programmation → le cron quotidien envoie quand le retrait est dans les 36 h.
  if (!canSchedule()) {
    if (pickup - now.getTime() > 36 * 3_600_000) return null;
    const emailId = await sendReminder(order);
    return { emailId: emailId || 'gmail', scheduledAt: new Date().toISOString(), immediate: true };
  }
  const maxAhead = now.getTime() + 29 * 24 * 3_600_000;
  if (remindAt > maxAhead) return null; // trop loin : le cron s'en chargera
  if (remindAt <= now.getTime() + 60_000) {
    const emailId = await sendReminder(order);
    return { emailId, scheduledAt: new Date().toISOString(), immediate: true };
  }
  const scheduledAt = new Date(remindAt).toISOString();
  const emailId = await sendReminder(order, { scheduledAt });
  return { emailId, scheduledAt, immediate: false };
}
