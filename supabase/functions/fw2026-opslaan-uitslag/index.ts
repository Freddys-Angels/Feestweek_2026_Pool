// supabase/functions/fw2026-opslaan-uitslag/index.ts
//
// Slaat de officiële top-3-uitslag op voor een spel + categorie.
// Alleen toegankelijk voor deelnemers met is_admin = true.

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

    // Admin-check
    const { data: deelnemer, error: deelnemerErr } = await supabase
      .from("deelnemers")
      .select("is_admin")
      .eq("id", deelnemerId)
      .single();

    if (deelnemerErr || !deelnemer?.is_admin) {
      return jsonRespons({ ok: false, error: "Geen beheerdersrechten." }, 403);
    }

    const body = await req.json().catch(() => null);
    if (!body) return jsonRespons({ ok: false, error: "Ongeldige request body." }, 400);

    const { spel_id, categorie, top3 } = body as {
      spel_id?: string;
      categorie?: string;
      top3?: string[];
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

    // Upsert 3 rijen (positie 1, 2, 3) — bestaat de rij al, dan wordt team_id bijgewerkt
    const rijen = top3.map((team_id, i) => ({
      spel_id,
      categorie,
      positie: i + 1,
      team_id,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertErr } = await supabase
      .from("uitslagen")
      .upsert(rijen, { onConflict: "spel_id,categorie,positie" });

    if (upsertErr) {
      return jsonRespons({ ok: false, error: "Kon uitslag niet opslaan: " + upsertErr.message }, 500);
    }

    return jsonRespons({ ok: true });
  } catch (e) {
    return jsonRespons({ ok: false, error: String(e) }, 500);
  }
});
