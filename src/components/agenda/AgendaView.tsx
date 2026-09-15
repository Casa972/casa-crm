import { useState } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { Modal, FormActions, EmptyState } from "../ui/Modal";
import { Field, Grid2, Input, Select } from "../ui/Field";
import { PageHeader } from "../shared/PageHeader";
import { StatusPill } from "../shared/StatusPill";
import { useRdv, useSaveRdv, useDeleteRdv } from "../../hooks/queries/useRdv";
import type { Rdv } from "../../types/domain";
import { TypeRdv } from "../../schemas/rdv.schema";
import { agendaSubtitle } from "./agendaSubtitle";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().slice(0, 10);
const TYPE_RDV_OPTIONS = TypeRdv.options;
type Tone = "emerald" | "amber" | "danger" | "primary" | "violet" | "neutral";
const TYPE_STYLES: Record<string, { pill: Tone }> = {
  Visite: { pill: "primary" },
  Appel: { pill: "emerald" },
  "RDV Signature": { pill: "violet" },
  Estimation: { pill: "amber" },
  "Suivi Agent": { pill: "primary" },
  Autre: { pill: "neutral" },
};

function emptyRdv(): Rdv {
  return {
    id: "",
    titre: "",
    date: today(),
    heureDebut: "09:00",
    heureFin: "10:00",
    typeRdv: "Visite",
    statut: "Planifi\u00e9",
  };
}

export function AgendaView() {
  const { data: rdvList } = useRdv();
  const del = useDeleteRdv();
  const [modal, setModal] = useState<{ item?: Rdv } | null>(null);
  const now = new Date();
  const rdvInMonth = rdvList.filter((r) => {
    const [y, m] = r.date.split("-").map(Number);
    return y === now.getFullYear() && m === now.getMonth() + 1;
  });

  return (
    <div className="mx-auto max-w-[960px] px-4 py-5">
      <PageHeader
        title="Agenda"
        subtitle={agendaSubtitle(rdvInMonth.length, rdvList.length)}
        actions={
          <button className="btn-primary" onClick={() => setModal({})}>
            <Plus size={14} /> Nouveau RDV
          </button>
        }
      />
      <div className="flex flex-col gap-2">
        {rdvInMonth.length === 0 ? (
          <EmptyState Icon={CalendarDays} text="Aucun RDV ce mois" sub="Cliquez sur + pour creer un rendez-vous." />
        ) : (
          rdvInMonth
            .sort((a, b) => a.date.localeCompare(b.date) || a.heureDebut.localeCompare(b.heureDebut))
            .map((r) => (
              <div key={r.id} className="card flex items-start gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-ink">{r.titre}</span>
                    <StatusPill label={r.typeRdv} tone={(TYPE_STYLES[r.typeRdv] ?? { pill: "neutral" as Tone }).pill} />
                    {r.statut !== "Planifi\u00e9" && <StatusPill label={r.statut} />}
                  </div>
                  <div className="text-xs text-ink-muted">{r.date} {r.heureDebut}-{r.heureFin}</div>
                </div>
                <button className="btn-ghost text-[12px]" onClick={() => { if (confirm("Supprimer ce RDV ?")) del.mutate(r.id); }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))
        )}
      </div>
      {modal && (
        <Modal title={modal.item ? "Modifier le RDV" : "Nouveau rendez-vous"} onClose={() => setModal(null)}>
          <RdvMiniForm initial={modal.item} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function RdvMiniForm({ initial, onClose }: { initial?: Rdv; onClose: () => void }) {
  const save = useSaveRdv();
  const [form, setForm] = useState<Rdv>(initial ?? emptyRdv());
  return (
    <>
      <Field label="Titre">
        <Input value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} />
      </Field>
      <Grid2>
        <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></Field>
        <Field label="Debut"><Input type="time" value={form.heureDebut} onChange={(e) => setForm((f) => ({ ...f, heureDebut: e.target.value }))} /></Field>
        <Field label="Fin"><Input type="time" value={form.heureFin} onChange={(e) => setForm((f) => ({ ...f, heureFin: e.target.value }))} /></Field>
        <Field label="Type"><Select value={form.typeRdv} onChange={(v) => setForm((f) => ({ ...f, typeRdv: v as Rdv["typeRdv"] }))} options={TYPE_RDV_OPTIONS} /></Field>
      </Grid2>
      <FormActions
        onSave={() => {
          save.mutate({ ...form, id: form.id || uid(), statut: form.statut || "Planifi\u00e9" });
          onClose();
        }}
        onClose={onClose}
        label={initial ? "Modifier" : "Creer le RDV"}
      />
    </>
  );
}
