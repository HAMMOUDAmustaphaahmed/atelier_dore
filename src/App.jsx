import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loader from './components/Loader';
import Chatbot from './components/Chatbot';
import { useSmoothScroll, setScrollLocked } from './hooks/useSmoothScroll';
import { useScrollToTop } from './hooks/useScrollToTop';
import { useBoutique } from './hooks/useBoutique';

const Home = lazy(() => import('./pages/Home'));
const Menu = lazy(() => import('./pages/Menu'));
const Histoire = lazy(() => import('./pages/Histoire'));
const Contact = lazy(() => import('./pages/Contact'));
const CommandeStatut = lazy(() => import('./pages/CommandeStatut'));
const Admin = lazy(() => import('./pages/Admin'));

const VISITED_KEY = 'atelier-dore-visited';

function readVisited() {
  try { return !!sessionStorage.getItem(VISITED_KEY); } catch { return true; }
}

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <span className="w-8 h-8 rounded-full border-2 border-bakery-sand border-t-bakery-orange animate-spin" aria-label="Chargement" />
    </div>
  );
}

function AppContent() {
  useSmoothScroll();
  useScrollToTop();
  useBoutique();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/histoire" element={<Histoire />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/commande" element={<CommandeStatut />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}

function App() {
  const [showLoader, setShowLoader] = useState(() => !readVisited());

  useEffect(() => {
    document.body.style.overflow = showLoader ? 'hidden' : '';
    setScrollLocked(showLoader);
    return () => { document.body.style.overflow = ''; };
  }, [showLoader]);

  const handleLoaderDone = () => {
    try { sessionStorage.setItem(VISITED_KEY, '1'); } catch { /* ignoré */ }
    setShowLoader(false);
  };

  return (
    <MotionConfig reducedMotion="user">
      <Router>
        {showLoader && <Loader onDone={handleLoaderDone} />}
        <AppContent />
      </Router>
    </MotionConfig>
  );
}

export default App;
