// Authentification de l'espace propriétaire (/admin) : mot de passe ADMIN_PASSWORD
// → cookie HttpOnly signé, valable 7 jours.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env, assertEnv } from './env.js';
import { parseCookies } from './http.js';

const COOKIE = 'ad_admin';
const MAX_AGE = 60 * 60 * 24 * 7;

function sign(payload) {
  return createHmac('sha256', env.sessionSecret).update(payload).digest('base64url');
}

export function adminCookie() {
  assertEnv(['sessionSecret']);
  const exp = String(Date.now() + MAX_AGE * 1000);
  const parts = [`${COOKIE}=${exp}.${sign(exp)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${MAX_AGE}`];
  if (env.isProd) parts.push('Secure');
  return parts.join('; ');
}

export function clearAdminCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isAdmin(request) {
  if (!env.sessionSecret) return false;
  const token = parseCookies(request)[COOKIE];
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  return expected.length === sig.length && timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

export function checkPassword(pwd) {
  if (!env.adminPassword) return false;
  const a = Buffer.from(String(pwd || ''));
  const b = Buffer.from(env.adminPassword);
  return a.length === b.length && timingSafeEqual(a, b);
}
