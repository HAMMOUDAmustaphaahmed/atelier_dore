// Lecture centralisée des variables d'environnement (Vercel → Settings → Environment Variables).
// Les valeurs par défaut correspondent aux garde-fous décrits dans le README.

const num = (v, d) => (v === undefined || v === '' ? d : Number(v));

export const env = {
  // Fournisseur du modèle : 'anthropic' (Claude, défaut) ou 'groq' (gratuit, compatible OpenAI).
  provider: (process.env.LLM_PROVIDER || 'anthropic').toLowerCase(),
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  groqKey: process.env.GROQ_API_KEY,
  model: process.env.LEA_MODEL || ((process.env.LLM_PROVIDER || '').toLowerCase() === 'groq' ? 'openai/gpt-oss-120b' : 'claude-opus-5'),
  chefModel: process.env.CHEF_MODEL || ((process.env.LLM_PROVIDER || '').toLowerCase() === 'groq' ? 'openai/gpt-oss-20b' : ''),
  guardEnabled: (process.env.LEA_GUARD || 'on') !== 'off',
  guardModel: process.env.LEA_GUARD_MODEL || ((process.env.LLM_PROVIDER || '').toLowerCase() === 'groq' ? 'openai/gpt-oss-20b' : 'claude-haiku-4-5'),
  offtopicStrikes: num(process.env.CHAT_OFFTOPIC_STRIKES, 3),

  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  sessionSecret: process.env.SESSION_SECRET,

  // Emails : 'gmail' (gratuit, mot de passe d'application) ou 'resend' (domaine vérifié).
  // Auto : gmail si GMAIL_USER est défini, sinon resend.
  emailProvider: (process.env.EMAIL_PROVIDER || (process.env.GMAIL_USER ? 'gmail' : 'resend')).toLowerCase(),
  gmailUser: process.env.GMAIL_USER,
  gmailAppPassword: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
  resendKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM || (process.env.GMAIL_USER ? `L'Atelier Doré <${process.env.GMAIL_USER}>` : "L'Atelier Doré <onboarding@resend.dev>"),
  bakeryEmail: process.env.BAKERY_EMAIL,

  // Garde-fous
  maxMessagesPerSession: num(process.env.CHAT_MAX_MESSAGES_PER_SESSION, 20),
  maxMessagesPerIpPerDay: num(process.env.CHAT_MAX_MESSAGES_PER_IP_PER_DAY, 40),
  maxSessionsPerIpPerDay: num(process.env.CHAT_MAX_SESSIONS_PER_IP_PER_DAY, 3),
  minIntervalMs: num(process.env.CHAT_MIN_INTERVAL_MS, 2500),
  maxInputChars: num(process.env.CHAT_MAX_INPUT_CHARS, 400),
  historyTurns: num(process.env.CHAT_HISTORY_TURNS, 12),
  dailyTokenBudget: num(process.env.CHAT_DAILY_TOKEN_BUDGET, 2_000_000),
  maxOutputTokens: num(process.env.CHAT_MAX_OUTPUT_TOKENS, 1200),
  maxOrdersPerSession: num(process.env.ORDERS_MAX_PER_SESSION, 3),
  maxOrdersPerEmailPerDay: num(process.env.ORDERS_MAX_PER_EMAIL_PER_DAY, 3),

  // URL publique du site (liens dans les emails). Déduite de la requête si absente.
  siteUrl: (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, ''),
  cronSecret: process.env.CRON_SECRET,

  // Espace propriétaire (Chef) : mot de passe /admin et /start Telegram
  adminPassword: process.env.ADMIN_PASSWORD,
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,

  isProd: process.env.VERCEL_ENV === 'production',
};

export function assertEnv(keys) {
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) {
    const err = new Error(`Configuration incomplète : ${missing.join(', ')}`);
    err.code = 'CONFIG';
    throw err;
  }
}
