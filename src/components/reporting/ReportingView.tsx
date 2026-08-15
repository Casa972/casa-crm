import { Suspense, lazy } from "react";
import { PageHeader } from "../shared/PageHeader";
import { FinanceNav } from "../shared/FinanceNav";
import { eur } from "../../lib/format";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useFinancials } from "../../hooks/useFinancials";
import {
  BarChart2, FileDown,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { exportGrandLivreCSV, exportPipelineCSV } from "../../services/export.csv";
import { useUiStore } from "../../store/ui.store";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid, Tooltip, YAxis,
} from "recharts";

const PdfDownload = lazy(() => import("./PdfDownloadButton"));

// ── Custom Recharts tooltip ────────────────────────────────────────────────
function MonthlyTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-line bg-surface shadow-card-hover px-3 py-2 text-[12px]">
      <p className="mb-1.5 font-semibold text-ink">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-ink-sub">{p.name === "encaisse" ? "Encaissé" : "En attente"}</span>
          <span className="ml-auto font-semibold text-ink">{eur(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Funnel visuel centré ───────────────────────────────────────────────────
function FunnelView({
  funnel,
}: {
  funnel: { mandats: number; compromis: number; actes: number; txMC: number; txCA: number };
}) {
  const steps = [
    { label: "Mandats actifs",   count: funnel.mandats,   color: "#1A3A52", bg: "#EBF1F6" },
    { label: "Compromis signés", count: funnel.compromis, color: "#5B4E8C", bg: "#F0EEFB" },
    { label: "Actes signés",     count: funnel.actes,     color: "#2D7A5F", bg: "#EAF5F0" },
  ];
  const maxCount = Math.max(...steps.map(s => s.count), 1);
  const rates = [funnel.txMC, funnel.txCA];

  return (
    <div className="flex flex-col items-center gap-0">
      {steps.map((s, i) => {
        // Width shrinks per step: 100% → ratio-based, min 30%
        const pct = maxCount > 0 ? Math.max((s.count / maxCount) * 100, s.count > 0 ? 30 : 10) : 10;
        return (
          <div key={i} className="w-full flex flex-col items-center">
            <div
              className="flex items-center justify-between rounded px-4 py-2.5 transition-all duration-700"
              style={{ width: `${pct}%`, background: s.bg, border: `1.5px solid ${s.color}22` }}
            >
              <span className="text-[12px] font-semibold" style={{ color: s.color }}>{s.label}</span>
              <span className="font-heading text-[18px] font-bold" style={{ color: s.color }}>{s.count}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="my-1 flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted">
                <div className="h-3 w-px bg-line" />
                <span className="rounded-full bg-line px-2 py-0.5 text-ink-sub">
                  → {rates[i]}%
                </span>
                <div className="h-3 w-px bg-line" />
              </div>
            )}
          </div>
        );
      })}

      {/* Stats globales */}
      <div className="mt-3 w-full border-t border-line pt-3 grid grid-cols-3 text-center text-[12px]">
        <div>
          <div className="font-bold text-ink">{funnel.txMC}%</div>
          <div className="text-ink-muted">Mandat → Compromis</div>
        </div>
        <div>
          <div className="font-bold text-ink">{funnel.txCA}%</div>
          <div className="text-ink-muted">Compromis → Acte</div>
        </div>
        <div>
          <div className="font-bold text-ink">
            {funnel.mandats > 0 ? Math.round((funnel.actes / funnel.mandats) * 100) : 0}%
          </div>
          <div className="text-ink-muted">Transformation globale</div>
        </div>
      </div>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────
export function ReportingView() {
  const { data } = useAgencyData();
  const fin = useFinancials(data);
  const setView = useUiStore(s => s.setView);

  const yearNow = new Date().getFullYear();

  // Ventilation encaissements par nature
  const ventilation = new Map<string, number>();
  for (const r of data.revenus.filter(r => r.statut === "Encaissé")) {
    ventilation.set(r.type, (ventilation.get(r.type) ?? 0) + r.montant);
  }
  const ventEntries = [...ventilation.entries()].sort((a, b) => b[1] - a[1]);
  const ventTotal = ventEntries.reduce((sum, [, v]) => sum + v, 0);
  const VENT_COLORS = ["#1A3A52", "#2D7A5F", "#9A6D22", "#5B4E8C", "#A03A30"];

  const maxCA = Math.max(...fin.agentPerformance.map(a => a.caVentes), 1);

  const varMois = fin.revMoisPrev > 0
    ? Math.round(((fin.revMois - fin.revMoisPrev) / fin.revMoisPrev) * 100)
    : null;

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-5">
      <FinanceNav active="reporting" />

      <PageHeader
        title="Reporting & Performance"
        subtitle={`Vue consolidée — Année ${yearNow}`}
        actions={
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => exportPipelineCSV(data)}>
              <FileDown size={14} /> Pipeline (CSV)
            </button>
            <button className="btn-ghost" onClick={() => exportGrandLivreCSV(data, fin)}>
              <FileDown size={14} /> Grand Livre (CSV)
            </button>
            <Suspense fallback={<button className="btn-primary opacity-60"><BarChart2 size={14} /> Préparation…</button>}>
              <PdfDownload data={data} fin={fin} />
            </Suspense>
          </div>
        }
      />

      {/* ── KPI cards ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* CA Année */}
        <div className="card border-l-4 border-l-emerald p-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">CA {yearNow}</div>
          <div className="font-heading text-[22px] font-bold text-emerald">{eur(fin.revAnneeCourante)}</div>
          <div className="mt-1 text-[11px] text-ink-muted">Encaissements réels</div>
        </div>

        {/* Ce mois */}
        <div className="card border-l-4 border-l-primary p-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Ce mois</div>
          <div className="font-heading text-[22px] font-bold text-ink">{eur(fin.revMois)}</div>
          {varMois !== null && (
            <div className={`mt-0.5 flex items-center gap-1 text-[12px] font-semibold ${varMois >= 0 ? "text-emerald" : "text-danger"}`}>
              {varMois >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {varMois >= 0 ? "+" : ""}{varMois}% vs mois préc.
            </div>
          )}
        </div>

        {/* En cours */}
        <div className="card border-l-4 border-l-amber p-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">En cours</div>
          <div className="font-heading text-[22px] font-bold text-amber">{eur(fin.globalAEncaisser)}</div>
          <div className="mt-0.5 text-[12px] text-ink-muted">
            <button onClick={() => setView("pilotage")} className="text-primary hover:underline">
              {fin.compromisAEncaisser.length} dossiers →
            </button>
          </div>
        </div>

        {/* Taux réalisation */}
        <div className="card border-l-4 border-l-violet p-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Taux réalisation</div>
          <div className="font-heading text-[22px] font-bold text-primary">{fin.pctRealise}%</div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700"
              style={{ width: `${Math.min(fin.pctRealise, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Graphique mensuel + Entonnoir ── */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Recharts stacked bar */}
        <div className="card p-5">
          <div className="mb-1 text-[13.5px] font-semibold text-ink">Encaissements mensuels (12 mois)</div>
          <div className="mb-3 text-[11.5px] text-ink-muted">Encaissé + en attente par mois</div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fin.monthly} barSize={20} barCategoryGap="25%">
              <CartesianGrid vertical={false} stroke="#EBEAE7" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9B9B97" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<MonthlyTooltip />} cursor={{ fill: "#EBEAE7", opacity: 0.5 }} />
              <Bar dataKey="encaisse" stackId="a" fill="#2D7A5F" radius={[0, 0, 0, 0]} name="encaisse" />
              <Bar dataKey="enAttente" stackId="a" fill="#9A6D22" radius={[4, 4, 0, 0]} name="enAttente" />
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-2 flex items-center gap-4 text-[11.5px] text-ink-sub">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full inline-block bg-emerald" />
              Encaissé
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full inline-block bg-amber" />
              En attente
            </div>
            <button onClick={() => setView("revenus")} className="ml-auto text-primary hover:underline flex items-center gap-1">
              Voir le journal →
            </button>
          </div>
        </div>

        {/* Entonnoir */}
        <div className="card p-5">
          <div className="mb-4 text-[13.5px] font-semibold text-ink">Entonnoir de conversion</div>
          <FunnelView funnel={fin.funnel} />
        </div>
      </div>

      {/* ── Ventilation + Performances agents ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Ventilation par nature */}
        <div className="card p-5">
          <div className="mb-4 text-[13.5px] font-semibold text-ink">Ventilation par nature</div>
          {ventEntries.length === 0 ? (
            <p className="text-[12.5px] text-ink-muted">Aucun encaissement enregistré.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {ventEntries.map(([type, montant], i) => {
                const pct = ventTotal > 0 ? Math.round((montant / ventTotal) * 100) : 0;
                const color = VENT_COLORS[i % VENT_COLORS.length];
                return (
                  <div key={type}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[13px] font-medium text-ink">{type}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                          style={{ background: color }}
                        >
                          {pct}%
                        </span>
                        <span className="font-heading text-[14px] font-bold text-ink">{eur(montant)}</span>
                      </div>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-line pt-3 flex justify-between text-[13px]">
                <span className="font-semibold text-ink">Total encaissé</span>
                <span className="font-heading font-bold text-emerald">{eur(ventTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Performance par négociateur */}
        <div className="card p-5">
          <div className="mb-4 text-[13.5px] font-semibold text-ink">Performance par négociateur</div>
          {fin.agentPerformance.length === 0 ? (
            <p className="text-[12.5px] text-ink-muted">Aucune donnée agent.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {fin.agentPerformance.map(a => {
                const pct = maxCA > 0 ? Math.round((a.caVentes / maxCA) * 100) : 0;
                return (
                  <div
                    key={a.id}
                    className="rounded border border-line bg-bg p-3"
                    style={{ borderTopWidth: 3, borderTopColor: a.color }}
                  >
                    {/* Top row: avatar + name + CA */}
                    <div className="mb-2 flex items-center gap-2.5">
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                        style={{ background: a.color }}
                      >
                        {a.name[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-semibold text-ink">{a.name}</div>
                        <div
                          className="font-heading text-[17px] font-bold leading-tight"
                          style={{ color: a.color }}
                        >
                          {eur(a.caVentes)}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${pct}%`, background: a.color }}
                      />
                    </div>

                    {/* Stats bottom */}
                    <div className="flex gap-3 text-[11px] text-ink-sub">
                      <span>
                        <b className="text-ink">{a.compromis}</b> compromis
                      </span>
                      <span>
                        <b className="text-ink">{a.clients}</b> clients actifs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Qualité pipeline par agent ── */}
      {fin.agentPerformance.length > 0 && (
        <div className="mt-4 card p-5">
          <div className="mb-4 text-[13.5px] font-semibold text-ink">Qualité pipeline par négociateur</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-[12.5px]">
              <thead>
                <tr className="border-b border-line">
                  {["Négociateur", "Clients actifs", "Compromis", "Ticket moyen", "Taux conv. (C→A)", "CA généré"].map((h) => (
                    <th key={h} className="pb-2.5 pr-4 text-left text-[10px] font-bold uppercase tracking-wider text-ink-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fin.agentPerformance.map((a) => {
                  const ticket = a.compromis > 0 ? Math.round(a.caVentes / a.compromis) : 0;
                  const agentClients = data.clients.filter((c) => c.agentId === a.id);
                  const agentActes = data.compromis.filter((c) => c.agentId === a.id && c.statut === "Acte signé").length;
                  const txConv = a.compromis > 0 ? Math.round((agentActes / a.compromis) * 100) : 0;
                  return (
                    <tr key={a.id} className="border-b border-line/50 hover:bg-bg/50 transition-colors">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: a.color }}>{a.name[0]}</span>
                          <span className="font-medium text-ink">{a.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 font-semibold text-ink">{agentClients.filter((c) => !["Acte", "Perdu"].includes(c.statut)).length}</td>
                      <td className="py-2.5 pr-4 font-semibold text-ink">{a.compromis}</td>
                      <td className="py-2.5 pr-4 font-semibold text-ink">{ticket > 0 ? eur(ticket) : "—"}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-line overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${txConv}%`, background: a.color }} />
                          </div>
                          <span className="font-semibold" style={{ color: a.color }}>{txConv}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 font-heading font-bold" style={{ color: a.color }}>{eur(a.caVentes)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
