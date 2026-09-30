-- À exécuter après schema.sql et la migration du catalogue bois.
alter table public.contact_messages enable row level security;
alter table public.admin_logs enable row level security;
alter table public.wood_products enable row level security;
alter table public.wood_product_lengths enable row level security;
alter table public.wood_product_images enable row level security;

drop policy if exists wood_products_public_read on public.wood_products;
create policy wood_products_public_read on public.wood_products for select to anon, authenticated using (is_published);
drop policy if exists wood_product_lengths_public_read on public.wood_product_lengths;
create policy wood_product_lengths_public_read on public.wood_product_lengths for select to anon, authenticated using (
  exists(select 1 from public.wood_products p where p.id=product_id and p.is_published)
);
drop policy if exists wood_product_images_public_read on public.wood_product_images;
create policy wood_product_images_public_read on public.wood_product_images for select to anon, authenticated using (
  exists(select 1 from public.wood_products p where p.id=product_id and p.is_published)
);
drop policy if exists wood_product_images_bucket_public_read on storage.objects;
create policy wood_product_images_bucket_public_read on storage.objects for select to anon, authenticated using (bucket_id='wood-product-images');
-- Le navigateur ne peut écrire aucune donnée directe. Les Server Actions vérifient
-- la session admin puis utilisent la clé service côté serveur.
