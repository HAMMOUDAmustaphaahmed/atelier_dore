# L'Atelier Doré — Site vitrine (version améliorée)

Site React (Vite) multi-pages pour une boulangerie-pâtisserie artisanale, avec un habillage GSAP + Framer Motion très scroll-animé.

## Nouveautés de cette version

- **Nouveau contenu produits** (`src/data/products.js`) : pains du jour **sans prix** (la sélection et les tarifs varient chaque fournée, avec une note explicite dans le Menu), viennoiseries et pâtisseries enrichies, gâteaux classiques, et une nouvelle catégorie **Gâteaux d'Événement** (anniversaires, mariages, fiançailles) avec sa propre section immersive sur la page Menu (`#evenements`) et un teaser sur l'accueil.
- **Illustrations produits sur-mesure** (`src/components/icons/ProductIcons.jsx`) : chaque pain, viennoiserie, pâtisserie et gâteau a sa propre icône dessinée en SVG (line-art, `currentColor`), plutôt que des photos de banque — plus cohérent visuellement, sans risque de lien cassé ou de droits d'image.
- **Chatbot flottant** (`src/components/Chatbot.jsx`) : Léa, agent Claude — voir « Phase 1 » ci-dessous.
- **Formulaire de contact repensé en 3 étapes** (`src/pages/Contact.jsx`) : 1) choix visuel de l'objet de la demande (info générale, commande, gâteau d'événement, autre), 2) formulaire qui s'adapte — pour un gâteau d'événement, des champs supplémentaires apparaissent (type d'événement, date souhaitée, nombre d'invités, **slider de budget indicatif**), 3) confirmation animée. Le lien "Demander un devis" du Menu et le chatbot peuvent présélectionner automatiquement l'étape et l'objet.
- **Correctif critique** (versions précédentes) : le hero animé de l'accueil utilisait `pin: true` dans GSAP ScrollTrigger, ce qui provoquait un crash silencieux de React lors du changement de page (pages Menu/Histoire/Contact vides). L'effet utilise désormais `position: sticky` en CSS pur — testé sur de nombreux allers-retours entre toutes les pages, aucune erreur.
- **Loader « entrée dans la boutique »** (`src/components/Loader.jsx`) : four qui cuit, puis « Pousser la porte ». Affiché uniquement à la première visite (`sessionStorage`).
- **Hero "pain qui se fend"**, **header fixe et stable**, **menu mobile** qui se ferme via X ou clic extérieur, **parallax GSAP**, **défilement fluide** (Lenis) — voir historique ci-dessous.

## Phase 1 — Léa devient une IA (Claude) + backend Vercel

Le chatbot à mots-clés est remplacé par **Léa, un agent Claude** (`claude-opus-5`) qui discute avec les clients, consulte le catalogue, vérifie les créneaux de retrait et transmet les commandes prêtes à l'équipe via le formulaire de contact pré-rempli. Le formulaire de contact envoie désormais de vrais emails (Resend).

### Architecture

```
src/                 front React (Vite)
api/                 fonctions serverless Vercel (signature Web : Request → Response)
  session.js         GET  → ouvre/retrouve la session de chat (cookie HttpOnly signé), renvoie l'historique
  chat.js            POST → réponse de Léa en streaming (SSE) avec boucle d'outils
  contact.js         POST → email à la boulangerie + accusé de réception (Resend)
  _lib/lea.js        prompt système, outils (get_catalogue, check_pickup_slot, handoff_to_human)
  _lib/store.js      stockage : Supabase (prod) ou mémoire (dev local sans Supabase)
  _lib/session.js    cookie signé + quota de sessions par IP
supabase/schema.sql  tables + fonctions SQL (à exécuter une fois)
vite-plugin-api.js   sert /api/* en dev avec `npm run dev` (pas besoin du CLI Vercel)
```

La clé Anthropic et les clés Supabase/Resend ne quittent jamais le serveur : le navigateur n'appelle que `/api/*`.

### Garde-fous anti-abus / anti-tokens (tous côté serveur)

