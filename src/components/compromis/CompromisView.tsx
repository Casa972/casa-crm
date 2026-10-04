import { useMemo, useState } from "react";
import { Plus, Edit2, Handshake } from "lucide-react";
import { FinanceNav } from "../shared/FinanceNav";
import { EmptyState, Modal } from "../ui/Modal";
import { CompromisForm } from "../pilotage/forms";
import { eur, fdate, daysDiff } from "../../lib/format";
import { useAgencyData, useSaveCompromis } from "../../hooks/queries/useAgencyData";
import { commissionAgence, commissionMontant, commissionPartenaire } from "../../schemas/compromis.schema";
import type { Compromis } from "../../types/domain";

const STATUT_BADGE: Record<string, string> = {
  "Offre acceptée": "bg-amber-soft text-amber",
  Compromis: "bg-primary-soft text-primary",
  "Acte prévu": "bg-violet-soft text-violet",
  "Acte signé": "bg-emerald-soft text-emerald",
  Annulé: "bg-danger-soft text-danger",
};

type Filtre = "en_cours" | "signes" | "interagence" | "tous";

export function CompromisView() {
  const { data } = useAgencyData();
  const save = useSaveCompromis();
  const [modal, setModal] = useState<{ item?: Compromis } | null>(null);
  const [filtre, setFiltre] = useState<Filtre>("en_cours");

  const rows = useMemo(() => {
    return [...data.compromis].sort((a, b) => (b.dateCompromis || b.dateOffre).localeCompare(a.dateCompromis || a.dateOffre));
  }, [data.compromis]);

  const visible = rows.filter((c) => {
    if (filtre === "en_cours") return c.statut !== "Annulé" && c.statut !== "Acte signé";
    if (filtre === "signes") return c.statut === "Acte signé";
    if (filtre === "interagence") return c.origine && c.origine !== "Maison";
    return true;
  });

  const enCours = rows.filter((c) => c.statut !== "Annulé" && c.statut !== "Acte signé");
  const caNet = enCours.reduce((s, c) => s + commissionAgence(c), 0);
  const retro = enCours.reduce((s, c) => s + commissionPartenaire(c), 0);
  const ia = enCours.filter((c) => c.origine && c.origine !== "Maison").length;

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-5">
      <FinanceNav active="compromis" />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-[18px] font-semibold text-ink">Compromis en cours</h1>
          <p className="text-[12px] text-ink-muted">
            Ventes et interagences. Le tableau financier et le pilotage retiennent la part Casa, pas la commission brute.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal({})}>
          <Plus size={14} /> Nouveau compromis
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Dossiers ouverts" value={String(enCours.length)} />
        <Kpi label="CA Casa prévisionnel" value={eur(caNet)} />
        <Kpi label="Rétrocessions confrères" value={eur(retro)} />
        <Kpi label="Dont interagences" value={String(ia)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {([
          ["en_cours", "En cours"],
          ["signes", "Actes signés"],
          ["interagence", "Interagences"],
          ["tous", "Tous"],
        ] as [Filtre, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFiltre(id)}
            className={`rounded-full px-3 py-1 text-[12px] ${filtre === id ? "bg-primary text-white" : "border border-line bg-surface text-ink-sub"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState Icon={Handshake} text="Aucun compromis" sub="Saisissez une offre acceptée ou un compromis, y compris en interagence." />
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((c) => {
            const net = commissionAgence(c);
            const brut = commissionMontant(c);
            const diff = c.dateActePrev ? daysDiff(c.dateActePrev) : null;
            return (
              <div key={c.id} className="card p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-heading text-[15px] font-semibold text-ink">{c.ref}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUT_BADGE[c.statut] ?? "bg-line text-ink-sub"}`}>{c.statut}</span>
                      {c.origine && c.origine !== "Maison" && (
                        <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-semibold text-amber">{c.origine}</span>
                      )}
                    </div>
                    <div className="text-[12.5px] text-ink-sub">
                      {c.acheteur}{c.vendeur ? ` · ${c.vendeur}` : ""}{c.bienDesc ? ` · ${c.bienDesc}` : ""}
                    </div>
                    <div className="mt-1 text-[12px] text-ink-muted">
                      {c.agencePartenaire ? `Confrère : ${c.agencePartenaire} · ` : ""}
                      Acte prévu {c.dateActePrev ? fdate(c.dateActePrev) : "—"}
                      {diff !== null ? ` · J${diff > 0 ? "+" : ""}${diff}` : ""}
                      {c.commissionStatut ? ` · ${c.commissionStatut}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-heading text-lg font-bold text-primary">{eur(net)}</div>
                    <div className="text-[11.5px] text-ink-muted">part Casa{brut !== net ? ` · brute ${eur(brut)}` : ""}</div>
                  </div>
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <button className="btn-ghost text-[12px]" onClick={() => setModal({ item: c })}>
                    <Edit2 size={13} /> Modifier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal.item ? "Modifier le compromis" : "Nouveau compromis"} wide onClose={() => setModal(null)}>
          <CompromisForm
            initial={modal.item}
            biens={data.biens}
            mandats={data.mandats}
            clients={data.clients}
            onClose={() => setModal(null)}
            onSave={(c) => { save.mutate(c); setModal(null); }}
          />
        </Modal>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-[10.5px] font-bold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 font-heading text-[20px] font-bold text-ink">{value}</div>
    </div>
  );
}
