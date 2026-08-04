// supabase/functions/fw2026-verwijder-deelnemer/index.ts
//
// Verwijdert een deelnemer volledig: de Supabase Auth-gebruiker wordt
// verwijderd via de Admin API. Dankzij 'on delete cascade' op de
// 'deelnemers'- en 'voorspellingen'-tabellen worden die rijen automatisch
// mee opgeruimd. Alleen toegankelijk voor is_admin = true.

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

    const { data: ikDeelnemer } = await supabase
      .from("deelnemers")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();
    if (!ikDeelnemer?.is_admin) return jsonRespons({ ok: false, error: "Geen beheerdersrechten." }, 403);

    const body = await req.json().catch(() => null);
    const deelnemer_id = (body as { deelnemer_id?: string } | null)?.deelnemer_id;
    if (!deelnemer_id) return jsonRespons({ ok: false, error: "deelnemer_id is verplicht." }, 400);

    if (deelnemer_id === userData.user.id) {
      return jsonRespons({ ok: false, error: "Je kunt jezelf niet verwijderen." }, 400);
    }

    const { error: delErr } = await supabase.auth.admin.deleteUser(deelnemer_id);
    if (delErr) return jsonRespons({ ok: false, error: delErr.message }, 500);

    return jsonRespons({ ok: true });
  } catch (e) {
    return jsonRespons({ ok: false, error: String(e) }, 500);
  }
});
