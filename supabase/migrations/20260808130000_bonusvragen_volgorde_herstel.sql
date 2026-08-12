-- ============================================================
-- 20260808130000_bonusvragen_volgorde_herstel.sql
-- Herstel: door een bug in de admin-app werd 'volgorde' teruggezet naar 0
-- zodra een correct antwoord werd opgeslagen. Hier zetten we 'm terug op
-- basis van de vraagtekst.
-- ============================================================

update bonusvragen set volgorde = 1 where vraag ilike 'Welk herenteam%';
update bonusvragen set volgorde = 2 where vraag ilike 'Welk damesteam%';
update bonusvragen set volgorde = 3 where vraag ilike 'Wie wint de rode lantaarn bij de dames%';
update bonusvragen set volgorde = 4 where vraag ilike 'Wie wint de rode lantaarn bij de heren%';
update bonusvragen set volgorde = 5 where vraag ilike 'Hoeveel snacks eet Mike Schneider%';
update bonusvragen set volgorde = 8 where vraag ilike 'Welk team wint op donderdag%';
