-- ============================================================
-- 20260819150000_korte_spelnamen_dagen.sql
-- De korte naam (`naam`, gebruikt in tussenstand en positieverloop-
-- grafieken waar weinig ruimte is) wordt de dagafkorting i.p.v. de
-- volledige spelnaam. `volledige_naam` (invoerpagina bij Deelnemers)
-- blijft ongewijzigd staan zoals ingevuld in de vorige migratie.
-- ============================================================

update spellen set naam = 'Ma' where speeldatum = '2026-09-07';
update spellen set naam = 'Di' where speeldatum = '2026-09-08';
update spellen set naam = 'Wo' where speeldatum = '2026-09-09';
update spellen set naam = 'Do' where speeldatum = '2026-09-10';
update spellen set naam = 'Vr' where speeldatum = '2026-09-11';
