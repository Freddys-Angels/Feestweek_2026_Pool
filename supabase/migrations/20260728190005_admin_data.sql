-- ============================================================
-- 20260728190005_admin_data.sql
-- Singleton-rij voor algemene instellingen (zoals bij WK2026-project)
-- ============================================================

create table if not exists admin_data (
  id text primary key default 'singleton',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into admin_data (id, data)
values ('singleton', '{}'::jsonb)
on conflict (id) do nothing;

alter table admin_data enable row level security;
create policy "admin_data_select_anon" on admin_data for select using (true);
-- Schrijven alleen via Edge Function (service_role), net als bij WK2026.
