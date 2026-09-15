// POST /api/admin/login { password } → cookie admin · DELETE → déconnexion · GET → état
import { json, error, readJson, getIp, hashIp } from '../_lib/http.js';
import { adminCookie, clearAdminCookie, isAdmin, checkPassword } from '../_lib/admin.js';
import { store } from '../_lib/store.js';

export async function GET(request) {
  return json({ admin: isAdmin(request) });
}

export async function POST(request) {
  // Anti-bruteforce : 10 tentatives par IP et par heure.
  const tries = await store().bumpCounter(`admin:${hashIp(getIp(request))}`, 3600).catch(() => 0);
  if (tries > 10) return error(429, 'Trop de tentatives. Réessayez dans une heure.');
  const body = await readJson(request);
  if (!checkPassword(body?.password)) return error(401, 'Mot de passe incorrect.');
  return json({ ok: true }, { headers: { 'set-cookie': adminCookie() } });
}

export async function DELETE() {
  return json({ ok: true }, { headers: { 'set-cookie': clearAdminCookie() } });
}
