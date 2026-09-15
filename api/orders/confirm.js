// GET /api/orders/confirm?t=<jeton>&a=confirm|cancel
// Lien reçu par email. Valide (ou annule) la commande, puis redirige vers la
// page /commande?statut=… du site. Le jeton prouve la possession de l'email.

import { siteOrigin } from '../_lib/http.js';
import { store } from '../_lib/store.js';
import { hashToken, ORDER_STATUS } from '../_lib/orders.js';
import { sendConfirmed, sendBakeryNotification, sendCancelled, scheduleReminder, cancelScheduledEmail } from '../_lib/emails.js';

function redirect(request, params) {
  const base = siteOrigin(request);
  const qs = new URLSearchParams(params).toString();
  return Response.redirect(`${base}/commande?${qs}`, 302);
}

export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t') || '';
  const action = url.searchParams.get('a') === 'cancel' ? 'cancel' : 'confirm';

  try {
    const order = token ? await store().getOrderByTokenHash(hashToken(token)) : null;
    if (!order) return redirect(request, { statut: 'introuvable' });

    const now = new Date();
    const cancelUrl = `${siteOrigin(request)}/api/orders/confirm?t=${token}&a=cancel`;

    if (action === 'cancel') {
      if (order.status === ORDER_STATUS.CANCELLED) return redirect(request, { statut: 'annulee', numero: order.numero });
      if (new Date(order.pickup_at) < now) return redirect(request, { statut: 'passee', numero: order.numero });
      await cancelScheduledEmail(order.reminder_email_id);
      const updated = await store().updateOrder(order.id, { status: ORDER_STATUS.CANCELLED, cancelled_at: now.toISOString(), reminder_email_id: null });
      sendCancelled(updated).catch((e) => console.warn('email annulation', e.message));
      return redirect(request, { statut: 'annulee', numero: order.numero });
    }

    // action === 'confirm'
    if (order.status === ORDER_STATUS.CONFIRMED) return redirect(request, { statut: 'confirmee', numero: order.numero, deja: '1' });
    if (order.status === ORDER_STATUS.CANCELLED) return redirect(request, { statut: 'annulee', numero: order.numero });
    if (order.status === ORDER_STATUS.EXPIRED || new Date(order.confirm_expires_at) < now) {
      if (order.status !== ORDER_STATUS.EXPIRED) await store().updateOrder(order.id, { status: ORDER_STATUS.EXPIRED });
      return redirect(request, { statut: 'expiree', numero: order.numero });
    }

    let updated = await store().updateOrder(order.id, { status: ORDER_STATUS.CONFIRMED, confirmed_at: now.toISOString() });

    // Rappel 24 h avant (programmé chez Resend ; le cron gère les dates > 30 jours).
    try {
      const r = await scheduleReminder(updated, now);
      if (r) updated = await store().updateOrder(order.id, { reminder_email_id: r.emailId, reminder_scheduled_at: r.scheduledAt });
    } catch (e) {
      console.error('programmation rappel', e.message);
    }

    await Promise.allSettled([
      sendConfirmed(updated, { cancelUrl }),
      sendBakeryNotification(updated),
    ]).then((results) => results.forEach((r) => r.status === 'rejected' && console.error('email confirmation', r.reason?.message)));

    return redirect(request, { statut: 'confirmee', numero: order.numero });
  } catch (e) {
    console.error('orders/confirm', e);
    return redirect(request, { statut: 'erreur' });
  }
}
