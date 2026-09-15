// Configuration du site pilotable par le propriétaire (via le Chef / Telegram) :
// nom, textes, coordonnées, horaires, palette, images, produits, fournées.
// Les valeurs du code (src/data/*) servent de défauts ; la base ne stocke que
// les surcharges (table site_settings, ligne 'main').

import { store } from './store.js';
import { env } from './env.js';
import { BOUTIQUE, HORAIRES_SEMAINE } from '../../src/data/infos.js';
import { pains, viennoiseries, patisseries, gateaux, gateauxEvenement } from '../../src/data/products.js';

export const PALETTE_DEFAULT = {
  light: '#f6f1e7', cream: '#fbf8f1', sand: '#e9dfcb', gold: '#b8892e', honey: '#e0b054',
  brown: '#5a3a22', crust: '#8a5a2b', dark: '#1b1512', ember: '#2c1e16', orange: '#c9622b',
};

// Palettes prêtes à l'emploi que le Chef peut proposer.
export const PALETTE_PRESETS = {
  'dore classique': PALETTE_DEFAULT,
  terracotta: { ...PALETTE_DEFAULT, orange: '#b5472a', honey: '#e8a26b', gold: '#a8642e', light: '#f7efe6', cream: '#fcf7f1', sand: '#ecd9c6' },
  olive: { ...PALETTE_DEFAULT, orange: '#6b7a3a', honey: '#c9c46a', gold: '#7d7a2d', brown: '#4a4a2a', crust: '#6e6a3a', dark: '#1d1f14', ember: '#2a2c1c', light: '#f4f3ea', cream: '#faf9f2', sand: '#e2e0cb' },
  nuit: { ...PALETTE_DEFAULT, orange: '#c58a3c', honey: '#e6c07a', gold: '#a8802c', brown: '#3b3550', crust: '#5b5375', dark: '#12111c', ember: '#1c1a2b', light: '#f1f0f5', cream: '#f9f8fc', sand: '#dcd9e6' },
  'rose patisserie': { ...PALETTE_DEFAULT, orange: '#c9506b', honey: '#f2b8c6', gold: '#b06a7e', brown: '#5a2f3c', crust: '#8a4a5e', dark: '#22141a', ember: '#33202a', light: '#faf1f3', cream: '#fdf8f9', sand: '#ecd6dc' },
  'bleu ocean': { ...PALETTE_DEFAULT, orange: '#2f6f9f', honey: '#8fc3e6', gold: '#3d6f8a', brown: '#2b3f4f', crust: '#3f5f75', dark: '#0f1a22', ember: '#182631', light: '#eff4f7', cream: '#f7fafc', sand: '#d5e0e8' },
  'chocolat noir': { ...PALETTE_DEFAULT, orange: '#8b4a2b', honey: '#d9a066', gold: '#9c6b3c', brown: '#3d2416', crust: '#5c3a26', dark: '#120b08', ember: '#1e120c', light: '#f3ebe3', cream: '#faf5ef', sand: '#e0d2c3' },
};