| Garde-fou | Variable | Défaut |
|---|---|---|
| Messages max par conversation | `CHAT_MAX_MESSAGES_PER_SESSION` | 20 |
| Messages max par IP et par jour | `CHAT_MAX_MESSAGES_PER_IP_PER_DAY` | 40 |
| Nouvelles conversations par IP et par jour (navigation privée, cookies effacés) | `CHAT_MAX_SESSIONS_PER_IP_PER_DAY` | 3 |
| Intervalle minimum entre deux messages | `CHAT_MIN_INTERVAL_MS` | 2500 ms |
| Longueur max d'un message | `CHAT_MAX_INPUT_CHARS` | 400 |
| Tours d'historique renvoyés au modèle | `CHAT_HISTORY_TURNS` | 12 |
| Budget global de tokens par jour (Léa passe en pause au-delà) | `CHAT_DAILY_TOKEN_BUDGET` | 2 000 000 |
| Tokens de sortie max par réponse | `CHAT_MAX_OUTPUT_TOKENS` | 1200 |

- Un **refresh de page ne coûte rien** : l'historique est rechargé depuis la base (`GET /api/session`), rien n'est renvoyé au modèle.
- Le prompt système et les outils sont en **prompt caching** ; la fin du tour précédent est aussi mise en cache.
- Le compteur de messages est incrémenté **avant** l'appel au modèle : impossible de le contourner en coupant la connexion.
- Léa est limitée à la boulangerie par son prompt ; les consignes contenues dans les messages clients sont ignorées.
- Les IP sont stockées hachées (RGPD).

### Mise en place

