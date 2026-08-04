-- ============================================================
-- 20260804200001_betaald_en_admin_leesrecht.sql
-- 'betaald' kolom op deelnemers (voor de admin Deelnemers-tab) +
-- RLS zodat is_admin-accounts alle voorspellingen kunnen lezen
-- (nodig om per deelnemer de invulvoortgang te tonen).
-- ============================================================

alter table deelnemers add column if not exists betaald boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'voorspellingen' and policyname = 'voorspellingen_select_admin'
  ) then
    execute 'create policy "voorspellingen_select_admin" on voorspellingen for select using (exists (select 1 from deelnemers d where d.id = auth.uid() and d.is_admin = true))';
  end if;
end $$;
