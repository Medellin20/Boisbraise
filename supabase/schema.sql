-- Schéma initial HolzNest : catalogue, tarifs, photos, contact et audit.
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  actor text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.wood_products (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  short_description text not null default '', description text not null default '',
  price_per_m3 numeric(10,2) not null default 0 check (price_per_m3 >= 0),
  moisture_percent numeric(5,2) check (moisture_percent between 0 and 100),
  calorific_value_kwh numeric(8,2) check (calorific_value_kwh >= 0),
  delivery_available boolean not null default true, in_stock boolean not null default true,
  stock_m3 numeric(10,2) check (stock_m3 >= 0), is_published boolean not null default false,
  sort_order integer not null default 0, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.wood_product_lengths (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.wood_products(id) on delete cascade,
  length_cm integer not null check (length_cm in (25,33,40,50,100)),
  price_per_m3 numeric(10,2) check (price_per_m3 >= 0), sort_order integer not null default 0,
  unique(product_id,length_cm)
);
create table if not exists public.wood_product_images (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.wood_products(id) on delete cascade,
  storage_path text not null, url text not null, alt_text text, is_primary boolean not null default false,
  sort_order integer not null default 0, created_at timestamptz not null default now()
);
create index if not exists wood_products_public_idx on public.wood_products(is_published,sort_order,name);
create index if not exists wood_product_lengths_product_idx on public.wood_product_lengths(product_id,sort_order);
create index if not exists wood_product_images_product_idx on public.wood_product_images(product_id,sort_order);
create unique index if not exists wood_product_images_one_primary_idx on public.wood_product_images(product_id) where is_primary;
