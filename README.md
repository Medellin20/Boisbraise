# HolzNest

Boutique web de bois de chauffage : catalogue d’essences, fiches produit, tarifs par longueur, gestion des photos et administration sécurisée.

## Stack

- Next.js 14, React 18, TypeScript et Tailwind CSS
- Roboto, Framer Motion et icônes Lucide
- Supabase pour les produits, les tarifs, les photos et les messages
- Server Actions protégées par la session administrateur

## Installation

1. Installer Node.js 18.18 ou supérieur, puis `npm install`.
2. Copier `.env.example` en `.env.local` et renseigner Supabase, le mot de passe admin et le secret de session. Le fichier `.env` n’est pas modifié par l’application.
3. Dans Supabase SQL Editor, exécuter `supabase/schema.sql`, puis `supabase/migrations/20260930_wood_catalog.sql`, `supabase/rls_policies.sql` et `supabase/seed.sql`. La migration crée les tables du catalogue, les règles publiques de lecture et le bucket de photos, puis ajoute les essences de départ.
4. Démarrer avec `npm run dev`.

Le site est disponible sur `http://localhost:3000`.

## Administration

Ouvrir `/admin` et se connecter avec `ADMIN_PASSWORD`. L’accueil admin mène au catalogue `/admin/bois`. Depuis cet espace, vous pouvez créer, modifier, publier ou supprimer des produits, régler les prix par longueur et gérer les photos dans Supabase Storage.

Les actions serveur valident la session avant toute écriture avec la clé de service. Les visiteurs anonymes ne peuvent lire que les produits publiés.

## Routes principales

- `/` : accueil et estimation hivernale
- `/catalogue` : essences disponibles
- `/catalogue/[slug]` : fiche produit, longueur, quantité et total
- `/commande` : coordonnées de livraison, récapitulatif et transmission de commande par e-mail
- `/commande/paiement` : acompte à régler par RIB ou lien externe
- `/contact` : demande de renseignements ou de devis
- `/admin/bois` : gestion du catalogue

## Données et migration

Les photos de produit acceptent JPG, PNG, WebP et AVIF jusqu’à 10 Mo. Les tarifs laissés vides dans le formulaire s’affichent « Sur devis ».

Les commandes revérifient les prix et les stocks dans Supabase avant l’envoi. La notification arrive à `WOOD_ORDER_EMAIL` (ou `ALERT_EMAIL` à défaut) via `GMAIL_USER` et `GMAIL_APP_PASSWORD`. Configurez `WOOD_DELIVERY_FEE_EUR` avec le montant fixe de livraison. Le moyen de paiement (RIB ou lien HTTPS) et les coordonnées se configurent depuis Administration > Paiement et RIB ; choisissez également celui qui sera affiché au client. Appliquez la migration `20260930_wood_store_settings.sql` avant d’utiliser cette page. Le formulaire demande prénom, nom, adresse, code postal, ville, téléphone et e-mail.

L’acompte demandé est égal à 50 % du montant du bois plus 100 % des frais de livraison ; le solde du bois est affiché séparément. Les valeurs de configuration et les modalités de vente doivent être complétées avant d’accepter des commandes.

Les fichiers de migrations antérieurs au catalogue bois sont conservés comme historique de base de données. Ils ne sont plus utilisés par les pages publiques du site.
