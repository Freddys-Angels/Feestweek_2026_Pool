-- ============================================================
-- 20260728190004_voorspellingen.sql
-- Voorspellingen per deelnemer (nu gekoppeld aan Supabase Auth)
-- ============================================================

create table if not exists voorspellingen (
  id uuid primary key default gen_random_uuid(),
  deelnemer_id uuid not null unique references auth.users(id) on delete cascade,

  -- predictions structuur:
  -- { "<spel_id>": { "heren": {"1": "<team_id>", "2": "<team_id>", "3": "<team_id>"},
  --                  "dames": {"1": "<team_id>", "2": "<team_id>", "3": "<team_id>"} } }
  predictions jsonb not null default '{}'::jsonb,

  -- bonusvragen antwoorden: { "<bonusvraag_id>": "antwoord" }
  bonus_antwoorden jsonb not null default '{}'::jsonb,

  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_voorspellingen_deelnemer on voorspellingen(deelnemer_id);

-- RLS: een deelnemer mag alleen zijn/haar eigen voorspelling lezen.
-- Wegschrijven (insert/update) gaat altijd via de Edge Function 'fw2026-opslaan-voorspelling'
-- met de service_role key, omdat daar ook de sluitingstijd- en joker-validatie gebeurt.
alter table voorspellingen enable row level security;
create policy "voorspellingen_select_eigen" on voorspellingen for select using (auth.uid() = deelnemer_id);

-- Let op: joker-keuze (joker_heren_spel_id / joker_dames_spel_id) staat op de
-- 'deelnemers'-tabel (zie 20260728190003_deelnemers.sql), niet hier — dat is de
-- plek waar ook de rest van het deelnemersprofiel staat.
