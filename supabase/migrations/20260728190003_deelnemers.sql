-- ============================================================
-- 20260728190003_deelnemers.sql
-- Profiel per deelnemer, gekoppeld aan Supabase Auth (auth.users)
-- ============================================================

create table if not exists deelnemers (
  id uuid primary key references auth.users(id) on delete cascade,
  naam text not null,
  joker_heren_spel_id uuid,   -- fk naar spellen wordt na aanmaak van spellen-tabel gezet (zie hieronder)
  joker_dames_spel_id uuid,
  created_at timestamptz not null default now()
);

alter table deelnemers
  add constraint deelnemers_joker_heren_fk foreign key (joker_heren_spel_id) references spellen(id),
  add constraint deelnemers_joker_dames_fk foreign key (joker_dames_spel_id) references spellen(id);

-- RLS: iedereen mag namen lezen (nodig voor ranglijst), alleen jezelf mag je eigen rij aanpassen.
-- Joker-keuze wordt in de praktijk via de Edge Function gezet (validatie), maar select-only
-- hier is voldoende voor de deelnemerspagina en het admin-overzicht.
alter table deelnemers enable row level security;
create policy "deelnemers_select_all" on deelnemers for select using (true);
create policy "deelnemers_update_eigen" on deelnemers for update using (auth.uid() = id);

-- Trigger: bij nieuwe Auth-registratie automatisch een deelnemers-profiel aanmaken.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.deelnemers (id, naam)
  values (new.id, coalesce(new.raw_user_meta_data->>'naam', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
