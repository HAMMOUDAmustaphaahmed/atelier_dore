// GET /api/cron/reminders — exécuté chaque jour par Vercel Cron (voir vercel.json).
// 1. Programme les rappels des commandes confirmées dont la date approche
//    (celles qui étaient trop loin pour être programmées à la confirmation,
//    ou dont la programmation avait échoué).
// 2. Passe en "expirée" les commandes jamais validées par email.
// Protégé par CRON_SECRET (Vercel envoie automatiquement "Authorization: Bearer <secret>").

import { env } from '../_lib/env.js';
import { json, error } from '../_lib/http.js';
import { store } from '../_lib/store.js';
import { scheduleReminder } from '../_lib/emails.js';
import { programmeDuJour } from '../_lib/chef.js';
import { broadcast } from '../_lib/telegram.js';

export const maxDuration = 60;

export async function GET(request) {
  if (env.cronSecret) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${env.cronSecret}`) return error(401, 'Non autorisé.');
  } else if (process.env.VERCEL) {
    return error(503, 'CRON_SECRET manquant.');
  }

  const now = new Date();
  const report = { programmes: 0, envoyes: 0, ignores: 0, expirees: 0, telegram: 0, erreurs: [] };

  try {
    report.expirees = await store().expirePendingOrders(now.toISOString());

    const orders = await store().ordersNeedingReminder(now.toISOString());
    for (const order of orders) {
      try {
        const r = await scheduleReminder(order, now);
        if (!r) { report.ignores++; continue; } // retrait dans plus de 30 jours : on repassera
        await store().updateOrder(order.id, { reminder_email_id: r.emailId, reminder_scheduled_at: r.scheduledAt });
        if (r.immediate) report.envoyes++; else report.programmes++;
      } catch (e) {
        report.erreurs.push({ numero: order.numero, message: e.message });
      }
    }
    // Programme du jour envoyé au propriétaire sur Telegram.
    if (env.telegramToken) {
      try { report.telegram = await broadcast(await programmeDuJour()); } catch (e) { report.erreurs.push({ telegram: e.message }); }
    }
    return json({ ok: true, ...report });
  } catch (e) {
    console.error('cron/reminders', e);
    return error(500, 'Erreur cron.', { ...report });
  }
}
