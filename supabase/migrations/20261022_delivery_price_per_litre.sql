alter table public.wood_sales_settings
  add column if not exists delivery_price_per_litre numeric(10, 2) not null default 0.34
  check (delivery_price_per_litre >= 0);
