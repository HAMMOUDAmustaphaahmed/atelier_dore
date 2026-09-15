// Illustrations "line-art" dessinées à la main pour les pains, viennoiseries,
// pâtisseries et gâteaux d'événement. Toutes en currentColor pour s'intégrer
// à la palette du site (bakery-gold / bakery-orange / bakery-brown).

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function Baguette({ className }) {
  return (
    <svg viewBox="0 0 120 60" className={className} {...base}>
      <path d="M8 40C8 24 24 12 60 12s52 12 52 28c0 8-8 12-20 12H28C16 52 8 48 8 40Z" />
      <path d="M28 20c2 6 2 14 0 22M46 17c2 8 2 18 0 26M64 16c2 9 2 20 0 28M82 17c2 8 2 18 0 26" />
    </svg>
  );
}

export function PainCampagne({ className }) {
  return (
    <svg viewBox="0 0 100 80" className={className} {...base}>
      <path d="M10 52c0-20 16-38 40-38s40 18 40 38c0 10-8 16-40 16S10 62 10 52Z" />
      <path d="M30 30 50 46 70 30" />
      <path d="M22 46 50 62 78 46" />
    </svg>
  );
}

export function PainCereales({ className }) {
  return (
    <svg viewBox="0 0 100 80" className={className} {...base}>
      <ellipse cx="50" cy="46" rx="38" ry="26" />
      <path d="M22 40c2-2 4-2 6 0M32 34c2-2 4-2 6 0M44 32c2-2 4-2 6 0M56 34c2-2 4-2 6 0M68 40c2-2 4-2 6 0M26 52c2-2 4-2 6 0M40 56c2-2 4-2 6 0M56 54c2-2 4-2 6 0M70 50c2-2 4-2 6 0" />
    </svg>
  );
}

export function PainSeigle({ className }) {
  return (
    <svg viewBox="0 0 100 70" className={className} {...base}>
      <rect x="14" y="20" width="72" height="34" rx="17" />
      <path d="M24 20v34M40 18v38M56 18v38M72 20v34" strokeWidth="1.6" opacity="0.7" />
    </svg>
  );
}

export function Croissant({ className }) {
  return (
    <svg viewBox="0 0 100 70" className={className} {...base}>
      <path d="M12 44C8 26 24 10 42 10c8 0 14 4 16 8-10 0-20 6-24 16-4 9-2 18 4 24-14 2-30-8-26-14 2-3 2 0 0-4Z" />
      <path d="M60 18c10 2 20 10 24 20 4 11-2 22-14 26" />
      <path d="M28 26c4 3 7 8 8 13M40 20c5 2 9 7 11 13M54 22c6 3 11 9 13 16" />
    </svg>
  );
}

export function PainChocolat({ className }) {
  return (
    <svg viewBox="0 0 100 60" className={className} {...base}>
      <rect x="12" y="16" width="76" height="30" rx="14" />
      <path d="M30 16v30M70 16v30" />
    </svg>
  );
}

export function ChaussonPommes({ className }) {
  return (
    <svg viewBox="0 0 100 80" className={className} {...base}>
      <path d="M14 20c24-10 48-10 72 0-2 26-16 42-36 48C30 62 16 46 14 20Z" />
      <path d="M26 24c16-6 32-6 48 0" strokeWidth="1.6" opacity="0.7" />
    </svg>
  );
}

