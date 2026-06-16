import { useState } from "react";
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { StatusPill } from "../shared/StatusPill";
import { EmptyState, Modal } from "../ui/Modal";
import { FinanceNav } from "../shared/FinanceNav";
import { RevenuForm } from "../pilotage/forms";
import { eur, fdate } from "../../lib/format";
import { useFinancials } from "../../hooks/useFinancials";
import { useAgencyData, useSaveRevenu, useDeleteRevenu } from "../../hooks/queries/useAgencyData";
import { useUiStore } from "../../store/ui.store";
import type { Revenu } from "../../types/domain";

// Graphique en barres SVG — pas de dépendance externe
function MonthlyChart({ data }: { data: { label: string; encaisse: number; enAttente: number }[] }) {
  const max = Math.max(...data.map(d => d.encaisse + d.enAttente), 1);
  const W = 52, H = 80, GAP = 4;
  const total = data.length;
  const barW = (W * total - GAP * (total - 1)) / total;

  return (
    <svg
      viewBox={`0 0 ${W * total} ${H + 20}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {data.map((d, i) => {
        const x = i * (W);
        const hEnc = d.encaisse > 0 ? Math.max((d.encaisse / max) * H, 2) : 0;
        const hAtt = d.enAttente > 0 ? Math.max((d.enAttente / max) * H, 2) : 0;
        const isCurrent = i === data.length - 1;
        return (
          <g key={i}>
            {/* Barre en attente */}
            {hAtt > 0 && (
              <rect
                x={x + 6} y={H - hEnc - hAtt} width={barW - 4} height={hAtt}
                rx={2} fill={isCurrent ? "#F59E0B" : "#D1D5DB"} opacity={0.6}
              />
            )}
            {/* Barre encaissé */}
            {hEnc > 0 && (
              <rect
                x={x + 6} y={H - hEnc} width={barW - 4} height={hEnc}
                rx={2} fill={isCurrent ? "#1A3A52" : "#2D7A5F"} opacity={isCurrent ? 1 : 0.7}
              />
            )}
            {/* Label mois */}
            <text
              x={x + W / 2} y={H + 14}
              textAnchor="middle" fontSize={9}
              fill={isCurrent ? "#1A3A52" : "#9B9B97"}
              fontWeight={isCurrent ? "700" : "400"}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function RevenusView() {
  const { data } = useAgencyData();
  const fin = useFinancials(data);
  const save = useSaveRevenu();
  const del = useDeleteRevenu();
  const setView = useUiStore(s => s.setView);
  const [modal, setModal] = useState<{ item?: Revenu } | null>(null);
  const [filter, setFilter] = useState<"tous" | "Encaissé" | "En attente">("tous");

  const varMois = fin.revMoisPrev > 0
    ? Math.round(((fin.revMois - fin.revMoisPrev) / fin.revMoisPrev) * 100)
    : null;

  const rows = data.revenus
    .filter(r => filter === "tous" || r.statut === filter)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const byMonth = new Map<string, Revenu[]>();
  for (const r of rows) {
    const k = r.date ? r.date.slice(0, 7) : "—";
    (byMonth.get(k) ?? byMonth.set(k, []).get(k)!).push(r);
  }

  return (
    <div className="mx-auto max-w-[960px] px-6 py-5">
      <FinanceNav active="revenus" />

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Total encaissé</div>
          <div className="font-heading text-2xl font-bold text-emerald">{eur(fin.globalEncaisse)}</div>
          <div className="mt-1 text-[12px] text-ink-muted">
            Ce mois : <span className="font-semibold text-ink">{eur(fin.revMois)}</span>
            {varMois !== null && (
              <span className={`ml-2 inline-flex items-center gap-0.5 text-[11px] font-bold ${varMois >= 0 ? "text-emerald" : "text-danger"}`}>
                {varMois >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {varMois >= 0 ? "+" : ""}{varMois}%
              </span>
            )}
          </div>
        </div>
        <div className="card p-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">En attente</div>
          <div className="font-heading text-2xl font-bold text-amber">{eur(fin.globalAEncaisser)}</div>
          <div className="mt-1 text-[12px] text-ink-muted">
            Portefeuille compromis + revenus en attente
          </div>
        </div>
        <div className="card p-4">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Année {new Date().getFullYear()}</div>
          <div className="font-heading text-2xl font-bold text-primary">{eur(fin.revAnneeCourante)}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-muted">
            <span>{fin.pctRealise}% du potentiel réalisé</span>
            <button onClick={() => setView("reporting")} className="inline-flex items-center gap-0.5 text-primary hover:underline">
              <ArrowUpRight size={11} /> Reporting
            </button>
          </div>
        </div>
      </div>

      {/* Graphique mensuel */}
      <div className="card mb-5 p-5">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-[13px] font-semibold text-ink">Encaissements sur 12 mois</div>
          <div className="flex items-center gap-3 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1"><span className="inline-block size-2.5 rounded-sm bg-[#2D7A5F]" /> Encaissé</span>
            <span className="flex items-center gap-1"><span className="inline-block size-2.5 rounded-sm bg-amber-300" /> En attente</span>
          </div>
        </div>
        <MonthlyChart data={fin.monthly} />
      </div>

      {/* Journal */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink">Journal des flux</span>
        <div className="flex items-center gap-2">
          <select
            className="rounded border border-line2 bg-surface px-2.5 py-1.5 text-[12.5px]"
            value={filter}
            onChange={e => setFilter(e.target.value as typeof filter)}
          >
            <option value="tous">Tous</option>
            <option value="Encaissé">Encaissés</option>
            <option value="En attente">En attente</option>
          </select>
          <button className="btn-primary" onClick={() => setModal({})}><Plus size={14} /> Nouveau flux</button>
        </div>
      </div>

      {byMonth.size === 0 ? (
        <EmptyState Icon={TrendingUp} text="Aucun flux enregistré" sub="Enregistrez vos premières commissions." />
      ) : (
        [...byMonth.entries()].map(([month, items]) => {
          const label = month === "—"
            ? "Sans date"
            : new Date(month + "-15").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
          const totalEnc = items.filter(r => r.statut === "Encaissé").reduce((s, r) => s + r.montant, 0);
          const totalAtt = items.filter(r => r.statut === "En attente").reduce((s, r) => s + r.montant, 0);
          return (
            <div key={month} className="mb-5">
              <div className="mb-2 flex items-center justify-between border-b border-line pb-2">
                <span className="text-[12px] font-bold uppercase tracking-wide text-ink-sub">{label}</span>
                <div className="flex items-center gap-3 text-[12.5px]">
                  {totalEnc > 0 && <span className="font-semibold text-emerald">{eur(totalEnc)} encaissé</span>}
                  {totalAtt > 0 && <span className="font-semibold text-amber">{eur(totalAtt)} en attente</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {items.map(r => (
                  <div
                    key={r.id}
                    className="card flex items-center gap-3.5 p-3.5"
                    style={{ borderLeftWidth: 3, borderLeftColor: r.statut === "Encaissé" ? "#2D7A5F" : "#F59E0B" }}
                  >
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded ${r.statut === "Encaissé" ? "bg-emerald-100" : "bg-amber-100"}`}>
                      <TrendingUp size={14} className={r.statut === "Encaissé" ? "text-emerald-700" : "text-amber-600"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] font-semibold text-ink">{r.desc || r.type}</span>
                        {r.source === "pilotage" && r.sourceId && (
                          <button
                            onClick={() => setView("pilotage")}
                            className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                          >
                            🤝 Voir le dossier
                          </button>
                        )}
                      </div>
                      <div className="text-[11.5px] text-ink-muted">{r.type} · {fdate(r.date)}</div>
                    </div>
                    <StatusPill label={r.statut} />
                    <span className={`font-heading text-[16px] font-bold ${r.statut === "Encaissé" ? "text-emerald" : "text-amber"}`}>
                      {eur(r.montant)}
                    </span>
                    <button className="text-ink-muted hover:text-ink transition-colors" onClick={() => setModal({ item: r })}><Edit2 size={13} /></button>
                    <button className="text-ink-muted hover:text-danger transition-colors" onClick={() => { if (confirm("Supprimer ce flux ?")) del.mutate(r.id); }}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {modal && (
        <Modal title={modal.item ? "Modifier flux" : "Nouveau flux"} onClose={() => setModal(null)}>
          <RevenuForm initial={modal.item} onClose={() => setModal(null)} onSave={r => { save.mutate(r); setModal(null); }} />
        </Modal>
      )}
    </div>
  );
}
