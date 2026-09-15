// POST /api/chat — un message du client → réponse de Léa en streaming (SSE).
//
// Garde-fous appliqués dans l'ordre :
//   1. session valide (cookie signé) ou créée si quota IP non atteint
//   2. message non vide, ≤ CHAT_MAX_INPUT_CHARS
//   3. quota par session (CHAT_MAX_MESSAGES_PER_SESSION)
//   4. intervalle minimum entre deux messages
//   5. quota par IP et par jour
//   6. budget global de tokens du jour
// Les compteurs vivent en base : ni le refresh ni la navigation privée ne les remettent à zéro.

import { env, assertEnv } from './_lib/env.js';
import { error, readJson, getIp, hashIp, siteOrigin } from './_lib/http.js';
import { resolveSession, remainingFor } from './_lib/session.js';
import { store } from './_lib/store.js';
import { toApiMessages, toDisplay } from './_lib/history.js';
import { buildLeaSystem, TOOLS, executeTool, contextBlock } from './_lib/lea.js';
import { getSettings } from './_lib/settings.js';
import { parisNow } from '../src/data/infos.js';
import { runTurn } from './_lib/llm.js';
import { checkScope, OFFTOPIC_REPLIES, BLOCKED_REPLY, looksOutOfScope, SAFE_REPLACEMENT } from './_lib/guard.js';

export const maxDuration = 60;

const MAX_TOOL_ROUNDS = 4;
const DAY = 60 * 60 * 24;

