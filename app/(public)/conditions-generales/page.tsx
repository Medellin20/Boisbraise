import type { Metadata } from 'next';
import { LegalPage } from '@/components/shared/legal-page';
export const metadata: Metadata = { title: 'Conditions générales de vente' };
export default function ConditionsGeneralesPage() {
  return <LegalPage title="Conditions générales de vente" updatedAt="À compléter">
    <p><em>Projet de contenu à faire valider et compléter par le vendeur avant toute vente en ligne. Les éléments entre crochets doivent être remplacés par les informations exactes de l’entreprise.</em></p>
    <h2>Vendeur</h2><p>[Raison sociale, forme juridique, adresse, immatriculation et coordonnées du vendeur à compléter.]</p>
    <h2>Devis et commande</h2><p>Les caractéristiques, essences, dimensions, volumes, prix, taxes applicables et disponibilités doivent être confirmés dans le devis transmis au client. La commande et ses modalités de validation sont à préciser par le vendeur.</p>
    <h2>Retrait et livraison</h2><p>Les zones desservies, frais, délais, conditions d’accès et modalités de réception sont précisés dans l’offre acceptée. Ils dépendent notamment du produit, du volume et de la destination.</p>
    <h2>Paiement, annulation et réclamations</h2><p>[Décrire les moyens et échéances de paiement, les règles d’annulation, le traitement des réclamations et les garanties applicables.]</p>
    <h2>Droit applicable</h2><p>[Juridiction et droit applicables à compléter selon le lieu d’établissement du vendeur et les règles en vigueur.]</p>
  </LegalPage>;
}
