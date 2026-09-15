// Page d'atterrissage des liens reçus par email (/api/orders/confirm redirige ici).
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, SearchX, AlertTriangle, ArrowRight, PhoneCall } from 'lucide-react';
import SEO from '../components/SEO';
import { useSite } from '../site/SiteProvider';

const VARIANTS = {
  confirmee: {
    icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-100',
    title: 'Commande confirmée !',
    text: 'Merci ! Un email récapitulatif vient de vous être envoyé, et vous recevrez un rappel la veille du retrait. Le règlement se fait en boutique.',
  },
  deja: {
    icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-100',
    title: 'Commande déjà confirmée',
    text: 'Cette commande était déjà validée — rien à faire de plus. À très bientôt !',
  },
  annulee: {
    icon: XCircle, color: 'text-bakery-orange', bg: 'bg-orange-50 border-orange-100',
    title: 'Commande annulée',
    text: 'Votre commande a bien été annulée. Vous pouvez en passer une nouvelle quand vous voulez avec Léa ou par téléphone.',
  },
  expiree: {
    icon: Clock, color: 'text-bakery-orange', bg: 'bg-orange-50 border-orange-100',
    title: 'Lien expiré',
    text: 'Le délai de validation de 48 h est dépassé et la commande a été annulée automatiquement. Repassez commande avec Léa, ou appelez-nous.',
  },
  passee: {
    icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-100',
    title: 'Date de retrait dépassée',
    text: 'Cette commande ne peut plus être modifiée en ligne. Contactez-nous directement si besoin.',
  },
  introuvable: {
    icon: SearchX, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-100',
    title: 'Commande introuvable',
    text: 'Ce lien ne correspond à aucune commande. Vérifiez que vous avez bien copié l\'adresse complète de l\'email.',
  },
  erreur: {
    icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-100',
    title: 'Un problème est survenu',
    text: 'Nous n\'avons pas pu traiter votre demande. Réessayez dans quelques minutes ou appelez-nous.',
  },
};

export default function CommandeStatut() {
  const { boutique: BOUTIQUE, nom } = useSite();
  const [params] = useSearchParams();
  const statut = params.get('statut') || 'introuvable';
  const numero = params.get('numero');
  const v = VARIANTS[statut === 'confirmee' && params.get('deja') ? 'deja' : statut] || VARIANTS.introuvable;
  const Icon = v.icon;

  return (
    <div className="pt-32 pb-24 bg-bakery-light min-h-screen">
      <SEO title="Votre commande" description={`Statut de votre commande à ${nom}.`} keywords="commande, confirmation" />
      <div className="container mx-auto px-6 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 text-center"
        >
          <div className={`w-20 h-20 mx-auto rounded-full border flex items-center justify-center mb-6 ${v.bg}`}>
            <Icon className={v.color} size={40} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-bakery-dark mb-3">{v.title}</h1>
          {numero && (
            <p className="inline-block text-sm font-mono tracking-wider bg-bakery-gold/10 text-bakery-brown px-3 py-1 rounded-full mb-5">
              N° {numero}
            </p>
          )}
          <p className="text-gray-600 leading-relaxed mb-8">{v.text}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2 bg-bakery-brown hover:bg-bakery-orange text-white px-6 py-3 rounded-full font-medium transition-colors">
              Retour à l'accueil <ArrowRight size={18} />
            </Link>
            <a href={`tel:${BOUTIQUE.telephone.replace(/\s/g, '')}`} className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-bakery-orange text-bakery-dark px-6 py-3 rounded-full font-medium transition-colors">
              <PhoneCall size={16} /> {BOUTIQUE.telephone}
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
