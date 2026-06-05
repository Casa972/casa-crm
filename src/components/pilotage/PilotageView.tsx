import { useState } from "react";
import { Plus, Edit2, Check } from "lucide-react";
import { StatusPill, KpiCard } from "../shared/StatusPill";
import { EmptyState, Modal } from "../ui/Modal";
import { PageHeader } from "../shared/PageHeader";
import { CompromisForm } from "./forms";
import { eur, fdate, daysDiff } from "../../lib/format";
import { useFinancials } from "../../hooks/useFinancials";
import {
  useAgencyData, useSaveCompromis, useEncaisserCommission,
} from "../../hooks/queries/useAgencyData";
import { commissionMontant } from "../../schemas/compromis.schema";
import type { Compromis } from "../../types/domain";

export function PilotageView() {
  const { data } = useAgencyData();
  const fin = useFinancials(data);
  const saveCompromis = useSaveCompromis();
  const encaisser = useEncaisserCommission();

  const [modal, setModal] = useState<{ item?: Compromis } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-5">
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="🤝 Commissions vente" value={eur(fin.totalCompromisAEncaisser)} tone="primary" />
        <KpiCard label="✅ Actes encaissés" value={eur(fin.totalActesEncaisses)} tone="emerald" />
        <KpiCard label="📊 Volume total" value={eur(fin.totalPotentiel)} tone="violet" />
        <KpiCard label="⚠️ Alertes délais" value={String(fin.alertesDelais.length)} tone={fin.alertesDelais.length ? "danger" : "neutral"} />
      </div>

      {fin.alertesDelais.length > 0 && (
        <div className="card mb-4 border-l-4 border-l-danger bg-danger-soft p-3.5">
          <div className="mb-2 text-xs font-bold text-danger">⚠️ Délais critiques — action requise</div>
          {fin.alertesDelais.map((c) => {
            const sru = daysDiff(c.sruExpire), cond = daysDiff(c.condSuspExpire);
            return (
              <div key={c.id} className="text-[12.5px] text-danger">
                <b>{c.ref}</b> — {c.acheteur}
                {sru !== null && sru <= 3 && <span className="ml-2">· SRU : {sru <= 0 ? "expiré" : `${sru}j`}</span>}
                {cond !== null && cond <= 7 && <span className="ml-2">· Cond. susp. : {cond <= 0 ? "expirée" : `${cond}j`}</span>}
              </div>
            );
          })}
        </div>
      )}

      <PageHeader
        title="Pilotage des ventes"
        subtitle="Suivi du portefeuille de compromis et des commissions."
        actions={<button className="btn-primary" onClick={() => setModal({})}><Plus size={14} /> Nouveau dossier</button>}
      />

      <div className="flex flex-col gap-2.5">
        {data.compromis.length === 0 ? (
          <EmptyState Icon={Plus} text="Aucun dossier en cours" sub="Ajoutez un compromis pour suivre vos ventes." />
        ) : (
          data.compromis.map((c) => {
            const montant = commissionMontant(c);
            const sru = daysDiff(c.sruExpire), cond = daysDiff(c.condSuspExpire);
            const alert = (sru !== null && sru <= 3) || (cond !== null && cond <= 7);
            const open = detail === c.id;
            return (
              <div key={c.id} className="card cursor-pointer p-3.5" style={{ borderLeftWidth: 3 }} onClick={() => setDetail(open ? null : c.id)}>
                <div className="flex items-start gap-3.5">
                  <div className="flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-ink">{c.ref}</span>
                      <StatusPill label={c.statut} />
                      {alert && <StatusPill label="Délai" tone="danger" />}
                      {c.commissionStatut === "Encaissée" && <StatusPill label="Encaissée" tone="emerald" />}
                    </div>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-1 text-[12.5px] text-ink-sub sm:grid-cols-2">
                      <div><b className="text-ink">Acheteur :</b> {c.acheteur}</div>
                      <div><b className="text-ink">Vendeur :</b> {c.vendeur || "—"}</div>
                      <div><b className="text-ink">Bien :</b> {c.bienRef} {c.bienDesc && `— ${c.bienDesc}`}</div>
                      <div><b className="text-ink">Notaire :</b> {c.notaire || "—"}</div>
                    </div>
                    {open && (
                      <div className="mt-3 border-t border-line pt-2.5">
                        <div className="mb-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-sub sm:grid-cols-3">
                          <div><b>Offre :</b> {fdate(c.dateOffre)}</div>
                          <div><b>Compromis :</b> {fdate(c.dateCompromis)}</div>
                          <div><b>Acte prévu :</b> {fdate(c.dateActePrev)}</div>
                          {c.sruExpire && <div className={sru !== null && sru <= 3 ? "text-danger" : ""}><b>SRU :</b> {fdate(c.sruExpire)}</div>}
                          {c.condSuspExpire && <div className={cond !== null && cond <= 7 ? "text-danger" : ""}><b>Cond. susp. :</b> {fdate(c.condSuspExpire)}</div>}
                          <div><b>Financement :</b> {c.financement || "—"}</div>
                        </div>
                        {c.notes && <div className="mb-2.5 text-[12.5px] italic text-ink-sub">"{c.notes}"</div>}
                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          {c.commissionStatut !== "Encaissée" && c.statut === "Acte signé" && (
                            <button className="btn-primary !bg-emerald" onClick={() => encaisser.mutate(c)}><Check size={13} /> Marquer encaissée</button>
                          )}
                          <button className="btn-ghost" onClick={() => setModal({ item: c })}><Edit2 size={13} /> Modifier</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-heading text-base font-bold text-ink">{eur(montant)}</div>
                    <div className="text-[11px] text-ink-muted">commission</div>
                    <div className="mt-0.5 text-[11px] text-ink-muted">{eur(c.prixVente)} · {c.honoraires}{c.typeHonoraires === "pct" ? "%" : "€"}</div>
                  </div>
                </div>
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
            onSave={(c) => { saveCompromis.mutate(c); setModal(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
