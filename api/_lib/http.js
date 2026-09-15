import { createHash } from 'node:crypto';
import { env } from './env.js';

export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function error(status, message, extra = {}) {
  return json({ error: message, ...extra }, { status });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Adresse IP du visiteur derrière le proxy Vercel.
export function getIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '0.0.0.0';
}

// On ne stocke jamais l'IP en clair (RGPD) : uniquement un hash salé.
export function hashIp(ip) {
  return createHash('sha256').update(`${env.sessionSecret || 'dev'}:${ip}`).digest('hex').slice(0, 32);
}

// Origine publique du site (pour les liens dans les emails et les redirections) :
// PUBLIC_SITE_URL si défini, sinon déduite des en-têtes du proxy Vercel / de l'URL.
export function siteOrigin(request) {
  if (env.siteUrl) return env.siteUrl;
  const url = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  return `${proto}://${host}`;
}

export function parseCookies(request) {
  const header = request.headers.get('cookie') || '';
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}
