// supabase/functions/fw2026-admin-actie/index.ts
//
// Generieke admin-only schrijf-acties voor teams, spellen en bonusvragen.
// Alles via service_role; toegang alleen voor deelnemers met is_admin = true.

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

    const { data: deelnemer } = await supabase
      .from("deelnemers")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();

    if (!deelnemer?.is_admin) return jsonRespons({ ok: false, error: "Geen beheerdersrechten." }, 403);

    const body = await req.json().catch(() => null);
    if (!body?.actie) return jsonRespons({ ok: false, error: "Actie ontbreekt." }, 400);

    const { actie, data } = body as { actie: string; data: Record<string, unknown> };

    switch (actie) {
      case "upsert_team": {
        const { id, naam, categorie, volgorde } = data as any;
        if (!naam || !["heren", "dames"].includes(categorie)) {
          return jsonRespons({ ok: false, error: "naam en geldige categorie zijn verplicht." }, 400);
        }
        const rij = { naam, categorie, volgorde: volgorde ?? 0, ...(id ? { id } : {}) };
        const { data: res, error } = await supabase.from("teams").upsert(rij).select().single();
        if (error) return jsonRespons({ ok: false, error: error.message }, 500);
        return jsonRespons({ ok: true, team: res });
      }

      case "verwijder_team": {
        const { id } = data as any;
        if (!id) return jsonRespons({ ok: false, error: "id is verplicht." }, 400);
        const { error } = await supabase.from("teams").delete().eq("id", id);
        if (error) return jsonRespons({ ok: false, error: error.message }, 500);
        return jsonRespons({ ok: true });
      }

      case "upsert_spel": {
        const { id, naam, volgorde, speeldatum, sluitingstijd, is_eindstand } = data as any;
        if (!naam || !sluitingstijd) {
          return jsonRespons({ ok: false, error: "naam en sluitingstijd zijn verplicht." }, 400);
        }
        const rij = {
          naam,
          volgorde: volgorde ?? 0,
          speeldatum: speeldatum ?? null,
          sluitingstijd,
          is_eindstand: is_eindstand === true,
          ...(id ? { id } : {}),
        };
        const { data: res, error } = await supabase.from("spellen").upsert(rij).select().single();
        if (error) {
          if (String(error.message).includes("idx_spellen_eindstand_uniek")) {
            return jsonRespons(
              { ok: false, error: "Er is al een spel gemarkeerd als eindstand/supercup. Verwijder eerst die markering." },
              400,
            );
          }
          return jsonRespons({ ok: false, error: error.message }, 500);
        }
        return jsonRespons({ ok: true, spel: res });
      }

      case "verwijder_spel": {
        const { id } = data as any;
        if (!id) return jsonRespons({ ok: false, error: "id is verplicht." }, 400);
        const { error } = await supabase.from("spellen").delete().eq("id", id);
        if (error) return jsonRespons({ ok: false, error: error.message }, 500);
        return jsonRespons({ ok: true });
      }

      case "upsert_bonusvraag": {
        const { id, vraag, punten, correct_antwoord, volgorde } = data as any;
        if (!vraag) return jsonRespons({ ok: false, error: "vraag is verplicht." }, 400);
        const rij = {
          vraag,
          punten: punten ?? 15,
          correct_antwoord: correct_antwoord ?? null,
          volgorde: volgorde ?? 0,
          ...(id ? { id } : {}),
        };
        const { data: res, error } = await supabase.from("bonusvragen").upsert(rij).select().single();
        if (error) return jsonRespons({ ok: false, error: error.message }, 500);
        return jsonRespons({ ok: true, bonusvraag: res });
      }

      case "verwijder_bonusvraag": {
        const { id } = data as any;
        if (!id) return jsonRespons({ ok: false, error: "id is verplicht." }, 400);
        const { error } = await supabase.from("bonusvragen").delete().eq("id", id);
        if (error) return jsonRespons({ ok: false, error: error.message }, 500);
        return jsonRespons({ ok: true });
      }

      default:
        return jsonRespons({ ok: false, error: `Onbekende actie: ${actie}` }, 400);
    }
  } catch (e) {
    return jsonRespons({ ok: false, error: String(e) }, 500);
  }
});
