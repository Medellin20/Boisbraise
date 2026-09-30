import type { Metadata } from 'next';
import { ShieldCheck, TreePine, Truck, MessagesSquare } from 'lucide-react';
import { FadeIn } from '@/components/ui/fade-in';
import { SectionHeading } from '@/components/ui/section-heading';

export const metadata: Metadata = { title: 'À propos', description: 'HolzNest vous accompagne dans le choix et l’achat de bois pour votre projet.' };
const VALUES = [
  { icon: TreePine, title: 'Le bon usage', description: 'Nous vous aidons à préciser l’essence, le format et la quantité selon votre projet.' },
  { icon: ShieldCheck, title: 'Une offre claire', description: 'Disponibilité, prix et modalités de transport sont précisés dans votre devis.' },
  { icon: Truck, title: 'Livraison organisée', description: 'Nous étudions avec vous les possibilités de livraison selon votre destination.' },
  { icon: MessagesSquare, title: 'Un contact direct', description: 'Une question sur votre commande ? Notre équipe vous répond et vous conseille.' },
];
export default function AProposPage() {
  return <div><section className="relative overflow-hidden bg-[#1f3025] py-20 text-[#f6f1e8] sm:py-28"><div className="container-app"><FadeIn><span className="text-eyebrow uppercase text-[#d5bd91]">HolzNest</span><h1 className="mt-3 max-w-2xl text-display-md font-extrabold sm:text-display-lg">Du bois adapté à vos projets</h1><p className="mt-4 max-w-xl text-white/75">Nous proposons différentes familles de bois et vous accompagnons pour définir les caractéristiques de votre commande.</p></FadeIn></div></section><section className="py-16 sm:py-20"><div className="container-app max-w-3xl"><FadeIn><SectionHeading eyebrow="Notre démarche" title="Un achat simple, avec les bonnes informations"/><p className="mt-4 leading-relaxed text-ink-500">Chaque projet est différent. Chauffage, construction ou transformation : le choix dépend de l’essence, du format, de la quantité et de la destination. En nous donnant ces informations, nous pouvons préparer une offre adaptée.</p><p className="mt-4 leading-relaxed text-ink-500">Les disponibilités, tarifs et conditions de livraison sont confirmés au moment du devis. Contactez-nous pour échanger sur votre besoin.</p></FadeIn></div></section><section className="border-t border-ink-100 bg-white py-16 sm:py-20"><div className="container-app"><FadeIn><SectionHeading eyebrow="Nos engagements" title="À vos côtés, du choix à la livraison" align="center" className="mx-auto"/></FadeIn><div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{VALUES.map((v,i)=><FadeIn key={v.title} delay={i*.06}><div className="h-full border border-[#ded5c6] bg-[#fbf8f1] p-6 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9e2d4] text-[#536147]"><v.icon className="h-5 w-5"/></div><h3 className="mt-4 font-bold text-ink-900">{v.title}</h3><p className="mt-1.5 text-sm text-ink-500">{v.description}</p></div></FadeIn>)}</div></div></section></div>;
}
