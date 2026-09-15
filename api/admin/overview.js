// GET /api/admin/overview — données du tableau de bord (commandes du jour/demain,
// en attente, demandes de contact, ardoise, fermetures, activité de Léa).
// POST /api/admin/overview { action: 'statut', numero, statut } — action rapide sur une commande.
import { json, error, readJson } from '../_lib/http.js';
import { isAdmin } from '../_lib/admin.js';
import { executeChefTool } from '../_lib/chef.js';
import { getSettings } from '../_lib/settings.js';
import { providerInfo } from '../_lib/llm.js';

const call = async (name, input) => JSON.parse((await executeChefTool(name, input)).result);

export async function GET(request) {
  if (!isAdmin(request)) return error(401, 'Non autorisé.');
  try {
    const [aujourdhui, demain, attente, semaine, contacts, board, closures, stats, settings] = await Promise.all([
      call('list_orders', { periode: 'aujourdhui' }),
      call('list_orders', { periode: 'demain' }),
      call('list_orders', { periode: 'en_attente' }),
      call('list_orders', { periode: 'semaine' }),
      call('list_contact_requests', {}),
      call('get_board', {}),
      call('manage_closure', { action: 'lister' }),
      call('stats', { jours: 7 }),
      getSettings(),
    ]);
    return json({ aujourdhui, demain, attente, semaine, contacts: contacts.demandes, board, closures: closures.fermetures, stats, site: { nom: settings.nom, version: settings.version }, llm: providerInfo() });
  } catch (e) {
    console.error('admin/overview', e);
    return error(500, e.message);
  }
}

export async function POST(request) {
  if (!isAdmin(request)) return error(401, 'Non autorisé.');
  const body = await readJson(request);
  try {
    if (body?.action === 'statut') return json(await call('update_order_status', { numero: body.numero, statut: body.statut, motif: body.motif }));
    if (body?.action === 'contact_traite') return json(await call('mark_contact_handled', { id: body.id }));
    return error(400, 'Action inconnue.');
  } catch (e) {
    return error(500, e.message);
  }
}
