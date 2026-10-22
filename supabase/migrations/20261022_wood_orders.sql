create table if not exists public.wood_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_first_name text not null,
  customer_last_name text not null,
  customer_address text not null,
  customer_postal_code text not null,
  customer_city text not null,
  customer_phone text not null,
  customer_email text not null,
  lines jsonb not null check (jsonb_typeof(lines) = 'array'),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null check (delivery_fee >= 0),
  delivery_litres numeric(10, 2) not null check (delivery_litres >= 0),
  delivery_price_per_litre numeric(10, 2) not null check (delivery_price_per_litre >= 0),
  total numeric(10, 2) not null check (total >= 0),
  deposit numeric(10, 2) not null check (deposit >= 0),
  remaining numeric(10, 2) not null check (remaining >= 0),
  payment_method text not null check (payment_method in ('link', 'rib')),
  created_at timestamptz not null default now()
);

create index if not exists wood_orders_created_at_idx on public.wood_orders(created_at desc);
alter table public.wood_orders enable row level security;
-- Aucun accès navigateur : la table est lue et écrite uniquement côté serveur avec service_role.
