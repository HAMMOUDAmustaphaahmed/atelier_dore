// Couche fournisseur LLM : Anthropic (Claude) ou Groq (API compatible OpenAI).
// Le reste du backend manipule uniquement le format "blocs" d'Anthropic
// ({type:'text'|'tool_use'|'tool_result'}), converti ici pour Groq.
//
//   LLM_PROVIDER=anthropic  → claude-opus-5 (défaut), prompt caching, effort low
//   LLM_PROVIDER=groq       → openai/gpt-oss-120b (défaut), gratuit, sans cache

import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { env, assertEnv } from './env.js';

let anthropic;
let groq;

export function providerInfo() {
  return { provider: env.provider, model: env.model, guardModel: env.guardModel };
}

/**
 * Un tour de génération en streaming.
 * @param {object} p
 * @param {string} p.system            prompt système (stable, mis en cache chez Anthropic)
 * @param {Array}  p.tools             définitions d'outils au format Anthropic
 * @param {Array}  p.messages          historique au format Anthropic (blocs)
 * @param {number} p.maxTokens
 * @param {(delta:string)=>void} p.onText
 * @returns {Promise<{content: Array, stop_reason: string, usage: object}>}
 */
export async function runTurn(p) {
  return env.provider === 'groq' ? groqTurn(p) : anthropicTurn(p);
}
// runTurn permet de surcharger le modèle par appel (p.model) — utilisé par le Chef.

/** Réponse courte non streamée (filtre de périmètre). */
export async function complete({ system, user, maxTokens = 10, model }) {
  if (env.provider === 'groq') {
    assertEnv(['groqKey']);
    groq ||= new Groq({ apiKey: env.groqKey, maxRetries: 6 }); // palier gratuit : 8k tokens/min → on attend plutôt qu'échouer
    const res = await groq.chat.completions.create({
      model: model || env.guardModel,
      max_completion_tokens: maxTokens,
      temperature: 0,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      ...(isReasoningModel(model || env.guardModel) ? { reasoning_effort: 'low' } : {}),
    });
    return res.choices?.[0]?.message?.content || '';
  }
  assertEnv(['anthropicKey']);
  anthropic ||= new Anthropic({ apiKey: env.anthropicKey });
  const res = await anthropic.messages.create({
    model: model || env.guardModel,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  return res.content.find((b) => b.type === 'text')?.text || '';
}

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------
async function anthropicTurn(p) {
  const { system, tools, messages, maxTokens, onText } = p;
  assertEnv(['anthropicKey']);
  anthropic ||= new Anthropic({ apiKey: env.anthropicKey });

  // Deuxième point de cache : fin du dernier tour assistant, pour que la
  // conversation précédente soit relue depuis le cache au tour suivant.
  const msgs = messages.map((m) => ({ ...m }));
  for (let i = msgs.length - 2; i >= 0; i--) {
    const m = msgs[i];
    if (m.role === 'assistant' && Array.isArray(m.content) && m.content.length) {
      const blocks = m.content.map((b) => ({ ...b }));
      blocks[blocks.length - 1] = { ...blocks[blocks.length - 1], cache_control: { type: 'ephemeral' } };
      msgs[i] = { ...m, content: blocks };
      break;
    }
  }

  const s = anthropic.messages.stream({
    model: p.model || env.model,
    max_tokens: maxTokens,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    tools,
    messages: msgs,
    output_config: { effort: 'low' },
  });
  s.on('text', onText);
  const message = await s.finalMessage();
  return { content: message.content, stop_reason: message.stop_reason, usage: message.usage };
}

// ---------------------------------------------------------------------------
// Groq (compatible OpenAI)
// ---------------------------------------------------------------------------
const isReasoningModel = (m) => /gpt-oss|qwen3|deepseek|compound/i.test(m || '');

function textOf(content) {
  if (typeof content === 'string') return content;
  return (content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

// Historique Anthropic → messages OpenAI.
function toOpenAiMessages(system, messages) {
  const out = [{ role: 'system', content: system }];
  for (const m of messages) {
    if (m.role === 'user') {
      const results = Array.isArray(m.content) ? m.content.filter((b) => b.type === 'tool_result') : [];
      if (results.length) {
        for (const r of results) {
          out.push({ role: 'tool', tool_call_id: r.tool_use_id, content: typeof r.content === 'string' ? r.content : JSON.stringify(r.content) });
        }
      } else {
        out.push({ role: 'user', content: textOf(m.content) });
      }
    } else if (m.role === 'assistant') {
      const blocks = Array.isArray(m.content) ? m.content : [{ type: 'text', text: String(m.content) }];
      const toolCalls = blocks
        .filter((b) => b.type === 'tool_use')
        .map((b) => ({ id: b.id, type: 'function', function: { name: b.name, arguments: JSON.stringify(b.input || {}) } }));
      const msg = { role: 'assistant', content: textOf(blocks) || null };
      if (toolCalls.length) msg.tool_calls = toolCalls;
      out.push(msg);
    }
  }
  return out;
}

function toOpenAiTools(tools) {
  return tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } }));
}

async function groqTurn(p) {
  const { system, tools, messages, maxTokens, onText } = p;
  const model = p.model || env.model;
  assertEnv(['groqKey']);
  groq ||= new Groq({ apiKey: env.groqKey, maxRetries: 6 }); // palier gratuit : 8k tokens/min → on attend plutôt qu'échouer

  const stream = await groq.chat.completions.create({
    model,
    max_completion_tokens: maxTokens,
    temperature: 0.4,
    stream: true,
    messages: toOpenAiMessages(system, messages),
    tools: toOpenAiTools(tools),
    tool_choice: 'auto',
    ...(isReasoningModel(model) ? { reasoning_effort: 'low' } : {}),
  });

  let text = '';
  const calls = new Map(); // index → { id, name, args }
  let finish = null;
  let usage = null;
  for await (const chunk of stream) {
    const choice = chunk.choices?.[0];
    if (choice?.delta?.content) {
      text += choice.delta.content;
      onText(choice.delta.content);
    }
    for (const tc of choice?.delta?.tool_calls || []) {
      const cur = calls.get(tc.index) || { id: tc.id, name: '', args: '' };
      if (tc.id) cur.id = tc.id;
      if (tc.function?.name) cur.name += tc.function.name;
      if (tc.function?.arguments) cur.args += tc.function.arguments;
      calls.set(tc.index, cur);
    }
    if (choice?.finish_reason) finish = choice.finish_reason;
    if (chunk.x_groq?.usage) usage = chunk.x_groq.usage;
    if (chunk.usage) usage = chunk.usage;
  }

  const content = [];
  if (text) content.push({ type: 'text', text });
  for (const c of [...calls.values()]) {
    let input = {};
    try { input = c.args ? JSON.parse(c.args) : {}; } catch { input = { _raw: c.args }; }
    content.push({ type: 'tool_use', id: c.id || `call_${Math.random().toString(36).slice(2, 10)}`, name: c.name, input });
  }
  const stop_reason = calls.size ? 'tool_use' : finish === 'length' ? 'max_tokens' : 'end_turn';
  return {
    content,
    stop_reason,
    usage: {
      input_tokens: usage?.prompt_tokens || 0,
      output_tokens: usage?.completion_tokens || 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
  };
}
