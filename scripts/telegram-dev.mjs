// Développement local : interroge Telegram en boucle (long polling) et traite
// les messages avec la même logique que le webhook. Lance : npm run telegram
// (nécessite .env.local ; en production, Vercel reçoit le webhook à la place).
import { loadEnv } from 'vite';

Object.assign(process.env, loadEnv('development', process.cwd(), ''));
const { handleUpdate, tg, BOT_COMMANDS } = await import('../api/_lib/telegram.js');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error('TELEGRAM_BOT_TOKEN manquant dans .env.local'); process.exit(1); }

// Un webhook actif empêche getUpdates : on le retire pour le mode local.
await tg('deleteWebhook', { drop_pending_updates: false });
await tg('setMyCommands', { commands: BOT_COMMANDS });
const me = await tg('getMe', {});
console.log(`🤖 Bot @${me.result?.username} en écoute (Ctrl+C pour arrêter). Envoyez /start <ADMIN_PASSWORD> depuis Telegram.`);

let offset = 0;
while (true) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates?timeout=50&offset=${offset}`);
    const data = await r.json();
    for (const u of data.result || []) {
      offset = u.update_id + 1;
      const txt = u.message?.text || u.message?.caption || (u.message?.photo ? '[photo]' : '');
      console.log(`← ${u.message?.from?.first_name || '?'}: ${txt.slice(0, 80)}`);
      await handleUpdate(u);
    }
  } catch (e) {
    console.error('polling', e.message);
    await new Promise((res) => setTimeout(res, 3000));
  }
}
