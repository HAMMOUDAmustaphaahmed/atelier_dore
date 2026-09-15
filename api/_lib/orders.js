// Logique métier des commandes : validation, numéro, jeton de confirmation,
// calcul du total estimé, formatage pour les emails et le ticket du chat.

import { randomBytes, createHash } from 'node:crypto';
import { findProduct } from './catalogue.js';
import { checkPickupSlot } from './slots.js';
import { BOUTIQUE, DELAIS_COMMANDE, AFFICHER_PRIX } from '../../src/data/infos.js';

export const ORDER_STATUS = { PENDING: 'en_attente', CONFIRMED: 'confirmee', CANCELLED: 'annulee', EXPIRED: 'expiree' };
export const CONFIRM_TTL_HOURS = 48;
export const REMINDER_HOURS_BEFORE = 24;

const MAX_LINES = 10;
const MAX_QTY = 50;

// Numéro lisible, sans caractères ambigus (0/O, 1/I).
export function newOrderNumber() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  let s = '';
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `AD-${s}`;
}

export function newToken() {
  const token = randomBytes(24).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

// '1.40€' → 1.4 ; 'à partir de 28€' → 28 (indicatif) ; 'sur devis' / 'prix du jour' → null.
export function parsePrice(label) {
  if (!label) return { value: null, indicatif: false };
  const m = String(label).replace(',', '.').match(/(\d+(?:\.\d+)?)\s*€/);
  if (!m) return { value: null, indicatif: false };
  return { value: Number(m[1]), indicatif: /partir/i.test(label) };
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

/**
 * Valide et normalise l'entrée de l'outil create_order.
 * Retourne { ok: true, order } ou { ok: false, erreurs: [...] }.
 */
export function buildOrder(input, now = new Date(), ctx = {}) {
  const { catalogue = [], horaires, closures = [] } = ctx;
  const erreurs = [];
  const client = input?.client || {};
  const nom = String(client.nom || '').trim().slice(0, 120);
  const email = String(client.email || '').trim().toLowerCase().slice(0, 200);
  const telephone = String(client.telephone || '').trim().slice(0, 40);
  if (nom.length < 2) erreurs.push('Le nom du client est requis.');
  if (!isEmail(email)) erreurs.push("L'adresse email est invalide.");
  if (telephone.replace(/\D/g, '').length < 8) erreurs.push('Le numéro de téléphone est invalide.');

  const rawItems = Array.isArray(input?.articles) ? input.articles.slice(0, MAX_LINES) : [];
  if (!rawItems.length) erreurs.push('La commande ne contient aucun article.');

  let categorieMax = 'pain';
  let total = 0;
  let totalIndicatif = false;
  const articles = [];
  for (const it of rawItems) {
    const produit = findProduct(String(it?.produit || ''), catalogue);
    const quantite = Math.round(Number(it?.quantite));
    if (!produit) { erreurs.push(`Produit inconnu : « ${it?.produit} ». Utilise les noms exacts du catalogue.`); continue; }
    if (!Number.isFinite(quantite) || quantite < 1 || quantite > MAX_QTY) { erreurs.push(`Quantité invalide pour ${produit.nom} (1 à ${MAX_QTY}).`); continue; }
    const { value, indicatif } = parsePrice(produit.prix);
    if (DELAIS_COMMANDE[produit.categorie] > DELAIS_COMMANDE[categorieMax]) categorieMax = produit.categorie;
    if (value !== null) { total += value * quantite; if (indicatif) totalIndicatif = true; } else totalIndicatif = true;
    articles.push({
      produit: produit.nom,
      categorie: produit.categorie,
      quantite,
      prix_unitaire: produit.prix,
      notes: String(it?.notes || '').trim().slice(0, 300) || null,
    });
  }

  const retrait = input?.retrait || {};
  const slot = checkPickupSlot({ date: retrait.date, heure: retrait.heure, categorie: categorieMax }, now, { horaires, closures });
  if (!slot.disponible) erreurs.push(`Créneau de retrait impossible : ${slot.raison}`);

  const evenement = input?.evenement
    ? {
        type: String(input.evenement.type || '').slice(0, 60),
        invites: input.evenement.invites ? Number(input.evenement.invites) : null,
        budget: input.evenement.budget ? Number(input.evenement.budget) : null,
        theme: String(input.evenement.theme || '').slice(0, 300) || null,
      }
    : null;

  if (erreurs.length) return { ok: false, erreurs };

  return {
    ok: true,
    order: {
      numero: newOrderNumber(),
      status: ORDER_STATUS.PENDING,
      client: { nom, email, telephone },
      articles,
      pickup_at: new Date(slot.pickup_utc).toISOString(),
      categorie_max: categorieMax,
      evenement,
      notes: String(input?.notes || '').trim().slice(0, 1000) || null,
      total_estime: AFFICHER_PRIX && total > 0 ? Math.round(total * 100) / 100 : null,
      total_indicatif: totalIndicatif,
      confirm_expires_at: new Date(now.getTime() + CONFIRM_TTL_HOURS * 3_600_000).toISOString(),
    },
  };
}

export function isQuote(order) {
  return order.categorie_max === 'evenement' || !!order.evenement;
}

export function formatPickup(iso) {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: BOUTIQUE.timezone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export function formatTotal(order) {
  if (!AFFICHER_PRIX) return isQuote(order) ? 'sur devis' : 'tarif communiqué en boutique';
  if (order.total_estime === null || order.total_estime === undefined) return 'sur devis / prix en boutique';
  const s = `${order.total_estime.toFixed(2).replace('.', ',')} €`;
  return order.total_indicatif ? `≈ ${s} (indicatif, à confirmer en boutique)` : s;
}

// Résumé public (sans jeton) pour le chat et l'outil get_order.
export function publicOrder(order) {
  return {
    numero: order.numero,
    statut: order.status,
    type: isQuote(order) ? 'devis' : 'commande',
    client: { nom: order.client.nom, email: order.client.email },
    articles: order.articles.map((a) => ({ produit: a.produit, quantite: a.quantite, prix_unitaire: AFFICHER_PRIX ? a.prix_unitaire : null, notes: a.notes })),
    retrait: formatPickup(order.pickup_at),
    total: formatTotal(order),
    evenement: order.evenement,
    confirmation_avant: order.status === ORDER_STATUS.PENDING ? formatPickup(order.confirm_expires_at) : null,
  };
}
