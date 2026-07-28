-- ============================================================
-- 20260728190002_bonusvragen.sql
-- Bonusvragen rond het weekthema (thema nog te bepalen)
-- ============================================================

create table if not exists bonusvragen (
  id uuid primary key default gen_random_uuid(),
  vraag text not null,
  punten int not null default 15,
  correct_antwoord text,           -- door admin ingevuld na afloop van de week
  volgorde int not null default 0,
  created_at timestamptz not null default now()
);

alter table bonusvragen enable row level security;
create policy "bonusvragen_select_anon" on bonusvragen for select using (true);