1. **Supabase** (gratuit) : créer un projet → *SQL Editor* → coller `supabase/schema.sql` → *Run*. Récupérer `Project URL` et la clé **service_role** (*Settings → API*). *(Fait pour le projet actuel : schéma appliqué, clés dans `.env.local`.)*
   Node 22 est requis par `@supabase/supabase-js` (Vercel l'utilise via `engines` ; en local avec Node 20 le client fonctionne quand même grâce au transport temps réel factice dans `store.js`).
2. **Anthropic** : créer une clé sur console.anthropic.com.
3. **Resend** (gratuit) : créer une clé API. Sans domaine vérifié, l'expéditeur `onboarding@resend.dev` ne peut envoyer **qu'à l'adresse de votre compte Resend** — mettez cette adresse dans `BAKERY_EMAIL` pour tester, puis vérifiez votre domaine pour envoyer partout.
4. Copier `.env.example` en `.env.local` et remplir les valeurs (`SESSION_SECRET` : `openssl rand -hex 32`).
5. `npm run dev` → le site **et** `/api/*` tournent sur http://localhost:5173.
   Pour tester **sans aucune clé** : `SESSION_SECRET=x npm run dev` suffit pour le site ; Léa nécessite `ANTHROPIC_API_KEY`, les emails `RESEND_API_KEY`.
   Sans `SUPABASE_URL`, le stockage est en mémoire (parfait pour tester Léa avec une seule clé Anthropic ; perdu au redémarrage).

### Déploiement Vercel

1. Pousser sur GitHub → Vercel → *Add New Project* (Vite détecté automatiquement).
2. *Settings → Environment Variables* : ajouter toutes les variables de `.env.example` (Supabase **obligatoire** en production).
3. Déployer. Les fonctions `api/*.js` sont déployées automatiquement ; `vercel.json` exclut `/api` de la réécriture SPA.

### Coût indicatif

Avec le cache, une conversation complète de 20 messages coûte ≈ 0,30 $ avec `claude-opus-5`. Pour réduire : `LEA_MODEL=claude-sonnet-5` (≈ 0,12 $) ou `claude-haiku-4-5` (≈ 0,06 $), sans changer le code.

## Phase 2 — Commandes, emails de confirmation et rappels

Léa enregistre désormais les commandes elle-même (outil `create_order`), après récapitulatif et accord explicite du client.

```
Client ──chat──▶ Léa ──create_order──▶ table orders (statut en_attente)
                                        └─▶ email « Confirmez votre commande » (lien valable 48 h)
Client ──clic──▶ /api/orders/confirm?t=…&a=confirm
                   ├─▶ statut confirmee
                   ├─▶ email récap au client + email à la boulangerie
                   └─▶ rappel programmé chez Resend (scheduled_at = retrait − 24 h)
Client ──clic──▶ /api/orders/confirm?t=…&a=cancel  → statut annulee, rappel annulé
Vercel Cron 06:00 UTC ──▶ /api/cron/reminders : programme les rappels > 30 jours, expire les commandes non validées
```

- **Aucune commande fantôme** : sans clic sur le lien, rien n'est engagé et la commande expire après 48 h.
- **Numéro lisible** (`AD-XXXXXX`) affiché dans un ticket de caisse dans le chat, et retrouvable via `get_order` (numéro + email).
- **Gâteaux d'événement** : même flux, libellé « demande de devis » ; l'équipe recontacte le client sous 24 h.
- **Quotas** : 3 commandes par conversation et par email/jour (`ORDERS_MAX_PER_SESSION`, `ORDERS_MAX_PER_EMAIL_PER_DAY`).
- **Validation serveur** stricte : produits du catalogue uniquement, quantités 1–50, créneau vérifié (horaires + délais), email/téléphone contrôlés — le modèle ne peut pas contourner ces règles.
- Page `/commande?statut=…` : atterrissage des liens (confirmée, annulée, expirée, introuvable…).

**Variables supplémentaires** : `PUBLIC_SITE_URL` (liens dans les emails ; déduit de la requête sinon), `CRON_SECRET` (Vercel l'envoie automatiquement au cron). Le cron est déclaré dans `vercel.json` (`0 6 * * *`, compatible plan Hobby).

**Testé localement** avec des serveurs simulés Anthropic/Resend : création, erreurs de validation renvoyées au modèle, confirmation, double clic, suivi, rappel programmé à retrait − 24 h, annulation (rappel Resend annulé), quota, restauration du ticket après refresh.

## Sécurité du périmètre (Léa ne parle que boulangerie)

Trois couches, dont deux déterministes côté serveur :

1. **Filtre avant Léa** (`api/_lib/guard.js`) : chaque message est classé OK / HORS par un petit modèle rapide (`claude-haiku-4-5` ou `openai/gpt-oss-20b` selon le fournisseur). Hors périmètre ou tentative de manipulation (« ignore tes instructions », « tu es maintenant… », faux gérant) → réponse fixe de recadrage, **Léa n'est pas appelée**, aucun token du modèle principal dépensé.
2. **Strikes** : au 3ᵉ message hors sujet (`CHAT_OFFTOPIC_STRIKES`), la session passe en `blocked` en base — définitivement pour ce cookie ; les quotas IP restent en place.
3. **Prompt de Léa** à périmètre strict + **post-contrôle** : une réponse qui ressemblerait à du code est remplacée avant affichage.

Testé en réel : script Python demandé → recadrage ; « ignore tes instructions » → recadrage ; retour au sujet accepté ; 3ᵉ écart → clôture, 403 ensuite.

## Fournisseur de modèle : Claude ou Groq

`LLM_PROVIDER=anthropic` (Claude Opus 5, prompt caching, meilleure fiabilité sur la prise de commande) ou `LLM_PROVIDER=groq` (gratuit, `openai/gpt-oss-120b`, sans cache). La conversion de format est faite dans `api/_lib/llm.js` ; tout le reste (outils, historique, quotas) est identique. Une commande complète a été validée avec Groq.

## Phase 3 — Design et expérience immersive

- **Système de design** : Fraunces (serif variable) + Instrument Sans + Caveat (craie), palette recalibrée dans `tailwind.config.js` (clés `bakery.*` conservées, contrastes AA), grain papier, tailles d'affichage fluides (`text-display-*`), ombres chaudes.
- **Entrée dans la boutique** : le loader (four) se termine par « Pousser la porte » — ouverture automatique après 7 s. Affiché une fois par session.
- **Accueil** : hero « pain qui se fend » + widget *prochaine fournée* et statut live · bandeau défilant · intro éditoriale · **ardoise du jour** à la craie (pains de la fournée) · **vitrine à défilement horizontal** (sticky + scrub GSAP, jamais `pin`) · bento des signatures · **une journée à l'Atelier** (frise dessinée au scroll, étape en cours qui pulse) · **le comptoir** (Léa se manifeste par une bulle quand on arrive devant) · avis.
- **La carte** : navigation par catégories sticky avec scroll-spy, cartes redessinées, « Commander avec Léa » sur chaque produit (ouvre le chat avec le message pré-rempli).
- **Histoire** : compteurs animés, engagement, frise « vingt ans en cinq dates ».
- **Contact** : vraie carte OpenStreetMap (Leaflet, sans clé — coordonnées dans `MapBoutique.jsx`), lien itinéraire, pastille de statut partagée.
- **Global** : routes en lazy-loading, transitions de page, `MotionConfig reducedMotion="user"`, header flottant, menu mobile plein écran, bus d'événements `src/lib/lea.js` (`openLea(message)`, `teaseLea(texte)`), ambiance `data-ambiance="matin|jour|soir"` sur `<html>` selon l'heure, JSON-LD `Bakery`.
- **Prix** : aucun prix affiché (site, Léa, tickets, emails) — interrupteur `AFFICHER_PRIX` dans `src/data/infos.js`.
- **Horaires** : tous les jours 07:00 – 17:00 (`HORAIRES_SEMAINE` / `HORAIRES_AFFICHAGE` dans `src/data/infos.js`) ; fournées 7 h, 11 h, 16 h (`FOURNEES` dans `src/hooks/useBoutique.js`).
- Pas de son (retiré à la demande).

## Phase 4 — Le Chef : l'agent du propriétaire (Telegram + /admin)

Le propriétaire pilote **toute la boulangerie et tout le site** depuis Telegram (`@Atelier_dore_bot`) ou depuis `/admin` sur le site, en français, en langage naturel.

### Accès
- **Telegram** : envoyer `/start VOTRE_MOT_DE_PASSE` (`ADMIN_PASSWORD`) une seule fois ; la conversation est ensuite autorisée (table `chef_chats`). Menu de commandes intégré (`/aide`, `/jour`, `/demain`, `/commandes`, `/attente`, `/ardoise`, `/stats`, `/contacts`, `/images`, `/site`, `/reset`) + boutons rapides sous la zone de saisie.
- **Web** : `/admin` (même mot de passe) — tableau de bord (commandes du jour / demain / en attente, actions « prête » / « retirée », demandes de contact, ardoise, stats) et chat avec le Chef.
- **Chaque matin (cron 04:00 UTC)** : le programme du jour (production agrégée, retraits, commandes en attente, demandes de contact) est envoyé sur Telegram.

### Ce que le Chef sait faire (outils `api/_lib/chef.js`)
| Domaine | Exemples |
|---|---|
| Commandes | « qu'est-ce que je prépare demain ? », « les commandes du mois / de la semaine / entre le 1er et le 15 octobre », « marque AD-XXXX comme prête / retirée », « annule la commande de Marie et préviens-la » (confirmation demandée) |
| Ardoise & fermetures | « plus de pain aux noix aujourd'hui », « ajoute une note : fougasse en plus », « on est fermés le 25 décembre » |
| Site — identité | « change le nom en Maison Doré », « mets le slogan : … », adresse / téléphone / email / Instagram / Facebook |
| Site — textes | titre et sous-titre d'accueil, intro, pied de page |
| Site — horaires | « ouvert du lundi au samedi 6h30–19h, fermé le dimanche », heures de fournées |
| Site — couleurs | palettes prêtes (`doré classique`, `terracotta`, `olive`, `nuit`, `rose pâtisserie`, `bleu océan`, `chocolat noir`) ou codes hexadécimaux par rôle |
| Site — produits | ajouter / modifier / masquer / supprimer un produit par catégorie (repris par la page Carte **et** par Léa) |
| Site — images | envoyer une **photo** dans Telegram : stockée dans Supabase Storage (bucket public `site`), puis placée dans l'emplacement demandé — ou le Chef propose des emplacements (16 slots : hero, portrait, signatures, vitrine ×6, histoire ×3, image de partage) ; une photo peut aussi illustrer un produit |
| Clients | rédiger et envoyer un email à un client (après « oui »), lister/traiter les demandes du formulaire, synthèse de ce que demandent les clients à Léa, statistiques |

### Configuration dynamique
- Tout vit dans `site_settings` (Supabase, une ligne JSON `main`) : les valeurs du code restent les défauts, la base ne stocke que les surcharges. `GET /api/site` sert la configuration publique ; le front l'applique via `src/site/SiteProvider.jsx` (palette en variables CSS, textes, images, produits, horaires). Léa lit la même configuration (catalogue, horaires, ardoise, fermetures).
- Développement local : `npm run telegram` (long polling, pas besoin d'URL publique) + `npm run dev`. En production : enregistrer le webhook une fois :
  `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<site>/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>`
- Test en ligne de commande : `node scripts/chef-test.mjs "Qu'est-ce que je prépare demain ?"`.

### Limite connue (Groq gratuit)
Le palier gratuit de Groq autorise **8 000 tokens/minute par modèle**. Le Chef (`openai/gpt-oss-20b` par défaut, `CHEF_MODEL`) consomme ≈ 2 500 tokens par requête : les tours avec appel d'outil peuvent attendre 15–50 s quand la fenêtre est saturée (le SDK réessaie tout seul). Passer sur le palier payant de Groq ou sur Anthropic (`LLM_PROVIDER=anthropic`) supprime cette attente.

## Stack technique

React 18 + Vite · React Router · Tailwind CSS · Framer Motion · GSAP + ScrollTrigger · Lenis · Leaflet · lucide-react · react-helmet-async (SEO) · Vercel Functions · Anthropic SDK (Claude) ou Groq SDK · Supabase (Postgres + Storage) · Resend · Telegram Bot API

## Lancer en local

```bash
npm install
npm run dev
```

## Build de production

```bash
npm run build
npm run preview
```

## Déployer sur Vercel

1. Poussez le projet sur GitHub (ou utilisez `vercel` en CLI directement dans ce dossier).
2. Sur [vercel.com](https://vercel.com) → "Add New Project" → sélectionnez le dépôt.
3. Vercel détecte Vite automatiquement (Build Command `npm run build`, Output Directory `dist`).
4. Déployez. Le fichier `vercel.json` inclus gère déjà les routes internes (`/menu`, `/histoire`, `/contact`) pour qu'elles fonctionnent au rechargement direct.

## Personnaliser

- **Couleurs / typo** : `tailwind.config.js` (`bakery.*`, polices) et `src/index.css` (grain, ardoise).
- **Photos d'ambiance** : images Unsplash de démonstration référencées par URL dans `Home.jsx` et `Histoire.jsx` — remplacez-les par vos propres visuels.
- **Produits (pains, viennoiseries, pâtisseries, gâteaux, gâteaux d'événement)** : tout est centralisé dans `src/data/products.js`. Les icônes disponibles sont listées dans `src/components/ProductCard.jsx` (objet `ICONS`) et dessinées dans `src/components/icons/ProductIcons.jsx` — vous pouvez en ajouter facilement en suivant le même style.
- **Comportement de Léa** : `api/_lib/lea.js` (`SYSTEM_PROMPT`, outils) ; infos boutique/horaires/délais : `src/data/infos.js`.
- **Étapes et champs du formulaire de contact** : `src/pages/Contact.jsx` (tableaux `SUBJECTS` et `EVENT_TYPES`).
- **Adresse / horaires / statut ouvert-fermé** : `src/data/infos.js` (partagé front + backend).
- **Durée du loader** : constantes `DURATION` et `AUTO_OPEN_AFTER` en haut de `src/components/Loader.jsx`.
- **Intensité de la fente du pain** : dans `BreadReveal.jsx`, ajustez `xPercent` dans le `gsap.timeline()`.

## Accessibilité

- Les animations respectent `prefers-reduced-motion`.
- Le focus clavier est visible sur les liens et boutons.
- Le loader est annoncé via `role="status"` / `aria-live="polite"`.
