// Test manuel du Chef en ligne de commande : node scripts/chef-test.mjs "message"
import { loadEnv } from 'vite';
Object.assign(process.env, loadEnv('development', process.cwd(), ''));
const { chefTurn } = await import('../api/_lib/chef.js');
const { store } = await import('../api/_lib/store.js');

const chatId = 'test:cli';
await store().authorizeChefChat(chatId, 'Test CLI');
const msgs = process.argv.slice(2);
if (msgs[0] === '--reset') { await store().clearChefMessages(chatId); msgs.shift(); }
for (const m of msgs) {
  console.log(`\n👤 ${m}`);
  const t0 = Date.now();
  const reply = await chefTurn(chatId, m);
  console.log(`👨‍🍳 ${reply}\n   (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
