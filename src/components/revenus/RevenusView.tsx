import { useState } from "react";
import { Plus, Edit2, Trash2, TrendingUp } from "lucide-react";
import { StatusPill, KpiCard } from "../shared/StatusPill";
import { EmptyState, Modal } from "../ui/Modal";
import { PageHeader } from "../shared/PageHeader";
import { RevenuForm } from "../pilotage/forms";
import { eur, fdate } from "../../lib/format";
import { useFinancials } from "../../hooks/useFinancials";
import { useAgencyData, useSaveRevenu, useDeleteRevenu } from "../../hooks/queries/useAgencyData";
import type { Revenu } from "../../types/domain";

export function RevenusView() {
  const { data } = useAgencyData();
  const fin = useFinancials(data);
  const save = useSaveRevenu();
  const del = useDeleteRevenu();
  const [modal, setModal] = useState<{ item?: Revenu } | null>(null);
  const [filter, setFilter] = useState<"tous" | "Encaissé" | "En attente">("tous");

  const rows = data.revenus
    .filter((r) => filter === "tous" || r.statut === filter)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const byMonth = new Map<string, Revenu[]>();
  for (const r of rows) {
    const k = r.date ? r.date.slice(0, 7) : "—";
    (byMonth.get(k) ?? byMonth.set(k, []).get(k)!).push(r);
  }

  return (
    <div className="mx-auto max-w-[860px] px-6 py-5">
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="✅ Total encaissé" value={eur(fin.globalEncaisse)} note={`Ce mois : ${eur(fin.revMois)}`} tone="emerald" />
        <KpiCard label="⏳ En attente" value={eur(fin.globalAEncaisser)} tone="amber" />
        <KpiCard label="📊 Volume total" value={eur(fin.totalPotentiel)} note={`${fin.pctRealise}% réalisé`} tone="primary" />
      </div>

      <PageHeader
        title="Journal des flux"
        actions={
          <div className="flex items-center gap-2">
            <select className="rounded border border-line2 bg-surface px-2.5 py-1.5 text-[12.5px]" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="tous">Tous</option><option value="Encaissé">Encaissés</option><option value="En attente">En attente</option>
            </select>
            <button className="btn-primary" onClick={() => setModal({})}><Plus size={14} /> Nouveau flux</button>
          </div>
        }
      />

      {byMonth.size === 0 ? (
        <EmptyState Icon={TrendingUp} text="Aucun flux enregistré" sub="Enregistrez vos premières commissions." />
      ) : (
        [...byMonth.entries()].map(([month, items]) => {
          const label = month === "—" ? "Sans date" : new Date(month + "-15").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
          const total = items.reduce((s, r) => s + r.montant, 0);
          return (
            <div key={month} className="mb-5">
              <div className="mb-2 flex items-center justify-between border-b border-line pb-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-sub">{label}</span>
                <span className="text-[13px] font-bold text-ink">{eur(total)}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((r) => (
                  <div key={r.id} className="card flex items-center gap-3.5 p-3" style={{ borderLeftWidth: 3 }}>
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded ${r.statut === "Encaissé" ? "bg-emerald-soft" : "bg-amber-soft"}`}>
                      <TrendingUp size={14} className={r.statut === "Encaissé" ? "text-emerald" : "text-amber"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-ink">{r.desc || r.type}</div>
                      <div className="text-xs text-ink-muted">{r.type} · {fdate(r.date)}</div>
                    </div>
                    <StatusPill label={r.statut} />
                    <span className={`font-heading text-[15px] font-bold ${r.statut === "Encaissé" ? "text-emerald" : "text-amber"}`}>{eur(r.montant)}</span>
                    <button className="text-ink-muted hover:text-ink" onClick={() => setModal({ item: r })}><Edit2 size={13} /></button>
                    <button className="text-ink-muted hover:text-danger" onClick={() => del.mutate(r.id)}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {modal && (
        <Modal title={modal.item ? "Modifier flux" : "Nouveau flux"} onClose={() => setModal(null)}>
          <RevenuForm initial={modal.item} onClose={() => setModal(null)} onSave={(r) => { save.mutate(r); setModal(null); }} />
        </Modal>
      )}
    </div>
  );
}