// Réponse SSE statique (sans appel au modèle).
function sse(events, setCookie) {
  const headers = { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' };
  if (setCookie) headers['set-cookie'] = setCookie;
  const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('');
  return new Response(body, { headers });
}

export async function POST(request) {
  try {
    assertEnv([env.provider === 'groq' ? 'groqKey' : 'anthropicKey']);

    const { session, setCookie, reason } = await resolveSession(request, { create: true });
    if (!session) return error(429, 'Trop de nouvelles conversations aujourd\'hui. Appelez-nous ou utilisez le formulaire.', { code: reason || 'too_many_sessions' });

    const body = await readJson(request);
    const text = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!text) return error(400, 'Message vide.', { code: 'empty' });
    if (text.length > env.maxInputChars) return error(400, `Message trop long (max ${env.maxInputChars} caractères).`, { code: 'too_long' });

    if (session.status === 'blocked') return error(403, BLOCKED_REPLY, { code: 'blocked' });
    if (remainingFor(session) <= 0) {
      return error(429, 'Vous avez atteint la limite de messages pour cette conversation.', { code: 'limit_reached', remaining: 0 });
    }

    const last = session.last_message_at ? new Date(session.last_message_at).getTime() : 0;
    if (Date.now() - last < env.minIntervalMs) return error(429, 'Un instant…', { code: 'too_fast' });

    const ipHash = hashIp(getIp(request));
    const ipCount = await store().bumpCounter(`msgs:${ipHash}`, DAY);
    if (ipCount > env.maxMessagesPerIpPerDay) return error(429, 'Limite quotidienne atteinte. Appelez-nous ou utilisez le formulaire.', { code: 'ip_limit' });

    if ((await store().todayTokens()) >= env.dailyTokenBudget) {
      return error(503, 'Léa fait une pause. Le formulaire de contact reste disponible.', { code: 'budget' });
    }

    // --- Réservation du tour : compteur + message client sauvegardés avant l'appel API.
    const count = await store().beginTurn(session.id, session.message_count);
    await store().saveMessage(session.id, { role: 'user', kind: 'text', content: text, displayText: text });
    const remaining = Math.max(env.maxMessagesPerSession - count, 0);

    const rows = await store().loadRows(session.id);

    // --- Filtre de périmètre : hors boulangerie → réponse fixe, Léa n'est pas appelée.
    const scope = await checkScope(text, toDisplay(rows.slice(0, -1)));
    if (!scope.ok) {
      const strikes = await store().addStrike(session.id, env.offtopicStrikes);
      const blocked = strikes >= env.offtopicStrikes;
      const reply = blocked ? BLOCKED_REPLY : OFFTOPIC_REPLIES[Math.min(strikes - 1, OFFTOPIC_REPLIES.length - 1)];
      await store().saveMessage(session.id, { role: 'assistant', kind: 'text', content: [{ type: 'text', text: reply }], displayText: reply });
      return sse([{ type: 'text', delta: reply }, { type: 'done', remaining: blocked ? 0 : remaining, blocked }], setCookie);
    }

    const messages = toApiMessages(rows);

    // Configuration du site + ardoise du jour + fermetures (pilotées par le propriétaire).
    const settings = await getSettings();
    const today = parisNow().isoDate;
    const [board, closures] = await Promise.all([
      store().getBoard(today).catch(() => null),
      store().listClosures(today).catch(() => []),
    ]);
    const systemPrompt = buildLeaSystem(settings);

    // Contexte volatil (date/heure/statut/ardoise) ajouté au dernier message, hors cache.
    const lastMsg = messages[messages.length - 1];
    lastMsg.content = [
      { type: 'text', text: lastMsg.content },
      { type: 'text', text: contextBlock({ settings, board, closures }) },
    ];
    if (remaining === 0) {
      lastMsg.content.push({ type: 'text', text: "[Contexte système : c'est le dernier message autorisé pour cette conversation. Termine proprement et, si une demande est en cours, appelle handoff_to_human avec le récapitulatif.]" });
    }

    const toolCtx = { sessionId: session.id, origin: siteOrigin(request), settings, closures };

    const encoder = new TextEncoder();
    const headers = {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
    };
    if (setCookie) headers['set-cookie'] = setCookie;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        const totalUsage = { input_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, output_tokens: 0 };
        let fullText = '';
        let cta = null;
        let ticket = null;

        try {
          for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
            const message = await runTurn({
              system: systemPrompt,
              tools: TOOLS,
              messages,
              maxTokens: env.maxOutputTokens,
              onText: (delta) => {
                fullText += delta;
                send({ type: 'text', delta });
              },
            });
            for (const k of Object.keys(totalUsage)) totalUsage[k] += message.usage?.[k] || 0;

            const toolUses = message.content.filter((b) => b.type === 'tool_use');
            const textOnly = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');

            if (message.stop_reason !== 'tool_use' || toolUses.length === 0 || round === MAX_TOOL_ROUNDS) {
              let displayText = fullText || textOnly;
              let content = message.content;
              // Post-contrôle : une réponse qui ressemble à du code ou à une sortie
              // du périmètre est remplacée (le texte déjà streamé est écrasé côté client).
              if (looksOutOfScope(displayText)) {
                displayText = SAFE_REPLACEMENT;
                content = [{ type: 'text', text: SAFE_REPLACEMENT }];
                send({ type: 'replace', text: SAFE_REPLACEMENT });
              }
              await store().saveMessage(session.id, {
                role: 'assistant', kind: 'text', content,
                displayText, meta: cta || ticket ? { cta, ticket } : null,
              });
              break;
            }

            // Tour intermédiaire (avec appel d'outil) : on garde les blocs complets pour
            // la relecture, mais on n'affiche que le texte éventuel.
            await store().saveMessage(session.id, { role: 'assistant', kind: 'tool', content: message.content, displayText: null });
            messages.push({ role: 'assistant', content: message.content });

            const results = [];
            for (const tu of toolUses) {
              const { result, cta: toolCta, ticket: toolTicket } = await executeTool(tu.name, tu.input, toolCtx);
              if (toolCta) cta = toolCta;
              if (toolTicket) ticket = toolTicket;
              results.push({ type: 'tool_result', tool_use_id: tu.id, content: result });
            }
            await store().saveMessage(session.id, { role: 'user', kind: 'tool', content: results, displayText: null });
            messages.push({ role: 'user', content: results });
          }

          if (ticket) send({ type: 'ticket', ticket });
          if (cta) send({ type: 'cta', cta });
          send({ type: 'done', remaining });
        } catch (e) {
          console.error('chat stream', e);
          // Aucune réponse produite : le message n'est pas décompté du quota.
          if (!fullText) await store().refundTurn(session.id).catch(() => {});
          const msg = e?.status === 429
            ? 'Léa est très sollicitée, réessayez dans un instant.'
            : 'Léa a rencontré un problème. Réessayez ou utilisez le formulaire de contact.';
          send({ type: 'error', message: msg, remaining: fullText ? remaining : remaining + 1 });
        } finally {
          await store().addUsage(totalUsage);
          controller.close();
        }
      },
    });

    return new Response(stream, { headers });
  } catch (e) {
    console.error('chat', e);
    if (e.code === 'CONFIG') return error(503, e.message, { code: 'config' });
    return error(500, 'Erreur serveur.', { code: 'server' });
  }
}
