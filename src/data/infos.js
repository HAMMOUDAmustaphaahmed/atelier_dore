// Informations pratiques centralisées — utilisées par le front (Footer, Contact)
// ET par le backend (/api, prompt de Léa). Ne pas mettre de JSX ici.

export const BOUTIQUE = {
  nom: "L'Atelier Doré",
  adresse: '123 Rue de la Boulangerie',
  codePostal: '75001',
  ville: 'Paris',
  pays: 'France',
  telephone: '+33 1 23 45 67 89',
  email: 'contact@atelier-dore.fr',
  timezone: 'Europe/Paris',
};

// Horaires : [ouverture, fermeture] en heures décimales, null = fermé.
// Index = getDay() (0 = dimanche).
export const HORAIRES_SEMAINE = {
  0: [7, 17],   // Dimanche
  1: [7, 17],   // Lundi
  2: [7, 17],
  3: [7, 17],
  4: [7, 17],
  5: [7, 17],
  6: [7, 17],   // Samedi
};

export const HORAIRES_AFFICHAGE = [
  { jour: 'Tous les jours', heures: '07:00 – 17:00' },
];

// Délais minimum de commande (en heures) par type de produit.
export const DELAIS_COMMANDE = {
  pain: 12,
  viennoiserie: 12,
  patisserie: 24,
  gateau: 48,
  evenement: 72,
};

// Affichage des prix (site, Léa, tickets, emails). false = « tarifs en boutique ».
export const AFFICHER_PRIX = false;

export const LIVRAISON = {
  rayonKm: 5,
  minimumEuros: 30,
  jours: 'tous les jours',
};

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/**
 * Retourne l'heure locale de Paris décomposée, quelle que soit la timezone
 * du serveur ou du visiteur.
 */
export function parisNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: BOUTIQUE.timezone,
    weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const weekday = get('weekday');
  const day = JOURS.indexOf(weekday);
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));
  return {
    day,                 // 0-6
    weekday,             // 'mardi'
    hour, minute,
    decimal: hour + minute / 60,
    isoDate: `${get('year')}-${get('month')}-${get('day')}`,
    label: `${weekday} ${get('day')}/${get('month')}/${get('year')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  };
}

export function isOpenAt(day, decimalHour, horaires = HORAIRES_SEMAINE) {
  const plage = horaires?.[day];
  if (!plage) return false;
  return decimalHour >= plage[0] && decimalHour < plage[1];
}

export function isOpenNow(date = new Date(), horaires = HORAIRES_SEMAINE) {
  const { day, decimal } = parisNow(date);
  return isOpenAt(day, decimal, horaires);
}

const JOURS_LABEL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const fmtH = (d) => { const h = Math.floor(d); const m = Math.round((d - h) * 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };

/** Regroupe les horaires en lignes lisibles : [{ jour: 'Lundi — Vendredi', heures: '07:00 – 17:00' }]. */
export function horairesAffichage(horaires = HORAIRES_SEMAINE) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const key = (d) => (horaires?.[d] ? `${fmtH(horaires[d][0])} – ${fmtH(horaires[d][1])}` : 'Fermé');
  const groups = [];
  for (const d of order) {
    const k = key(d);
    const last = groups[groups.length - 1];
    if (last && last.heures === k) last.days.push(d); else groups.push({ heures: k, days: [d] });
  }
  if (groups.length === 1) return [{ jour: 'Tous les jours', heures: groups[0].heures }];
  return groups.map((g) => ({ jour: g.days.length > 1 ? `${JOURS_LABEL[g.days[0]]} — ${JOURS_LABEL[g.days[g.days.length - 1]]}` : JOURS_LABEL[g.days[0]], heures: g.heures }));
}
