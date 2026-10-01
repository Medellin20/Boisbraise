import type { Metadata } from 'next';
import { LegalPage } from '@/components/shared/legal-page';

export const metadata: Metadata = { title: 'Datenschutzerklärung' };

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Datenschutzerklärung" updatedAt="21. August 2026">
      <h2>Erhobene Daten</h2>
      <p>
        Wenn Sie das Kontaktformular nutzen, werden Ihre Angaben zur Bearbeitung Ihrer Anfrage übermittelt. Die genauen Datenkategorien, der Verantwortliche und die Aufbewahrungsfristen müssen vom Betreiber bestätigt werden.
      </p>

      <h2>Zwecke der Verarbeitung</h2>
      <p>
        Die Angaben dienen der Bearbeitung von Fragen und Angebotsanfragen zu Produkten und deren Lieferung.
      </p>

      <h2>Speicherdauer</h2>
      <p>
        Ihre Daten werden so lange gespeichert, wie es zur Bearbeitung Ihres Anliegens erforderlich ist, und anschließend gemäß den geltenden gesetzlichen Pflichten archiviert.
      </p>

      <h2>Sicherheit</h2>
      <p>
        Ihre Daten werden auf einer geschützten Supabase-Infrastruktur gespeichert und durch Row-Level-Security-Richtlinien geschützt. Der Zugriff ist unserem Verwaltungsteam vorbehalten.
      </p>

      <h2>Ihre Rechte</h2>
      <p>
        Gemäß der Datenschutz-Grundverordnung (DSGVO) haben Sie das Recht auf Auskunft, Berichtigung und Löschung Ihrer Daten. Zur Ausübung dieser Rechte kontaktieren Sie uns unter [Kontakt-E-Mail ergänzen].
      </p>

      <h2>Cookies</h2>
      <p>
        Diese Website verwendet den lokalen Browserspeicher ausschließlich zum Merken Ihrer Favoriten. Werbe-Tracking-Cookies werden nicht eingesetzt.
      </p>
    </LegalPage>
  );
}
