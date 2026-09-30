-- Réglages privés administrés depuis l'espace HolzNest.
create table if not exists public.wood_store_settings (
  id smallint primary key default 1 check (id = 1),
  payment_method text not null default 'rib' check (payment_method in ('rib', 'link')),
  payment_url text not null default '',
  bank_name text not null default '',
  bank_account_holder text not null default '',
  bank_iban text not null default '',
  bank_bic text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.wood_store_settings enable row level security;
-- Aucun accès anon/authenticated : lecture et écriture uniquement avec service_role côté serveur.
insert into public.wood_store_settings (id) values (1) on conflict (id) do nothing;
