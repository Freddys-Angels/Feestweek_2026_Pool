-- ============================================================
-- 20260805170000_herstel_team_id_kolom.sql
-- Herstelmigratie: de eerdere migratie (20260728190007) die
-- team_id aan deelnemers toevoegde is nooit succesvol toegepast
-- op de live database. Dit haalt dat alsnog in, idempotent.
-- ============================================================

alter table deelnemers add column if not exists team_id uuid references teams(id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.deelnemers (id, naam, team_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'naam', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'team_id', '')::uuid
  );
  return new;
end;
$$;
