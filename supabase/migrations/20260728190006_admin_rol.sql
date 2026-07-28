-- ============================================================
-- 20260728190006_admin_rol.sql
-- Admin-rol als kolom op deelnemers (i.p.v. vast wachtwoord)
-- ============================================================

alter table deelnemers add column if not exists is_admin boolean not null default false;
