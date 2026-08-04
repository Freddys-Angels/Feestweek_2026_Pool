-- ============================================================
-- HERNUMMERD op 2026-08-04: dit bestand deelde per ongeluk hetzelfde versienummer (20260728190007) met deelnemer_team.sql, waardoor Supabase migraties bleven falen op een dubbele sleutel in schema_migrations.
-- 20260728190007_feestweek_teams.sql
-- Feestweek-teams (buurtteam van de deelnemer zelf) — los van de
-- 'teams'-tabel die gebruikt wordt voor de heren/dames-voorspellingen.
-- Lijst wordt later aangevuld door de admin.
--
-- LET OP: idempotent gemaakt op 2026-08-04 nadat deze migratie was
-- vastgelopen (policy bestond al in de database maar was niet als
-- toegepast geregistreerd, waardoor elke volgende deploy hierop bleef
-- stuklopen en alle latere migraties blokkeerde).
-- ============================================================

create table if not exists feestweek_teams (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  volgorde int not null default 0,
  created_at timestamptz not null default now()
);

alter table feestweek_teams enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feestweek_teams' and policyname = 'feestweek_teams_select_anon'
  ) then
    execute 'create policy "feestweek_teams_select_anon" on feestweek_teams for select using (true)';
  end if;
end $$;

-- Nullable: 'geen team' = null, geen aparte optie nodig.
alter table deelnemers add column if not exists feestweek_team_id uuid references feestweek_teams(id);
