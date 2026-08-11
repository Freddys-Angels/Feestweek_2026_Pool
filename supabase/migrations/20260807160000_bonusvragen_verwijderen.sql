-- ============================================================
-- 20260807160000_bonusvragen_verwijderen.sql
-- Twee bonusvragen laten vervallen
-- ============================================================

delete from bonusvragen where vraag = 'Welk team moet dit jaar de 5-meter van Vijfhuizen betalen?';
delete from bonusvragen where vraag = 'Welk team sluit dit jaar de meeste avonden de kroeg af?';
