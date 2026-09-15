// Vérification d'un créneau de retrait en boutique (heure de Paris).
import { HORAIRES_SEMAINE, DELAIS_COMMANDE, parisNow, isOpenAt } from '../../src/data/infos.js';

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function fmtHeure(decimal) {
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Convertit une date/heure "mur" de Paris en timestamp UTC (gère l'heure d'été).
export function parisWallToUtc(isoDate, hh, mm) {
  const [y, mo, d] = isoDate.split('-').map(Number);
  const guess = Date.UTC(y, mo - 1, d, hh, mm);
  const wall = parisNow(new Date(guess));
  const [wy, wmo, wd] = wall.isoDate.split('-').map(Number);
  const wallAsUtc = Date.UTC(wy, wmo - 1, wd, wall.hour, wall.minute);
  return guess - (wallAsUtc - guess);
}

export function checkPickupSlot({ date, heure, categorie }, now = new Date(), { horaires = HORAIRES_SEMAINE, closures = [] } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return { disponible: false, raison: 'Format de date invalide (attendu AAAA-MM-JJ).' };
  if (!/^\d{1,2}:\d{2}$/.test(heure || '')) return { disponible: false, raison: "Format d'heure invalide (attendu HH:MM)." };

  const [hh, mm] = heure.split(':').map(Number);
  const decimal = hh + mm / 60;
  const pickupUtc = parisWallToUtc(date, hh, mm);
  if (Number.isNaN(pickupUtc)) return { disponible: false, raison: 'Date invalide.' };

  const wall = parisNow(new Date(pickupUtc)); // jour/heure "mur" à Paris
  const jour = JOURS[wall.day];
  const plage = horaires[wall.day];
  const fermeture = closures.find((c) => c.day === wall.isoDate);
  if (fermeture) {
    return { disponible: false, raison: `La boutique est exceptionnellement fermée le ${date}${fermeture.motif ? ` (${fermeture.motif})` : ''}.`, suggestions: ['Proposer un autre jour.'] };
  }

  if (!plage) {
    return {
      disponible: false,
      raison: `La boutique est fermée le ${jour}.`,
      suggestions: ['Proposer un autre jour.'],
    };
  }
  if (!isOpenAt(wall.day, decimal, horaires)) {
    return {
      disponible: false,
      raison: `Le ${jour}, la boutique est ouverte de ${fmtHeure(plage[0])} à ${fmtHeure(plage[1])}.`,
      suggestions: [`Proposer un horaire entre ${fmtHeure(plage[0])} et ${fmtHeure(plage[1] - 0.5)}.`],
    };
  }

  const delai = DELAIS_COMMANDE[categorie] ?? DELAIS_COMMANDE.patisserie;
  const heuresAvant = (pickupUtc - now.getTime()) / 3_600_000;
  if (heuresAvant < 0) return { disponible: false, raison: 'Ce créneau est déjà passé.' };
  if (heuresAvant < delai) {
    return {
      disponible: false,
      raison: `Il faut au moins ${delai} h de délai pour cette catégorie (${categorie}) ; ce créneau est dans ${Math.floor(heuresAvant)} h.`,
      suggestions: [`Proposer un retrait à partir de ${parisNow(new Date(now.getTime() + delai * 3_600_000)).label}.`],
    };
  }
  return { disponible: true, creneau: `${jour} ${date} à ${heure}`, delai_respecte_heures: Math.floor(heuresAvant), pickup_utc: pickupUtc };
}
