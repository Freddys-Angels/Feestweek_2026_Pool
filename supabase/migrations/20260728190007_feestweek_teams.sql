-- ============================================================
-- 20260728190007_feestweek_teams.sql
-- Feestweek-teams (buurtteam van de deelnemer zelf) — los van de
-- 'teams'-tabel die gebruikt wordt voor de heren/dames-voorspellingen.
-- Lijst wordt later aangevuld door de admin.
-- ============================================================

create table if not exists feestweek_teams (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  volgorde int not null default 0,
  created_at timestamptz not null default now()
);

alter table feestweek_teams enable row level security;
create policy "feestweek_teams_select_anon" on feestweek_teams for select using (true);

-- Nullable: 'geen team' = null, geen aparte optie nodig.
alter table deelnemers add column if not exists feestweek_team_id uuid references feestweek_teams(id);
