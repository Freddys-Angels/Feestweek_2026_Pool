// supabase/functions/fw2026-opslaan-voorspelling/index.ts
// deploy-trigger: secrets nu ingesteld
//
// Slaat een voorspelling (top 3) op voor een ingelogde deelnemer.
// - Checkt sluitingstijd van het spel
// - Checkt/zet joker (max 1x per categorie, over alle spellen)
// - Schrijft via service_role (RLS staat geen directe schrijfacties toe)

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return jsonRespons({ ok: false, error: "Niet ingelogd." }, 401);
    }

    // Client die de JWT van de deelnemer gebruikt, om de gebruiker te identificeren
    const supabaseAuth = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonRespons({ ok: false, error: "Ongeldige sessie." }, 401);
    }
    const deelnemerId = userData.user.id;

    // Service-role client voor alle databasewijzigingen (bypast RLS)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => null);
    if (!body) return jsonRespons({ ok: false, error: "Ongeldige request body." }, 400);

    const { spel_id, categorie, top3, joker } = body as {
      spel_id?: string;
      categorie?: string;
      top3?: string[];
      joker?: boolean;
    };

    if (!spel_id || !categorie || !Array.isArray(top3) || top3.length !== 3) {
      return jsonRespons({ ok: false, error: "spel_id, categorie en top3 (3 teams) zijn verplicht." }, 400);
    }
    if (categorie !== "heren" && categorie !== "dames") {
      return jsonRespons({ ok: false, error: "categorie moet 'heren' of 'dames' zijn." }, 400);
    }
    if (new Set(top3).size !== 3) {
      return jsonRespons({ ok: false, error: "top3 mag geen dubbele teams bevatten." }, 400);
    }

    // 1. Spel + sluitingstijd ophalen
    const { data: spel, error: spelErr } = await supabase
      .from("spellen")
      .select("id, sluitingstijd")
      .eq("id", spel_id)
      .single();

    if (spelErr || !spel) {
      return jsonRespons({ ok: false, error: "Spel niet gevonden." }, 404);
    }
    if (new Date(spel.sluitingstijd).getTime() <= Date.now()) {
      return jsonRespons({ ok: false, error: "De inzendtermijn voor dit spel is verstreken." }, 403);
    }

    // 2. Deelnemersprofiel ophalen (voor joker-status)
    const { data: deelnemer, error: deelnemerErr } = await supabase
      .from("deelnemers")
      .select("id, joker_heren_spel_id, joker_dames_spel_id")
      .eq("id", deelnemerId)
      .single();

    if (deelnemerErr || !deelnemer) {
      return jsonRespons({ ok: false, error: "Deelnemersprofiel niet gevonden." }, 404);
    }

    const jokerKolom = categorie === "heren" ? "joker_heren_spel_id" : "joker_dames_spel_id";
    const huidigeJokerSpel = deelnemer[jokerKolom] as string | null;

    if (joker === true) {
      // Joker inzetten mag alleen als er nog geen joker gezet is voor deze categorie,
      // of als de joker al op dit exacte spel staat (dan is het gewoon een update).
      if (huidigeJokerSpel && huidigeJokerSpel !== spel_id) {
        return jsonRespons(
          { ok: false, error: `Je hebt de joker voor ${categorie} al ingezet op een ander spel.` },
          400,
        );
      }
      if (huidigeJokerSpel !== spel_id) {
        const { error: jokerErr } = await supabase
          .from("deelnemers")
          .update({ [jokerKolom]: spel_id })
          .eq("id", deelnemerId);
        if (jokerErr) return jsonRespons({ ok: false, error: "Kon joker niet opslaan." }, 500);
      }
    } else if (joker === false && huidigeJokerSpel === spel_id) {
      // Joker voor dit spel weer uitzetten
      const { error: unjokerErr } = await supabase
        .from("deelnemers")
        .update({ [jokerKolom]: null })
        .eq("id", deelnemerId);
      if (unjokerErr) return jsonRespons({ ok: false, error: "Kon joker niet verwijderen." }, 500);
    }

    // 3. Voorspelling (predictions jsonb) ophalen, mergen, wegschrijven
    const { data: bestaand } = await supabase
      .from("voorspellingen")
      .select("id, predictions")
      .eq("deelnemer_id", deelnemerId)
      .maybeSingle();

    const predictions = (bestaand?.predictions ?? {}) as Record<string, Record<string, unknown>>;
    if (!predictions[spel_id]) predictions[spel_id] = {};
    predictions[spel_id][categorie] = { "1": top3[0], "2": top3[1], "3": top3[2] };

    if (bestaand) {
      const { error: updateErr } = await supabase
        .from("voorspellingen")
        .update({ predictions, saved_at: new Date().toISOString() })
        .eq("deelnemer_id", deelnemerId);
      if (updateErr) return jsonRespons({ ok: false, error: "Kon voorspelling niet opslaan." }, 500);
    } else {
      const { error: insertErr } = await supabase
        .from("voorspellingen")
        .insert({ deelnemer_id: deelnemerId, predictions, saved_at: new Date().toISOString() });
      if (insertErr) return jsonRespons({ ok: false, error: "Kon voorspelling niet opslaan." }, 500);
    }

    return jsonRespons({ ok: true });
  } catch (e) {
    return jsonRespons({ ok: false, error: String(e) }, 500);
  }
});
