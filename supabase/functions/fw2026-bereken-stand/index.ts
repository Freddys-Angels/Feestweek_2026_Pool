// supabase/functions/fw2026-bereken-stand/index.ts
//
// Berekent de gecombineerde eindstand (alle deelnemers, heren+dames samen)
// en publiceert het resultaat in admin_data.data.leaderboard, zodat de
// deelnemerspagina dit publiek (anon, read-only) kan uitlezen.
// Alleen toegankelijk voor is_admin = true.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonRespons(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const BONUS_PER_POSITIE: Record<number, number> = { 1: 5, 2: 3, 3: 2 };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return jsonRespons({ ok: false, error: "Niet ingelogd." }, 401);

    const supabaseAuth = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) return jsonRespons({ ok: false, error: "Ongeldige sessie." }, 401);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: ikDeelnemer } = await supabase
      .from("deelnemers")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();
    if (!ikDeelnemer?.is_admin) return jsonRespons({ ok: false, error: "Geen beheerdersrechten." }, 403);

    // Alle benodigde data ophalen
    const [deelnemersRes, voorspellingenRes, uitslagenRes, spellenRes, bonusRes] = await Promise.all([
      supabase.from("deelnemers").select("id, naam, team_id"),
      supabase.from("voorspellingen").select("deelnemer_id, predictions, bonus_antwoorden"),
      supabase.from("uitslagen").select("spel_id, categorie, positie, team_id"),
      supabase.from("spellen").select("id, naam, volgorde, is_eindstand").order("volgorde"),
      supabase.from("bonusvragen").select("id, punten, correct_antwoord"),
    ]);

    // Elke query expliciet checken — anders faalt dit stilletjes met een lege
    // lijst (data ?? []) zonder dat de admin ooit een foutmelding ziet.
    const queryFouten = [
      ["deelnemers", deelnemersRes.error],
      ["voorspellingen", voorspellingenRes.error],
      ["uitslagen", uitslagenRes.error],
      ["spellen", spellenRes.error],
      ["bonusvragen", bonusRes.error],
    ].filter(([, err]) => err);
    if (queryFouten.length) {
      const msg = queryFouten.map(([tabel, err]) => `${tabel}: ${(err as { message: string }).message}`).join(" | ");
      console.error("fw2026-bereken-stand queryfout:", msg);
      return jsonRespons({ ok: false, error: "Databasefout bij ophalen: " + msg }, 500);
    }

    const alleDeelnemers = deelnemersRes.data ?? [];
    const alleVoorspellingen = voorspellingenRes.data ?? [];
    const alleUitslagen = uitslagenRes.data ?? [];
    const alleSpellen = spellenRes.data ?? [];
    const alleBonusvragen = bonusRes.data ?? [];

    if (!alleDeelnemers.length) {
      console.warn("fw2026-bereken-stand: 0 deelnemers gevonden.");
    }

    // Voorspelling per deelnemer_id opzoekbaar maken
    const voorspellingMap = new Map(alleVoorspellingen.map((v) => [v.deelnemer_id, v]));

    // Deelnemers-jokerkolommen (nodig voor spelpunten-verdubbeling) los ophalen
    const { data: deelnemersMetJoker, error: jokerQueryErr } = await supabase
      .from("deelnemers")
      .select("id, joker_heren_spel_id, joker_dames_spel_id");
    if (jokerQueryErr) {
      console.error("fw2026-bereken-stand jokerquery fout:", jokerQueryErr.message);
      return jsonRespons({ ok: false, error: "Databasefout bij ophalen jokers: " + jokerQueryErr.message }, 500);
    }
    const jokerMap = new Map((deelnemersMetJoker ?? []).map((d) => [d.id, d]));

    const rijen = alleDeelnemers.map((d) => {
      const vp = voorspellingMap.get(d.id);
      const joker = jokerMap.get(d.id);
      const perSpel: Record<string, number> = {};

      alleSpellen.forEach((spel) => {
        let spelTotaal = 0;
        (["heren", "dames"] as const).forEach((categorie) => {
          const voorspeld = vp?.predictions?.[spel.id]?.[categorie];
          if (!voorspeld) return;
          const actueel = alleUitslagen.filter((u) => u.spel_id === spel.id && u.categorie === categorie);
          if (!actueel.length) return;

          const actueelMap: Record<number, string> = {};
          actueel.forEach((u) => (actueelMap[u.positie] = u.team_id));
          const actueleTop3 = Object.values(actueelMap);

          let catPunten = 0;
          [1, 2, 3].forEach((pos) => {
            const teamId = voorspeld[String(pos)];
            if (!teamId) return;
            if (actueleTop3.includes(teamId)) catPunten += 10;
            if (actueelMap[pos] === teamId) catPunten += BONUS_PER_POSITIE[pos];
          });

          if (spel.is_eindstand) {
            // Eindstand/supercup-voorspelling: telt altijd dubbel, geen joker mogelijk hier.
            spelTotaal += catPunten * 2;
          } else {
            const jokerKolom = categorie === "heren" ? "joker_heren_spel_id" : "joker_dames_spel_id";
            const jokerActief = joker?.[jokerKolom] === spel.id;
            spelTotaal += jokerActief ? catPunten * 2 : catPunten;
          }
        });
        perSpel[spel.id] = spelTotaal;
      });

      // Bonusvragen-score
      let bonusPunten = 0;
      alleBonusvragen.forEach((vraag) => {
        if (!vraag.correct_antwoord) return;
        const antwoord = vp?.bonus_antwoorden?.[vraag.id];
        if (!antwoord) return;
        if (String(antwoord).trim().toLowerCase() === String(vraag.correct_antwoord).trim().toLowerCase()) {
          bonusPunten += vraag.punten;
        }
      });

      const spelPuntenTotaal = Object.values(perSpel).reduce((a, b) => a + b, 0);
      const totaal = spelPuntenTotaal + bonusPunten;

      return {
        deelnemer_id: d.id,
        naam: d.naam,
        team_id: d.team_id,
        per_spel: perSpel,
        bonus_punten: bonusPunten,
        totaal,
      };
    });

    rijen.sort((a, b) => b.totaal - a.totaal);

    const leaderboard = {
      gegenereerd_op: new Date().toISOString(),
      spellen: alleSpellen.map((s) => ({ id: s.id, naam: s.naam, is_eindstand: !!s.is_eindstand })),
      rijen,
    };

    // ── POSITIEVERLOOP-SNAPSHOT ──
    // Elk spel waarvoor al een officiële uitslag is ingevoerd geldt als een
    // afgeronde "periode". We slaan de tussenstand (individueel + teamklassement)
    // op onder de periode van het laatst-afgeronde spel (in volgorde), zodat er
    // per periode een historisch snapshot ontstaat voor de positieverloop-grafiek.
    // Eerdere periodes blijven ongewijzigd staan zolang ze niet zelf opnieuw de
    // "laatst-afgeronde" periode zijn — zo ontstaat een chronologische trend.
    const spelIdsMetUitslag = new Set(alleUitslagen.map((u) => u.spel_id));
    const voltooideSpellen = alleSpellen.filter((s) => spelIdsMetUitslag.has(s.id));

    // Cachen in admin_data (singleton)
    const { data: huidigeAdminData } = await supabase
      .from("admin_data")
      .select("data")
      .eq("id", "singleton")
      .single();

    const huidigePv = huidigeAdminData?.data?.positieverloop ?? { periodes: [], deelnemers: {}, teams: {} };

    if (voltooideSpellen.length) {
      const laatsteSpel = voltooideSpellen[voltooideSpellen.length - 1];

      const individueelSnapshot = rijen.map((r) => ({ id: r.deelnemer_id, totaal: r.totaal }));

      const perTeam: Record<string, { totaal: number; aantal: number }> = {};
      rijen.forEach((r) => {
        if (!r.team_id) return;
        if (!perTeam[r.team_id]) perTeam[r.team_id] = { totaal: 0, aantal: 0 };
        perTeam[r.team_id].totaal += r.totaal;
        perTeam[r.team_id].aantal += 1;
      });
      const teamSnapshot = Object.entries(perTeam).map(([teamId, v]) => ({
        id: teamId,
        totaal: v.aantal ? Math.round((v.totaal / v.aantal) * 100) / 100 : 0,
      }));

      const periodeMeta = {
        spel_id: laatsteSpel.id,
        naam: laatsteSpel.naam,
        volgorde: laatsteSpel.volgorde,
        is_eindstand: !!laatsteSpel.is_eindstand,
      };
      const periodes = [...(huidigePv.periodes ?? [])];
      const idx = periodes.findIndex((p: { spel_id: string }) => p.spel_id === laatsteSpel.id);
      if (idx === -1) periodes.push(periodeMeta);
      else periodes[idx] = periodeMeta;
      periodes.sort((a: { volgorde: number }, b: { volgorde: number }) => a.volgorde - b.volgorde);

      huidigePv.periodes = periodes;
      huidigePv.deelnemers = { ...(huidigePv.deelnemers ?? {}), [laatsteSpel.id]: individueelSnapshot };
      huidigePv.teams = { ...(huidigePv.teams ?? {}), [laatsteSpel.id]: teamSnapshot };
    }

    const nieuweData = { ...(huidigeAdminData?.data ?? {}), leaderboard, positieverloop: huidigePv };

    const { error: schrijfErr } = await supabase
      .from("admin_data")
      .update({ data: nieuweData, updated_at: new Date().toISOString() })
      .eq("id", "singleton");

    if (schrijfErr) return jsonRespons({ ok: false, error: schrijfErr.message }, 500);

    return jsonRespons({ ok: true, leaderboard });
  } catch (e) {
    return jsonRespons({ ok: false, error: String(e) }, 500);
  }
});

