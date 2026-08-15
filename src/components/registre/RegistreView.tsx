import { useMemo, useState, useRef } from "react";
import { BookOpen, Printer, AlertTriangle, CheckCircle2, Clock, XCircle, Filter, RefreshCw, Copy, Check, Phone } from "lucide-react";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { fdate, eur, daysDiff } from "../../lib/format";
import { cn } from "../../lib/cn";
import type { Mandat } from "../../types/domain";
import type { Bien } from "../../schemas/bien.schema";

type StatutFilter = "tous" | "Actif" | "Expiré" | "Résilié" | "Suspendu";
type TypeFilter = "tous" | "Exclusif" | "Simple" | "Gestion" | "Co-exclusif";

const STATUT_COLORS: Record<string, string> = {
  Actif:    "bg-emerald-100 text-emerald-800",
  Expiré:   "bg-amber-100 text-amber-800",
  Résilié:  "bg-red-100 text-red-800",
  Suspendu: "bg-gray-100 text-gray-600",
};

const TYPE_COLORS: Record<string, string> = {
  Exclusif:     "bg-primary-soft text-primary",
  Simple:       "bg-blue-50 text-blue-700",
  Gestion:      "bg-purple-50 text-purple-700",
  "Co-exclusif":"bg-orange-50 text-orange-700",
};

function getBienForMandat(mandat: Mandat, biens: Bien[]): Bien | undefined {
  return biens.find((b) => b.id === mandat.bienId || b.ref === mandat.bienId);
}

function StatutIcon({ statut }: { statut: string }) {
  if (statut === "Actif")    return <CheckCircle2 size={13} className="text-emerald-600" />;
  if (statut === "Expiré")   return <Clock size={13} className="text-amber-500" />;
  if (statut === "Résilié")  return <XCircle size={13} className="text-red-500" />;
  return <AlertTriangle size={13} className="text-gray-400" />;
}

