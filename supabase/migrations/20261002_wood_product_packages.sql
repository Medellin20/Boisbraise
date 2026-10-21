-- Formats de vente en sachets et au raummeter, avec prix configurables par essence.
create table if not exists public.wood_product_packages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.wood_products(id) on delete cascade,
  package_code text not null check (package_code in ('12_5_litres', '20_litres', '40_litres', '1_rm')),
  price numeric(10,2) check (price >= 0),
  sort_order integer not null default 0,
  unique (product_id, package_code)
);

alter table public.wood_product_packages enable row level security;
drop policy if exists wood_product_packages_public_read on public.wood_product_packages;
create policy wood_product_packages_public_read on public.wood_product_packages for select to anon, authenticated using (
  exists (select 1 from public.wood_products p where p.id = product_id and p.is_published)
);
grant select on public.wood_product_packages to anon, authenticated;

insert into public.wood_products
  (slug, name, short_description, description, price_per_m3, delivery_available, in_stock, is_published, sort_order)
values
  ('bouleau', 'Bouleau', 'Bois clair, apprécié pour son allumage facile et sa flamme vive.', 'Le bouleau est un bois facile à allumer, adapté aux feux vifs. Les prix des formats et la longueur des bûches sont indiqués ci-dessous.', 199, true, true, true, 4),
  ('charme', 'Charme', 'Bois dense qui offre une combustion soutenue.', 'Le charme est un bois dense, recherché pour sa combustion soutenue. Les prix des formats et la longueur des bûches sont indiqués ci-dessous.', 199, true, true, true, 5),
  ('epicea', 'Épicéa', 'Bois résineux, souvent choisi pour démarrer un feu.', 'L’épicéa est un bois résineux qui s’allume rapidement et convient notamment à l’allumage. Les prix des formats et la longueur des bûches sont indiqués ci-dessous.', 199, true, true, true, 6)
on conflict (slug) do nothing;

insert into public.wood_product_lengths (product_id, length_cm, price_per_m3, sort_order)
select p.id, lengths.length_cm, null, lengths.sort_order
from public.wood_products p
cross join (values (25, 1), (33, 2), (50, 3)) as lengths(length_cm, sort_order)
where p.slug in ('bouleau', 'charme', 'epicea')
on conflict (product_id, length_cm) do nothing;

insert into public.wood_product_packages (product_id, package_code, price, sort_order)
select p.id, packages.package_code, packages.price, packages.sort_order
from public.wood_products p
cross join (values
  ('12_5_litres', 4.50::numeric, 1),
  ('20_litres', 7.00::numeric, 2),
  ('40_litres', 14.00::numeric, 3),
  ('1_rm', 199.00::numeric, 4)
) as packages(package_code, price, sort_order)
where p.slug in ('chene', 'hetre', 'frene', 'bouleau', 'charme', 'epicea')
on conflict (product_id, package_code) do nothing;
