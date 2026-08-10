-- ============================================================
-- 20260807120000_teams_volgorde_vorig_jaar.sql
-- Volgorde van teams bijwerken op basis van de eindstand van vorig
-- jaar. Nieuwe teams (niet in de uitslag van vorig jaar) komen
-- onderaan, in oorspronkelijke volgorde.
-- ============================================================

update teams set volgorde = 1 where id = (select id from teams where categorie = 'heren' and naam = 'Biermusketiers' order by id asc limit 1);
update teams set volgorde = 2 where id = (select id from teams where categorie = 'heren' and naam = 'Hermanos' order by id asc limit 1);
update teams set volgorde = 3 where id = (select id from teams where categorie = 'heren' and naam = 'Allergoeiste' order by id asc limit 1);
update teams set volgorde = 4 where id = (select id from teams where categorie = 'heren' and naam = 'Vrijgezellig' order by id asc limit 1);
update teams set volgorde = 5 where id = (select id from teams where categorie = 'heren' and naam = 'Freddy''s Angels Never Alone' order by id asc limit 1);
update teams set volgorde = 6 where id = (select id from teams where categorie = 'heren' and naam = 'Nachtbrakers' order by id asc limit 1);
update teams set volgorde = 7 where id = (select id from teams where categorie = 'heren' and naam = 'Allstars' order by id asc limit 1);
update teams set volgorde = 8 where id = (select id from teams where categorie = 'heren' and naam = 'Bier Bataven' order by id asc limit 1);
update teams set volgorde = 9 where id = (select id from teams where categorie = 'heren' and naam = 'POLDERBOYS' order by id asc limit 1);
update teams set volgorde = 10 where id = (select id from teams where categorie = 'heren' and naam = 'Lekker Gewoon' order by id asc limit 1);
update teams set volgorde = 11 where id = (select id from teams where categorie = 'heren' and naam = 'Ladyjkillers' order by id asc limit 1);
update teams set volgorde = 12 where id = (select id from teams where categorie = 'heren' and naam = 'De Pintewippers' order by id asc limit 1);
update teams set volgorde = 13 where id = (select id from teams where categorie = 'heren' and naam = 'The underdogs' order by id asc limit 1);
update teams set volgorde = 14 where id = (select id from teams where categorie = 'heren' and naam = 'De Vrienden Van' order by id asc limit 1);
update teams set volgorde = 15 where id = (select id from teams where categorie = 'heren' and naam = 'de kelderklasse' order by id asc limit 1);
update teams set volgorde = 16 where id = (select id from teams where categorie = 'heren' and naam = 'Trio Ome Loek' order by id asc limit 1);
update teams set volgorde = 17 where id = (select id from teams where categorie = 'heren' and naam = '''t Winckeltje' order by id asc limit 1);
update teams set volgorde = 18 where id = (select id from teams where categorie = 'heren' and naam = 'Onze jongens uit 5huizen' order by id asc limit 1);
update teams set volgorde = 19 where id = (select id from teams where categorie = 'heren' and naam = 'Goud van Oud' order by id asc limit 1);
update teams set volgorde = 20 where id = (select id from teams where categorie = 'heren' and naam = 'AB normaal' order by id asc limit 1);
update teams set volgorde = 21 where id = (select id from teams where categorie = 'heren' and naam = 'Tweede jeugd' order by id asc limit 1);
update teams set volgorde = 22 where id = (select id from teams where categorie = 'heren' and naam = 'Hofnarren' order by id asc limit 1);
update teams set volgorde = 23 where id = (select id from teams where categorie = 'heren' and naam = 'Buurman & Buurman' order by id asc limit 1);
update teams set volgorde = 24 where id = (select id from teams where categorie = 'heren' and naam = 'Tuig van de Richel' order by id asc limit 1);
update teams set volgorde = 25 where id = (select id from teams where categorie = 'heren' and naam = 'Wat Nou?' order by id asc limit 1);
update teams set volgorde = 26 where id = (select id from teams where categorie = 'heren' and naam = 'Kater komt later' order by id asc limit 1);
update teams set volgorde = 27 where id = (select id from teams where categorie = 'heren' and naam = 'De Voorstelling' order by id asc limit 1);
update teams set volgorde = 28 where id = (select id from teams where categorie = 'heren' and naam = 'Onno Jansen' order by id asc limit 1);
update teams set volgorde = 29 where id = (select id from teams where categorie = 'heren' and naam = 'Onze jongens uit 5huizen' order by id desc limit 1);

update teams set volgorde = 1 where id = (select id from teams where categorie = 'dames' and naam = 'On Point' order by id asc limit 1);
update teams set volgorde = 2 where id = (select id from teams where categorie = 'dames' and naam = 'Inteam' order by id asc limit 1);
update teams set volgorde = 3 where id = (select id from teams where categorie = 'dames' and naam = 'Genieten' order by id asc limit 1);
update teams set volgorde = 4 where id = (select id from teams where categorie = 'dames' and naam = 'Wijnzinnig' order by id asc limit 1);
update teams set volgorde = 5 where id = (select id from teams where categorie = 'dames' and naam = 'd''r op of d''r onder' order by id asc limit 1);
update teams set volgorde = 6 where id = (select id from teams where categorie = 'dames' and naam = 'Simply The Best (STB)' order by id asc limit 1);
update teams set volgorde = 7 where id = (select id from teams where categorie = 'dames' and naam = 'de Spiering' order by id asc limit 1);
update teams set volgorde = 8 where id = (select id from teams where categorie = 'dames' and naam = 'Alphalicious' order by id asc limit 1);
update teams set volgorde = 9 where id = (select id from teams where categorie = 'dames' and naam = 'Echte Meisjes in Vijfhuizen' order by id asc limit 1);
update teams set volgorde = 10 where id = (select id from teams where categorie = 'dames' and naam = 'Hofdames' order by id asc limit 1);
update teams set volgorde = 11 where id = (select id from teams where categorie = 'dames' and naam = 'DSOF' order by id asc limit 1);
update teams set volgorde = 12 where id = (select id from teams where categorie = 'dames' and naam = 'Nooit meer naar huis' order by id asc limit 1);
update teams set volgorde = 13 where id = (select id from teams where categorie = 'dames' and naam = 'Bende van Ellende' order by id asc limit 1);
update teams set volgorde = 14 where id = (select id from teams where categorie = 'dames' and naam = 'My home' order by id asc limit 1);
update teams set volgorde = 15 where id = (select id from teams where categorie = 'dames' and naam = 'Alleen maar Liefde' order by id asc limit 1);
update teams set volgorde = 16 where id = (select id from teams where categorie = 'dames' and naam = 'Hot Stuff' order by id asc limit 1);
update teams set volgorde = 17 where id = (select id from teams where categorie = 'dames' and naam = 'Onderschatjes' order by id asc limit 1);
update teams set volgorde = 18 where id = (select id from teams where categorie = 'dames' and naam = 'Goodlife' order by id asc limit 1);
update teams set volgorde = 19 where id = (select id from teams where categorie = 'dames' and naam = 'WTF' order by id asc limit 1);
update teams set volgorde = 20 where id = (select id from teams where categorie = 'dames' and naam = 'Chickies op een Missie' order by id asc limit 1);
update teams set volgorde = 21 where id = (select id from teams where categorie = 'dames' and naam = 'Cheers' order by id asc limit 1);
update teams set volgorde = 22 where id = (select id from teams where categorie = 'dames' and naam = 'C''est la vie' order by id asc limit 1);
update teams set volgorde = 23 where id = (select id from teams where categorie = 'dames' and naam = 'Menhunters' order by id asc limit 1);
update teams set volgorde = 24 where id = (select id from teams where categorie = 'dames' and naam = 'Verenigde Chaos' order by id asc limit 1);
update teams set volgorde = 25 where id = (select id from teams where categorie = 'dames' and naam = 'OnVoorStelBaar' order by id asc limit 1);
update teams set volgorde = 26 where id = (select id from teams where categorie = 'dames' and naam = 'Prachtpatsers' order by id asc limit 1);
update teams set volgorde = 27 where id = (select id from teams where categorie = 'dames' and naam = 'High Five' order by id asc limit 1);
update teams set volgorde = 28 where id = (select id from teams where categorie = 'dames' and naam = 'Niemand' order by id asc limit 1);
update teams set volgorde = 29 where id = (select id from teams where categorie = 'dames' and naam = 'Veni Vidi Vici Vijfhuizen' order by id asc limit 1);
update teams set volgorde = 30 where id = (select id from teams where categorie = 'dames' and naam = 'Victorious Secret' order by id asc limit 1);
update teams set volgorde = 31 where id = (select id from teams where categorie = 'dames' and naam = 'Fabulous Females' order by id asc limit 1);
update teams set volgorde = 32 where id = (select id from teams where categorie = 'dames' and naam = 'Game Over' order by id asc limit 1);
update teams set volgorde = 33 where id = (select id from teams where categorie = 'dames' and naam = 'De katers van morgen.....' order by id asc limit 1);
update teams set volgorde = 34 where id = (select id from teams where categorie = 'dames' and naam = 'De Hoogste Tijd' order by id asc limit 1);

