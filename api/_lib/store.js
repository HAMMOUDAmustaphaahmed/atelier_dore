// Couche de stockage : Supabase en production, mémoire en local si SUPABASE_URL
// est absent (pratique pour tester Léa avec une seule clé Anthropic).
// Le mode mémoire est refusé sur Vercel : les fonctions y sont sans état.

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { env, assertEnv } from './env.js';

const ON_VERCEL = !!process.env.VERCEL;

// ---------------------------------------------------------------------------
// Implémentation Supabase
// ---------------------------------------------------------------------------
function supabaseStore() {
  assertEnv(['supabaseUrl', 'supabaseServiceKey']);
  const db = createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Le temps réel n'est pas utilisé : on fournit un transport factice pour que
    // le client s'instancie aussi sous Node < 22 (pas de WebSocket global).
    realtime: { transport: globalThis.WebSocket ?? function NoWebSocket() { throw new Error('Realtime désactivé'); } },
  });
  const rpc = async (fn, args) => {
    const { data, error } = await db.rpc(fn, args);
    if (error) throw error;
    return data;
  };
  return {
    kind: 'supabase',
    async getSession(id) {
      const { data, error } = await db.from('chat_sessions').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async createSession(ipHash) {
      const { data, error } = await db.from('chat_sessions').insert({ id: randomUUID(), ip_hash: ipHash }).select('*').single();
      if (error) throw error;
      return data;
    },
    // Réserve un tour : incrémente le compteur, retourne le nouveau total.
    async beginTurn(id, currentCount) {
      const now = new Date().toISOString();
      const { data, error } = await db
        .from('chat_sessions')
        .update({ message_count: currentCount + 1, last_message_at: now, last_seen_at: now })
        .eq('id', id)
        .select('message_count')
        .single();
      if (error) throw error;
      return data.message_count;
    },
    // Message hors sujet : incrémente les strikes, bloque la session au seuil. Retourne le total.
    async addStrike(id, limit) {
      const { data, error } = await db.rpc('add_strike', { p_id: id, p_limit: limit });
      if (error) throw error;
      return data;
    },
    // Rend un tour au client quand l'API a échoué avant toute réponse.
    async refundTurn(id) {
      const { error } = await db.rpc('refund_turn', { p_id: id });
      if (error) console.error('refund_turn', error.message);
    },
    bumpCounter: (key, windowSeconds) => rpc('bump_counter', { p_key: key, p_window_seconds: windowSeconds }),
    async addUsage(u) {
      try {
        await rpc('add_usage', {
          p_input: u.input_tokens || 0, p_cache_read: u.cache_read_input_tokens || 0,
          p_cache_write: u.cache_creation_input_tokens || 0, p_output: u.output_tokens || 0,
        });
      } catch (e) { console.error('add_usage', e.message); }
    },
    async todayTokens() {
      try { return Number(await rpc('today_tokens')) || 0; } catch (e) { console.error('today_tokens', e.message); return 0; }
    },
    async saveMessage(sessionId, row) {
      const { error } = await db.from('chat_messages').insert({
        session_id: sessionId, role: row.role, kind: row.kind, content: row.content,
        display_text: row.displayText ?? null, meta: row.meta ?? null,
      });
      if (error) throw error;
    },
    async loadRows(sessionId) {
      const { data, error } = await db
        .from('chat_messages')
        .select('id, role, kind, content, display_text, meta, created_at')
        .eq('session_id', sessionId)
        .order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    },

    // ----- Commandes -----
    async createOrder(order) {
      const { data, error } = await db.from('orders').insert(order).select('*').single();
      if (error) throw error;
      return data;
    },
    async getOrderByTokenHash(hash) {
      const { data, error } = await db.from('orders').select('*').eq('confirm_token_hash', hash).maybeSingle();
      if (error) throw error;
      return data;
    },
    async getOrderByNumero(numero) {
      const { data, error } = await db.from('orders').select('*').eq('numero', numero).maybeSingle();
      if (error) throw error;
      return data;
    },
    async updateOrder(id, patch) {
      const { data, error } = await db.from('orders').update(patch).eq('id', id).select('*').single();
      if (error) throw error;
      return data;
    },
    async countOrders(field, value, sinceIso) {
      const { count, error } = await db.from('orders').select('id', { count: 'exact', head: true }).eq(field, value).gte('created_at', sinceIso);
      if (error) throw error;
      return count || 0;
    },
    // Commandes confirmées dont le rappel n'est pas encore programmé, retrait à venir.
    async ordersNeedingReminder(nowIso) {
      const { data, error } = await db.from('orders').select('*')
        .eq('status', 'confirmee').is('reminder_email_id', null).gt('pickup_at', nowIso).order('pickup_at');
      if (error) throw error;
      return data || [];
    },
    // Commandes en attente dont le délai de confirmation est dépassé.
    async expirePendingOrders(nowIso) {
      const { data, error } = await db.from('orders').update({ status: 'expiree' })
        .eq('status', 'en_attente').lt('confirm_expires_at', nowIso).select('id');
      if (error) throw error;
      return (data || []).length;
    },
    // Commandes par fenêtre de retrait et/ou statuts (pour le Chef et le tableau de bord).
    async listOrders({ fromIso, toIso, statuses, limit = 200 } = {}) {
      let q = db.from('orders').select('*').order('pickup_at', { ascending: true }).limit(limit);
      if (fromIso) q = q.gte('pickup_at', fromIso);
      if (toIso) q = q.lt('pickup_at', toIso);
      if (statuses?.length) q = q.in('status', statuses);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },

    // ----- Ardoise / fermetures -----
    async getBoard(day) {
      const { data, error } = await db.from('daily_board').select('*').eq('day', day).maybeSingle();
      if (error) throw error;
      return data;
    },
    async setBoard(day, items, note) {
      const { data, error } = await db.from('daily_board').upsert({ day, items, note: note ?? null, updated_at: new Date().toISOString() }).select('*').single();
      if (error) throw error;
      return data;
    },
    async listClosures(fromDay) {
      const { data, error } = await db.from('closures').select('*').gte('day', fromDay).order('day');
      if (error) throw error;
      return data || [];
    },
    async addClosure(day, motif) {
      const { error } = await db.from('closures').upsert({ day, motif: motif ?? null });
      if (error) throw error;
    },
    async removeClosure(day) {
      const { error } = await db.from('closures').delete().eq('day', day);
      if (error) throw error;
    },

    // ----- Chef (agent du propriétaire) -----
    async getChefChat(chatId) {
      const { data, error } = await db.from('chef_chats').select('*').eq('chat_id', chatId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async authorizeChefChat(chatId, name) {
      const { error } = await db.from('chef_chats').upsert({ chat_id: chatId, name: name ?? null, last_seen_at: new Date().toISOString() });
      if (error) throw error;
    },
    async listChefChats() {
      const { data, error } = await db.from('chef_chats').select('*');
      if (error) throw error;
      return data || [];
    },
    async saveChefMessage(chatId, row) {
      const { error } = await db.from('chef_messages').insert({ chat_id: chatId, role: row.role, kind: row.kind, content: row.content, display_text: row.displayText ?? null });
      if (error) throw error;
    },
    async loadChefMessages(chatId, limit = 60) {
      const { data, error } = await db.from('chef_messages').select('id, role, kind, content, display_text, created_at')
        .eq('chat_id', chatId).order('id', { ascending: false }).limit(limit);
      if (error) throw error;
      return (data || []).reverse();
    },
    async clearChefMessages(chatId) {
      const { error } = await db.from('chef_messages').delete().eq('chat_id', chatId);
      if (error) throw error;
    },

    // ----- Formulaire de contact -----
    async saveContact(row) {
      const { error } = await db.from('contact_messages').insert(row);
      if (error) throw error;
    },
    async listContacts({ onlyOpen = true, limit = 50 } = {}) {
      let q = db.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(limit);
      if (onlyOpen) q = q.is('handled_at', null);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async markContactHandled(id) {
      const { error } = await db.from('contact_messages').update({ handled_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    // Messages clients récents (chat Léa) pour les synthèses du Chef.
    async recentCustomerMessages(sinceIso, limit = 300) {
      const { data, error } = await db.from('chat_messages').select('display_text, role, created_at')
        .gte('created_at', sinceIso).not('display_text', 'is', null).order('id', { ascending: false }).limit(limit);
      if (error) throw error;
      return (data || []).reverse();
    },
    async usageSince(day) {
      const { data, error } = await db.from('usage_daily').select('*').gte('day', day).order('day');
      if (error) throw error;
      return data || [];
    },

    // ----- Configuration du site -----
    async getSettings() {
      const { data, error } = await db.from('site_settings').select('data').eq('id', 'main').maybeSingle();
      if (error) throw error;
      return data?.data || null;
    },
    async saveSettings(data) {
      const { error } = await db.from('site_settings').upsert({ id: 'main', data, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    // Fichier public (images du site). Crée le bucket "site" au premier usage.
    async uploadPublicFile(path, buffer, contentType) {
      const bucket = 'site';
      let { error } = await db.storage.from(bucket).upload(path, buffer, { contentType, upsert: false });
      if (error && /bucket/i.test(error.message)) {
        await db.storage.createBucket(bucket, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
        ({ error } = await db.storage.from(bucket).upload(path, buffer, { contentType, upsert: false }));
      }
      if (error) throw error;
      return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },
  };
}

// ---------------------------------------------------------------------------
// Implémentation mémoire (développement local uniquement)
// ---------------------------------------------------------------------------
function memoryStore() {
  const sessions = new Map();
  const messages = new Map(); // sessionId → rows[]
  const counters = new Map();
  const orders = new Map();
  const boards = new Map();
  const closures = new Map();
  const chefChats = new Map();
  const chefMsgs = new Map();
  const contacts = [];
  let settings = null;
  const usage = { tokens: 0, day: '' };
  let nextId = 1;
  const today = () => new Date().toISOString().slice(0, 10);
  return {
    kind: 'memory',
    async getSession(id) { return sessions.get(id) || null; },
    async createSession(ipHash) {
      const s = { id: randomUUID(), ip_hash: ipHash, message_count: 0, status: 'active', last_message_at: null, created_at: new Date().toISOString() };
      sessions.set(s.id, s);
      return s;
    },
    async beginTurn(id) {
      const s = sessions.get(id);
      s.message_count += 1;
      s.last_message_at = new Date().toISOString();
      return s.message_count;
    },
    async refundTurn(id) { const s = sessions.get(id); if (s && s.message_count > 0) s.message_count -= 1; },
    async addStrike(id, limit) { const s = sessions.get(id); s.offtopic_count = (s.offtopic_count || 0) + 1; if (s.offtopic_count >= limit) s.status = 'blocked'; return s.offtopic_count; },
    async bumpCounter(key, windowSeconds) {
      const now = Date.now();
      const c = counters.get(key);
      if (!c || now - c.start > windowSeconds * 1000) { counters.set(key, { count: 1, start: now }); return 1; }
      c.count += 1;
      return c.count;
    },
    async addUsage(u) {
      if (usage.day !== today()) { usage.day = today(); usage.tokens = 0; }
      usage.tokens += (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.output_tokens || 0);
    },
    async todayTokens() { return usage.day === today() ? usage.tokens : 0; },
    async saveMessage(sessionId, row) {
      if (!messages.has(sessionId)) messages.set(sessionId, []);
      messages.get(sessionId).push({ id: nextId++, role: row.role, kind: row.kind, content: row.content, display_text: row.displayText ?? null, meta: row.meta ?? null });
    },
    async loadRows(sessionId) { return messages.get(sessionId) || []; },

    // ----- Commandes -----
    async createOrder(order) {
      const o = { id: randomUUID(), created_at: new Date().toISOString(), ...order };
      orders.set(o.id, o);
      return o;
    },
    async getOrderByTokenHash(hash) { return [...orders.values()].find((o) => o.confirm_token_hash === hash) || null; },
    async getOrderByNumero(numero) { return [...orders.values()].find((o) => o.numero === numero) || null; },
    async updateOrder(id, patch) { const o = Object.assign(orders.get(id), patch); return o; },
    async countOrders(field, value, sinceIso) {
      return [...orders.values()].filter((o) => (field === 'client_email' ? o.client?.email : o[field]) === value && o.created_at >= sinceIso).length;
    },
    async ordersNeedingReminder(nowIso) {
      return [...orders.values()].filter((o) => o.status === 'confirmee' && !o.reminder_email_id && o.pickup_at > nowIso);
    },
    async expirePendingOrders(nowIso) {
      let n = 0;
      for (const o of orders.values()) if (o.status === 'en_attente' && o.confirm_expires_at < nowIso) { o.status = 'expiree'; n++; }
      return n;
    },
    async listOrders({ fromIso, toIso, statuses, limit = 200 } = {}) {
      return [...orders.values()].filter((o) => (!fromIso || o.pickup_at >= fromIso) && (!toIso || o.pickup_at < toIso) && (!statuses?.length || statuses.includes(o.status)))
        .sort((a, b) => a.pickup_at.localeCompare(b.pickup_at)).slice(0, limit);
    },
    async getBoard(day) { return boards.get(day) || null; },
    async setBoard(day, items, note) { const b = { day, items, note: note ?? null, updated_at: new Date().toISOString() }; boards.set(day, b); return b; },
    async listClosures(fromDay) { return [...closures.values()].filter((c) => c.day >= fromDay).sort((a, b) => a.day.localeCompare(b.day)); },
    async addClosure(day, motif) { closures.set(day, { day, motif: motif ?? null }); },
    async removeClosure(day) { closures.delete(day); },
    async getChefChat(chatId) { return chefChats.get(chatId) || null; },
    async authorizeChefChat(chatId, name) { chefChats.set(chatId, { chat_id: chatId, name: name ?? null, authorized_at: new Date().toISOString() }); },
    async listChefChats() { return [...chefChats.values()]; },
    async saveChefMessage(chatId, row) { if (!chefMsgs.has(chatId)) chefMsgs.set(chatId, []); chefMsgs.get(chatId).push({ id: nextId++, role: row.role, kind: row.kind, content: row.content, display_text: row.displayText ?? null }); },
    async loadChefMessages(chatId, limit = 60) { return (chefMsgs.get(chatId) || []).slice(-limit); },
    async clearChefMessages(chatId) { chefMsgs.delete(chatId); },
    async saveContact(row) { contacts.unshift({ id: nextId++, created_at: new Date().toISOString(), handled_at: null, ...row }); },
    async listContacts({ onlyOpen = true, limit = 50 } = {}) { return contacts.filter((c) => !onlyOpen || !c.handled_at).slice(0, limit); },
    async markContactHandled(id) { const c = contacts.find((x) => x.id === id); if (c) c.handled_at = new Date().toISOString(); },
    async recentCustomerMessages(sinceIso, limit = 300) {
      const out = [];
      for (const rows of messages.values()) for (const r of rows) if (r.display_text) out.push({ display_text: r.display_text, role: r.role, created_at: sinceIso });
      return out.slice(-limit);
    },
    async usageSince() { return [{ day: today(), requests: 0, input_tokens: usage.tokens, cache_read_tokens: 0, cache_write_tokens: 0, output_tokens: 0 }]; },
    async getSettings() { return settings; },
    async saveSettings(data) { settings = data; },
    async uploadPublicFile() { throw new Error('Le stockage d\'images nécessite Supabase (SUPABASE_URL).'); },
  };
}

let instance;
export function store() {
  if (instance) return instance;
  if (env.supabaseUrl) {
    instance = supabaseStore();
  } else if (ON_VERCEL) {
    assertEnv(['supabaseUrl', 'supabaseServiceKey']);
  } else {
    console.warn('[store] SUPABASE_URL absent : stockage en mémoire (dev uniquement, perdu au redémarrage).');
    instance = memoryStore();
  }
  return instance;
}
