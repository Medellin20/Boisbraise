import type { Metadata } from 'next';
import { LegalPage } from '@/components/shared/legal-page';
export const metadata: Metadata = { title: 'Allgemeine Geschäftsbedingungen' };
export default function ConditionsGeneralesPage() {
  return <LegalPage title="Allgemeine Geschäftsbedingungen" updatedAt="Noch zu ergänzen">
    <p><em>Dieser Entwurf muss vom Verkäufer vor dem Onlineverkauf geprüft und vervollständigt werden. Angaben in eckigen Klammern sind durch die tatsächlichen Unternehmensdaten zu ersetzen.</em></p>
    <h2>Verkäufer</h2><p>[Firmenname, Rechtsform, Anschrift, Registereintrag und Kontaktdaten des Verkäufers ergänzen.]</p>
    <h2>Angebot und Bestellung</h2><p>Eigenschaften, Holzarten, Maße, Mengen, Preise, Steuern und Verfügbarkeit müssen im Kundenangebot bestätigt werden. Der Verkäufer legt Bestell- und Bestätigungsbedingungen fest.</p>
    <h2>Abholung und Lieferung</h2><p>Liefergebiete, Kosten, Fristen, Zufahrtsbedingungen und Übergabe werden im angenommenen Angebot festgelegt. Sie hängen insbesondere von Produkt, Menge und Lieferort ab.</p>
    <h2>Zahlung, Stornierung und Reklamationen</h2><p>[Zahlungsarten und -fristen, Stornierungsregeln, Bearbeitung von Reklamationen und geltende Garantien beschreiben.]</p>
    <h2>Anwendbares Recht</h2><p>[Zuständiges Gericht und anwendbares Recht gemäß Sitz des Verkäufers und geltenden Vorschriften ergänzen.]</p>
  </LegalPage>;
}
