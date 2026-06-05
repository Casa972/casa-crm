import { Suspense, lazy } from "react";
import { KpiCard } from "../shared/StatusPill";
import { PageHeader, ProgressBar } from "../shared/PageHeader";
import { eur } from "../../lib/format";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useFinancials } from "../../hooks/useFinancials";
import { BarChart2, FileDown } from "lucide-react";
import { exportGrandLivreCSV } from "../../services/export.csv";

// Import dynamique : @react-pdf n'est chargé qu'à l'ouverture du reporting.
const PdfDownload = lazy(() => import("./PdfDownloadButton"));

export function ReportingView() {
  const { data } = useAgencyData();
  const fin = useFinancials(data);

  // Ventilation des encaissements par nature
  const ventilation = new Map<string, number>();
  for (const r of data.revenus.filter((r) => r.statut === "Encaissé")) {
    ventilation.set(r.type, (ventilation.get(r.type) ?? 0) + r.montant);
  }
  const ventEntries = [...ventilation.entries()].sort((a, b) => b[1] - a[1]);
  const ventTotal = ventEntries.reduce((sum, [, v]) => sum + v, 0);
  const VENT_COLORS = ["#1A3A52", "#2D7A5F", "#9A6D22", "#5B4E8C", "#A03A30"];

  const maxCA = Math.max(...fin.agentPerformance.map((a) => a.caVentes), 1);

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-5">
      <PageHeader
        title="Reporting & Performance"
        subtitle="Vision consolidée des flux et du portefeuille."
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

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="✅ Encaissé réel" value={eur(fin.globalEncaisse)} note={`Ce mois : ${eur(fin.revMois)}`} tone="emerald" />
        <KpiCard label="⏳ Reste à encaisser" value={eur(fin.globalAEncaisser)} tone="amber" />
        <KpiCard label="📊 Volume total" value={eur(fin.totalPotentiel)} note={`${fin.pctRealise}% réalisé`} tone="primary" />
      </div>

      <div className="mb-5">
        <ProgressBar
          pct={fin.pctRealise}
          label="Taux de réalisation du volume d'affaires"
          left={`${eur(fin.globalEncaisse)} encaissés`}
          right={`Objectif : ${eur(fin.totalPotentiel)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Ventilation */}
        <div className="card p-5">
          <h3 className="mb-4 text-[13.5px] font-semibold text-ink">Ventilation par nature de revenu</h3>
          {ventEntries.length === 0 ? (
            <p className="text-[12.5px] text-ink-muted">Aucun encaissement enregistré.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {ventEntries.map(([type, montant], i) => {
                const pct = ventTotal > 0 ? Math.round((montant / ventTotal) * 100) : 0;
                return (
                  <div key={type}>
                    <div className="mb-1 flex justify-between text-[12.5px]">
                      <span className="text-ink-sub">{type}</span>
                      <span className="font-semibold text-ink">{eur(montant)} <span className="font-normal text-ink-muted">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: VENT_COLORS[i % VENT_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Performances agents */}
        <div className="card p-5">
          <h3 className="mb-4 text-[13.5px] font-semibold text-ink">Performances par négociateur</h3>
          <div className="flex flex-col gap-3">
            {fin.agentPerformance.map((a) => {
              const pct = Math.round((a.caVentes / maxCA) * 100);
              return (
                <div key={a.id} className="rounded border border-line bg-bg p-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                      <span className="size-2 rounded-full" style={{ background: a.color }} />{a.name}
                    </span>
                    <span className="text-[13px] font-bold" style={{ color: a.color }}>{eur(a.caVentes)}</span>
                  </div>
                  <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: a.color }} />
                  </div>
                  <div className="flex gap-3 text-[11px] text-ink-sub">
                    <span>💼 <b>{a.compromis}</b> compromis</span>
                    <span>👥 <b>{a.clients}</b> clients</span>
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
