import { DELAIS_COMMANDE, AFFICHER_PRIX } from '../../src/data/infos.js';

// Catalogue vu par Léa : construit depuis la configuration du site (produits
// modifiables par le propriétaire), enrichi de la catégorie et du délai de commande.
const CAT = { pains: 'pain', viennoiseries: 'viennoiserie', patisseries: 'patisserie', gateaux: 'gateau' };

export function buildCatalogue(settings) {
  const out = [];
  for (const [key, categorie] of Object.entries(CAT)) {
    for (const p of settings.produits?.[key] || []) {
      if (p.disponible === false) continue;
      out.push({
        nom: p.name,
        categorie,
        prix: AFFICHER_PRIX ? (p.price || 'prix du jour en boutique') : 'tarif communiqué en boutique',
        description: p.desc,
        delai_commande_heures: DELAIS_COMMANDE[categorie],
      });
    }
  }
  for (const e of settings.produits?.evenements || []) {
    if (e.disponible === false) continue;
    out.push({
      nom: `Gâteau d'événement — ${e.name}`,
      categorie: 'evenement',
      prix: AFFICHER_PRIX ? 'sur devis' : 'sur devis en boutique',
      description: `${e.desc}${e.tags?.length ? ` (${e.tags.join(', ')})` : ''}`,
      delai_commande_heures: DELAIS_COMMANDE.evenement,
    });
  }
  return out;
}

export function findProduct(nom, catalogue) {
  const n = String(nom || '').trim().toLowerCase();
  return catalogue.find((p) => p.nom.toLowerCase() === n)
    || catalogue.find((p) => p.nom.toLowerCase().includes(n))
    || catalogue.find((p) => n.includes(p.nom.toLowerCase()));
}
