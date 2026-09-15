import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Croissant } from 'lucide-react';
import { useBoutique } from '../hooks/useBoutique';
import { setScrollLocked } from '../hooks/useSmoothScroll';
import { openLea } from '../lib/lea';
import { useSite } from '../site/SiteProvider';

const navLinks = [
  { name: 'Accueil', path: '/' },
  { name: 'La carte', path: '/menu' },
  { name: 'Notre histoire', path: '/histoire' },
  { name: 'Contact', path: '/contact' },
];

function Logo({ className = '' }) {
  const { nom } = useSite();
  return (
    <Link to="/" className={`flex items-center gap-2 text-2xl font-serif font-bold text-bakery-brown group ${className}`} aria-label={`${nom} — accueil`}>
      <Croissant className="text-bakery-orange group-hover:-rotate-12 transition-transform" />
      <span>{nom}</span>
    </Link>
  );
}

export function StatusPill({ compact = false }) {
  const { open, closesAt, opensAt } = useBoutique();
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border text-xs font-medium ${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'} ${
      open ? 'border-green-700/20 bg-green-50 text-green-800' : 'border-bakery-orange/30 bg-orange-50 text-bakery-orange'
    }`}>
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${open ? 'bg-green-500 animate-ping' : 'bg-bakery-orange'}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${open ? 'bg-green-600' : 'bg-bakery-orange'}`} />
      </span>
      {open ? `Ouvert · ferme à ${closesAt}` : `Fermé · ouvre ${opensAt}`}
    </span>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => { setIsOpen(false); }, [location]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    setScrollLocked(isOpen);
    return () => { document.body.style.overflow = ''; setScrollLocked(false); };
  }, [isOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'py-2.5' : 'py-4'}`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className={`flex items-center justify-between gap-4 rounded-full px-4 sm:px-5 py-2 transition-all duration-300 ${
          scrolled ? 'bg-bakery-cream/92 backdrop-blur-md shadow-warm-sm border border-bakery-sand/70' : 'bg-bakery-cream/75 backdrop-blur-md border border-bakery-sand/40'
        }`}>
          <Logo />

          <nav className="hidden lg:flex items-center gap-7" aria-label="Navigation principale">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative text-[0.92rem] font-medium transition-colors hover:text-bakery-orange ${active ? 'text-bakery-dark' : 'text-bakery-brown/80'}`}
                >
                  {link.name}
                  {active && (
                    <motion.span layoutId="nav-underline" className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-bakery-orange rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <StatusPill compact />
            <button
              onClick={() => openLea()}
              className="bg-bakery-dark hover:bg-bakery-orange text-bakery-light px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-warm-sm"
            >
              Commander avec Léa
            </button>
          </div>

          <button
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isOpen}
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-bakery-dark bg-bakery-cream border border-bakery-sand"
            onClick={() => setIsOpen((v) => !v)}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-bakery-dark/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            onMouseDown={(e) => e.target === e.currentTarget && setIsOpen(false)}
          >
            <motion.nav
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
              className="absolute top-0 right-0 h-full w-[84%] max-w-sm bg-bakery-light grain shadow-2xl flex flex-col px-7 pt-6 pb-8"
              aria-label="Navigation mobile"
            >
              <div className="flex justify-between items-center mb-8 relative z-10">
                <Logo />
                <button aria-label="Fermer le menu" onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-bakery-dark border border-bakery-sand bg-bakery-cream">
                  <X size={20} />
                </button>
              </div>
              <div className="relative z-10 mb-6"><StatusPill /></div>
              <div className="flex flex-col relative z-10">
                {navLinks.map((link, i) => (
                  <motion.div key={link.name} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                    <Link
                      to={link.path}
                      className={`block py-3.5 font-serif text-3xl tracking-tight border-b border-bakery-sand/70 transition-colors ${
                        location.pathname === link.path ? 'text-bakery-orange' : 'text-bakery-dark hover:text-bakery-orange'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-auto relative z-10">
                <button onClick={() => { setIsOpen(false); openLea(); }} className="w-full bg-bakery-dark text-bakery-light px-6 py-3.5 rounded-full text-center font-medium">
                  Commander avec Léa
                </button>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
