-- ============================================================
-- 20260819190000_bonusvraag_geklede_team_splitsen.sql
-- Splitst "Welk team wint op donderdag de prijs voor best geklede
-- team?" (volgorde 8) in een aparte dames- en herenvraag.
-- - Bestaande vraag (id blijft gelijk) wordt de damesvariant.
-- - Nieuwe vraag (vast id, volgorde 9) wordt de herenvariant.
-- - Reeds ingevulde antwoorden waarbij het gekozen team een
--   herenteam is, verhuizen automatisch naar de nieuwe herenvraag.
--   Damesantwoorden blijven gewoon onder de bestaande vraag staan.
-- ============================================================

do $$
declare
  v_dames_vraag_id uuid;
  v_heren_vraag_id uuid := 'a1e50f9c-8b7f-4b1e-9b2a-3f7c1a9d5e21';
  r record;
  v_team_id uuid;
  v_categorie text;
begin
  select id into v_dames_vraag_id from bonusvragen where volgorde = 8;

  -- Nieuwe vraag voor heren toevoegen (vast id zodat we 'm hieronder kunnen aanspreken)
  insert into bonusvragen (id, vraag, punten, volgorde)
  values (v_heren_vraag_id, 'Welk herenteam wint op donderdag de prijs voor best geklede team?', 10, 9)
  on conflict (id) do nothing;

  -- Bestaande vraag hernoemen naar de dames-variant
  update bonusvragen set vraag = 'Welk damesteam wint op donderdag de prijs voor best geklede team?'
  where id = v_dames_vraag_id;

  -- Bestaande antwoorden van herenteams verhuizen naar de nieuwe vraag
  if v_dames_vraag_id is not null then
    for r in
      select id, bonus_antwoorden
      from voorspellingen
      where bonus_antwoorden ? v_dames_vraag_id::text
    loop
      v_team_id := nullif(r.bonus_antwoorden ->> v_dames_vraag_id::text, '')::uuid;
      if v_team_id is not null then
        select categorie into v_categorie from teams where id = v_team_id;
        if v_categorie = 'heren' then
          update voorspellingen
          set bonus_antwoorden = (bonus_antwoorden - v_dames_vraag_id::text)
                                  || jsonb_build_object(v_heren_vraag_id::text, v_team_id::text)
          where id = r.id;
        end if;
      end if;
    end loop;
  end if;
end $$;
