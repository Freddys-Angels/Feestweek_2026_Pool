-- ============================================================
-- 20260805180000_spellen_volledige_naam.sql
-- Extra kolom op spellen: volledige_naam (uitgebreide omschrijving,
-- getoond op de invoerpagina bij Deelnemers). De bestaande 'naam'
-- kolom blijft de korte naam (o.a. gebruikt in de tussenstand).
-- ============================================================

alter table spellen add column if not exists volledige_naam text;
