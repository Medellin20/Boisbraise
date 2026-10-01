import type { Metadata } from 'next';
import { Accordion } from '@/components/shared/accordion';
import { FadeIn } from '@/components/ui/fade-in';
export const metadata: Metadata = { title: 'FAQ', description: 'Häufige Fragen zu Holzauswahl, Angebot und Lieferung.' };
const CATEGORIES = [
  { title: 'Produkte & Angebote', items: [
    { question: 'Welche Holzarten bieten Sie an?', answer: 'Wir bieten Holz zum Heizen, Rohholz und Bauholz an. Kontaktieren Sie uns zu aktuell verfügbaren Holzarten und Formaten.' },
    { question: 'Wie erhalte ich einen Preis?', answer: 'Senden Sie uns den Verwendungszweck, die gewünschten Maße oder Mengen und den Lieferort. Wir erstellen ein Angebot abhängig von Verfügbarkeit und Lieferung.' },
    { question: 'Kann ich eine bestimmte Menge oder Größe bestellen?', answer: 'Teilen Sie uns Ihren Bedarf über das Formular mit. Wir bestätigen die Möglichkeiten vor Ihrer Bestellung.' },
  ] },
  { title: 'Abholung & Lieferung', items: [
    { question: 'Liefern Sie in meine Region?', answer: 'Möglichkeiten und Transportkosten hängen von Lieferort, Menge und Produktart ab. Geben Sie Ihren Ort an, damit wir Ihnen Bescheid geben können.' },
    { question: 'Wann kann meine Bestellung geliefert werden?', answer: 'Den Lieferzeitraum bestätigen wir mit dem Angebot, abhängig vom Lagerbestand und der Transportplanung.' },
  ] },
];
export default function FaqPage() { return <div className="container-app py-14 sm:py-20"><FadeIn><span className="text-eyebrow uppercase text-canal-600">HolzNest · Hilfe</span><h1 className="mt-2 text-display-sm font-extrabold text-ink-900 sm:text-display-md">Häufige Fragen</h1><p className="mt-3 max-w-xl text-ink-500">Wichtige Informationen für Ihre Angebotsanfrage und Bestellung.</p></FadeIn><div className="mt-12 max-w-3xl space-y-10">{CATEGORIES.map((category,i)=><FadeIn key={category.title} delay={i*.05}><h2 className="mb-4 text-lg font-bold text-ink-900">{category.title}</h2><Accordion items={category.items}/></FadeIn>)}</div></div>; }
