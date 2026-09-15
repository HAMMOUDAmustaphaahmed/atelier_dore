import { useEffect, useState } from 'react';
import { HORAIRES_SEMAINE, parisNow, isOpenAt } from '../data/infos';
import { useSite } from '../site/SiteProvider';

// Heures des fournées par défaut (modifiables par le propriétaire).
export const FOURNEES = [7, 11, 16];
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function fmt(decimal) {
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return `${h}h${m ? String(m).padStart(2, '0') : ''}`;
}

/**
 * Statut live de la boutique (heure de Paris) :
 *  - open, closesAt, opensAt (libellés)
 *  - ambiance : 'matin' | 'jour' | 'soir'
 *  - nextBatch : { label, minutes } prochaine fournée
 */
export function computeBoutique(date = new Date(), horaires = HORAIRES_SEMAINE, fournees = FOURNEES) {
  const HORAIRES_SEMAINE = horaires;
  const FOURNEES = fournees;
  const now = parisNow(date);
  const plage = HORAIRES_SEMAINE[now.day];
  const open = isOpenAt(now.day, now.decimal, HORAIRES_SEMAINE);

  let closesAt = null;
  let opensAt = null;
  if (open) closesAt = fmt(plage[1]);
  else {
    // prochaine ouverture
    for (let i = 0; i < 8; i++) {
      const d = (now.day + i) % 7;
      const p = HORAIRES_SEMAINE[d];
      if (!p) continue;
      if (i === 0 && now.decimal >= p[0]) continue;
      opensAt = i === 0 ? `aujourd'hui à ${fmt(p[0])}` : i === 1 ? `demain à ${fmt(p[0])}` : `${JOURS[d]} à ${fmt(p[0])}`;
      break;
    }
  }

  // prochaine fournée
  let nextBatch = null;
  for (let i = 0; i < 8 && !nextBatch; i++) {
    const d = (now.day + i) % 7;
    if (!HORAIRES_SEMAINE[d]) continue;
    for (const f of FOURNEES) {
      if (i === 0 && f <= now.decimal + 1 / 60) continue;
      if (f > HORAIRES_SEMAINE[d][1]) continue;
      const minutes = Math.round(((i * 24 + f) - now.decimal) * 60);
      nextBatch = {
        hour: fmt(f),
        minutes,
        label: i === 0 ? `dans ${minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}` : `${minutes} min`}` : i === 1 ? `demain ${fmt(f)}` : `${JOURS[d]} ${fmt(f)}`,
        today: i === 0,
      };
      break;
    }
  }

  const ambiance = !open ? 'soir' : now.decimal < 10 ? 'matin' : now.decimal >= 17 ? 'soir' : 'jour';
  return { open, closesAt, opensAt, ambiance, nextBatch, now };
}

export function useBoutique(refreshMs = 30_000) {
  const { horaires, fournees } = useSite();
  const [state, setState] = useState(() => computeBoutique(new Date(), horaires, fournees));
  useEffect(() => {
    setState(computeBoutique(new Date(), horaires, fournees));
    const id = setInterval(() => setState(computeBoutique(new Date(), horaires, fournees)), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, horaires, fournees]);
  useEffect(() => {
    document.documentElement.dataset.ambiance = state.ambiance;
  }, [state.ambiance]);
  return state;
}