export function KouignAmann({ className }) {
  return (
    <svg viewBox="0 0 100 80" className={className} {...base}>
      <circle cx="50" cy="44" r="30" />
      <path d="M50 14v60M20 44h60M29 23l42 42M71 23 29 65" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

export function Brioche({ className }) {
  return (
    <svg viewBox="0 0 100 70" className={className} {...base}>
      <circle cx="50" cy="46" r="20" />
      <circle cx="50" cy="18" r="11" />
    </svg>
  );
}

export function Eclair({ className }) {
  return (
    <svg viewBox="0 0 120 50" className={className} {...base}>
      <rect x="10" y="16" width="100" height="20" rx="10" />
      <path d="M20 16c4-4 8-4 12 0M40 16c4-4 8-4 12 0M60 16c4-4 8-4 12 0M80 16c4-4 8-4 12 0" />
    </svg>
  );
}

export function TarteCitron({ className }) {
  return (
    <svg viewBox="0 0 100 70" className={className} {...base}>
      <path d="M10 50c0-6 18-10 40-10s40 4 40 10" />
      <path d="M10 50c14 8 66 8 80 0" />
      <path d="M30 26c4 8 4 16 0 22M50 20c4 10 4 20 0 28M70 26c4 8 4 16 0 22" strokeWidth="1.8" opacity="0.75" />
    </svg>
  );
}

export function ParisBrest({ className }) {
  return (
    <svg viewBox="0 0 100 60" className={className} {...base}>
      <circle cx="50" cy="34" r="26" />
      <circle cx="50" cy="34" r="12" />
      <path d="M18 40c4 2 8 2 10-2M72 40c4 2 8 2 10-2" strokeWidth="1.6" opacity="0.6" />
    </svg>
  );
}

export function Macarons({ className }) {
  return (
    <svg viewBox="0 0 100 70" className={className} {...base}>
      <path d="M20 26c0-8 14-14 30-14s30 6 30 14-6 10-6 10 6 2 6 10-14 14-30 14-30-6-30-14 6-10 6-10-6-2-6-10Z" />
      <path d="M18 36h64" />
    </svg>
  );
}

export function GateauAnniversaire({ className }) {
  return (
    <svg viewBox="0 0 100 90" className={className} {...base}>
      <path d="M18 82V54c0-4 4-6 8-6h48c4 0 8 2 8 8v26" />
      <path d="M18 66h64" />
      <path d="M30 48v-8M50 48v-10M70 48v-8" />
      <path d="M50 34c-4-4-4-8 0-12 4 4 4 8 0 12Z" fill="currentColor" fillOpacity="0.35" />
      <path d="M22 82c4-4 6-4 10 0s6 4 10 0 6-4 10 0 6 4 10 0 6-4 10 0 6 4 10 0" strokeWidth="1.8" />
    </svg>
  );
}

export function GateauMariage({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} {...base}>
      <path d="M28 90v-14c0-3 3-5 6-5h32c3 0 6 2 6 5v14" />
      <path d="M34 71v-12c0-3 3-5 6-5h20c3 0 6 2 6 5v12" />
      <path d="M40 54v-9c0-3 2-5 5-5h10c3 0 5 2 5 5v9" />
      <path d="M22 90h56M28 71h44M34 54h32" strokeWidth="1.6" opacity="0.7" />
      <path d="M46 34c-3-4-3-7 0-10 2 2 2 5 0 6 2-1 4 1 4 3s-2 4-4 3c2 1 2 3 0 5-2-2-2-4 0-7Z" fill="currentColor" fillOpacity="0.3" />
      <circle cx="42" cy="24" r="4" />
      <circle cx="50" cy="21" r="4" />
    </svg>
  );
}

export function GateauFiancailles({ className }) {
  return (
    <svg viewBox="0 0 100 90" className={className} {...base}>
      <path d="M20 84V58c0-4 4-6 8-6h44c4 0 8 2 8 6v26" />
      <path d="M20 70h60" strokeWidth="1.6" opacity="0.7" />
      <circle cx="40" cy="34" r="9" />
      <circle cx="58" cy="34" r="9" />
      <path d="M49 34c0-4-3-7-6-8M49 34c0-4 3-7 6-8" />
      <path d="M46 18c1-3 3-5 4-5s3 2 4 5" strokeWidth="1.6" opacity="0.7" />
    </svg>
  );
}

export function CakeSlice({ className }) {
  return (
    <svg viewBox="0 0 100 80" className={className} {...base}>
      <path d="M50 12 88 68H12Z" />
      <path d="M28 68 50 32 72 68" strokeWidth="1.6" opacity="0.7" />
      <path d="M12 68h76" />
    </svg>
  );
}

export function Wheat({ className }) {
  return (
    <svg viewBox="0 0 60 100" className={className} {...base}>
      <path d="M30 96V30" />
      <path d="M30 34 20 20M30 34 40 20M30 46 16 34M30 46 44 34M30 58 14 48M30 58 46 48M30 70 16 62M30 70 44 62" />
      <path d="M20 20c0-8 4-14 10-16 6 2 10 8 10 16" />
    </svg>
  );
}
