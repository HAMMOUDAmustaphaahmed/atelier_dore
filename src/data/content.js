// Registre de tous les textes modifiables du site (front ET backend).
// Chaque clé : { page, label, defaut }. Le propriétaire les change via le Chef
// (outils list_content / set_content) ; les surcharges vivent dans site_settings.textes.
// Ne pas mettre de JSX ici.

const K = (page, label, defaut) => ({ page, label, defaut });

export const CONTENT = {
  // ---------- Accueil : hero ----------
  hero_kicker: K('accueil', 'Petite ligne au-dessus du grand titre', "Cuit chaque matin, dès l'aube"),
  hero_titre: K('accueil', 'Grand titre (1re partie)', "L'art de la tradition,"),
  hero_titre_accent: K('accueil', 'Grand titre (2e partie, dorée)', "le goût de l'innovation"),
  hero_sous_titre: K('accueil', 'Sous-titre du hero', 'Pains au levain, viennoiseries pur beurre et pâtisseries de saison, sortis du four à bois trois fois par jour.'),
  hero_bouton_1: K('accueil', 'Bouton principal du hero', 'Commander avec Léa'),
  hero_bouton_2: K('accueil', 'Bouton secondaire du hero', 'Découvrir la carte'),
  hero_scroll: K('accueil', 'Indication de défilement', 'Défiler pour entrer'),
  // ---------- Accueil : bandeau ----------
  marquee_1: K('accueil', 'Bandeau défilant — mot 1', 'Levain naturel'),
  marquee_2: K('accueil', 'Bandeau défilant — mot 2', 'Cuit au feu de bois'),
  marquee_3: K('accueil', 'Bandeau défilant — mot 3', 'Farines bio & locales'),
  marquee_4: K('accueil', 'Bandeau défilant — mot 4', 'Beurre AOP Charentes-Poitou'),
  marquee_5: K('accueil', 'Bandeau défilant — mot 5', 'Trois fournées par jour'),
  marquee_6: K('accueil', 'Bandeau défilant — mot 6', 'Gâteaux sur-mesure'),
  marquee_7: K('accueil', 'Bandeau défilant — mot 7', 'Depuis 2004'),
  marquee_8: K('accueil', 'Bandeau défilant — mot 8', 'Invendus redistribués'),
  // ---------- Accueil : intro ----------
  intro_kicker: K('accueil', 'Intro — petite ligne', 'Fait à la main, avec le temps'),
  intro_titre: K('accueil', 'Intro — titre', 'Vingt ans de levain, un seul secret : ne pas se presser.'),
  intro_texte: K('accueil', 'Intro — paragraphe', 'Farines biologiques de moulins à moins de 100 km, fermentation lente de 24 à 48 h, four à bois. Rien de plus, rien de moins.'),
  intro_lien: K('accueil', 'Intro — lien', 'Lire notre histoire'),
  intro_badge_chiffre: K('accueil', 'Intro — badge (chiffre)', '48 h'),
  intro_badge_texte: K('accueil', 'Intro — badge (texte)', 'de fermentation pour la boule au levain'),
  // ---------- Accueil : ardoise ----------
  ardoise_kicker: K('accueil', 'Ardoise — petite ligne', "Aujourd'hui en boutique"),
  ardoise_titre: K('accueil', 'Ardoise — titre', "L'ardoise du jour, écrite à la craie chaque matin"),
  ardoise_texte: K('accueil', 'Ardoise — paragraphe', "Les pains varient selon la fournée et l'humeur du levain. Léa peut vous réserver votre pain avant qu'il ne parte."),
  ardoise_bouton: K('accueil', 'Ardoise — bouton', 'Réserver mon pain'),
  ardoise_entete: K('accueil', "Ardoise — titre à la craie", 'Fournée du jour'),
  ardoise_pied: K('accueil', 'Ardoise — mention en bas', 'Tarifs en boutique'),
  // ---------- Accueil : vitrine ----------
  vitrine_kicker: K('accueil', 'Vitrine — petite ligne', 'La vitrine'),
  vitrine_titre: K('accueil', 'Vitrine — titre', 'Longez le comptoir'),
  vitrine_texte: K('accueil', 'Vitrine — texte', 'Faites défiler pour avancer le long de la vitrine — comme en boutique, le nez collé à la vitre.'),
  vitrine_1_nom: K('accueil', 'Vitrine carte 1 — nom', 'Pain au levain'), vitrine_1_tag: K('accueil', 'Vitrine carte 1 — étiquette', 'Signature'), vitrine_1_texte: K('accueil', 'Vitrine carte 1 — texte', 'Fermentation lente de 48 h, croûte épaisse, mie dense et parfumée.'),
  vitrine_2_nom: K('accueil', 'Vitrine carte 2 — nom', 'Croissant pur beurre'), vitrine_2_tag: K('accueil', 'Vitrine carte 2 — étiquette', 'Chaque matin'), vitrine_2_texte: K('accueil', 'Vitrine carte 2 — texte', 'Beurre AOP Charentes-Poitou, 27 couches de feuilletage.'),
  vitrine_3_nom: K('accueil', 'Vitrine carte 3 — nom', 'Tartelette framboise'), vitrine_3_tag: K('accueil', 'Vitrine carte 3 — étiquette', 'Pâtisserie'), vitrine_3_texte: K('accueil', 'Vitrine carte 3 — texte', 'Sablé breton, crème diplomate et fruits frais du marché.'),
  vitrine_4_nom: K('accueil', 'Vitrine carte 4 — nom', 'Paris-Brest'), vitrine_4_tag: K('accueil', 'Vitrine carte 4 — étiquette', 'Classique'), vitrine_4_texte: K('accueil', 'Vitrine carte 4 — texte', 'Pâte à choux et mousseline au praliné noisette maison.'),
  vitrine_5_nom: K('accueil', 'Vitrine carte 5 — nom', 'Wedding cake'), vitrine_5_tag: K('accueil', 'Vitrine carte 5 — étiquette', 'Sur-mesure'), vitrine_5_texte: K('accueil', 'Vitrine carte 5 — texte', 'Étages, dégustation offerte, coordination avec votre thème.'),
  vitrine_6_nom: K('accueil', 'Vitrine carte 6 — nom', 'Kouign-amann'), vitrine_6_tag: K('accueil', 'Vitrine carte 6 — étiquette', 'Bretagne'), vitrine_6_texte: K('accueil', 'Vitrine carte 6 — texte', 'Beurre salé de Guérande, caramélisé au four.'),
  // ---------- Accueil : signatures ----------
  signatures_kicker: K('accueil', 'Signatures — petite ligne', 'Nos signatures'),
  signatures_titre: K('accueil', 'Signatures — titre', 'Succombez à la tentation'),
  signature_1_titre: K('accueil', 'Signature 1 — titre', 'Le pain au levain'), signature_1_texte: K('accueil', 'Signature 1 — texte', 'Notre classique : croûte épaisse, mie alvéolée, 48 h de patience.'), signature_1_tag: K('accueil', 'Signature 1 — étiquette', 'Signature'),
  signature_2_titre: K('accueil', 'Signature 2 — titre', 'Croissant pur beurre'), signature_2_texte: K('accueil', 'Signature 2 — texte', 'Feuilletage croustillant, cœur moelleux.'), signature_2_tag: K('accueil', 'Signature 2 — étiquette', 'Chaque matin'),
  signature_3_titre: K('accueil', 'Signature 3 — titre', 'Tartelette framboise'), signature_3_texte: K('accueil', 'Signature 3 — texte', 'Sablé breton, crème diplomate.'), signature_3_tag: K('accueil', 'Signature 3 — étiquette', 'De saison'),
  signature_evenement: K('accueil', 'Signatures — carte sombre (événements)', 'Un gâteau pour vos grands jours'),
  // ---------- Accueil : journée ----------
  journee_kicker: K('accueil', 'Journée — petite ligne', 'Dans les coulisses'),
  journee_titre: K('accueil', 'Journée — titre', "Une journée à l'Atelier"),
  journee_1_titre: K('accueil', 'Journée étape 1 (4 h) — titre', 'Le pétrissage'), journee_1_texte: K('accueil', 'Journée étape 1 — texte', "Le levain a travaillé toute la nuit. On pétrit à la main, farine T65 et sel de Guérande."),
  journee_2_titre: K('accueil', 'Journée étape 2 (6 h) — titre', 'Le four à bois'), journee_2_texte: K('accueil', 'Journée étape 2 — texte', 'Les premières miches entrent dans le four. Le quartier sent le pain chaud.'),
  journee_3_titre: K('accueil', 'Journée étape 3 (ouverture) — titre', 'Ouverture'), journee_3_texte: K('accueil', 'Journée étape 3 — texte', 'La cloche de la porte sonne. Croissants tièdes, café voisin, premiers habitués.'),
  journee_4_titre: K('accueil', 'Journée étape 4 (11 h) — titre', 'Deuxième fournée'), journee_4_texte: K('accueil', 'Journée étape 4 — texte', "Baguettes tradition et pains spéciaux pour le déjeuner. C'est l'heure de pointe."),
  journee_5_titre: K('accueil', 'Journée étape 5 (16 h) — titre', 'Dernière fournée'), journee_5_texte: K('accueil', 'Journée étape 5 — texte', 'Pain frais pour le dîner, et les pâtisseries de fin de journée sortent du labo.'),
  journee_6_titre: K('accueil', 'Journée étape 6 (fermeture) — titre', 'Fermeture'), journee_6_texte: K('accueil', 'Journée étape 6 — texte', "On éteint le four. Les invendus partent aux associations du quartier."),
  // ---------- Accueil : comptoir ----------
  comptoir_kicker: K('accueil', 'Comptoir — petite ligne', 'Au comptoir'),
  comptoir_titre: K('accueil', 'Comptoir — titre', 'Léa prend votre commande, comme au comptoir'),
  comptoir_texte: K('accueil', 'Comptoir — paragraphe', "Dites-lui ce qui vous ferait plaisir : elle connaît la carte, vérifie le créneau de retrait, note vos envies (une inscription sur le gâteau, une allergie) et vous envoie un email à valider. Un rappel arrive la veille."),
  comptoir_bouton: K('accueil', 'Comptoir — bouton', 'Parler à Léa'),
  comptoir_bulle: K('accueil', 'Comptoir — bulle de Léa qui apparaît', 'Je vous sers quelque chose ? 🥐'),
  // ---------- Accueil : événements ----------
  evenements_kicker: K('accueil', 'Événements — petite ligne', 'Célébrez avec nous'),
  evenements_titre: K('accueil', 'Événements — titre', 'Un gâteau pour chaque grand moment'),
  evenements_texte: K('accueil', 'Événements — paragraphe', 'Mariages, anniversaires, fiançailles — nous créons des gâteaux sur-mesure, pensés avec vous. Dégustation offerte pour les mariages.'),
  evenements_bouton: K('accueil', 'Événements — bouton', 'Demander un devis à Léa'),
  // ---------- Accueil : avis ----------
  avis_kicker: K('accueil', 'Avis — petite ligne', 'Ils en parlent'),
  avis_titre: K('accueil', 'Avis — titre', 'Le mot des habitués'),
  avis_1_nom: K('accueil', 'Avis 1 — nom', 'Sophie M.'), avis_1_texte: K('accueil', 'Avis 1 — texte', 'Le meilleur croissant de Paris, sans hésiter ! Une texture parfaite.'),
  avis_2_nom: K('accueil', 'Avis 2 — nom', 'Julien T.'), avis_2_texte: K('accueil', 'Avis 2 — texte', 'Leur pain au levain se conserve des jours et reste délicieux.'),
  avis_3_nom: K('accueil', 'Avis 3 — nom', 'Claire D.'), avis_3_texte: K('accueil', 'Avis 3 — texte', 'Leurs gâteaux sur-mesure ont sublimé notre mariage.'),
  // ---------- Carte ----------
  carte_kicker: K('carte', 'Carte — petite ligne', 'La carte'),
  carte_titre: K('carte', 'Carte — titre', "Ce qui sort du four aujourd'hui"),
  carte_texte: K('carte', 'Carte — introduction', 'Chaque jour, nos artisans préparent une sélection de produits frais. Tout se commande avec Léa, retrait en boutique.'),
  carte_note_pains: K('carte', 'Carte — note sous « Pains »', 'La sélection varie chaque jour selon la fournée — demandez conseil en boutique, ou réservez avec Léa.'),
  carte_evenements_titre: K('carte', 'Carte — événements : titre', 'Des gâteaux pour vos plus beaux jours'),
  carte_evenements_texte: K('carte', 'Carte — événements : paragraphe', 'Anniversaires, mariages, fiançailles : nous imaginons avec vous une création unique. Devis sous 24 h, dégustation offerte pour les mariages.'),
  carte_evenements_bouton: K('carte', 'Carte — événements : bouton', 'Composer mon gâteau avec Léa'),
  carte_evenements_mention: K('carte', 'Carte — événements : mention', 'Réponse sous 24 h · Dégustation possible sur rendez-vous'),
  // ---------- Histoire ----------
  histoire_kicker: K('histoire', 'Histoire — petite ligne du bandeau', 'Depuis 2004'),
  histoire_titre: K('histoire', 'Histoire — grand titre', 'Le temps, notre seul ingrédient secret'),
  histoire_chiffre_1: K('histoire', 'Chiffre 1 — valeur', '20'), histoire_chiffre_1_suffixe: K('histoire', 'Chiffre 1 — suffixe', ' ans'), histoire_chiffre_1_texte: K('histoire', 'Chiffre 1 — légende', 'de levain entretenu chaque jour'),
  histoire_chiffre_2: K('histoire', 'Chiffre 2 — valeur', '3'), histoire_chiffre_2_suffixe: K('histoire', 'Chiffre 2 — suffixe', ''), histoire_chiffre_2_texte: K('histoire', 'Chiffre 2 — légende', 'fournées quotidiennes'),
  histoire_chiffre_3: K('histoire', 'Chiffre 3 — valeur', '100'), histoire_chiffre_3_suffixe: K('histoire', 'Chiffre 3 — suffixe', ' %'), histoire_chiffre_3_texte: K('histoire', 'Chiffre 3 — légende', 'de farines biologiques'),
  histoire_chiffre_4: K('histoire', 'Chiffre 4 — valeur', '48'), histoire_chiffre_4_suffixe: K('histoire', 'Chiffre 4 — suffixe', ' h'), histoire_chiffre_4_texte: K('histoire', 'Chiffre 4 — légende', 'de fermentation pour la boule au levain'),
  histoire_racines_kicker: K('histoire', 'Racines — petite ligne', 'Des racines profondes'),
  histoire_racines_titre: K('histoire', 'Racines — titre', 'Ramener le vrai goût du pain au cœur du quartier'),
  histoire_racines_texte_1: K('histoire', 'Racines — paragraphe 1', "Tout a commencé il y a deux décennies avec une simple idée. L'Atelier Doré est né de cette passion pour l'authenticité et le respect des traditions boulangères françaises."),
  histoire_racines_texte_2: K('histoire', 'Racines — paragraphe 2', 'Nous avons construit notre réputation sur un élément essentiel : le temps. Le temps de laisser la pâte lever, le temps de sélectionner les meilleurs producteurs, le temps de partager un sourire avec chaque client.'),
  histoire_engagement_kicker: K('histoire', 'Engagement — petite ligne', 'Un engagement éthique'),
  histoire_engagement_titre: K('histoire', 'Engagement — titre', 'Nourrir le corps autant que le quartier'),
  histoire_engagement_1_titre: K('histoire', 'Engagement 1 — titre', 'Farines 100 % bio'), histoire_engagement_1_texte: K('histoire', 'Engagement 1 — texte', 'Moulins situés à moins de 100 km de notre atelier.'),
  histoire_engagement_2_titre: K('histoire', 'Engagement 2 — titre', 'Fermes responsables'), histoire_engagement_2_texte: K('histoire', 'Engagement 2 — texte', 'Beurre, œufs et lait issus de fermes éthiques.'),
  histoire_engagement_3_titre: K('histoire', 'Engagement 3 — titre', 'Zéro invendu jeté'), histoire_engagement_3_texte: K('histoire', 'Engagement 3 — texte', 'Redistribution quotidienne aux associations locales.'),
  histoire_frise_titre: K('histoire', 'Frise — titre', 'Vingt ans en cinq dates'),
  histoire_date_1: K('histoire', 'Frise 1 — date', '2004'), histoire_date_1_titre: K('histoire', 'Frise 1 — titre', 'Le premier four'), histoire_date_1_texte: K('histoire', 'Frise 1 — texte', "Un fournil de 30 m² rue de la Boulangerie, un four à bois d'occasion et un levain hérité d'un maître boulanger lyonnais."),
  histoire_date_2: K('histoire', 'Frise 2 — date', '2009'), histoire_date_2_titre: K('histoire', 'Frise 2 — titre', 'Le laboratoire pâtisserie'), histoire_date_2_texte: K('histoire', 'Frise 2 — texte', 'Ouverture du labo au sous-sol : éclairs, tartes de saison et les premiers gâteaux de mariage.'),
  histoire_date_3: K('histoire', 'Frise 3 — date', '2015'), histoire_date_3_titre: K('histoire', 'Frise 3 — titre', '100 % bio'), histoire_date_3_texte: K('histoire', 'Frise 3 — texte', 'Toutes nos farines deviennent biologiques, meulées à moins de 100 km de Paris.'),
  histoire_date_4: K('histoire', 'Frise 4 — date', '2021'), histoire_date_4_titre: K('histoire', 'Frise 4 — titre', "L'engagement anti-gaspillage"), histoire_date_4_texte: K('histoire', 'Frise 4 — texte', 'Chaque soir, les invendus partent aux associations du quartier. Plus rien ne se jette.'),
  histoire_date_5: K('histoire', 'Frise 5 — date', "Aujourd'hui"), histoire_date_5_titre: K('histoire', 'Frise 5 — titre', 'Léa au comptoir'), histoire_date_5_texte: K('histoire', 'Frise 5 — texte', "Une assistante qui prend vos commandes en ligne, avec la même attention qu'au comptoir."),
  histoire_bouton: K('histoire', 'Histoire — bouton final', "Goûter, c'est adopter — commander avec Léa"),
  // ---------- Contact ----------
  contact_kicker: K('contact', 'Contact — petite ligne', 'Contact'),
  contact_titre: K('contact', 'Contact — titre', 'Écrivez-nous, ou passez la porte'),
  contact_texte: K('contact', 'Contact — introduction', "Une question ? Une envie de gâteau personnalisé pour un événement ? N'hésitez pas à nous contacter ou à passer nous voir."),
  faq_titre: K('contact', 'FAQ — titre', 'Questions fréquentes'),
  faq_1_q: K('contact', 'FAQ 1 — question', 'Prenez-vous les commandes pour des événements ?'), faq_1_r: K('contact', 'FAQ 1 — réponse', 'Oui, gâteaux de mariage, anniversaires et buffets salés-sucrés pour vos réceptions. Un délai de 72h est recommandé.'),
  faq_2_q: K('contact', 'FAQ 2 — question', 'Proposez-vous des options sans gluten ?'), faq_2_r: K('contact', 'FAQ 2 — réponse', 'Une sélection de pains et de pâtisseries sans gluten est disponible sur commande, préparée dans un espace dédié.'),
  faq_3_q: K('contact', 'FAQ 3 — question', 'Livrez-vous les commandes ?'), faq_3_r: K('contact', 'FAQ 3 — réponse', 'La livraison est possible dans un rayon de 5 km pour les commandes de plus de 30€, tous les jours.'),
  faq_4_q: K('contact', 'FAQ 4 — question', 'Acceptez-vous les cartes bancaires ?'), faq_4_r: K('contact', 'FAQ 4 — réponse', 'Carte, espèces et titres-restaurant sont acceptés en boutique.'),
  // ---------- Pied de page ----------
  footer_accroche: K('global', 'Pied de page — accroche', "Le pain chaud n'attend pas."),
  footer_accroche_accent: K('global', 'Pied de page — accroche (partie dorée)', 'Réservez le vôtre.'),
  footer_description: K('global', 'Pied de page — description', 'Boulangerie-pâtisserie artisanale. Levain naturel, farines bio, four à bois — et des artisans qui prennent le temps.'),
  footer_signature: K('global', 'Pied de page — petite phrase', 'Fait avec du levain et un peu de code.'),
  // ---------- Global / Léa ----------
  nav_bouton: K('global', 'Bouton du menu (haut de page)', 'Commander avec Léa'),
  lea_accueil: K('global', 'Message d\'accueil de Léa dans le chat', "Bonjour, je suis Léa 👋 Je peux vous renseigner sur nos produits, nos horaires, et préparer votre commande ou votre gâteau d'événement."),
  seo_accueil: K('global', 'Description Google — accueil', 'Boulangerie artisanale. Pains au levain, pâtisseries créatives et viennoiseries pur beurre. Commandez en ligne avec Léa.'),
};

export const CONTENT_PAGES = ['accueil', 'carte', 'histoire', 'contact', 'global'];

/** Texte effectif : surcharge du propriétaire, sinon valeur par défaut. */
export function texte(textes, key) {
  const v = textes?.[key];
  return v !== undefined && v !== null && v !== '' ? v : CONTENT[key]?.defaut ?? '';
}
