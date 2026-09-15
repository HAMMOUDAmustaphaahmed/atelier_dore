// POST /api/telegram — webhook Telegram (production). Vérifie le secret envoyé
// par Telegram, répond 200 immédiatement après traitement.
// Enregistrement du webhook (une fois, après déploiement) :
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<site>/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>

import { env } from './_lib/env.js';
import { json, error, readJson } from './_lib/http.js';
import { handleUpdate } from './_lib/telegram.js';

export const maxDuration = 60;

export async function POST(request) {
  if (!env.telegramToken) return error(503, 'TELEGRAM_BOT_TOKEN manquant.');
  if (env.telegramWebhookSecret && request.headers.get('x-telegram-bot-api-secret-token') !== env.telegramWebhookSecret) {
    return error(401, 'Non autorisé.');
  }
  const update = await readJson(request);
  if (!update) return error(400, 'Requête invalide.');
  await handleUpdate(update);
  return json({ ok: true });
}

// GET : petite page de diagnostic (le webhook est-il en place ?)
export async function GET() {
  if (!env.telegramToken) return error(503, 'TELEGRAM_BOT_TOKEN manquant.');
  const r = await fetch(`https://api.telegram.org/bot${env.telegramToken}/getWebhookInfo`).then((x) => x.json()).catch(() => null);
  return json({ ok: true, webhook: r?.result || null });
}
