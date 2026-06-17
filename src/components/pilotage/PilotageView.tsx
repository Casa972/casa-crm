import { useState } from "react";
import { Plus, Edit2, Check, Trash2, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, FileText } from "lucide-react";
import { KpiCard } from "../shared/StatusPill";
import { EmptyState, Modal } from "../ui/Modal";
import { FinanceNav } from "../shared/FinanceNav";
import { CompromisForm } from "./forms";
import { eur, fdate, daysDiff } from "../../lib/format";
import { useFinancials } from "../../hooks/useFinancials";
import {
  useAgencyData, useSaveCompromis, useEncaisserCommission, useDeleteCompromis,
} from "../../hooks/queries/useAgencyData";
import { useUiStore } from "../../store/ui.store";
import { commissionMontant } from "../../schemas/compromis.schema";
import type { Compromis } from "../../types/domain";

const STATUT_ORDER = ["Offre", "Compromis signé", "Conditions suspensives", "Acte signé"];
const STATUT_COLOR: Record<string, string> = {
  "Offre":                  "bg-amber-100 text-amber-800",
  "Compromis signé":        "bg-blue-100 text-blue-800",
  "Conditions suspensives": "bg-violet-100 text-violet-800",
  "Acte signé":             "bg-emerald-100 text-emerald-800",
  "Annulé":                 "bg-red-100 text-red-700",
};

