-- ============================================================
-- 20260819140000_definitieve_spelnamen.sql
-- Vervangt de placeholder-namen ('Spel 1'..'Spel 5') door de
-- definitieve spelnamen. `naam` is de korte versie (tussenstand,
-- positieverloop-grafieken), `volledige_naam` de volledige titel zoals
-- getoond op de invoerpagina bij Deelnemers.
-- ============================================================

update spellen set naam = 'Touwtrekken', volledige_naam = 'Touwtrekken'
  where speeldatum = '2026-09-07';

update spellen set naam = 'De Oase', volledige_naam = 'Waterspel: De Oase'
  where speeldatum = '2026-09-08';

update spellen set naam = 'Sinbad''s Schattenstrijd', volledige_naam = 'Spel: Sinbad''s Schattenstrijd'
  where speeldatum = '2026-09-09';

update spellen set naam = 'De vloek van de geest', volledige_naam = 'Spel: De vloek van de geest'
  where speeldatum = '2026-09-10';

update spellen set naam = 'De Karavaan', volledige_naam = 'Spel: De Karavaan'
  where speeldatum = '2026-09-11';