function RenewalPanel({ mandats, biens }: { mandats: Mandat[]; biens: Bien[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const expiring = mandats.filter((m) => {
    const d = daysDiff(m.dateFin);
    return m.statut === "Actif" && d !== null && d >= 0 && d <= 30;
  }).sort((a, b) => a.dateFin.localeCompare(b.dateFin));

  if (expiring.length === 0) return null;

  const copyEmail = (m: Mandat) => {
    const bien = biens.find((b) => b.id === m.bienId || b.ref === m.bienId);
    const template = `Bonjour ${m.mandant},

Je me permets de vous contacter concernant le mandat de vente n°${m.ref ?? m.id.slice(0, 8)} ${bien ? `portant sur le bien situé au ${bien.adresse || bien.commune}` : ""}, qui arrive à échéance le ${fdate(m.dateFin)}.

Votre bien n'ayant pas encore trouvé acquéreur, je souhaite vous proposer le renouvellement de notre mandat afin de poursuivre les démarches de commercialisation.

Pouvez-vous me confirmer votre souhait de renouveler ou de mettre fin à notre collaboration ?

Je reste disponible pour en discuter à votre convenance.

Cordialement,
L'équipe Casa Caraïbes`;
    navigator.clipboard.writeText(template).then(() => {
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <RefreshCw size={15} className="text-amber-600" />
        <h3 className="text-[13px] font-bold text-amber-800">
          {expiring.length} mandat{expiring.length > 1 ? "s" : ""} à renouveler sous 30 jours
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {expiring.map((m) => {
          const d = daysDiff(m.dateFin);
          const urgent = d !== null && d <= 10;
          return (
            <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg bg-white border border-amber-100 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink text-[13px]">{m.ref || m.mandant}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${urgent ? "bg-danger-soft text-danger" : "bg-amber-100 text-amber-700"}`}>
                    {d !== null ? `${d}j restants` : ""} · {fdate(m.dateFin)}
                  </span>
                </div>
                <div className="mt-0.5 text-[12px] text-ink-muted">{m.mandant}{m.tel && ` · ${m.tel}`}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {m.tel && (
                  <a href={`tel:${m.tel}`} className="flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] font-medium text-ink-sub hover:bg-bg hover:text-ink">
                    <Phone size={11} /> Appeler
                  </a>
                )}
                <button
                  onClick={() => copyEmail(m)}
                  className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-100 px-2.5 py-1.5 text-[11px] font-medium text-amber-800 hover:bg-amber-200 transition-colors"
                >
                  {copiedId === m.id ? <><Check size={11} /> Copié !</> : <><Copy size={11} /> Email renouvellement</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RegistreView() {
  const { data } = useAgencyData();
  const printRef = useRef<HTMLDivElement>(null);

  const [statutFilter, setStatutFilter] = useState<StatutFilter>("tous");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("tous");
  const [anneeFilter, setAnneeFilter] = useState<string>("tous");

  const annees = useMemo(() => {
    const set = new Set<string>();
    data.mandats.forEach((m) => {
      const y = m.dateDebut?.slice(0, 4);
      if (y) set.add(y);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [data.mandats]);

  const mandats = useMemo(() => {
    return [...data.mandats]
      .filter((m) => {
        if (statutFilter !== "tous" && m.statut !== statutFilter) return false;
        if (typeFilter !== "tous" && m.type !== typeFilter) return false;
        if (anneeFilter !== "tous" && !m.dateDebut?.startsWith(anneeFilter)) return false;
        return true;
      })
      .sort((a, b) => {
        const na = a.numeroRegistre ?? 999999;
        const nb = b.numeroRegistre ?? 999999;
        return na - nb;
      });
  }, [data.mandats, statutFilter, typeFilter, anneeFilter]);

  const kpis = useMemo(() => {
    const all = data.mandats;
    return {
      total:       all.length,
      actifs:      all.filter((m) => m.statut === "Actif").length,
      regularises: all.filter((m) => m.regularisation).length,
      expires:     all.filter((m) => m.statut === "Expiré").length,
    };
  }, [data.mandats]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Registre des mandats — Casa Caraïbes</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 10px; color: #111; padding: 20px; }
          h1 { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
          .subtitle { font-size: 11px; color: #555; margin-bottom: 6px; }
          .meta { font-size: 9px; color: #777; margin-bottom: 14px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f0f0f0; border: 1px solid #ccc; padding: 5px 6px; text-align: left; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; }
          td { border: 1px solid #ddd; padding: 5px 6px; vertical-align: top; }
          tr:nth-child(even) td { background: #fafafa; }
          .badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 8px; font-weight: bold; }
          .reg { background: #fef3c7; color: #92400e; }
          .actif { background: #d1fae5; color: #065f46; }
          .expire { background: #fef3c7; color: #78350f; }
          .resilie { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 16px; font-size: 8px; color: #999; text-align: center; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <div class="footer">
          Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")} — Casa Caraïbes — Registre des mandats électronique (Loi Hoguet n°70-9)
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-5">
      {/* En-tête */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <BookOpen size={17} className="text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-ink">Registre des mandats</h1>
            <p className="text-[12px] text-ink-muted">Conforme Loi Hoguet n°70-9 — numérotation chronologique irréversible</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-primary/90"
        >
          <Printer size={14} /> Imprimer le registre
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: "Total mandats", val: kpis.total, color: "text-ink" },
          { label: "Actifs",        val: kpis.actifs, color: "text-emerald-600" },
          { label: "Régularisés",   val: kpis.regularises, color: "text-amber-600" },
          { label: "Expirés",       val: kpis.expires, color: "text-red-500" },
        ].map((k) => (
          <div key={k.label} className="card p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">{k.label}</div>
            <div className={cn("mt-1 font-heading text-2xl font-semibold", k.color)}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Bannière régularisation */}
      {kpis.regularises > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="text-[12.5px] text-amber-800">
            <span className="font-semibold">{kpis.regularises} mandat{kpis.regularises > 1 ? "s" : ""} régularisé{kpis.regularises > 1 ? "s" : ""}</span>
            {" "}— saisis rétroactivement avec leur date réelle de signature. Ces mandats sont conformes à la pratique de régularisation légale.
          </div>
        </div>
      )}

      {/* Renouvellements */}
      <RenewalPanel mandats={data.mandats} biens={data.biens} />

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter size={13} className="text-ink-muted" />
        <select
          value={anneeFilter}
          onChange={(e) => setAnneeFilter(e.target.value)}
          className="rounded border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="tous">Toutes les années</option>
          {annees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="rounded border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="tous">Tous les types</option>
          {["Exclusif", "Simple", "Gestion", "Co-exclusif"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as StatutFilter)}
          className="rounded border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="tous">Tous les statuts</option>
          {["Actif", "Expiré", "Résilié", "Suspendu"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="ml-auto text-[11px] text-ink-muted">
          {mandats.length} mandat{mandats.length > 1 ? "s" : ""} affiché{mandats.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Table visible + contenu print */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-[12px]">
            <thead>
              <tr className="border-b border-line bg-bg">
                {["N° Registre", "Enregistrement", "Type", "Mandant", "Bien", "Prix", "Mandat", "Durée", "Statut"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mandats.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-ink-muted">
                    Aucun mandat pour ces filtres.
                  </td>
                </tr>
              )}
              {mandats.map((m, i) => {
                const bien = getBienForMandat(m, data.biens);
                return (
                  <tr
                    key={m.id}
                    className={cn(
                      "border-b border-line/60 transition-colors hover:bg-bg/60",
                      i % 2 === 1 && "bg-bg/30",
                    )}
                  >
                    {/* N° registre */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading text-base font-bold text-primary">
                          {m.numeroRegistre != null
                            ? String(m.numeroRegistre).padStart(3, "0")
                            : "—"}
                        </span>
                        {m.regularisation && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                            Régul.
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date enregistrement */}
                    <td className="px-3 py-2.5 text-ink-sub">
                      {m.dateEnregistrement
                        ? fdate(m.dateEnregistrement.slice(0, 10))
                        : "—"}
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded px-2 py-0.5 text-[10px] font-semibold", TYPE_COLORS[m.type] ?? "bg-gray-100 text-gray-600")}>
                        {m.type}
                      </span>
                    </td>

                    {/* Mandant */}
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-ink">{m.mandant}</div>
                      {m.tel && <div className="text-[11px] text-ink-muted">{m.tel}</div>}
                    </td>

                    {/* Bien */}
                    <td className="px-3 py-2.5">
                      {bien ? (
                        <>
                          <div className="text-ink">{bien.adresse || bien.commune}</div>
                          <div className="text-[11px] text-ink-muted">{bien.commune} · {bien.ref}</div>
                        </>
                      ) : (
                        <span className="text-ink-muted">{m.bienId || "—"}</span>
                      )}
                    </td>

                    {/* Prix */}
                    <td className="px-3 py-2.5 font-medium text-ink">
                      {bien?.prix ? eur(bien.prix) : "—"}
                    </td>

                    {/* Mandat dates */}
                    <td className="px-3 py-2.5 text-ink-sub">
                      <div>{fdate(m.dateDebut)}</div>
                      <div className="text-[11px]">→ {fdate(m.dateFin)}</div>
                    </td>

                    {/* Durée */}
                    <td className="px-3 py-2.5 text-ink-sub">
                      {m.dateDebut && m.dateFin
                        ? (() => {
                            const d1 = new Date(m.dateDebut);
                            const d2 = new Date(m.dateFin);
                            const months = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24 * 30));
                            return `${months} mois`;
                          })()
                        : "—"}
                    </td>

                    {/* Statut */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <StatutIcon statut={m.statut} />
                        <span className={cn("rounded px-2 py-0.5 text-[10px] font-semibold", STATUT_COLORS[m.statut] ?? "bg-gray-100 text-gray-600")}>
                          {m.statut}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contenu print (caché à l'écran) */}
      <div className="hidden">
        <div ref={printRef}>
          <h1>Registre des mandats — Casa Caraïbes</h1>
          <div className="subtitle">Agence immobilière — Martinique</div>
          <div className="meta">
            Registre électronique conforme Loi Hoguet n°70-9 du 2 janvier 1970 et Décret n°72-678 du 20 juillet 1972.
            Numérotation chronologique irréversible générée par séquence PostgreSQL côté serveur.
            {kpis.regularises > 0 && ` | ${kpis.regularises} mandat(s) régularisé(s) saisi(s) avec date réelle de signature.`}
          </div>
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Enregistrement</th>
                <th>Type</th>
                <th>Mandant</th>
                <th>Téléphone</th>
                <th>Bien</th>
                <th>Commune</th>
                <th>Prix</th>
                <th>Début mandat</th>
                <th>Fin mandat</th>
                <th>Honoraires</th>
                <th>Statut</th>
                <th>Régul.</th>
              </tr>
            </thead>
            <tbody>
              {data.mandats
                .slice()
                .sort((a, b) => (a.numeroRegistre ?? 999999) - (b.numeroRegistre ?? 999999))
                .map((m) => {
                  const bien = getBienForMandat(m, data.biens);
                  return (
                    <tr key={m.id}>
                      <td>{m.numeroRegistre != null ? String(m.numeroRegistre).padStart(3, "0") : "—"}</td>
                      <td>{m.dateEnregistrement ? m.dateEnregistrement.slice(0, 10) : "—"}</td>
                      <td>{m.type}</td>
                      <td>{m.mandant}</td>
                      <td>{m.tel || "—"}</td>
                      <td>{bien?.adresse || "—"}</td>
                      <td>{bien?.commune || "—"}</td>
                      <td>{bien?.prix ? `${bien.prix.toLocaleString("fr-FR")} €` : "—"}</td>
                      <td>{m.dateDebut || "—"}</td>
                      <td>{m.dateFin || "—"}</td>
                      <td>{m.honoraires ? `${m.honoraires}%` : "—"}</td>
                      <td>
                        <span className={cn("badge", {
                          actif: m.statut === "Actif",
                          expire: m.statut === "Expiré",
                          resilie: m.statut === "Résilié",
                        })}>
                          {m.statut}
                        </span>
                      </td>
                      <td>
                        {m.regularisation ? <span className="badge reg">Oui</span> : "Non"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
