import { useMemo, useState } from "react";
import { Plus, Handshake } from "lucide-react";
import { FinanceNav } from "../shared/FinanceNav";
import { Modal } from "../ui/Modal";
import { CompromisForm } from "../pilotage/forms";
import { eur, fdate, daysDiff } from "../../lib/format";
import { useAgencyData, useSaveCompromis, useDeleteCompromis } from "../../hooks/queries/useAgencyData";
import { commissionAgence, commissionMontant, commissionPartenaire } from "../../schemas/compromis.schema";
import type { Compromis } from "../../types/domain";

const BADGE: Record<string, string> = {
  "Offre acceptée": "bg-amber-soft text-amber",
  Compromis: "bg-primary-soft text-primary",
  "Acte prévu": "bg-violet-soft text-violet",
  "Acte signé": "bg-emerald-soft text-emerald",
  Annulé: "bg-danger-soft text-danger",
};

export function CompromisView() {
  const { data } = useAgencyData();
  const save = useSaveCompromis();
  const del = useDeleteCompromis();
  const [selected, setSelected] = useState<string | null>(null);
  const [modal, setModal] = useState<{ item?: Compromis } | null>(null);
  const [filtre, setFiltre] = useState<"ouverts" | "tous">("ouverts");

  const rows = useMemo(
    () => [...data.compromis].sort((a, b) => (a.dateActePrev || "9999").localeCompare(b.dateActePrev || "9999")),
    [data.compromis],
  );
  const visible = rows.filter((c) => filtre === "tous" || (c.statut !== "Annulé" && c.statut !== "Acte signé"));
  const current = rows.find((c) => c.id === selected) ?? visible[0] ?? null;

  const ouverts = rows.filter((c) => c.statut !== "Annulé" && c.statut !== "Acte signé");
  const ca = ouverts.reduce((s, c) => s + commissionAgence(c), 0);
  const retro = ouverts.reduce((s, c) => s + commissionPartenaire(c), 0);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-5">
      <FinanceNav active="compromis" />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[18px] font-semibold text-ink">Compromis</h1>
          <p className="text-[12px] text-ink-muted">
            {ouverts.length} dossier{ouverts.length > 1 ? "s" : ""} ouvert{ouverts.length > 1 ? "s" : ""} · part Casa {eur(ca)} · rétrocessions {eur(retro)}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal({})}><Plus size={14} /> Nouveau</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div>
          <div className="mb-2 flex gap-2">
            <button className={`rounded-full px-3 py-1 text-[12px] ${filtre === "ouverts" ? "bg-primary text-white" : "border border-line"}`} onClick={() => setFiltre("ouverts")}>Ouverts</button>
            <button className={`rounded-full px-3 py-1 text-[12px] ${filtre === "tous" ? "bg-primary text-white" : "border border-line"}`} onClick={() => setFiltre("tous")}>Tous</button>
          </div>
          <div className="flex max-h-[70vh] flex-col gap-2 overflow-auto">
            {visible.length === 0 && (
              <div className="card p-6 text-center text-[13px] text-ink-muted">
                <Handshake className="mx-auto mb-2 text-ink-muted" size={18} />
                Aucun compromis. Le CA ventes partira d'ici.
              </div>
            )}
            {visible.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`rounded border px-3 py-2 text-left ${current?.id === c.id ? "border-primary bg-primary-soft" : "border-line bg-surface"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-ink">{c.ref}</span>
                  <span className="text-[12px] font-semibold text-primary">{eur(commissionAgence(c))}</span>
                </div>
                <div className="truncate text-[12px] text-ink-sub">{c.acheteur} · {c.bienDesc || c.bienRef || "Bien"}</div>
                <div className="mt-1 text-[11px] text-ink-muted">{c.origine && c.origine !== "Maison" ? c.origine : "Maison"} · {c.statut}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          {!current ? (
            <p className="text-[13px] text-ink-muted">Sélectionnez un dossier ou créez-en un.</p>
          ) : (
            <Detail
              c={current}
              onEdit={() => setModal({ item: current })}
              onDelete={() => { if (confirm("Supprimer ce compromis ?")) del.mutate(current.id); }}
            />
          )}
        </div>
      </div>

      {modal && (
        <Modal title={modal.item ? "Modifier le compromis" : "Nouveau compromis"} wide onClose={() => setModal(null)}>
          <CompromisForm
            initial={modal.item}
            biens={data.biens}
            mandats={data.mandats}
            clients={data.clients}
            onClose={() => setModal(null)}
            onSave={(c) => { save.mutate(c); setModal(null); if (c.id) setSelected(c.id); }}
          />
        </Modal>
      )}
    </div>
  );
}

function Detail({ c, onEdit, onDelete }: { c: Compromis; onEdit: () => void; onDelete: () => void }) {
  const brut = commissionMontant(c);
  const net = commissionAgence(c);
  const retro = commissionPartenaire(c);
  const diff = c.dateActePrev ? daysDiff(c.dateActePrev) : null;
  const steps = [
    ["Offre", c.dateOffre],
    ["Compromis", c.dateCompromis],
    ["Fin SRU", c.sruExpire],
    ["Conditions", c.condSuspExpire],
    ["Acte prévu", c.dateActePrev],
    ["Acte réel", c.dateActeReel],
  ] as const;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl font-semibold text-ink">{c.ref}</h2>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE[c.statut] ?? ""}`}>{c.statut}</span>
          </div>
          <p className="text-[13px] text-ink-sub">{c.acheteur}{c.vendeur ? ` achète à ${c.vendeur}` : ""}</p>
          <p className="text-[12.5px] text-ink-muted">{c.bienDesc || c.bienRef || "Bien non rattaché"} · prix {eur(c.prixVente)}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-[12px]" onClick={onEdit}>Modifier</button>
          <button className="btn-ghost text-[12px] text-danger" onClick={onDelete}>Supprimer</button>
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <Money label="Commission brute" value={eur(brut)} />
        <Money label="Rétrocession confrère" value={eur(retro)} hint={c.agencePartenaire || (c.origine === "Maison" ? "Aucune" : "Confrère")} />
        <Money label="Part Casa" value={eur(net)} hint="C'est ce montant qui alimente le CA" strong />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3">
        {steps.map(([label, date]) => (
          <div key={label} className="rounded border border-line px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">{label}</div>
            <div className="text-[13px] text-ink">{date ? fdate(date) : "—"}</div>
          </div>
        ))}
      </div>
      {diff !== null && c.statut !== "Acte signé" && c.statut !== "Annulé" && (
        <p className={`mb-3 text-[12.5px] font-medium ${diff < 0 ? "text-danger" : "text-ink-sub"}`}>
          Acte prévu {diff < 0 ? `en retard de ${-diff} j` : `dans ${diff} j`}
        </p>
      )}
      <p className="text-[12.5px] text-ink-sub">
        {c.origine && c.origine !== "Maison"
          ? `${c.origine}${c.agencePartenaire ? ` avec ${c.agencePartenaire}` : ""}, Casa conserve ${c.pctAgence ?? 50} %.`
          : "Dossier maison, 100 % de la commission pour Casa."}
        {c.notaire ? ` Notaire : ${c.notaire}.` : ""} {c.notes}
      </p>
      <p className="mt-3 text-[12px] text-ink-muted">
        Le revenu « Commission vente » n'est créé qu'à l'acte signé, au montant de la part Casa. Tant que le dossier est ouvert, il reste dans le prévisionnel.
      </p>
    </>
  );
}

function Money({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className={`rounded border px-3 py-2 ${strong ? "border-primary bg-primary-soft" : "border-line"}`}>
      <div className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={`font-heading text-[18px] font-bold ${strong ? "text-primary" : "text-ink"}`}>{value}</div>
      {hint && <div className="text-[11px] text-ink-muted">{hint}</div>}
    </div>
  );
}
