import { createHmac, timingSafeEqual } from 'node:crypto';
import { env, assertEnv } from './env.js';
import { store } from './store.js';
import { parseCookies, getIp, hashIp } from './http.js';

export const COOKIE_NAME = 'ad_sid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function sign(id) {
  return createHmac('sha256', env.sessionSecret).update(id).digest('base64url');
}

function verify(token) {
  if (!token) return null;
  const [id, sig] = token.split('.');
  if (!id || !sig) return null;
  const expected = sign(id);
  if (expected.length !== sig.length) return null;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig)) ? id : null;
}

export function cookieHeader(id) {
  const parts = [
    `${COOKIE_NAME}=${id}.${sign(id)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${COOKIE_MAX_AGE}`,
  ];
  if (env.isProd) parts.push('Secure');
  return parts.join('; ');
}

/**
 * Retrouve la session du cookie, ou en crée une (si `create`).
 * Retourne { session, setCookie, created, reason } — `session` vaut null si
 * aucune session valide et création refusée (quota de sessions par IP atteint).
 */
export async function resolveSession(request, { create = false } = {}) {
  assertEnv(['sessionSecret']);
  const cookies = parseCookies(request);
  const id = verify(cookies[COOKIE_NAME]);

  if (id) {
    const session = await store().getSession(id);
    if (session) return { session, setCookie: null, created: false };
  }

  if (!create) return { session: null, setCookie: null, created: false };

  // Nouvelle session : limitée par IP et par jour (navigation privée, cookies effacés…).
  const ipHash = hashIp(getIp(request));
  const sessionsToday = await store().bumpCounter(`sessions:${ipHash}`, 60 * 60 * 24);
  if (sessionsToday > env.maxSessionsPerIpPerDay) {
    return { session: null, setCookie: null, created: false, reason: 'too_many_sessions' };
  }

  const session = await store().createSession(ipHash);
  return { session, setCookie: cookieHeader(session.id), created: true };
}

export function remainingFor(session) {
  return Math.max(env.maxMessagesPerSession - (session?.message_count || 0), 0);
}
