-- ============================================================
-- 20260804194001_eerste_teams.sql
-- Eerste teamnamen voor heren en dames, aangeleverd door Jaap.
-- ============================================================

insert into teams (naam, categorie, volgorde)
select 'Freddy''s Angels', 'heren', 1
where not exists (select 1 from teams where naam = 'Freddy''s Angels' and categorie = 'heren');

insert into teams (naam, categorie, volgorde)
select 'Polderboys', 'heren', 2
where not exists (select 1 from teams where naam = 'Polderboys' and categorie = 'heren');

insert into teams (naam, categorie, volgorde)
select 'All Stars', 'heren', 3
where not exists (select 1 from teams where naam = 'All Stars' and categorie = 'heren');

insert into teams (naam, categorie, volgorde)
select 'Goodlife', 'dames', 1
where not exists (select 1 from teams where naam = 'Goodlife' and categorie = 'dames');

insert into teams (naam, categorie, volgorde)
select 'Echte meisjes in Vijfhuizen', 'dames', 2
where not exists (select 1 from teams where naam = 'Echte meisjes in Vijfhuizen' and categorie = 'dames');

insert into teams (naam, categorie, volgorde)
select 'My Home', 'dames', 3
where not exists (select 1 from teams where naam = 'My Home' and categorie = 'dames');
