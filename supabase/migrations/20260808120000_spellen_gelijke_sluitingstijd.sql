-- ============================================================
-- 20260808120000_spellen_gelijke_sluitingstijd.sql
-- Alle spellen (incl. Supercup/eindstand) sluiten nu gelijktijdig,
-- op maandag 7 september 2026 om 19:00 (Nederlandse tijd, CEST/UTC+2 =
-- 17:00 UTC), het moment waarop het eerste spel begint.
-- ============================================================

update spellen set sluitingstijd = '2026-09-07T17:00:00+00:00';
