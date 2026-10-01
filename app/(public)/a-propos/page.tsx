import type { Metadata } from 'next';
import { ShieldCheck, TreePine, Truck, MessagesSquare } from 'lucide-react';
import { FadeIn } from '@/components/ui/fade-in';
import { SectionHeading } from '@/components/ui/section-heading';

export const metadata: Metadata = { title: 'Über uns', description: 'HolzNest unterstützt Sie bei der Auswahl und beim Kauf des passenden Holzes.' };
const VALUES = [
  { icon: TreePine, title: 'Passend zum Vorhaben', description: 'Wir helfen Ihnen, Holzart, Format und Menge passend zu Ihrem Vorhaben zu bestimmen.' },
  { icon: ShieldCheck, title: 'Ein klares Angebot', description: 'Verfügbarkeit, Preis und Transportbedingungen werden im Angebot aufgeführt.' },
  { icon: Truck, title: 'Organisierte Lieferung', description: 'Gemeinsam prüfen wir die Liefermöglichkeiten für Ihren Zielort.' },
  { icon: MessagesSquare, title: 'Direkter Kontakt', description: 'Fragen zu Ihrer Bestellung? Unser Team hilft Ihnen gerne weiter.' },
];
export default function AProposPage() {
  return <div><section className="relative overflow-hidden bg-[#1f3025] py-20 text-[#f6f1e8] sm:py-28"><div className="container-app"><FadeIn><span className="text-eyebrow uppercase text-[#d5bd91]">HolzNest</span><h1 className="mt-3 max-w-2xl text-display-md font-extrabold sm:text-display-lg">Holz für Ihre Vorhaben</h1><p className="mt-4 max-w-xl text-white/75">Wir bieten verschiedene Holzarten an und helfen Ihnen, die passende Bestellung zusammenzustellen.</p></FadeIn></div></section><section className="py-16 sm:py-20"><div className="container-app max-w-3xl"><FadeIn><SectionHeading eyebrow="Unser Ansatz" title="Einfach einkaufen mit klaren Informationen"/><p className="mt-4 leading-relaxed text-ink-500">Jedes Vorhaben ist anders. Ob Heizen, Bauen oder Weiterverarbeiten: Die Wahl hängt von Holzart, Format, Menge und Lieferort ab. Mit diesen Angaben erstellen wir ein passendes Angebot.</p><p className="mt-4 leading-relaxed text-ink-500">Verfügbarkeit, Preise und Lieferbedingungen bestätigen wir im Angebot. Kontaktieren Sie uns, damit wir Ihren Bedarf besprechen können.</p></FadeIn></div></section><section className="border-t border-ink-100 bg-white py-16 sm:py-20"><div className="container-app"><FadeIn><SectionHeading eyebrow="Unsere Leistungen" title="Von der Auswahl bis zur Lieferung an Ihrer Seite" align="center" className="mx-auto"/></FadeIn><div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{VALUES.map((v,i)=><FadeIn key={v.title} delay={i*.06}><div className="h-full border border-[#ded5c6] bg-[#fbf8f1] p-6 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9e2d4] text-[#536147]"><v.icon className="h-5 w-5"/></div><h3 className="mt-4 font-bold text-ink-900">{v.title}</h3><p className="mt-1.5 text-sm text-ink-500">{v.description}</p></div></FadeIn>)}</div></div></section></div>;
}
