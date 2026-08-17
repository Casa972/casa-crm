import { createClient } from "@supabase/supabase-js";

function html(title, message, color) {
  return `<!DOCTYPE html>
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
}

export default async function handler(req, res) {
  const { id, response } = req.query;

  if (!id || !["oui", "non"].includes(response ?? "")) {
    return res.status(400).setHeader("Content-Type", "text/html; charset=utf-8").send(
      html("Lien invalide", "Ce lien de confirmation est invalide ou expiré.", "red")
    );
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const confirme = response === "oui";
  const { error } = await supabase.from("rdv").update({ confirme }).eq("id", id);

  if (error) {
    console.error("[confirm-rdv] Supabase error:", error);
    return res.status(500).setHeader("Content-Type", "text/html; charset=utf-8").send(
      html("Erreur", "Une erreur est survenue. Veuillez contacter Casa Caraïbes directement.", "red")
    );
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(
    confirme
      ? html("RDV confirmé", "Votre présence a bien été enregistrée. À bientôt !", "green")
      : html("RDV décliné", "Votre réponse a bien été prise en compte. Casa Caraïbes vous recontactera.", "red")
  );
}