function PipelineFunnel({ fin }: { fin: ReturnType<typeof useFinancials> }) {
  const stages = [
    { label: "Mandats actifs",  count: fin.mandatsEnCours.length,      color: "#6B7280" },
    { label: "Compromis",       count: fin.funnel.compromis,            color: "#3B82F6" },
    { label: "Actes signés",    count: fin.funnel.actes,                color: "#10B981" },
  ];
  const max = Math.max(...stages.map(s => s.count), 1);
  return (
    <div className="card p-4">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Entonnoir de conversion</div>
      <div className="flex flex-col gap-2">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-[12px] text-ink-sub">{s.label}</span>
            <div className="flex-1 h-6 rounded bg-line overflow-hidden">
              <div
                className="h-full rounded flex items-center justify-end pr-2 transition-[width] duration-700"
                style={{ width: `${Math.max((s.count / max) * 100, s.count > 0 ? 8 : 0)}%`, background: s.color }}
              >
                <span className="text-[11px] font-bold text-white">{s.count}</span>
              </div>
            </div>
            {i < stages.length - 1 && (
              <span className="w-14 shrink-0 text-right text-[11px] font-semibold text-ink-muted">
                {i === 0 ? `${fin.funnel.txMC}%` : `${fin.funnel.txCA}%`} →
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PilotageView() {
  const { data } = useAgencyData();
  const fin = useFinancials(data);
  const saveCompromis = useSaveCompromis();
  const encaisser = useEncaisserCommission();
  const delCompromis = useDeleteCompromis();
  const { setView, setPrefillRedacteur } = useUiStore();

  const [modal, setModal] = useState<{ item?: Compromis } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>("tous");

  const filtered = data.compromis
    .filter(c => filterStatut === "tous" || c.statut === filterStatut)
    .sort((a, b) => (b.dateCompromis || "").localeCompare(a.dateCompromis || ""));

  const varMois = fin.revMoisPrev > 0
    ? Math.round(((fin.revMois - fin.revMoisPrev) / fin.revMoisPrev) * 100)
    : null;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-5">
      <FinanceNav active="pilotage" />

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Commissions en cours"
          value={eur(fin.totalCompromisAEncaisser)}
          note={`${fin.compromisAEncaisser.length} dossiers actifs`}
          tone="primary"
        />
        <KpiCard
          label="Actes encaissés"
          value={eur(fin.totalActesEncaisses)}
          note={`${fin.actesEncaisses.length} actes signés`}
          tone="emerald"
        />
        <KpiCard
          label="Ce mois-ci"
          value={eur(fin.revMois)}
          note={varMois !== null ? `${varMois >= 0 ? "+" : ""}${varMois}% vs mois préc.` : undefined}
          tone={varMois !== null && varMois >= 0 ? "emerald" : "amber"}
        />
        <KpiCard
          label="Alertes délais"
          value={String(fin.alertesDelais.length)}
          note={fin.alertesDelais.length ? "Action requise" : "RAS"}
          tone={fin.alertesDelais.length ? "danger" : "neutral"}
        />
      </div>

      {/* Alertes */}
      {fin.alertesDelais.length > 0 && (
        <div className="card mb-4 border-l-4 border-l-danger bg-danger-soft p-4">
          <div className="mb-2 flex items-center gap-2 text-[12px] font-bold text-danger">
            <AlertTriangle size={14} /> Délais critiques — action requise immédiatement
          </div>
          <div className="flex flex-col gap-1">
            {fin.alertesDelais.map(c => {
              const sru = daysDiff(c.sruExpire), cond = daysDiff(c.condSuspExpire);
              return (
                <div key={c.id} className="flex items-center gap-3 text-[12.5px]">
                  <span className="font-semibold text-danger">{c.ref}</span>
                  <span className="text-danger/80">{c.acheteur}</span>
                  {sru !== null && sru <= 3 && (
                    <span className="rounded bg-danger px-2 py-0.5 text-[11px] font-bold text-white">
                      SRU : {sru <= 0 ? "EXPIRÉ" : `${sru}j`}
                    </span>
                  )}
                  {cond !== null && cond <= 7 && (
                    <span className="rounded bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
                      Cond. susp. : {cond <= 0 ? "EXPIRÉE" : `${cond}j`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <PipelineFunnel fin={fin} />

        {/* Résumé rapide */}
        <div className="card p-4">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Volume d'affaires</div>
          <div className="mb-3">
            <div className="mb-1 flex justify-between text-[12.5px]">
              <span className="text-ink-sub">Encaissé</span>
              <span className="font-semibold text-emerald">{eur(fin.globalEncaisse)}</span>
            </div>
            <div className="mb-1 flex justify-between text-[12.5px]">
              <span className="text-ink-sub">En cours</span>
              <span className="font-semibold text-amber">{eur(fin.globalAEncaisser)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-line overflow-hidden">
              <div className="h-full rounded-full bg-emerald transition-[width]" style={{ width: `${fin.pctRealise}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-ink-muted">
              <span>{fin.pctRealise}% réalisé</span>
              <span>Total : {eur(fin.totalPotentiel)}</span>
            </div>
          </div>
          <button
            onClick={() => setView("reporting")}
            className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline"
          >
            <TrendingUp size={12} /> Voir le reporting complet →
          </button>
        </div>
      </div>

      {/* Liste des dossiers */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-ink">Dossiers</span>
          <select
            className="rounded border border-line2 bg-surface px-2 py-1 text-[12px]"
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
          >
            <option value="tous">Tous statuts</option>
            {STATUT_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="Annulé">Annulé</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setModal({})}><Plus size={14} /> Nouveau dossier</button>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <EmptyState Icon={Plus} text="Aucun dossier" sub="Ajoutez un compromis pour suivre vos ventes." />
        ) : (
          filtered.map(c => {
            const montant = commissionMontant(c);
            const sru = daysDiff(c.sruExpire), cond = daysDiff(c.condSuspExpire);
            const alert = (sru !== null && sru <= 3) || (cond !== null && cond <= 7);
            const open = detail === c.id;
            const colorClass = STATUT_COLOR[c.statut] ?? "bg-gray-100 text-gray-700";
            return (
              <div
                key={c.id}
                className={`card cursor-pointer p-4 transition-shadow hover:shadow-md ${alert ? "border-l-4 border-l-danger" : ""}`}
                onClick={() => setDetail(open ? null : c.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold text-ink">{c.ref}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${colorClass}`}>{c.statut}</span>
                      {alert && <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-bold text-white">Délai</span>}
                      {c.commissionStatut === "Encaissée" && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Encaissée</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[12.5px] text-ink-sub">
                      <div><b className="text-ink">Acheteur</b> {c.acheteur}</div>
                      <div><b className="text-ink">Vendeur</b> {c.vendeur || "—"}</div>
                      <div><b className="text-ink">Bien</b> {c.bienRef}</div>
                      <div><b className="text-ink">Notaire</b> {c.notaire || "—"}</div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-heading text-[17px] font-bold text-ink">{eur(montant)}</div>
                    <div className="text-[11px] text-ink-muted">commission</div>
                    <div className="mt-0.5 text-[11px] text-ink-muted">{eur(c.prixVente)}</div>
                  </div>
                  <div className="shrink-0 text-ink-muted">
                    {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {open && (
                  <div className="mt-3 border-t border-line pt-3" onClick={e => e.stopPropagation()}>
                    <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-ink-sub sm:grid-cols-3">
                      <div><b className="text-ink">Offre :</b> {fdate(c.dateOffre) || "—"}</div>
                      <div><b className="text-ink">Compromis :</b> {fdate(c.dateCompromis) || "—"}</div>
                      <div><b className="text-ink">Acte prévu :</b> {fdate(c.dateActePrev) || "—"}</div>
                      {c.sruExpire && (
                        <div className={sru !== null && sru <= 3 ? "text-danger font-semibold" : ""}>
                          <b className="text-ink">SRU :</b> {fdate(c.sruExpire)}
                          {sru !== null && sru <= 3 && ` (${sru <= 0 ? "expiré" : sru + "j"})`}
                        </div>
                      )}
                      {c.condSuspExpire && (
                        <div className={cond !== null && cond <= 7 ? "text-amber-600 font-semibold" : ""}>
                          <b className="text-ink">Cond. susp. :</b> {fdate(c.condSuspExpire)}
                          {cond !== null && cond <= 7 && ` (${cond <= 0 ? "expirée" : cond + "j"})`}
                        </div>
                      )}
                      <div><b className="text-ink">Financement :</b> {c.financement || "—"}</div>
                    </div>
                    {c.notes && <p className="mb-3 rounded bg-bg px-3 py-2 text-[12.5px] italic text-ink-sub">"{c.notes}"</p>}
                    <div className="flex flex-wrap gap-2">
                      {c.commissionStatut !== "Encaissée" && c.statut === "Acte signé" && (
                        <button className="btn-primary !bg-emerald-600 text-[12px]" onClick={() => encaisser.mutate(c)}>
                          <Check size={13} /> Marquer encaissée
                        </button>
                      )}
                      <button className="btn-ghost text-[12px] text-primary" onClick={() => { setPrefillRedacteur({ docType: "compromis", sourceId: c.id }); setView("redacteur"); }}>
                        <FileText size={13} /> Générer le document
                      </button>
                      <button className="btn-ghost text-[12px]" onClick={() => setModal({ item: c })}>
                        <Edit2 size={13} /> Modifier
                      </button>
                      {data.revenus.some(r => r.sourceId === c.id) && (
                        <button className="btn-ghost text-[12px] text-primary" onClick={() => setView("revenus")}>
                          💰 Voir dans les revenus
                        </button>
                      )}
                      <button
                        className="btn-ghost text-[12px] text-danger hover:bg-danger-soft"
                        onClick={() => { if (confirm("Supprimer ce dossier ?")) delCompromis.mutate(c.id); }}
                      >
                        <Trash2 size={13} /> Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {modal && (
        <Modal title={modal.item ? "Modifier le dossier" : "Nouveau dossier"} wide onClose={() => setModal(null)}>
          <CompromisForm
            initial={modal.item}
            onClose={() => setModal(null)}
            onSave={c => { saveCompromis.mutate(c); setModal(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
