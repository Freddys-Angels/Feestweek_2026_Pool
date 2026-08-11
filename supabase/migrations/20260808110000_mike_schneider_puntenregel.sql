-- ============================================================
-- 20260808110000_mike_schneider_puntenregel.sql
-- Puntenregel toevoegen aan de Mike Schneider-bonusvraag
-- ============================================================

update bonusvragen
set vraag = 'Hoeveel snacks eet Mike Schneider dit jaar binnen één uur op? (−1 punt per snack afwijking)'
where vraag = 'Hoeveel snacks eet Mike Schneider dit jaar binnen één uur op?';
