// POST /api/contact — envoie le formulaire de contact à la boulangerie (Resend)
// et un accusé de réception au client.

import { env, assertEnv } from './_lib/env.js';
import { json, error, readJson, getIp, hashIp } from './_lib/http.js';
import { store } from './_lib/store.js';
import { getSettings } from './_lib/settings.js';
import { sendMail } from './_lib/emails.js';

const SUBJECT_LABELS = {
  info: 'Information générale',
  commande: 'Commande de pâtisserie',
  evenement: "Gâteau d'événement",
  autre: 'Autre demande',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

export async function POST(request) {
  try {
    assertEnv([env.emailProvider === 'gmail' ? 'gmailUser' : 'resendKey', 'bakeryEmail']);

    const body = await readJson(request);
    if (!body) return error(400, 'Requête invalide.');
    if (body.website) return json({ ok: true }); // honeypot : les bots remplissent ce champ caché

    const nom = String(body.nom || '').trim().slice(0, 120);
    const email = String(body.email || '').trim().slice(0, 200);
    const telephone = String(body.telephone || '').trim().slice(0, 40);
    const message = String(body.message || '').trim().slice(0, 4000);
    const subject = SUBJECT_LABELS[body.subject] ? body.subject : 'info';
    if (!nom || !isEmail(email) || message.length < 5) return error(400, 'Nom, email valide et message sont requis.');

    // Anti-spam : 5 envois par IP et par jour.
    const count = await store().bumpCounter(`contact:${hashIp(getIp(request))}`, 60 * 60 * 24).catch(() => 0);
    if (count > 5) return error(429, 'Trop de messages envoyés aujourd\'hui.');

    const evenement = body.subject === 'evenement'
      ? {
          type: String(body.eventType || '').slice(0, 60),
          date: String(body.eventDate || '').slice(0, 20),
          invites: String(body.guests || '').slice(0, 10),
          budget: String(body.budget || '').slice(0, 10),
        }
      : null;

    const lignes = [
      ['Objet', SUBJECT_LABELS[subject]],
      ['Nom', nom],
      ['Email', email],
      ['Téléphone', telephone || '—'],
      ...(evenement
        ? [['Événement', evenement.type], ['Date souhaitée', evenement.date || '—'], ['Invités', evenement.invites || '—'], ['Budget indicatif', evenement.budget ? `${evenement.budget} €` : '—']]
        : []),
    ];

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;color:#2c1e16;max-width:600px">
        <h2 style="font-family:Georgia,serif;color:#5c4033">Nouvelle demande — ${esc(SUBJECT_LABELS[subject])}</h2>
        <table style="border-collapse:collapse;width:100%">
          ${lignes.map(([k, v]) => `<tr><td style="padding:6px 8px;color:#777;width:140px">${esc(k)}</td><td style="padding:6px 8px"><strong>${esc(v)}</strong></td></tr>`).join('')}
        </table>
        <h3 style="margin-top:20px">Message</h3>
        <p style="white-space:pre-wrap;background:#fdfbf7;padding:14px;border-radius:10px;border:1px solid #eee">${esc(message)}</p>
      </div>`;

    const settings = await getSettings();
    const BOUTIQUE = { nom: settings.nom, ...settings.boutique };
    await store().saveContact({ subject, nom, email, telephone: telephone || null, message, evenement }).catch((e) => console.error('saveContact', e.message));

    try {
      await sendMail({ to: env.bakeryEmail, replyTo: email, subject: `[Site] ${SUBJECT_LABELS[subject]} — ${nom}`, html });
    } catch (e) {
      console.error('email contact', e);
      return error(502, "Impossible d'envoyer le message pour le moment.");
    }

    // Accusé de réception (non bloquant : si l'adresse expéditrice n'est pas
    // encore vérifiée chez Resend, seul l'email vers la boulangerie passe).
    sendMail({
        to: email,
        subject: `Nous avons bien reçu votre demande — ${BOUTIQUE.nom}`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;color:#2c1e16;max-width:600px">
            <h2 style="font-family:Georgia,serif;color:#5c4033">Merci ${esc(nom)} !</h2>
            <p>Nous avons bien reçu votre demande (<strong>${esc(SUBJECT_LABELS[subject])}</strong>) et nous vous répondons sous 24 h ouvrées.</p>
            <p style="white-space:pre-wrap;background:#fdfbf7;padding:14px;border-radius:10px;border:1px solid #eee">${esc(message)}</p>
            <p style="color:#777;font-size:13px">${esc(BOUTIQUE.nom)} · ${esc(BOUTIQUE.adresse)}, ${esc(BOUTIQUE.codePostal)} ${esc(BOUTIQUE.ville)} · ${esc(BOUTIQUE.telephone)}</p>
          </div>`,
      })
      .catch((e) => console.warn('accusé de réception non envoyé', e?.message));

    return json({ ok: true });
  } catch (e) {
    console.error('contact', e);
    if (e.code === 'CONFIG') return error(503, e.message, { code: 'config' });
    return error(500, 'Erreur serveur.');
  }
}
