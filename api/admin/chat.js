// POST /api/admin/chat { message } → réponse du Chef en streaming (SSE)
// GET  /api/admin/chat → historique · DELETE → remise à zéro
import { json, error, readJson } from '../_lib/http.js';
import { isAdmin } from '../_lib/admin.js';
import { chefTurn } from '../_lib/chef.js';
import { store } from '../_lib/store.js';

export const maxDuration = 60;
const CHAT_ID = 'web:admin';

async function ensureChat() {
  if (!(await store().getChefChat(CHAT_ID))) await store().authorizeChefChat(CHAT_ID, 'Espace admin');
}

export async function GET(request) {
  if (!isAdmin(request)) return error(401, 'Non autorisé.');
  await ensureChat();
  const rows = await store().loadChefMessages(CHAT_ID, 80);
  return json({ messages: rows.filter((r) => r.display_text).map((r) => ({ from: r.role === 'user' ? 'user' : 'bot', text: r.display_text })) });
}

export async function DELETE(request) {
  if (!isAdmin(request)) return error(401, 'Non autorisé.');
  await store().clearChefMessages(CHAT_ID);
  return json({ ok: true });
}

export async function POST(request) {
  if (!isAdmin(request)) return error(401, 'Non autorisé.');
  const body = await readJson(request);
  const text = String(body?.message || '').trim().slice(0, 2000);
  if (!text) return error(400, 'Message vide.');
  await ensureChat();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (ev) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
      try {
        let streamed = '';
        const reply = await chefTurn(CHAT_ID, text, (d) => { streamed += d; send({ type: 'text', delta: d }); });
        // Si le texte final diffère du flux (ex. réponse après des appels d'outils), on remplace.
        if (reply !== streamed) send({ type: 'replace', text: reply });
        send({ type: 'done' });
      } catch (e) {
        console.error('admin/chat', e);
        send({ type: 'error', message: e.message });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' } });
}
