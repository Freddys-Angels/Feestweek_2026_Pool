// supabase/functions/fw2026-opslaan-bonusantwoorden/index.ts
//
// Slaat de bonusvraag-antwoorden van een ingelogde deelnemer op.
// Schrijft via service_role in voorspellingen.bonus_antwoorden (RLS staat
// geen directe schrijfacties toe).

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

    const supabaseAuth = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonRespons({ ok: false, error: "Ongeldige sessie." }, 401);
    }
    const deelnemerId = userData.user.id;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => null);
    if (!body) return jsonRespons({ ok: false, error: "Ongeldige request body." }, 400);

    const { antwoorden } = body as { antwoorden?: Record<string, string> };
    if (!antwoorden || typeof antwoorden !== "object") {
      return jsonRespons({ ok: false, error: "antwoorden (object) is verplicht." }, 400);
    }

    // Alleen bekende bonusvraag-ids toestaan
    const { data: geldigeVragen, error: vragenErr } = await supabase
      .from("bonusvragen")
      .select("id");
    if (vragenErr) return jsonRespons({ ok: false, error: vragenErr.message }, 500);
    const geldigeIds = new Set((geldigeVragen ?? []).map((v) => v.id));

    const { data: bestaand } = await supabase
      .from("voorspellingen")
      .select("id, bonus_antwoorden")
      .eq("deelnemer_id", deelnemerId)
      .maybeSingle();

    const huidig = (bestaand?.bonus_antwoorden ?? {}) as Record<string, string>;
    for (const [id, antwoord] of Object.entries(antwoorden)) {
      if (!geldigeIds.has(id)) continue;
      const schoon = String(antwoord ?? "").trim();
      if (schoon) huidig[id] = schoon;
      else delete huidig[id];
    }

    if (bestaand) {
      const { error: updateErr } = await supabase
        .from("voorspellingen")
        .update({ bonus_antwoorden: huidig, saved_at: new Date().toISOString() })
        .eq("deelnemer_id", deelnemerId);
      if (updateErr) return jsonRespons({ ok: false, error: "Kon antwoorden niet opslaan." }, 500);
    } else {
      const { error: insertErr } = await supabase
        .from("voorspellingen")
        .insert({ deelnemer_id: deelnemerId, bonus_antwoorden: huidig, saved_at: new Date().toISOString() });
      if (insertErr) return jsonRespons({ ok: false, error: "Kon antwoorden niet opslaan." }, 500);
    }

    return jsonRespons({ ok: true });
  } catch (e) {
    return jsonRespons({ ok: false, error: String(e) }, 500);
  }
});
