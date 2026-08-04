-- ============================================================
-- 20260804190001_eindstand_supercup.sql
-- Markeert een 'spel' als de eindstand/supercup-voorspelling:
-- dezelfde top-3-opzet als de reguliere spellen, maar telt dubbel
-- en is uitgesloten van de joker-regeling.
-- ============================================================

alter table spellen add column if not exists is_eindstand boolean not null default false;

-- Er mag maximaal één spel als eindstand gemarkeerd zijn.
create unique index if not exists idx_spellen_eindstand_uniek
  on spellen ((is_eindstand))
  where is_eindstand = true;
