import type { Metadata } from 'next';
import { Accordion } from '@/components/shared/accordion';
import { FadeIn } from '@/components/ui/fade-in';
export const metadata: Metadata = { title: 'FAQ', description: 'Questions fréquentes sur le choix, le devis et la livraison du bois.' };
const CATEGORIES = [
  { title: 'Produits & devis', items: [
    { question: 'Quels types de bois proposez-vous ?', answer: 'Nous présentons des familles de produits pour le chauffage, le bois brut et la construction. Contactez-nous pour connaître les essences, formats et disponibilités du moment.' },
    { question: 'Comment obtenir un prix ?', answer: 'Envoyez-nous votre usage, les dimensions ou le volume souhaité et votre destination. Nous vous répondrons avec une offre selon la disponibilité et les modalités de livraison.' },
    { question: 'Puis-je commander une quantité ou une dimension particulière ?', answer: 'Indiquez votre besoin dans le formulaire. Nous confirmerons ce qui est possible avant toute commande.' },
  ] },
  { title: 'Retrait & livraison', items: [
    { question: 'Livrez-vous dans ma région ?', answer: 'Les possibilités et frais de transport dépendent de la destination, du volume et du type de produit. Précisez votre localité pour que nous puissions vous répondre.' },
    { question: 'Quand ma commande peut-elle être livrée ?', answer: 'Le délai est confirmé avec le devis, en fonction des stocks et de l’organisation du transport.' },
  ] },
];
export default function FaqPage() { return <div className="container-app py-14 sm:py-20"><FadeIn><span className="text-eyebrow uppercase text-canal-600">HolzNest · Aide</span><h1 className="mt-2 text-display-sm font-extrabold text-ink-900 sm:text-display-md">Questions fréquentes</h1><p className="mt-3 max-w-xl text-ink-500">Les informations utiles pour demander un devis et organiser votre commande.</p></FadeIn><div className="mt-12 max-w-3xl space-y-10">{CATEGORIES.map((category,i)=><FadeIn key={category.title} delay={i*.05}><h2 className="mb-4 text-lg font-bold text-ink-900">{category.title}</h2><Accordion items={category.items}/></FadeIn>)}</div></div>; }