// Emplacements d'images sur le site (le Chef s'en sert pour suggérer où placer une photo).
export const IMAGE_SLOTS = {
  hero: { label: "Grande image d'accueil (la croûte qui se fend)", page: 'Accueil', defaut: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=65&w=1400&auto=format&fit=crop' },
  intro: { label: "Portrait de l'artisan (accueil, section « fait à la main »)", page: 'Accueil', defaut: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=70&w=1000&auto=format&fit=crop' },
  signature_1: { label: 'Signature n°1 — grande carte (pain au levain)', page: 'Accueil', defaut: 'https://images.unsplash.com/photo-1589367920969-ab8e050eb0e9?q=70&w=1000&auto=format&fit=crop' },
  signature_2: { label: 'Signature n°2 (croissant)', page: 'Accueil', defaut: 'https://images.unsplash.com/photo-1555507036-ab1f40ce88cb?q=70&w=900&auto=format&fit=crop' },
  signature_3: { label: 'Signature n°3 (tartelette)', page: 'Accueil', defaut: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=70&w=700&auto=format&fit=crop' },
  vitrine_1: { label: 'Vitrine — carte 1 (pain au levain)', page: 'Accueil', defaut: 'https://images.unsplash.com/photo-1589367920969-ab8e050eb0e9?q=70&w=700&auto=format&fit=crop' },
  vitrine_2: { label: 'Vitrine — carte 2 (croissant)', page: 'Accueil', defaut: 'https://images.unsplash.com/photo-1555507036-ab1f40ce88cb?q=70&w=700&auto=format&fit=crop' },
  vitrine_3: { label: 'Vitrine — carte 3 (tartelette)', page: 'Accueil', defaut: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=70&w=700&auto=format&fit=crop' },
  vitrine_4: { label: 'Vitrine — carte 4 (Paris-Brest)', page: 'Accueil', defaut: 'https://images.unsplash.com/photo-1626803775151-61d756612f97?q=70&w=700&auto=format&fit=crop' },
  vitrine_5: { label: 'Vitrine — carte 5 (wedding cake)', page: 'Accueil', defaut: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=70&w=700&auto=format&fit=crop' },
  vitrine_6: { label: 'Vitrine — carte 6 (kouign-amann)', page: 'Accueil', defaut: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?q=70&w=700&auto=format&fit=crop' },
  histoire_hero: { label: "Bandeau de la page Histoire (l'atelier)", page: 'Histoire', defaut: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?q=65&w=1400&auto=format&fit=crop' },
  histoire_petrissage: { label: 'Histoire — photo « pétrissage »', page: 'Histoire', defaut: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?q=70&w=1000&auto=format&fit=crop' },
  histoire_ingredients: { label: 'Histoire — photo « ingrédients »', page: 'Histoire', defaut: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?q=70&w=1000&auto=format&fit=crop' },
  og: { label: 'Image de partage (réseaux sociaux, aperçu de lien)', page: 'Global', defaut: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=70&w=900&auto=format&fit=crop' },
};

export const CATEGORIES = ['pains', 'viennoiseries', 'patisseries', 'gateaux', 'evenements'];
export const ICONS_DISPONIBLES = ['baguette', 'campagne', 'cereales', 'seigle', 'croissant', 'chocolat', 'chausson', 'kouign', 'brioche', 'eclair', 'citron', 'parisbrest', 'macarons', 'anniversaire', 'mariage', 'fiancailles', 'cakeslice'];

const strip = (p) => ({ name: p.name, desc: p.desc, icon: p.icon, ...(p.price ? { price: p.price } : {}), ...(p.tags ? { tags: p.tags } : {}), disponible: true });

export const DEFAULTS = {
  nom: BOUTIQUE.nom,
  slogan: 'Boulangerie & Pâtisserie artisanale',
  textes: {},            // surcharges du registre src/data/content.js
  boutique: { adresse: BOUTIQUE.adresse, codePostal: BOUTIQUE.codePostal, ville: BOUTIQUE.ville, pays: BOUTIQUE.pays, telephone: BOUTIQUE.telephone, email: BOUTIQUE.email, coords: [48.8606, 2.3376], instagram: '', facebook: '' },
  horaires: HORAIRES_SEMAINE,          // { 0..6: [ouverture, fermeture] | null }
  fournees: [7, 11, 16],
  palette: PALETTE_DEFAULT,
  images: Object.fromEntries(Object.entries(IMAGE_SLOTS).map(([k, v]) => [k, v.defaut])),
  produits: {
    pains: pains.map(strip),
    viennoiseries: viennoiseries.map(strip),
    patisseries: patisseries.map(strip),
    gateaux: gateaux.map(strip),
    evenements: gateauxEvenement.map(strip),
  },
  police: 'fraunces',
  version: 0,
};

export const FONT_PRESETS = ['fraunces', 'playfair', 'cormorant', 'dm-serif', 'lora'];

function deepMerge(base, patch) {
  if (Array.isArray(patch) || patch === null || typeof patch !== 'object') return patch === undefined ? base : patch;
  const out = { ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}) };
  for (const [k, v] of Object.entries(patch)) out[k] = deepMerge(out[k], v);
  return out;
}

let cache = { at: 0, value: null };
const TTL = 15_000;

/** Configuration effective (défauts + surcharges en base). Mise en cache 15 s. */
export async function getSettings({ fresh = false } = {}) {
  if (!fresh && cache.value && Date.now() - cache.at < TTL) return cache.value;
  let overrides = {};
  try { overrides = (await store().getSettings()) || {}; } catch (e) { console.error('settings', e.message); }
  const value = deepMerge(DEFAULTS, overrides);
  cache = { at: Date.now(), value };
  return value;
}

/** Applique une surcharge (fusion profonde) et renvoie la configuration effective. */
export async function updateSettings(patch) {
  const current = (await store().getSettings()) || {};
  const next = deepMerge(current, patch);
  next.version = (Number(current.version) || 0) + 1;
  await store().saveSettings(next);
  cache = { at: 0, value: null };
  return getSettings({ fresh: true });
}

/** Vue publique (front) : tout sauf ce qui n'a rien à faire côté client. */
export function publicSettings(s) {
  const { version, ...rest } = s;
  return { ...rest, version };
}

// ---------------------------------------------------------------------------
// Images : téléversement dans Supabase Storage (bucket public "site")
// ---------------------------------------------------------------------------
export async function uploadImage(buffer, { name = 'image', contentType = 'image/jpeg' } = {}) {
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';
  const path = `${Date.now()}-${safe}.${ext}`;
  return store().uploadPublicFile(path, buffer, contentType);
}

export function isHex(s) { return /^#[0-9a-f]{6}$/i.test(String(s || '')); }
export { env };

// ---------------------------------------------------------------------------
// Résolution d'une URL fournie par le propriétaire → image hébergée chez nous.
// Accepte un fichier image OU une page web (on prend son image principale og:image).
// ---------------------------------------------------------------------------
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

async function fetchWithTimeout(url, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; AtelierDoreBot/1.0)', accept: 'image/*,text/html;q=0.9,*/*;q=0.8' } });
  } finally { clearTimeout(t); }
}

export async function resolveImageUrl(input, depth = 0) {
  const url = String(input || '').trim();
  if (!/^https?:\/\//i.test(url)) throw new Error('URL invalide (elle doit commencer par http:// ou https://).');
  const r = await fetchWithTimeout(url);
  if (!r.ok) throw new Error(`Impossible de télécharger cette adresse (HTTP ${r.status}).`);
  const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();

  if (type.startsWith('image/')) {
    const buffer = Buffer.from(await r.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) throw new Error('Image trop lourde (max 8 Mo).');
    if (buffer.length < 15 * 1024) throw new Error('Image trop petite pour le site (icône ou logo ?).');
    const name = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'image').replace(/\.[a-z0-9]+$/i, '');
    return { url: await uploadImage(buffer, { name, contentType: type === 'image/jpg' ? 'image/jpeg' : type }), source: 'fichier' };
  }

  if (type.includes('text/html') && depth < 1) {
    const html = (await r.text()).slice(0, 400_000);
    const meta = (prop) => {
      const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i'));
      return m?.[1];
    };
    const candidate = meta('og:image') || meta('og:image:secure_url') || meta('twitter:image');
    if (candidate) {
      const abs = new URL(candidate.replace(/&amp;/g, '&'), url).href;
      const res = await resolveImageUrl(abs, depth + 1);
      return { ...res, source: 'page' };
    }
    throw new Error("Cette adresse est une page web sans image principale détectable.");
  }
  throw new Error(`Cette adresse ne pointe pas vers une image (type reçu : ${type || 'inconnu'}).`);
}
