import { Link } from 'react-router-dom';
import { Croissant, Instagram, Facebook, MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';
import { horairesAffichage } from '../data/infos';
import { openLea } from '../lib/lea';
import { useSite, useText } from '../site/SiteProvider';

export default function Footer() {
  const { nom, boutique: BOUTIQUE, horaires } = useSite();
  const t = useText();
  const textes = { footer_accroche: t('footer_accroche'), footer_accroche_accent: t('footer_accroche_accent'), footer_description: t('footer_description') };
  const HORAIRES_AFFICHAGE = horairesAffichage(horaires);
  return (
    <footer className="bg-bakery-dark text-bakery-light relative overflow-hidden">
      {/* Appel final */}
      <div className="container mx-auto px-6 pt-20 pb-14 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <h2 className="font-serif text-display max-w-3xl text-balance">
            {textes.footer_accroche} <span className="italic font-light text-bakery-honey">{textes.footer_accroche_accent}</span>
          </h2>
          <button onClick={() => openLea()} className="self-start lg:self-auto inline-flex items-center gap-2 bg-bakery-honey hover:bg-bakery-light text-bakery-dark px-7 py-4 rounded-full font-semibold transition-colors shadow-glow">
            {t('nav_bouton')} <ArrowUpRight size={18} />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <Link to="/" className="flex items-center gap-2 text-2xl font-serif font-bold text-bakery-honey"><Croissant /><span>{nom}</span></Link>
          <p className="text-bakery-light/60 text-sm mt-4 max-w-xs text-pretty">
            {textes.footer_description}
          </p>
          <div className="flex gap-3 mt-6">
            <a href={BOUTIQUE.instagram || '#'} target={BOUTIQUE.instagram ? '_blank' : undefined} rel="noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-bakery-orange hover:border-bakery-orange transition-colors"><Instagram size={18} /></a>
            <a href={BOUTIQUE.facebook || '#'} target={BOUTIQUE.facebook ? '_blank' : undefined} rel="noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-bakery-orange hover:border-bakery-orange transition-colors"><Facebook size={18} /></a>
          </div>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-[0.65rem] uppercase tracking-[0.25em] text-bakery-honey mb-4">Naviguer</h3>
          <ul className="space-y-2.5 text-sm text-bakery-light/75">
            <li><Link to="/" className="hover:text-bakery-light transition-colors">Accueil</Link></li>
            <li><Link to="/menu" className="hover:text-bakery-light transition-colors">La carte</Link></li>
            <li><Link to="/menu#evenements" className="hover:text-bakery-light transition-colors">Gâteaux d'événement</Link></li>
            <li><Link to="/histoire" className="hover:text-bakery-light transition-colors">Notre histoire</Link></li>
            <li><Link to="/contact" className="hover:text-bakery-light transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <h3 className="text-[0.65rem] uppercase tracking-[0.25em] text-bakery-honey mb-4">Horaires</h3>
          <ul className="space-y-2 text-sm text-bakery-light/75">
            {HORAIRES_AFFICHAGE.map((h) => (
              <li key={h.jour} className="flex justify-between gap-4">
                <span>{h.jour}</span>
                <span className={h.heures === 'Fermé' ? 'text-bakery-orange' : 'text-bakery-light'}>{h.heures}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h3 className="text-[0.65rem] uppercase tracking-[0.25em] text-bakery-honey mb-4">Nous trouver</h3>
          <ul className="space-y-3 text-sm text-bakery-light/75">
            <li className="flex items-start gap-3"><MapPin size={16} className="text-bakery-orange mt-0.5 shrink-0" /><span>{BOUTIQUE.adresse}<br />{BOUTIQUE.codePostal} {BOUTIQUE.ville}</span></li>
            <li className="flex items-center gap-3"><Phone size={16} className="text-bakery-orange shrink-0" /><a href={`tel:${BOUTIQUE.telephone.replace(/\s/g, '')}`} className="hover:text-bakery-light transition-colors">{BOUTIQUE.telephone}</a></li>
            <li className="flex items-center gap-3"><Mail size={16} className="text-bakery-orange shrink-0" /><a href={`mailto:${BOUTIQUE.email}`} className="hover:text-bakery-light transition-colors">{BOUTIQUE.email}</a></li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-2 text-xs text-bakery-light/40">
        <span>© {new Date().getFullYear()} {nom}. Tous droits réservés.</span>
        <span>{t('footer_signature')}</span>
      </div>
    </footer>
  );
}
