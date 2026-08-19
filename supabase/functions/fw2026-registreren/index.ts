// supabase/functions/fw2026-registreren/index.ts
//
// Registreert een nieuwe deelnemer. Om te voorkomen dat het gratis
// Resend-mailbudget (100 mails/dag) tijdens een piek op de inschrijving
// vol raakt vóórdat iedereen een bevestigingsmail heeft gehad, houdt deze
// functie samen met fw2026-wachtwoord-vergeten een gedeelde dagteller bij
// (email_teller-tabel, atomisch bijgewerkt via email_teller_verhoog()).
//
// Zolang er nog ruimte is (<90 mails vandaag) loopt registratie via de
// normale weg: Supabase stuurt zelf een bevestigingsmail via de
// geconfigureerde SMTP (Resend). Zodra die grens bereikt is, wordt het
// account direct bevestigd aangemaakt (geen mail nodig) en krijgt de
// deelnemer meteen een sessie — zo blijft er budget over voor
// "wachtwoord vergeten"-mails tot een totaal van 100 die dag.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REGISTRATIE_MAIL_GRENS = 90; // vanaf hier: auto-bevestigen, geen mail meer
const REGISTRATIE_SLUIT = new Date("2026-09-07T19:00:00+02:00"); // gelijk aan sluitingstijd spellen

function jsonRespons(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    if (new Date() >= REGISTRATIE_SLUIT) {
      return jsonRespons(
        { ok: false, reden: "gesloten", error: "De inschrijving is gesloten — de Feestweek is al begonnen." },
        403,
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json().catch(() => ({}));
    const naam = (body.naam ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const wachtwoord = (body.wachtwoord ?? "").toString();
    const teamId = body.team_id ? String(body.team_id) : "";
    const redirectTo = (body.redirect_to ?? "").toString();

    if (!naam || !email || !wachtwoord) {
      return jsonRespons({ ok: false, error: "Vul alle verplichte velden in." }, 400);
    }
    if (wachtwoord.length < 6) {
      return jsonRespons({ ok: false, error: "Wachtwoord moet minimaal 6 tekens zijn." }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const vandaag = new Date().toISOString().slice(0, 10);

    // Atomisch: probeer het dag-mailbudget te reserveren. Geeft geen rijen
    // terug als de grens al bereikt is — dan gaan we automatisch bevestigen.
    const { data: tellerRij, error: tellerErr } = await supabase.rpc("email_teller_verhoog", {
      p_datum: vandaag,
      p_grens: REGISTRATIE_MAIL_GRENS,
    });
    if (tellerErr) {
      return jsonRespons({ ok: false, error: "Kon mail-teller niet bijwerken: " + tellerErr.message }, 500);
    }
    const magMail = Array.isArray(tellerRij) && tellerRij.length > 0;

    if (magMail) {
      // Normale weg: Supabase stuurt zelf de bevestigingsmail via Resend.
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
        method: "POST",
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: wachtwoord, data: { naam, team_id: teamId } }),
      });
      const data = await res.json();
      if (!res.ok) {
        return jsonRespons({ ok: false, error: data.error_description || data.msg || "Registreren mislukt." }, res.status);
      }
      if (data.access_token) {
        return jsonRespons({
          ok: true,
          modus: "direct",
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user,
        });
      }
      return jsonRespons({ ok: true, modus: "mail" });
    }

    // Mailbudget van vandaag zit vol: account direct bevestigd aanmaken, geen mail nodig.
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: wachtwoord,
      email_confirm: true,
      user_metadata: { naam, team_id: teamId },
    });
    if (createErr || !created?.user) {
      return jsonRespons({ ok: false, error: createErr?.message || "Registreren mislukt." }, 400);
    }

    // Meteen inloggen namens de nieuwe deelnemer — dit is een tokenaanvraag,
    // geen mail, telt dus niet mee tegen het mailbudget.
    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: wachtwoord }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return jsonRespons(
        { ok: false, error: "Account is aangemaakt, maar automatisch inloggen lukte niet. Probeer handmatig in te loggen." },
        500,
      );
    }

    return jsonRespons({
      ok: true,
      modus: "auto",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      user: tokenData.user,
    });
  } catch (e) {
    return jsonRespons({ ok: false, error: (e as Error).message }, 500);
  }
});
