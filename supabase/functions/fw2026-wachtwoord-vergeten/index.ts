// supabase/functions/fw2026-wachtwoord-vergeten/index.ts
//
// Vraagt een wachtwoord-reset-mail aan, maar alléén als het gedeelde
// dag-mailbudget (samen met registratie-bevestigingsmails, zie
// fw2026-registreren) nog niet vol is. Registraties reserveren maximaal 90
// van de 100 mails per dag, zodat er voor reset-verzoeken altijd nog ruimte
// overblijft tot een totaal van 100 — pas daarna wordt de knop in de app
// grijs met de melding dat de mailserver voor vandaag vol is.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOTAAL_MAIL_GRENS = 100; // registratie- en reset-mails samen

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

    const body = await req.json().catch(() => ({}));
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const redirectTo = (body.redirect_to ?? "").toString();
    if (!email) return jsonRespons({ ok: false, error: "Vul je e-mailadres in." }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const vandaag = new Date().toISOString().slice(0, 10);

    const { data: tellerRij, error: tellerErr } = await supabase.rpc("email_teller_verhoog", {
      p_datum: vandaag,
      p_grens: TOTAAL_MAIL_GRENS,
    });
    if (tellerErr) {
      return jsonRespons({ ok: false, error: "Kon mail-teller niet bijwerken: " + tellerErr.message }, 500);
    }
    const magMail = Array.isArray(tellerRij) && tellerRij.length > 0;

    if (!magMail) {
      return jsonRespons(
        { ok: false, reden: "vol", error: "E-mailserver is vandaag vol. Probeer het morgen weer." },
        429,
      );
    }

    await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    return jsonRespons({ ok: true });
  } catch (e) {
    return jsonRespons({ ok: false, error: (e as Error).message }, 500);
  }
});
