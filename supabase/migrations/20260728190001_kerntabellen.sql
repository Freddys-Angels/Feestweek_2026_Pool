-- ============================================================
-- 20260728190001_kerntabellen.sql
-- Feestweek Vijfhuizen Pool — teams, spellen, uitslagen
-- ============================================================

-- TEAMS
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  categorie text not null check (categorie in ('heren','dames')),
  volgorde int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_teams_categorie on teams(categorie);

-- SPELLEN
-- Eén spel geldt voor beide categorieën (zelfde naam/dag), maar heeft
-- een aparte uitslag per categorie (zie tabel 'uitslagen').
create table if not exists spellen (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  volgorde int not null default 0,
  speeldatum date,
  sluitingstijd timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_spellen_volgorde on spellen(volgorde);

-- UITSLAGEN
-- Officiële uitslag per spel + categorie: top 3 posities.
create table if not exists uitslagen (
  id uuid primary key default gen_random_uuid(),
  spel_id uuid not null references spellen(id) on delete cascade,
  categorie text not null check (categorie in ('heren','dames')),
  positie int not null check (positie between 1 and 3),
  team_id uuid references teams(id),
  updated_at timestamptz not null default now(),
  unique (spel_id, categorie, positie)
);
create index if not exists idx_uitslagen_spel on uitslagen(spel_id, categorie);

-- RLS — anon-rol krijgt alleen leesrechten. Schrijven via Edge Function (service_role).
alter table teams enable row level security;
alter table spellen enable row level security;
alter table uitslagen enable row level security;

create policy "teams_select_anon" on teams for select using (true);
create policy "spellen_select_anon" on spellen for select using (true);
create policy "uitslagen_select_anon" on uitslagen for select using (true);
