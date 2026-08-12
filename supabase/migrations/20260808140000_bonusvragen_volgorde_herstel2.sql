-- ============================================================
-- 20260808140000_bonusvragen_volgorde_herstel2.sql
-- Nogmaals herstellen van volgorde (voor het geval de bug nog eens
-- heeft toegeslagen met een sessie die de oude, ongepatchte adminpagina
-- in de browser had openstaan).
-- ============================================================

update bonusvragen set volgorde = 1 where vraag ilike 'Welk herenteam%';
update bonusvragen set volgorde = 2 where vraag ilike 'Welk damesteam%';
update bonusvragen set volgorde = 3 where vraag ilike 'Wie wint de rode lantaarn bij de dames%';
update bonusvragen set volgorde = 4 where vraag ilike 'Wie wint de rode lantaarn bij de heren%';
update bonusvragen set volgorde = 5 where vraag ilike 'Hoeveel snacks eet Mike Schneider%';
update bonusvragen set volgorde = 8 where vraag ilike 'Welk team wint op donderdag%';
