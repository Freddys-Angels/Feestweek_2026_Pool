-- ============================================================
-- 20260804193001_placeholder_spellen.sql
-- Vult de 5 spellen van de Feestweek met placeholder-namen en
-- sluitingstijden (elke dag 19:00 Nederlandse tijd), zodat de
-- structuur alvast klaarstaat. Namen/tijden kunnen later via de
-- admin-pagina worden aangepast.
-- ============================================================

insert into spellen (naam, volgorde, speeldatum, sluitingstijd)
select 'Spel 1', 1, '2026-09-07', '2026-09-07T19:00:00+02:00'
where not exists (select 1 from spellen where naam = 'Spel 1');

insert into spellen (naam, volgorde, speeldatum, sluitingstijd)
select 'Spel 2', 2, '2026-09-08', '2026-09-08T19:00:00+02:00'
where not exists (select 1 from spellen where naam = 'Spel 2');

insert into spellen (naam, volgorde, speeldatum, sluitingstijd)
select 'Spel 3', 3, '2026-09-09', '2026-09-09T19:00:00+02:00'
where not exists (select 1 from spellen where naam = 'Spel 3');

insert into spellen (naam, volgorde, speeldatum, sluitingstijd)
select 'Spel 4', 4, '2026-09-10', '2026-09-10T19:00:00+02:00'
where not exists (select 1 from spellen where naam = 'Spel 4');

insert into spellen (naam, volgorde, speeldatum, sluitingstijd)
select 'Spel 5', 5, '2026-09-11', '2026-09-11T19:00:00+02:00'
where not exists (select 1 from spellen where naam = 'Spel 5');
