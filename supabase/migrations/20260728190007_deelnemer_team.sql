-- ============================================================
-- 20260728190007_deelnemer_team.sql
-- Koppeling deelnemer -> eigen Feestweek-team (optioneel)
-- ============================================================

alter table deelnemers add column if not exists team_id uuid references teams(id);

-- Trigger bijwerken zodat team_id ook uit de registratie-metadata wordt overgenomen
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
