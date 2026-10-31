begin;

alter table public.wood_sales_packages
  drop constraint if exists wood_sales_packages_package_code_check;
alter table public.wood_sales_packages
  add constraint wood_sales_packages_package_code_check
  check (package_code in ('12_5_litres', '20_litres', '40_litres', '1_rm', 'format_5'));

-- Existing volumes remain available for stock checks. Custom formats have no
-- assumed volume; their availability and quantity limit still apply.
alter table public.wood_sales_packages alter column volume_litres drop not null;

insert into public.wood_sales_packages (package_code, label, volume_litres, price, sort_order)
values ('format_5', 'Format 5', null, null, 5)
on conflict (package_code) do nothing;

-- Retained for compatibility with older deployments; new orders use 30% of
-- the products subtotal and no per-litre charge.
alter table public.wood_orders alter column delivery_litres set default 0;
alter table public.wood_orders alter column delivery_price_per_litre set default 0;

commit;
