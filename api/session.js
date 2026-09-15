// GET /api/session — ouvre (ou retrouve) la session de chat du visiteur.
// Appelé uniquement quand le client ouvre le widget : pas de session créée
// pour les simples visiteurs. Renvoie l'historique et le nombre de messages restants.

import { env } from './_lib/env.js';
import { json, error } from './_lib/http.js';
import { resolveSession, remainingFor } from './_lib/session.js';
import { store } from './_lib/store.js';
import { toDisplay } from './_lib/history.js';

export async function GET(request) {
  try {
    const { session, setCookie, reason } = await resolveSession(request, { create: true });
    if (!session) {
      return error(429, 'Trop de nouvelles conversations depuis votre connexion aujourd\'hui.', { code: reason || 'too_many_sessions' });
    }
    const rows = await store().loadRows(session.id);
    const headers = {};
    if (setCookie) headers['set-cookie'] = setCookie;
    return json(
      {
        messages: toDisplay(rows),
        remaining: remainingFor(session),
        limit: env.maxMessagesPerSession,
        status: session.status,
      },
      { headers }
    );
  } catch (e) {
    console.error('session', e);
    const status = e.code === 'CONFIG' ? 503 : 500;
    return error(status, e.code === 'CONFIG' ? e.message : 'Erreur serveur.', { code: e.code || 'server' });
  }
}
