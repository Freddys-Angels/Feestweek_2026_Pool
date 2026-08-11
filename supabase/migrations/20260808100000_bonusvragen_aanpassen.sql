-- ============================================================
-- 20260808100000_bonusvragen_aanpassen.sql
-- Twee bonusvragen laten vervallen + Mike Schneider-vraag verduidelijken
-- ============================================================

delete from bonusvragen where vraag = 'Welk team moet dit jaar de 5-meter van Vijfhuizen betalen?';
delete from bonusvragen where vraag = 'Welk team sluit dit jaar de meeste avonden de kroeg af?';

update bonusvragen
set vraag = 'Hoeveel snacks eet Mike Schneider dit jaar binnen één uur op?'
where vraag = 'Hoeveel snacks eet Mike Schneider dit jaar binnen een uur?';
