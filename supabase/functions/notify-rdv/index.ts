import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

serve(async (req) => {
  const h = new Headers();
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info");
  h.set("Content-Type", "application/json");

  if (req.method === "OPTIONS") return new Response("ok", { headers: h });

  const key = Deno.env.get("RESEND_API_KEY") ?? "";
  if (!key) return new Response(JSON.stringify({ error: "no key" }), { status: 500, headers: h });

  const rdv = await req.json();
  if (!rdv._to) return new Response(JSON.stringify({ skipped: true }), { headers: h });

  const mois = ["janvier","fevrier","mars","avril","mai","juin","juillet","aout","septembre","octobre","novembre","decembre"];
  const jours = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  const d = new Date(rdv.date + "T12:00");
  const dateLabel = jours[d.getDay()] + " " + d.getDate() + " " + mois[d.getMonth()] + " " + d.getFullYear();

  const isNew = rdv._isNew === true;
  const subject = (isNew ? "Nouveau RDV - " : "RDV modifie - ") + rdv.titre + " - " + dateLabel;

  const gcalStart = rdv.date.replace(/-/g, "") + "T" + rdv.heureDebut.replace(/:/g, "") + "00";
  const gcalEnd = rdv.date.replace(/-/g, "") + "T" + rdv.heureFin.replace(/:/g, "") + "00";
  const gcalParams = "action=TEMPLATE&text=" + encodeURIComponent(rdv.titre) + "&dates=" + gcalStart + "/" + gcalEnd + "&details=" + encodeURIComponent(rdv.typeRdv) + "&ctz=America/Martinique";
  const gcalUrl = "https://calendar.google.com/calendar/render?" + gcalParams;

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const confirmBase = supabaseUrl + "/functions/v1/confirm-rdv?id=" + rdv.id;

  const badge = isNew
    ? "<span style='background:#dcfce7;color:#166534;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:1px'>NOUVEAU</span>"
    : "<span style='background:#fef9c3;color:#854d0e;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:1px'>MODIFIE</span>";

  const row = (label: string, value: string) =>
    "<tr>"
    + "<td style='padding:10px 16px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;width:80px'>" + label + "</td>"
    + "<td style='padding:10px 16px;color:#111827;font-size:14px'>" + value + "</td>"
    + "</tr>";

  const html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>"
    + "<body style='margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif'>"
    + "<div style='max-width:520px;margin:32px auto;padding:0 16px'>"

    + "<div style='background:#0f172a;border-radius:12px 12px 0 0;padding:24px 32px;display:flex;align-items:center'>"
    + "<div style='width:36px;height:36px;background:#1e3a5f;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;margin-right:12px'>"
    + "<span style='color:#93c5fd;font-size:18px;font-weight:700'>C</span>"
    + "</div>"
    + "<div>"
    + "<div style='color:#f8fafc;font-size:15px;font-weight:700;letter-spacing:0.3px'>Casa Caraibes</div>"
    + "<div style='color:#64748b;font-size:11px;margin-top:1px'>Agence immobiliere - Martinique</div>"
    + "</div>"
    + "</div>"

    + "<div style='background:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;padding:28px 32px'>"
    + "<div style='margin-bottom:16px'>" + badge + "</div>"
    + "<div style='font-size:22px;font-weight:700;color:#0f172a;margin-bottom:6px'>" + rdv.titre + "</div>"
    + "<div style='color:#6b7280;font-size:14px;margin-bottom:24px'>Bonjour <strong style='color:#0f172a'>" + rdv.participantNom + "</strong>, voici les details de votre rendez-vous.</div>"

    + "<div style='background:#f8fafc;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:24px'>"
    + "<table style='width:100%;border-collapse:collapse'>"
    + "<tr style='border-bottom:1px solid #e5e7eb'>" + row("Date", "<strong>" + dateLabel + "</strong>").slice(4, -5) + "</tr>"
    + "<tr style='border-bottom:1px solid #e5e7eb'>" + row("Heure", rdv.heureDebut + " &rarr; " + rdv.heureFin).slice(4, -5) + "</tr>"
    + "<tr" + (rdv.notes ? " style='border-bottom:1px solid #e5e7eb'" : "") + ">" + row("Type", rdv.typeRdv).slice(4, -5) + "</tr>"
    + (rdv.notes ? "<tr>" + row("Notes", rdv.notes).slice(4, -5) + "</tr>" : "")
    + "</table>"
    + "</div>"

    + "<div style='margin-bottom:16px;padding:16px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;text-align:center'>"
    + "<div style='color:#166534;font-size:13px;font-weight:600;margin-bottom:12px'>Pouvez-vous confirmer votre presence ?</div>"
    + "<div style='display:flex;gap:10px'>"
    + "<a href='" + confirmBase + "&response=oui' style='flex:1;display:block;background:#16a34a;color:#ffffff;text-align:center;padding:11px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700'>✓ Confirmer</a>"
    + "<a href='" + confirmBase + "&response=non' style='flex:1;display:block;background:#dc2626;color:#ffffff;text-align:center;padding:11px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700'>✗ Decliner</a>"
    + "</div>"
    + "</div>"

    + "<div style='display:flex;gap:10px;margin-bottom:0'>"
    + "<a href='https://casa-crm.vercel.app' style='flex:1;display:block;background:#0f172a;color:#ffffff;text-align:center;padding:13px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600'>Ouvrir le CRM</a>"
    + "<a href='" + gcalUrl + "' style='flex:1;display:block;background:#ffffff;color:#0f172a;text-align:center;padding:13px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;border:2px solid #e5e7eb'>+ Google Agenda</a>"
    + "</div>"
    + "</div>"

    + "<div style='background:#f8fafc;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center'>"
    + "<span style='color:#9ca3af;font-size:12px'>Casa Caraibes &middot; Agence immobiliere &middot; Martinique</span>"
    + "</div>"

    + "</div></body></html>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
    body: JSON.stringify({ from: "Casa Caraibes <noreply@casacaraibes.com>", to: [rdv._to], subject, html }),
  });

  const data = await res.json();
  console.log("status:", res.status, JSON.stringify(data));
  return new Response(JSON.stringify(data), { status: res.ok ? 200 : 500, headers: h });
});
