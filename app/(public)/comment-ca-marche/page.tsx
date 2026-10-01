import type { Metadata } from 'next';
import { ClipboardList, MessageCircle, Truck } from 'lucide-react';
import { FadeIn } from '@/components/ui/fade-in';
import { SectionHeading } from '@/components/ui/section-heading';
export const metadata: Metadata = { title: 'Bestellung & Lieferung', description: 'So fragen Sie ein Holzangebot an und organisieren Ihre Lieferung.' };
const STEPS = [
  { icon: ClipboardList, title: 'Beschreiben Sie Ihren Bedarf', description: 'Nennen Sie den Verwendungszweck, die gewünschte Holzart (falls bekannt), Maße oder Menge sowie den Lieferort.' },
  { icon: MessageCircle, title: 'Erhalten Sie ein Angebot', description: 'Wir melden uns, um Verfügbarkeit, Preis und Transportbedingungen zu bestätigen.' },
  { icon: Truck, title: 'Vereinbaren Sie die Lieferung', description: 'Nach Annahme des Angebots vereinbaren wir je nach Möglichkeit die Abholung oder Lieferung.' },
];
export default function CommentCaMarchePage() { return <div className="container-app py-14 sm:py-20"><FadeIn><SectionHeading eyebrow="Ihre Bestellung" title="So funktioniert es" description="In drei Schritten von Ihrem Bedarf zum passenden Angebot."/></FadeIn><div className="mt-14 space-y-8">{STEPS.map((step,i)=><FadeIn key={step.title} delay={i*.05}><div className="flex gap-5 sm:gap-8"><div className="flex flex-col items-center"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#40513d] text-white sm:h-14 sm:w-14"><step.icon className="h-5 w-5 sm:h-6 sm:w-6"/></div>{i<STEPS.length-1&&<div className="mt-2 w-px flex-1 bg-ink-100"/>}</div><div className="pb-8"><span className="text-eyebrow text-[#806344]">Schritt {i+1}</span><h2 className="mt-1 text-lg font-bold text-ink-900 sm:text-xl">{step.title}</h2><p className="mt-2 max-w-2xl leading-relaxed text-ink-500">{step.description}</p></div></div></FadeIn>)}</div></div> }
