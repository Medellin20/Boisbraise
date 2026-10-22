# HolzNest

Boutique web de bois de chauffage : catalogue d’essences, fiches produit, formats et tarifs communs, gestion des photos et administration sécurisée.

## Stack

- Next.js 14, React 18, TypeScript et Tailwind CSS
- Roboto, Framer Motion et icônes Lucide
- Supabase pour les produits, les tarifs, les photos et les messages
- Server Actions protégées par la session administrateur

## Installation

1. Installer Node.js 18.18 ou supérieur, puis `npm install`.
2. Copier `.env.example` en `.env.local` et renseigner `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET`. La clé `SUPABASE_SERVICE_ROLE_KEY` est réservée au serveur : ne la préfixez jamais par `NEXT_PUBLIC_` et ne la publiez pas. Le fichier `.env` n’est pas modifié par l’application.
   En production sur Netlify, renseigner ces variables dans **Site configuration > Environment variables** puis relancer un déploiement. Le fichier `.env` local est ignoré par Git et n’est pas transmis à Netlify.
   Le scan de secrets Netlify reste activé : seules les variables publiques `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_STORAGE_BUCKET` et `ADMIN_ALLOWED_ORIGIN` sont exclues. Ne jamais ajouter `ADMIN_PASSWORD` ou `SUPABASE_SERVICE_ROLE_KEY` à `SECRETS_SCAN_OMIT_KEYS`.
3. Dans Supabase SQL Editor, exécuter `supabase/schema.sql`, puis `supabase/migrations/20260930_wood_catalog.sql`, `supabase/migrations/20261002_wood_product_packages.sql`, `supabase/migrations/20261021_uniform_wood_sales_settings.sql`, `supabase/migrations/20261022_delivery_price_per_litre.sql`, `supabase/rls_policies.sql` et `supabase/seed.sql`. Les migrations ajoutent les prix et formats communs, les longueurs et limites configurables, puis le tarif de livraison de 0,34 € par litre.
4. Démarrer avec `npm run dev`.

Le site est disponible sur `http://localhost:3000`.

## Administration

Ouvrir `/admin` et se connecter avec `ADMIN_PASSWORD`. Dans `/admin/bois`, vous pouvez créer, modifier, publier ou supprimer les essences, gérer les photos et mettre à jour les stocks. Dans `/admin/vente`, modifiez en un seul endroit les prix et contenances des quatre formats, les longueurs de bûches, la quantité maximale par essence et le tarif de livraison au litre : ces réglages s’appliquent uniformément aux six essences.

Les actions serveur valident la session avant toute écriture avec la clé de service. Les visiteurs anonymes ne peuvent lire que les produits publiés.

## Routes principales

- `/` : accueil et estimation hivernale
- `/catalogue` : essences disponibles
- `/catalogue/[slug]` : fiche produit, format, longueur, quantité et total recalculé
- `/commande` : coordonnées de livraison, récapitulatif et transmission de commande par e-mail
- `/commande/paiement` : acompte à régler par RIB ou lien externe
- `/contact` : demande de renseignements ou de devis
- `/admin/bois` : gestion du catalogue et des stocks
- `/admin/vente` : paramètres communs de prix, format, longueur et quantité

## Données et migration

Les photos de produit acceptent JPG, PNG, WebP et AVIF jusqu’à 10 Mo. Les prix communs laissés vides dans `/admin/vente` s’affichent « Sur devis ». La livraison est calculée au tarif commun par litre (0,34 € par défaut), d’après le volume des formats et quantités choisis, puis ajoutée au total. Le stock reste propre à chaque essence ; le panier limite automatiquement les quantités selon le volume des formats, puis le serveur revérifie prix, livraison, limites et stock et recalcule le total avant d’accepter la commande.

Les commandes revérifient les prix et les stocks dans Supabase avant l’envoi. La notification arrive à `WOOD_ORDER_EMAIL` (ou `ALERT_EMAIL` à défaut) via `GMAIL_USER` et `GMAIL_APP_PASSWORD`. Le moyen de paiement (RIB ou lien HTTPS) et les coordonnées se configurent depuis Administration > Paiement et RIB ; choisissez également celui qui sera affiché au client. Appliquez la migration `20260930_wood_store_settings.sql` avant d’utiliser cette page. Le formulaire demande prénom, nom, adresse, code postal, ville, téléphone et e-mail.

L’acompte demandé est égal à 50 % du total, frais de livraison compris ; le solde restant est affiché séparément. Les valeurs de configuration et les modalités de vente doivent être complétées avant d’accepter des commandes. Le tarif standard de livraison est de 0,34 €/litre et peut être modifié dans `/admin/vente`.

Une configuration Gmail absente ou un échec d’envoi ne bloque pas l’affichage du récapitulatif de paiement. Dans ce cas, la commande est seulement préparée dans la session du navigateur : la page et le PDF indiquent qu’elle n’a pas été transmise à l’équipe et demandent de contacter HolzNest avant de payer.

Les fichiers de migrations antérieurs au catalogue bois sont conservés comme historique de base de données. Ils ne sont plus utilisés par les pages publiques du site.
