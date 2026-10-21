create table if not exists public.wood_sales_settings (
  id smallint primary key check (id = 1),
  allowed_lengths_cm integer[] not null default array[25, 33, 50],
  max_quantity_per_product integer not null default 100 check (max_quantity_per_product between 1 and 1000),
  updated_at timestamptz not null default now(),
  check (cardinality(allowed_lengths_cm) > 0)
);

create table if not exists public.wood_sales_packages (
  package_code text primary key check (package_code in ('12_5_litres', '20_litres', '40_litres', '1_rm')),
  label text not null check (length(trim(label)) between 1 and 80),
  volume_litres numeric(10, 2) not null check (volume_litres > 0),
  price numeric(10, 2) check (price is null or price >= 0),
  sort_order integer not null default 0
);

insert into public.wood_sales_settings (id)
values (1)
on conflict (id) do nothing;

insert into public.wood_sales_packages (package_code, label, volume_litres, price, sort_order)
values
  ('12_5_litres', '12,5 litres', 12.5, 4.50, 1),
  ('20_litres', '20 litres', 20, 7.00, 2),
  ('40_litres', '40 litres', 40, 14.00, 3),
  ('1_rm', '1 RM', 1000, 199.00, 4)
on conflict (package_code) do nothing;

alter table public.wood_sales_settings enable row level security;
alter table public.wood_sales_packages enable row level security;

drop policy if exists wood_sales_settings_public_read on public.wood_sales_settings;
create policy wood_sales_settings_public_read on public.wood_sales_settings
  for select to anon, authenticated using (id = 1);

drop policy if exists wood_sales_packages_public_read on public.wood_sales_packages;
create policy wood_sales_packages_public_read on public.wood_sales_packages
  for select to anon, authenticated using (true);

grant select on public.wood_sales_settings, public.wood_sales_packages to anon, authenticated;
