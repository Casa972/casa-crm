import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;
const COMMERCIAL_EMAIL = Deno.env.get("COMMERCIAL_EMAIL") ?? "steeve@casacaraibes.com";
const FROM_EMAIL = "Casa Caraïbes <noreply@casacaraibes.com>";
const CRM_URL = "https://casa-crm.vercel.app";
const SUPABASE_FUNCTIONS_URL = Deno.env.get("SUPABASE_URL")?.replace("https://", "https://") + "/functions/v1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${MOIS[parseInt(m) - 1]} ${y}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  console.log("[notify-rdv] Request received");

  if (!RESEND_KEY) {
    console.error("[notify-rdv] RESEND_API_KEY manquante !");
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const rdv = await req.json();
  console.log("[notify-rdv] participantNom:", rdv.participantNom, "| _to:", rdv._to);

  // N'envoie que si un participant est désigné
  if (!rdv.participantNom || !rdv._to) {
    console.log("[notify-rdv] Skipped — pas de participant/destinataire");
    return new Response(JSON.stringify({ skipped: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const isNew = rdv._isNew === true;
  const subject = isNew
    ? `📅 Nouveau RDV — ${rdv.titre} — ${formatDate(rdv.date)}`
    : `✏️ RDV modifié — ${rdv.titre} — ${formatDate(rdv.date)}`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#0a0a0a;padding:28px 32px;text-align:center;">
      <p style="color:#7a8b6f;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px;">Casa Caraïbes</p>
      <p style="color:#ffffff;font-size:18px;font-weight:600;margin:0;">${isNew ? "Nouveau rendez-vous" : "Rendez-vous modifié"}</p>
    </div>

    <!-- Corps -->
    <div style="padding:32px;">
      <p style="color:#3a3a3a;font-size:14px;margin:0 0 24px;">Bonjour ${rdv.participantNom},</p>
      <p style="color:#3a3a3a;font-size:14px;margin:0 0 24px;">
        ${isNew ? "Un rendez-vous a été planifié pour vous :" : "Le rendez-vous suivant a été modifié :"}
      </p>

      <!-- Détails RDV -->
      <div style="background:#f5f0e8;border-radius:6px;padding:20px 24px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#6b6b67;font-size:12px;width:90px;vertical-align:top;">TITRE</td>
            <td style="padding:6px 0;color:#0a0a0a;font-size:14px;font-weight:600;">${rdv.titre}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b6b67;font-size:12px;vertical-align:top;">DATE</td>
            <td style="padding:6px 0;color:#0a0a0a;font-size:14px;">${formatDate(rdv.date)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b6b67;font-size:12px;vertical-align:top;">HEURE</td>
            <td style="padding:6px 0;color:#0a0a0a;font-size:14px;">${rdv.heureDebut} → ${rdv.heureFin}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b6b67;font-size:12px;vertical-align:top;">TYPE</td>
            <td style="padding:6px 0;color:#0a0a0a;font-size:14px;">${rdv.typeRdv}</td>
          </tr>
          ${rdv.notes ? `
          <tr>
            <td style="padding:6px 0;color:#6b6b67;font-size:12px;vertical-align:top;">NOTES</td>
            <td style="padding:6px 0;color:#3a3a3a;font-size:13px;">${rdv.notes}</td>
          </tr>` : ""}
        </table>
      </div>

      <!-- Confirmation -->
      <div style="margin-bottom:24px;">
        <p style="color:#6b6b67;font-size:13px;text-align:center;margin:0 0 14px;">Pouvez-vous confirmer votre présence ?</p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <a href="${SUPABASE_FUNCTIONS_URL}/confirm-rdv?id=${rdv.id}&response=oui"
            style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 32px;border-radius:6px;letter-spacing:0.5px;">
            ✓ Confirmer
          </a>
          <a href="${SUPABASE_FUNCTIONS_URL}/confirm-rdv?id=${rdv.id}&response=non"
            style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 32px;border-radius:6px;letter-spacing:0.5px;">
            ✗ Décliner
          </a>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${CRM_URL}" style="display:inline-block;background:#7a8b6f;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:6px;letter-spacing:0.5px;">
          Voir dans le CRM
        </a>
      </div>

      <p style="color:#9b9b97;font-size:12px;text-align:center;margin:0;">
        Casa Caraïbes · Agence immobilière Martinique
      </p>
    </div>
  </div>
</body>
</html>`;

  const to = rdv._to as string;
  console.log("[notify-rdv] Envoi email à:", to, "| sujet:", subject);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[notify-rdv] Erreur Resend:", res.status, JSON.stringify(data));
  } else {
    console.log("[notify-rdv] Email envoyé avec succès. ID:", (data as any).id);
  }

  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 500,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
