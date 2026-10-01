import type { Metadata } from 'next';
import { LegalPage } from '@/components/shared/legal-page';

export const metadata: Metadata = { title: 'Impressum' };

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Impressum" updatedAt="9. August 2026">
      <h2>Betreiber der Website</h2>
      <p>
        Die Website HolzNest wird betrieben von [Firmenname ergänzen], [Rechtsform und Land ergänzen]. <em>[Diese Angaben sind Beispiele und müssen durch die tatsächlichen Unternehmensdaten ersetzt werden: Firmenname, Handelsregisternummer, Anschrift, Umsatzsteuer-ID und verantwortliche Person.]</em>
      </p>

      <h2>Hosting</h2>
      <p>
        Die Anwendung wird auf der Infrastruktur Ihres Hosting-Anbieters betrieben (z. B. [Anbieter bestätigen]); die Daten werden über Supabase (PostgreSQL) gespeichert.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Alle Inhalte dieser Website (Texte, Fotos, Logo und Gestaltung) sind urheberrechtlich geschützt. Eine auch teilweise Vervielfältigung ist ohne vorherige Genehmigung untersagt.
      </p>

      <h2>Haftung</h2>
      <p>
        HolzNest bemüht sich um korrekte Angaben auf dieser Website, übernimmt jedoch keine Haftung für Fehler, Auslassungen oder vorübergehende Nichtverfügbarkeit.
      </p>

      <h2>Kontakt</h2>
      <p>Bei Fragen zu diesem Impressum: [E-Mail-Adresse ergänzen]</p>
    </LegalPage>
  );
}
