import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function htmlPage(title: string, message: string, color: string): Response {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Casa Caraïbes</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f5f0e8; font-family: 'Helvetica Neue', Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #fff; border-radius: 12px; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .icon { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 28px; background: ${color === "green" ? "#d1fae5" : "#fee2e2"}; }
    .brand { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #7a8b6f; margin-bottom: 16px; }
    h1 { font-size: 22px; color: #0a0a0a; margin-bottom: 12px; }
    p { font-size: 14px; color: #6b6b67; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Casa Caraïbes</div>
    <div class="icon">${color === "green" ? "✓" : "✗"}</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
  return new Response(html, { headers: { ...CORS, "Content-Type": "text/html; charset=utf-8" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const response = url.searchParams.get("response"); // "oui" | "non"

  if (!id || !["oui", "non"].includes(response ?? "")) {
    return htmlPage("Lien invalide", "Ce lien de confirmation est invalide ou expiré.", "red");
  }

  const confirme = response === "oui";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { error } = await supabase.from("rdv").update({ confirme }).eq("id", id);

  if (error) {
    console.error("[confirm-rdv] Erreur Supabase:", error);
    return htmlPage("Erreur", "Une erreur est survenue. Veuillez contacter Casa Caraïbes directement.", "red");
  }

  return confirme
    ? htmlPage("RDV confirmé", "Votre présence a bien été enregistrée. À bientôt !", "green")
    : htmlPage("RDV décliné", "Votre réponse a bien été prise en compte. Casa Caraïbes vous recontactera.", "red");
});
