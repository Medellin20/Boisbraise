-- Catalogue de bois et photos gérés depuis l’espace admin.
create table if not exists public.wood_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  description text not null default '',
  price_per_m3 numeric(10,2) not null default 0 check (price_per_m3 >= 0),
  moisture_percent numeric(5,2) check (moisture_percent >= 0 and moisture_percent <= 100),
  calorific_value_kwh numeric(8,2) check (calorific_value_kwh >= 0),
  delivery_available boolean not null default true,
  in_stock boolean not null default true,
  stock_m3 numeric(10,2) check (stock_m3 >= 0),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wood_products_public_idx on public.wood_products (is_published, sort_order, name);

create table if not exists public.wood_product_lengths (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.wood_products(id) on delete cascade,
  length_cm integer not null check (length_cm in (25, 33, 40, 50, 100)),
  price_per_m3 numeric(10,2) check (price_per_m3 >= 0),
  sort_order integer not null default 0,
  unique (product_id, length_cm)
);
create index if not exists wood_product_lengths_product_idx on public.wood_product_lengths (product_id, sort_order);

create table if not exists public.wood_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.wood_products(id) on delete cascade,
  storage_path text not null,
  url text not null,
  alt_text text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists wood_product_images_product_idx on public.wood_product_images (product_id, sort_order);
create unique index if not exists wood_product_images_one_primary_idx on public.wood_product_images (product_id) where is_primary;

create or replace function public.enforce_single_primary_wood_image()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.is_primary then
    update public.wood_product_images set is_primary = false
      where product_id = new.product_id and id <> new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_single_primary_wood_image on public.wood_product_images;
create trigger trg_single_primary_wood_image before insert or update of is_primary
  on public.wood_product_images for each row execute function public.enforce_single_primary_wood_image();

alter table public.wood_products enable row level security;
alter table public.wood_product_lengths enable row level security;
alter table public.wood_product_images enable row level security;
drop policy if exists wood_products_public_read on public.wood_products;
create policy wood_products_public_read on public.wood_products for select to anon, authenticated using (is_published);
drop policy if exists wood_product_lengths_public_read on public.wood_product_lengths;
create policy wood_product_lengths_public_read on public.wood_product_lengths for select to anon, authenticated using (
  exists (select 1 from public.wood_products p where p.id = product_id and p.is_published)
);
drop policy if exists wood_product_images_public_read on public.wood_product_images;
create policy wood_product_images_public_read on public.wood_product_images for select to anon, authenticated using (
  exists (select 1 from public.wood_products p where p.id = product_id and p.is_published)
);

grant select on public.wood_products, public.wood_product_lengths, public.wood_product_images to anon, authenticated;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wood-product-images', 'wood-product-images', true, 10485760,
  array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists wood_product_images_bucket_public_read on storage.objects;
create policy wood_product_images_bucket_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'wood-product-images');

-- Essences initiales correspondant aux cartes de la boutique.
insert into public.wood_products (slug, name, short_description, description, price_per_m3, moisture_percent, calorific_value_kwh, delivery_available, in_stock, stock_m3, is_published, sort_order)
values
  ('chene','Chêne','Bois dense à combustion longue, idéal pour les longues soirées.','Le chêne est apprécié pour sa combustion lente et sa chaleur durable.',87.40,20,null,true,true,null,true,1),
  ('hetre','Hêtre','Belle flamme claire et chaleur vive, le préféré des cheminées ouvertes.','Le hêtre offre une flamme lumineuse et une bonne restitution de chaleur.',82.80,20,2050,true,true,40,true,2),
  ('frene','Frêne','Allumage facile, combustion propre et peu de cendres.','Le frêne s’allume facilement et produit une chaleur régulière.',80.96,20,null,true,true,null,true,3)
on conflict (slug) do nothing;
insert into public.wood_product_lengths(product_id,length_cm,price_per_m3,sort_order)
select p.id, l.length_cm, l.price_per_m3, l.sort_order
from public.wood_products p
join (values
  ('hetre',25,103.50,1),('hetre',33,97.20,2),('hetre',40,93.60,3),('hetre',50,90.00,4),('hetre',100,82.80,5),
  ('chene',25,null::numeric,1),('chene',33,null::numeric,2),('chene',40,null::numeric,3),('chene',50,null::numeric,4),('chene',100,87.40,5),
  ('frene',25,null::numeric,1),('frene',33,null::numeric,2),('frene',40,null::numeric,3),('frene',50,null::numeric,4),('frene',100,80.96,5)
) as l(slug,length_cm,price_per_m3,sort_order) on l.slug=p.slug
on conflict (product_id,length_cm) do nothing;
