/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette recalibrée (phase 3) : les clés historiques sont conservées pour
        // que les classes existantes continuent de fonctionner.
        // Valeurs par défaut dans src/index.css (:root) ; le propriétaire peut les
        // changer via le Chef — SiteProvider met à jour les variables CSS.
        bakery: {
          light: 'rgb(var(--bakery-light) / <alpha-value>)',   // crème
          cream: 'rgb(var(--bakery-cream) / <alpha-value>)',   // crème claire (cartes)
          sand: 'rgb(var(--bakery-sand) / <alpha-value>)',     // sable (bordures, fonds doux)
          gold: 'rgb(var(--bakery-gold) / <alpha-value>)',     // or profond
          honey: 'rgb(var(--bakery-honey) / <alpha-value>)',   // or clair (accents sur fond sombre)
          brown: 'rgb(var(--bakery-brown) / <alpha-value>)',   // croûte
          crust: 'rgb(var(--bakery-crust) / <alpha-value>)',
          dark: 'rgb(var(--bakery-dark) / <alpha-value>)',     // charbon chaud
          ember: 'rgb(var(--bakery-ember) / <alpha-value>)',   // braise (surfaces sombres)
          orange: 'rgb(var(--bakery-orange) / <alpha-value>)', // terracotta
        },
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', '"Playfair Display"', 'Georgia', 'serif'],
        hand: ['Caveat', 'cursive'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 8vw, 7.5rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display': ['clamp(2.5rem, 5.5vw, 4.75rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(2rem, 3.5vw, 3rem)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        warm: '0 20px 60px -20px rgba(90, 58, 34, 0.35)',
        'warm-sm': '0 8px 24px -10px rgba(90, 58, 34, 0.3)',
        glow: '0 0 60px rgba(224, 176, 84, 0.35)',
      },
      keyframes: {
        steam: {
          '0%': { transform: 'translateY(0) translateX(0) scaleX(1)', opacity: '0' },
          '15%': { opacity: '0.6' },
          '50%': { transform: 'translateY(-20px) translateX(3px) scaleX(1.15)' },
          '100%': { transform: 'translateY(-42px) translateX(-2px) scaleX(1.4)', opacity: '0' },
        },
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.2' } },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.08)' },
        },
        flicker: {
          '0%, 100%': { opacity: '0.85' }, '25%': { opacity: '1' }, '45%': { opacity: '0.75' }, '70%': { opacity: '0.95' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.4) translateY(6px)' },
          '60%': { opacity: '1', transform: 'scale(1.12) translateY(-2px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        floaty: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        emberGlow: { '0%, 100%': { opacity: '0.55' }, '50%': { opacity: '1' } },
      },
      animation: {
        steam: 'steam 2.4s ease-in infinite',
        blink: 'blink 1s step-start infinite',
        pulseGlow: 'pulseGlow 1.6s ease-in-out infinite',
        flicker: 'flicker 2.2s ease-in-out infinite',
        popIn: 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
        marquee: 'marquee 40s linear infinite',
        floaty: 'floaty 4s ease-in-out infinite',
        emberGlow: 'emberGlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
