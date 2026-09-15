import { env } from './env.js';

/**
 * Stockage des messages (voir store.js) :
 *  - role 'user', kind 'text'  : content = texte du client (string)
 *  - role 'assistant'          : content = blocs de contenu complets (tool_use inclus)
 *  - role 'user', kind 'tool'  : content = blocs tool_result
 * `display_text` est ce que l'interface affiche ; `meta` porte un éventuel bouton (cta).
 */

// Messages tels que l'interface les affiche (texte uniquement).
export function toDisplay(rows) {
  return rows
    .filter((r) => r.display_text)
    .map((r) => ({
      from: r.role === 'user' ? 'user' : 'bot',
      text: r.display_text,
      cta: r.meta?.cta || null,
      ticket: r.meta?.ticket || null,
    }));
}

/**
 * Reconstruit l'historique envoyé à l'API, limité aux N derniers tours
 * (un tour commence toujours par un message texte du client, donc la coupe
 * ne sépare jamais un tool_use de son tool_result).
 */
export function toApiMessages(rows, turns = env.historyTurns) {
  const userTextIdx = rows
    .map((r, i) => (r.role === 'user' && r.kind === 'text' ? i : -1))
    .filter((i) => i >= 0);
  const start = userTextIdx.length > turns ? userTextIdx[userTextIdx.length - turns] : 0;
  const slice = rows.slice(start);

  const messages = slice.map((r) => ({ role: r.role, content: r.content }));

  // Sécurité : un tour assistant avec tool_use sans tool_result derrière
  // (fonction interrompue) rendrait la requête invalide → on le retire.
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const hasToolUse = m.role === 'assistant' && Array.isArray(m.content) && m.content.some((b) => b.type === 'tool_use');
    if (!hasToolUse) continue;
    const next = messages[i + 1];
    const answered = next && next.role === 'user' && Array.isArray(next.content) && next.content.some((b) => b.type === 'tool_result');
    if (!answered) messages.splice(i, 1);
  }
  // Le premier message doit être un message utilisateur.
  while (messages.length && messages[0].role !== 'user') messages.shift();

  // Résultats d'outils des anciens tours (catalogue, créneaux…) : volumineux et
  // inutiles ensuite → remplacés par un court résumé pour économiser les tokens.
  const userText = messages.map((m, i) => (m.role === 'user' && typeof m.content === 'string' ? i : -1)).filter((i) => i >= 0);
  const cutoff = userText.length > 2 ? userText[userText.length - 2] : 0;
  for (let i = 0; i < cutoff; i++) {
    const m = messages[i];
    if (m.role === 'user' && Array.isArray(m.content)) {
      m.content = m.content.map((b) => (b.type === 'tool_result' ? { ...b, content: '(résultat omis — ancien tour)' } : b));
    }
  }
  return messages;
}
