-- Suppression définitive des tables de l’ancien catalogue immobilier.
-- Les tables bois/contact/admin et les fichiers Storage restent conservés.
-- Les tables dépendantes sont supprimées avant leurs tables parentes ; aucune
-- suppression en cascade n’est utilisée afin de protéger les objets non listés.

begin;

drop table if exists public.refund_requests;
drop table if exists public.guarantee_payments;
drop table if exists public.status_history;
drop table if exists public.reservations;
drop table if exists public.viewing_requests;
drop table if exists public.favorites;
drop table if exists public.property_amenities;
drop table if exists public.property_images;
drop table if exists public.properties;
drop table if exists public.clients;
drop table if exists public.payment_settings;

commit;
