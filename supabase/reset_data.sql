-- Réinitialise le catalogue bois, les messages de contact et le journal admin.
-- Cette opération supprime les produits et leurs images associées.
begin;
truncate table public.wood_products, public.contact_messages, public.admin_logs restart identity cascade;
delete from storage.objects where bucket_id='wood-product-images';
commit;
