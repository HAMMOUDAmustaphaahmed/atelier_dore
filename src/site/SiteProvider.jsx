// Configuration du site pilotée par le propriétaire (via le Chef / Telegram).
// Chargée depuis /api/site au démarrage ; les valeurs du code servent de défauts
// pour un premier rendu immédiat. La palette est appliquée en variables CSS.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BOUTIQUE, HORAIRES_SEMAINE } from '../data/infos';
import { pains, viennoiseries, patisseries, gateaux, gateauxEvenement } from '../data/products';

export const PALETTE_DEFAULT = {
  light: '#f6f1e7', cream: '#fbf8f1', sand: '#e9dfcb', gold: '#b8892e', honey: '#e0b054',
  brown: '#5a3a22', crust: '#8a5a2b', dark: '#1b1512', ember: '#2c1e16', orange: '#c9622b',
};

export const IMAGES_DEFAULT = {
  hero: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop',
  intro: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=1400&auto=format&fit=crop',
  signature_1: 'https://images.unsplash.com/photo-1589367920969-ab8e050eb0e9?q=80&w=1400&auto=format&fit=crop',
  signature_2: 'https://images.unsplash.com/photo-1555507036-ab1f40ce88cb?q=80&w=1200&auto=format&fit=crop',
  signature_3: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=900&auto=format&fit=crop',
  vitrine_1: 'https://images.unsplash.com/photo-1589367920969-ab8e050eb0e9?q=80&w=900&auto=format&fit=crop',
  vitrine_2: 'https://images.unsplash.com/photo-1555507036-ab1f40ce88cb?q=80&w=900&auto=format&fit=crop',
  vitrine_3: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=900&auto=format&fit=crop',
  vitrine_4: 'https://images.unsplash.com/photo-1626803775151-61d756612f97?q=80&w=900&auto=format&fit=crop',
  vitrine_5: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=900&auto=format&fit=crop',
  vitrine_6: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?q=80&w=900&auto=format&fit=crop',
  histoire_hero: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?q=80&w=2070&auto=format&fit=crop',
  histoire_petrissage: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?q=80&w=1400&auto=format&fit=crop',
  histoire_ingredients: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?q=80&w=1400&auto=format&fit=crop',
};

const strip = (p) => ({ ...p, disponible: true });

export const SITE_DEFAULT = {
  nom: BOUTIQUE.nom,
  slogan: 'Boulangerie & Pâtisserie artisanale',
  textes: {
    hero_kicker: "Cuit chaque matin, dès l'aube",
    hero_titre: "L'art de la tradition,",
    hero_titre_accent: "le goût de l'innovation",
    hero_sous_titre: 'Pains au levain, viennoiseries pur beurre et pâtisseries de saison, sortis du four à bois trois fois par jour.',
    intro_titre: 'Vingt ans de levain, un seul secret : ne pas se presser.',
    intro_texte: 'Farines biologiques de moulins à moins de 100 km, fermentation lente de 24 à 48 h, four à bois. Rien de plus, rien de moins.',
    footer_accroche: "Le pain chaud n'attend pas.",
    footer_accroche_accent: 'Réservez le vôtre.',
    footer_description: 'Boulangerie-pâtisserie artisanale. Levain naturel, farines bio, four à bois — et des artisans qui prennent le temps.',
  },
  boutique: { ...BOUTIQUE, coords: [48.8606, 2.3376], instagram: '', facebook: '' },
  horaires: HORAIRES_SEMAINE,
  fournees: [7, 11, 16],
  palette: PALETTE_DEFAULT,
  images: IMAGES_DEFAULT,
  produits: { pains: pains.map(strip), viennoiseries: viennoiseries.map(strip), patisseries: patisseries.map(strip), gateaux: gateaux.map(strip), evenements: gateauxEvenement.map(strip) },
  board: null,
  closures: [],
  version: 0,
};

const SiteContext = createContext(SITE_DEFAULT);

const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

export function applyPalette(palette) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries({ ...PALETTE_DEFAULT, ...(palette || {}) })) {
    const rgb = hexToRgb(v);
    if (rgb) root.style.setProperty(`--bakery-${k}`, rgb);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && palette?.dark) meta.setAttribute('content', palette.dark);
}

const CACHE_KEY = 'ad-site';

export function SiteProvider({ children }) {
  const [site, setSite] = useState(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
      return cached ? { ...SITE_DEFAULT, ...cached } : SITE_DEFAULT;
    } catch { return SITE_DEFAULT; }
  });

  useEffect(() => {
    let alive = true;
    fetch('/api/site')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        const merged = { ...SITE_DEFAULT, ...data, textes: { ...SITE_DEFAULT.textes, ...(data.textes || {}) }, boutique: { ...SITE_DEFAULT.boutique, ...(data.boutique || {}) }, palette: { ...PALETTE_DEFAULT, ...(data.palette || {}) }, images: { ...IMAGES_DEFAULT, ...(data.images || {}) }, produits: { ...SITE_DEFAULT.produits, ...(data.produits || {}) } };
        setSite(merged);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(merged)); } catch { /* ignoré */ }
      })
      .catch(() => { /* hors ligne : on garde les défauts */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => { applyPalette(site.palette); }, [site.palette]);
  useEffect(() => { if (site.nom) document.title = `${site.nom} | ${site.slogan}`; }, [site.nom, site.slogan]);

  const value = useMemo(() => site, [site]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}
