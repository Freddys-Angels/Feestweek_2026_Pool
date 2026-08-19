-- ============================================================
-- 20260819120000_email_teller.sql
-- Houdt per dag bij hoeveel auth-mails (registratie-bevestiging +
-- wachtwoord-reset samen) er via Resend zijn verstuurd, zodat we ruim
-- onder het gratis dagbudget (100 mails/dag) blijven tijdens een piek
-- op de inschrijving. Gebruikt door fw2026-registreren (stopt bij 90,
-- daarna automatisch bevestigde accounts zonder mail) en
-- fw2026-wachtwoord-vergeten (stopt bij 100, daarna knop grijs).
-- ============================================================

create table if not exists public.email_teller (
  datum date primary key,
  emails_verstuurd integer not null default 0
);

alter table public.email_teller enable row level security;

-- Iedereen (ook een nog niet ingelogde bezoeker op het inlogscherm) mag de
-- teller van vandaag uitlezen, zodat de "wachtwoord vergeten"-knop proactief
-- grijs gemaakt kan worden zonder eerst een mislukte poging te doen.
drop policy if exists "email_teller_publiek_lezen" on public.email_teller;
create policy "email_teller_publiek_lezen" on public.email_teller
  for select using (true);

-- Alleen de service-role (edge functions) mag schrijven — er is bewust geen
-- insert/update/delete-policy voor anon/authenticated.

-- Atomische "reserveer een mail-slot"-functie: verhoogt de teller van
-- `p_datum` met 1, maar alléén als de teller nog onder `p_grens` zit.
-- Geeft de nieuwe waarde terug als het lukte, of niets (0 rijen) als de
-- grens al bereikt was — zo kan de aanroeper zonder race condition bepalen
-- of er nog ruimte is.
create or replace function public.email_teller_verhoog(p_datum date, p_grens integer)
returns table(emails_verstuurd integer)
language sql
as $$
  insert into public.email_teller as et (datum, emails_verstuurd)
  values (p_datum, 1)
  on conflict (datum) do update
    set emails_verstuurd = et.emails_verstuurd + 1
    where et.emails_verstuurd < p_grens
  returning et.emails_verstuurd;
$$;
