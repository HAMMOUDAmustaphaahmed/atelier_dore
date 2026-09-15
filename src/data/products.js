// Données produits centralisées, réutilisées par la page Menu, l'accueil et
// le chatbot. Les pains n'ont volontairement pas de prix : la sélection et
// les tarifs varient chaque jour selon la fournée — voir la note affichée
// dans la section correspondante du Menu.

export const pains = [
  { name: 'Baguette Tradition', desc: "Farine T65, sel de Guérande, croûte craquante et mie alvéolée.", icon: 'baguette' },
  { name: 'Pain de Campagne', desc: 'Grosse miche à la levure naturelle, longue fermentation de 24h.', icon: 'campagne' },
  { name: 'Pain aux Céréales', desc: 'Lin, courge, tournesol et sésame pour une mie riche en goût.', icon: 'cereales' },
  { name: 'Pain de Seigle', desc: 'Idéal avec fromages affinés et charcuteries, saveur légèrement acidulée.', icon: 'seigle' },
  { name: 'Pain aux Noix', desc: 'Noix de Grenoble entières, parfait pour accompagner un plateau de fromage.', icon: 'campagne' },
  { name: 'Boule au Levain', desc: 'Fermentation lente de 48h, croûte épaisse et mie dense.', icon: 'campagne' },
];

export const viennoiseries = [
  { name: 'Croissant', price: '1.40€', desc: 'Pur beurre AOP Charentes-Poitou, feuilletage à l\'ancienne.', icon: 'croissant' },
  { name: 'Pain au Chocolat', price: '1.50€', desc: 'Double barre de chocolat noir intense.', icon: 'chocolat' },
  { name: 'Chausson aux Pommes', price: '2.20€', desc: 'Compote maison, pommes de saison et cannelle.', icon: 'chausson' },
  { name: 'Kouign-Amann', price: '3.20€', desc: 'Beurre salé de Guérande, caramélisé au four.', icon: 'kouign' },
  { name: 'Brioche Tressée', price: '3.40€', desc: 'Tressée à la main, sucre perlé et fleur d\'oranger.', icon: 'brioche' },
  { name: 'Pain Suisse', price: '2.60€', desc: 'Crème pâtissière vanille et pépites de chocolat.', icon: 'chocolat' },
];

export const patisseries = [
  { name: 'Éclair au Chocolat', price: '3.50€', desc: 'Crème pâtissière chocolat intense, glaçage brillant.', icon: 'eclair' },
  { name: 'Tarte au Citron Meringuée', price: '4.00€', desc: 'Crémeux citron, meringue italienne flambée.', icon: 'citron' },
  { name: 'Paris-Brest', price: '4.50€', desc: 'Pâte à choux, crème mousseline au praliné noisette.', icon: 'parisbrest' },
  { name: 'Macarons (x6)', price: '9.90€', desc: 'Vanille, pistache, framboise, chocolat, caramel, café.', icon: 'macarons' },
  { name: 'Éclair Café', price: '3.80€', desc: 'Crème pâtissière au café de Colombie.', icon: 'eclair' },
  { name: 'Tartelette Framboise', price: '4.20€', desc: 'Sablé breton, crème diplomate et fruits frais.', icon: 'citron' },
];

export const gateaux = [
  { name: 'Fraisier', price: 'à partir de 28€', desc: 'Génoise légère, crème mousseline, fraises fraîches — pour 6 pers.', icon: 'cakeslice' },
  { name: 'Forêt Noire', price: 'à partir de 30€', desc: 'Chocolat, cerises griottes, chantilly — pour 6 pers.', icon: 'cakeslice' },
  { name: 'Saint-Honoré', price: 'à partir de 32€', desc: 'Choux caramélisés, crème Chiboust vanille — pour 6 pers.', icon: 'cakeslice' },
];

// Gâteaux d'événement : mariages, anniversaires, fiançailles — sur devis,
// personnalisés selon le thème, le nombre d'invités et les envies du client.
export const gateauxEvenement = [
  {
    name: 'Anniversaires',
    icon: 'anniversaire',
    desc: "Pièces montées personnalisées, thèmes enfants ou adultes, du gâteau simple au multi-étages.",
    tags: ['Personnalisable', 'Toutes tailles'],
  },
  {
    name: 'Mariages',
    icon: 'mariage',
    desc: 'Wedding cakes à étages, dégustation offerte, coordination avec votre thème et vos couleurs.',
    tags: ['Dégustation offerte', 'Livraison possible'],
  },
  {
    name: 'Fiançailles',
    icon: 'fiancailles',
    desc: 'Créations élégantes et raffinées pour célébrer une demande ou des fiançailles.',
    tags: ['Sur-mesure', 'Petit ou grand format'],
  },
];

export const avis = [
  { name: 'Sophie M.', text: 'Le meilleur croissant de Paris, sans hésiter ! Une texture parfaite.' },
  { name: 'Julien T.', text: 'Leur pain au levain se conserve des jours et reste délicieux.' },
  { name: 'Claire D.', text: 'Leurs gâteaux sur-mesure ont sublimé notre mariage.' },
];
