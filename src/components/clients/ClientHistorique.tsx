import { useState } from "react";
import { Plus, Clock, Phone, Mail, Eye, StickyNote, Calendar, Handshake, Bell, MoreHorizontal, Trash2 } from "lucide-react";
import { Modal, FormActions, EmptyState } from "../ui/Modal";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { useActivites, useSaveActivite, useDeleteActivite } from "../../hooks/queries/useActivites";
import { useSessionStore } from "../../store/session.store";
import type { Activite, Client } from "../../types/domain";
import { TypeActivite } from "../../schemas/activite.schema";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().slice(0, 10);

const TYPE_OPTIONS = TypeActivite.options;

const TYPE_ICON: Record<string, React.ReactNode> = {
  Appel: <Phone size={13} />,
  Email: <Mail size={13} />,
  Visite: <Eye size={13} />,
  Note: <StickyNote size={13} />,
  RDV: <Calendar size={13} />,
  Offre: <Handshake size={13} />,
  Relance: <Bell size={13} />,
  Autre: <MoreHorizontal size={13} />,
};

const TYPE_STYLES: Record<string, { dot: string; label: string }> = {
  Appel:   { dot: "bg-emerald-soft text-emerald", label: "text-emerald" },
  Email:   { dot: "bg-primary-soft text-primary", label: "text-primary" },
  Visite:  { dot: "bg-violet-soft text-violet",   label: "text-violet"  },
  Note:    { dot: "bg-line/60 text-ink-sub",       label: "text-ink-sub" },
  RDV:     { dot: "bg-amber-soft text-amber",      label: "text-amber"   },
  Offre:   { dot: "bg-emerald-soft text-emerald",  label: "text-emerald" },
  Relance: { dot: "bg-danger-soft text-danger",    label: "text-danger"  },
  Autre:   { dot: "bg-line/60 text-ink-sub",       label: "text-ink-sub" },
};
const FALLBACK_STYLE = { dot: "bg-line/60 text-ink-sub", label: "text-ink-sub" };

function emptyActivite(clientId: string): Activite {
  return {
    id: "", clientId, typeActivite: "Note", note: "", date: today(),
  };
}

function ActiviteFormModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const save = useSaveActivite(clientId);
  const user = useSessionStore((s) => s.user);
  const [form, setForm] = useState<Activite>(emptyActivite(clientId));

  const set = (k: keyof Activite, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.note.trim() || !form.date) return;
    save.mutate({ ...form, id: uid(), agentId: user?.id });
    onClose();
  };

  return (
    <>
      <Grid2>
        <Field label="Type">
          <Select value={form.typeActivite} onChange={(v) => set("typeActivite", v)} options={TYPE_OPTIONS} />
        </Field>
        <Field label="Date">
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
      </Grid2>
      <Field label="Note *">
        <Textarea rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Détails de l'activité..." />
      </Field>
      <FormActions onSave={handleSave} onClose={onClose} label="Ajouter" disabled={save.isPending} />
    </>
  );
}

export function ClientHistorique({ client, onClose }: { client: Client; onClose: () => void }) {
  const { data: activites, isLoading } = useActivites(client.id);
  const del = useDeleteActivite();
  const [addModal, setAddModal] = useState(false);

  return (
    <Modal title={`Historique — ${client.prenom} ${client.nom}`} wide onClose={onClose}>
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => setAddModal(true)}>
          <Plus size={14} /> Ajouter activité
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-ink-muted text-sm">Chargement…</div>
      ) : activites.length === 0 ? (
        <EmptyState Icon={Clock} text="Aucune activité" sub="Ajoutez un appel, email, visite ou note pour tracer l'historique." />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-line" />
          <div className="flex flex-col gap-3">
            {activites.map((a) => {
              const styles = TYPE_STYLES[a.typeActivite] ?? FALLBACK_STYLE;
              return (
                <div key={a.id} className="flex items-start gap-3 pl-10 relative">
                  {/* Dot */}
                  <div className={`absolute left-2 mt-1.5 flex size-5 items-center justify-center rounded-full border-2 border-surface ${styles.dot}`}>
                    {TYPE_ICON[a.typeActivite]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[11.5px] font-bold ${styles.label}`}>{a.typeActivite}</span>
                      <span className="text-[11px] text-ink-muted">
                        {new Date(a.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <div className="text-[13px] text-ink bg-bg rounded p-2 border border-line">
                      {a.note}
                    </div>
                  </div>
                  <button
                    className="mt-1 flex size-6 items-center justify-center rounded text-ink-muted hover:bg-danger-soft hover:text-danger"
                    onClick={() => { if (confirm("Supprimer ?")) del.mutate(a.id); }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {addModal && (
        <Modal title="Ajouter une activité" onClose={() => setAddModal(false)}>
          <ActiviteFormModal clientId={client.id} onClose={() => setAddModal(false)} />
        </Modal>
      )}
    </Modal>
  );
}
