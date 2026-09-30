import type { Metadata } from 'next';
import { LegalPage } from '@/components/shared/legal-page';

export const metadata: Metadata = { title: 'Mentions légales' };

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updatedAt="9 août 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site HolzNest est édité par [raison sociale à compléter], [forme juridique et pays à compléter]. <em>[Ces informations sont fournies à titre d’exemple et doivent être
        complétées avec les données réelles de votre société : raison sociale, SIRET, adresse
        du siège, numéro de TVA, directeur de la publication.]</em>
      </p>

      <h2>Hébergement</h2>
      <p>
        L’application est hébergée sur l’infrastructure de votre fournisseur d’hébergement
        (ex : [fournisseur à confirmer]) et les données sont stockées via Supabase (PostgreSQL).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L’ensemble des contenus présents sur ce site (textes, photographies, logo, charte graphique)
        est protégé par le droit d’auteur. Toute reproduction, même partielle, est interdite sans
        autorisation préalable.
      </p>

      <h2>Responsabilité</h2>
      <p>
        HolzNest s’efforce d’assurer l’exactitude des informations diffusées sur ce site mais
        ne saurait être tenue responsable des erreurs, omissions ou indisponibilités temporaires.
      </p>

      <h2>Contact</h2>
      <p>Pour toute question relative aux présentes mentions légales : [adresse e-mail à compléter]</p>
    </LegalPage>
  );
}
