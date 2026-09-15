-- Schéma Supabase pour L'Atelier Doré (phase 1 : chat Léa + garde-fous).
-- À exécuter dans Supabase → SQL Editor → New query → Run.
-- Toutes les tables sont accessibles uniquement via la clé "service role" (serveur),
-- le RLS est activé sans policy : le navigateur ne peut rien lire ni écrire.

create extension if not exists pgcrypto;

-- Sessions de chat (une par visiteur, cookie signé côté serveur)
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_message_at timestamptz,
  ip_hash text,
  message_count integer not null default 0,
  status text not null default 'active' check (status in ('active', 'blocked'))
);
create index if not exists chat_sessions_ip_idx on chat_sessions (ip_hash, created_at desc);

-- Messages (contenu complet pour relecture par l'API + texte affiché)
create table if not exists chat_messages (
  id bigserial primary key,
  session_id uuid not null references chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  kind text not null default 'text' check (kind in ('text', 'tool')),
  content jsonb not null,
  display_text text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_session_idx on chat_messages (session_id, id);

-- Compteurs glissants (rate limiting par IP, anti-spam formulaire…)
create table if not exists counters (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);

-- Consommation quotidienne de tokens (budget global)
create table if not exists usage_daily (
  day date primary key,
  requests integer not null default 0,
  input_tokens bigint not null default 0,
  cache_read_tokens bigint not null default 0,
  cache_write_tokens bigint not null default 0,
  output_tokens bigint not null default 0
);

alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table counters enable row level security;
alter table usage_daily enable row level security;

-- Incrémente un compteur dans une fenêtre glissante ; retourne la nouvelle valeur.
create or replace function bump_counter(p_key text, p_window_seconds integer)
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  insert into counters (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when counters.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else counters.count + 1
        end,
        window_start = case
          when counters.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else counters.window_start
        end
  returning count into v_count;
  return v_count;
end;
$$;

-- Ajoute la consommation d'une requête au jour courant (heure de Paris).
create or replace function add_usage(p_input bigint, p_cache_read bigint, p_cache_write bigint, p_output bigint)
returns void
language plpgsql
security definer
as $$
begin
  insert into usage_daily (day, requests, input_tokens, cache_read_tokens, cache_write_tokens, output_tokens)
  values ((now() at time zone 'Europe/Paris')::date, 1, p_input, p_cache_read, p_cache_write, p_output)
  on conflict (day) do update
    set requests = usage_daily.requests + 1,
        input_tokens = usage_daily.input_tokens + excluded.input_tokens,
        cache_read_tokens = usage_daily.cache_read_tokens + excluded.cache_read_tokens,
        cache_write_tokens = usage_daily.cache_write_tokens + excluded.cache_write_tokens,
        output_tokens = usage_daily.output_tokens + excluded.output_tokens;
end;
$$;

-- Total de tokens (entrée + sortie, cache inclus) consommés aujourd'hui.
create or replace function today_tokens()
returns bigint
language sql
security definer
as $$
  select coalesce(sum(input_tokens + cache_read_tokens + cache_write_tokens + output_tokens), 0)
  from usage_daily
  where day = (now() at time zone 'Europe/Paris')::date;
$$;

-- Nettoyage optionnel : sessions inactives depuis 60 jours (à planifier via pg_cron si souhaité).
-- delete from chat_sessions where last_seen_at < now() - interval '60 days';

-- ---------------------------------------------------------------------------
-- Phase 2 : commandes
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  session_id uuid references chat_sessions (id) on delete set null,
  status text not null default 'en_attente' check (status in ('en_attente', 'confirmee', 'annulee', 'expiree')),
  client jsonb not null,                 -- { nom, email, telephone }
  client_email text not null,            -- copie pour les quotas
  articles jsonb not null,               -- [{ produit, categorie, quantite, prix_unitaire, notes }]
  pickup_at timestamptz not null,
  categorie_max text not null,
  evenement jsonb,                       -- { type, invites, budget, theme } pour les gâteaux d'événement
  notes text,
  total_estime numeric(10,2),
  total_indicatif boolean not null default false,
  confirm_token_hash text unique,
  confirm_expires_at timestamptz not null,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  reminder_email_id text,                -- id Resend de l'email de rappel programmé
  reminder_scheduled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists orders_status_pickup_idx on orders (status, pickup_at);
create index if not exists orders_email_idx on orders (client_email, created_at desc);
alter table orders enable row level security;

-- Rend un tour à une session (échec de l'API avant toute réponse).
create or replace function refund_turn(p_id uuid)
returns void
language sql
security definer
as $$
  update chat_sessions set message_count = greatest(message_count - 1, 0) where id = p_id;
$$;

-- Filtre de périmètre : strikes hors sujet et blocage automatique.
alter table chat_sessions add column if not exists offtopic_count integer not null default 0;

create or replace function add_strike(p_id uuid, p_limit integer)
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  update chat_sessions
     set offtopic_count = offtopic_count + 1,
         status = case when offtopic_count + 1 >= p_limit then 'blocked' else status end
   where id = p_id
   returning offtopic_count into v_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Phase 4 : agent du propriétaire ("le Chef"), Telegram, ardoise, fermetures
-- ---------------------------------------------------------------------------
-- Statuts de commande étendus : prête / retirée
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('en_attente', 'confirmee', 'prete', 'retiree', 'annulee', 'expiree'));
alter table orders add column if not exists ready_at timestamptz;
alter table orders add column if not exists picked_up_at timestamptz;

-- Ardoise du jour (pilotée par le propriétaire, lue par le site et par Léa)
create table if not exists daily_board (
  day date primary key,
  items jsonb not null default '[]',       -- [{ nom, disponible }]
  note text,
  updated_at timestamptz not null default now()
);

-- Fermetures exceptionnelles (jours fériés, congés)
create table if not exists closures (
  day date primary key,
  motif text,
  created_at timestamptz not null default now()
);

-- Conversations autorisées avec le Chef (Telegram, web admin…)
create table if not exists chef_chats (
  chat_id text primary key,                -- ex. 'telegram:123456789' ou 'web:admin'
  name text,
  authorized_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists chef_messages (
  id bigserial primary key,
  chat_id text not null references chef_chats (chat_id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  kind text not null default 'text' check (kind in ('text', 'tool')),
  content jsonb not null,
  display_text text,
  created_at timestamptz not null default now()
);
create index if not exists chef_messages_chat_idx on chef_messages (chat_id, id);

-- Messages reçus via le formulaire de contact
create table if not exists contact_messages (
  id bigserial primary key,
  subject text not null,
  nom text not null,
  email text not null,
  telephone text,
  message text not null,
  evenement jsonb,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table daily_board enable row level security;
alter table closures enable row level security;
alter table chef_chats enable row level security;
alter table chef_messages enable row level security;
alter table contact_messages enable row level security;

-- Configuration du site pilotée par le propriétaire (nom, textes, horaires, palette, images, produits)
create table if not exists site_settings (
  id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table site_settings enable row level security;
