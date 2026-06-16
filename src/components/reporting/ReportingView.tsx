import { Suspense, lazy } from "react";
import { PageHeader } from "../shared/PageHeader";
import { FinanceNav } from "../shared/FinanceNav";
import { eur } from "../../lib/format";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useFinancials } from "../../hooks/useFinancials";
import { BarChart2, FileDown, TrendingUp, TrendingDown } from "lucide-react";
import { exportGrandLivreCSV } from "../../services/export.csv";
import { useUiStore } from "../../store/ui.store";

const PdfDownload = lazy(() => import("./PdfDownloadButton"));

// Graphique barres SVG
function BarChart({ data }: { data: { label: string; encaisse: number }[] }) {
  const max = Math.max(...data.map(d => d.encaisse), 1);
  const W = 52, H = 80;
  return (
    <svg viewBox={`0 0 ${W * data.length} ${H + 18}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const x = i * W;
        const h = d.encaisse > 0 ? Math.max((d.encaisse / max) * H, 3) : 0;
        const isCurrent = i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x + 8} y={H - h} width={W - 14} height={h} rx={3}
              fill={isCurrent ? "#1A3A52" : "#2D7A5F"} opacity={isCurrent ? 1 : 0.65} />
            <text x={x + W / 2} y={H + 13} textAnchor="middle" fontSize={8.5}
              fill={isCurrent ? "#1A3A52" : "#9B9B97"} fontWeight={isCurrent ? "700" : "400"}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Entonnoir de conversion
function FunnelView({ funnel }: { funnel: { mandats: number; compromis: number; actes: number; txMC: number; txCA: number } }) {
  const steps = [
    { label: "Mandats actifs",   count: funnel.mandats,   color: "#6B7280", width: "100%" },
    { label: "Compromis signés", count: funnel.compromis, color: "#3B82F6", width: `${Math.max(funnel.mandats > 0 ? (funnel.compromis / funnel.mandats) * 100 : 0, funnel.compromis > 0 ? 10 : 0)}%` },
    { label: "Actes signés",     count: funnel.actes,     color: "#10B981", width: `${Math.max(funnel.mandats > 0 ? (funnel.actes / funnel.mandats) * 100 : 0, funnel.actes > 0 ? 5 : 0)}%` },
  ];
  return (
    <div className="flex flex-col gap-2.5">
      {steps.map((s, i) => (
        <div key={i}>
          <div className="mb-1 flex justify-between text-[12px]">
            <span className="text-ink-sub">{s.label}</span>
            <span className="font-semibold text-ink">{s.count}</span>
          </div>
          <div className="h-5 overflow-hidden rounded bg-line">
            <div className="h-full rounded transition-[width] duration-700 flex items-center" style={{ width: s.width, background: s.color }}>
              {s.count > 0 && (
                <span className="pl-2 text-[10px] font-bold text-white">{s.count}</span>
              )}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="mt-1 text-right text-[11px] text-ink-muted">
              Taux de transformation : <b className="text-ink">{i === 0 ? funnel.txMC : funnel.txCA}%</b>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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
            <button className="btn-ghost" onClick={() => exportGrandLivreCSV(data, fin)}>
              <FileDown size={14} /> Grand Livre (CSV)
            </button>
            <Suspense fallback={<button className="btn-primary opacity-60"><BarChart2 size={14} /> Préparation…</button>}>
              <PdfDownload data={data} fin={fin} />
            </Suspense>
          </div>
        }
      />

      {/* Ligne KPIs financiers */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card p-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">CA {yearNow}</div>
          <div className="font-heading text-[22px] font-bold text-emerald">{eur(fin.revAnneeCourante)}</div>
        </div>
        <div className="card p-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Ce mois</div>
          <div className="font-heading text-[22px] font-bold text-ink">{eur(fin.revMois)}</div>
          {varMois !== null && (
            <div className={`mt-0.5 flex items-center gap-1 text-[12px] font-semibold ${varMois >= 0 ? "text-emerald" : "text-danger"}`}>
              {varMois >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {varMois >= 0 ? "+" : ""}{varMois}% vs mois préc.
            </div>
          )}
        </div>
        <div className="card p-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">En cours</div>
          <div className="font-heading text-[22px] font-bold text-amber">{eur(fin.globalAEncaisser)}</div>
          <div className="mt-0.5 text-[12px] text-ink-muted">
            <button onClick={() => setView("pilotage")} className="text-primary hover:underline">
              {fin.compromisAEncaisser.length} dossiers →
            </button>
          </div>
        </div>
        <div className="card p-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Taux réalisation</div>
          <div className="font-heading text-[22px] font-bold text-primary">{fin.pctRealise}%</div>
          <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${fin.pctRealise}%` }} />
          </div>
        </div>
      </div>

      {/* Graphique + Entonnoir */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 text-[13.5px] font-semibold text-ink">Encaissements mensuels (12 mois)</div>
          <BarChart data={fin.monthly.map(m => ({ label: m.label, encaisse: m.encaisse }))} />
          <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-muted">
            <button onClick={() => setView("revenus")} className="text-primary hover:underline flex items-center gap-1">
              💰 Voir le journal des flux →
            </button>
          </div>
        </div>
        <div className="card p-5">
          <div className="mb-4 text-[13.5px] font-semibold text-ink">Entonnoir de conversion</div>
          <FunnelView funnel={fin.funnel} />
          <div className="mt-3 border-t border-line pt-3 grid grid-cols-3 text-center text-[12px]">
            <div>
              <div className="font-bold text-ink">{fin.funnel.txMC}%</div>
              <div className="text-ink-muted">Mandat → Compromis</div>
            </div>
            <div>
              <div className="font-bold text-ink">{fin.funnel.txCA}%</div>
              <div className="text-ink-muted">Compromis → Acte</div>
            </div>
            <div>
              <div className="font-bold text-ink">{fin.funnel.mandats > 0 ? Math.round((fin.funnel.actes / fin.funnel.mandats) * 100) : 0}%</div>
              <div className="text-ink-muted">Transformation globale</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ventilation + Performances agents */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 text-[13.5px] font-semibold text-ink">Ventilation par nature</div>
          {ventEntries.length === 0 ? (
            <p className="text-[12.5px] text-ink-muted">Aucun encaissement enregistré.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {ventEntries.map(([type, montant], i) => {
                const pct = ventTotal > 0 ? Math.round((montant / ventTotal) * 100) : 0;
                return (
                  <div key={type}>
                    <div className="mb-1 flex justify-between text-[12.5px]">
                      <span className="text-ink-sub">{type}</span>
                      <span className="font-semibold text-ink">
                        {eur(montant)} <span className="font-normal text-ink-muted">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: VENT_COLORS[i % VENT_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
              <div className="mt-1 border-t border-line pt-2 flex justify-between text-[12.5px]">
                <span className="font-semibold text-ink">Total encaissé</span>
                <span className="font-bold text-emerald">{eur(ventTotal)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 text-[13.5px] font-semibold text-ink">Performance par négociateur</div>
          <div className="flex flex-col gap-3.5">
            {fin.agentPerformance.map(a => {
              const pct = Math.round((a.caVentes / maxCA) * 100);
              return (
                <div key={a.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: a.color }}>
                        {a.name[0]}
                      </span>
                      <span className="text-[13px] font-semibold text-ink">{a.name}</span>
                    </div>
                    <span className="font-heading text-[14px] font-bold" style={{ color: a.color }}>{eur(a.caVentes)}</span>
                  </div>
                  <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: a.color }} />
                  </div>
                  <div className="flex gap-4 text-[11px] text-ink-sub">
                    <span>💼 <b>{a.compromis}</b> compromis</span>
                    <span>👥 <b>{a.clients}</b> clients actifs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
