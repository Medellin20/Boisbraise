create table if not exists public.site_contact_settings (
  id smallint primary key default 1 check (id = 1),
  contact_email text not null default '',
  phone_numbers text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.site_contact_settings enable row level security;

drop policy if exists site_contact_settings_public_read on public.site_contact_settings;
create policy site_contact_settings_public_read
  on public.site_contact_settings
  for select
  to anon, authenticated
  using (true);

grant select on public.site_contact_settings to anon, authenticated;

insert into public.site_contact_settings (id)
values (1)
on conflict (id) do nothing;
