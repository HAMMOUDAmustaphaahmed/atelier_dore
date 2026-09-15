// GET /api/site — configuration publique du site (nom, textes, horaires, palette,
// images, produits) + ardoise du jour + fermetures à venir. Lue au chargement du front.
import { json, error } from './_lib/http.js';
import { getSettings, publicSettings } from './_lib/settings.js';
import { store } from './_lib/store.js';
import { parisNow } from '../src/data/infos.js';

export async function GET() {
  try {
    const settings = await getSettings();
    const today = parisNow().isoDate;
    const [board, closures] = await Promise.all([
      store().getBoard(today).catch(() => null),
      store().listClosures(today).catch(() => []),
    ]);
    return json({ ...publicSettings(settings), board, closures, today }, { headers: { 'cache-control': 'public, max-age=15, s-maxage=15' } });
  } catch (e) {
    console.error('site', e);
    return error(500, 'Configuration indisponible.');
  }
}
