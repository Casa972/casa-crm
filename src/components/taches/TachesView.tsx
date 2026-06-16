import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Flag } from "lucide-react";
import { Modal, FormActions, EmptyState } from "../ui/Modal";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { PageHeader } from "../shared/PageHeader";
import { StatusPill } from "../shared/StatusPill";
import { useTaches, useSaveTache, useDeleteTache } from "../../hooks/queries/useTaches";
import type { Tache } from "../../types/domain";
import { PrioритеTache } from "../../schemas/tache.schema";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const PRIORITE_OPTIONS = PrioритеTache.options;

const PRIO_TONE: Record<string, { tone: any; label: string }> = {
  Haute: { tone: "danger", label: "Haute" },
  Normale: { tone: "primary", label: "Normale" },
  Basse: { tone: "neutral", label: "Basse" },
};

const PRIO_ORDER: Record<string, number> = { Haute: 0, Normale: 1, Basse: 2 };

function emptyTache(): Tache {
  return { id: "", texte: "", done: false, priorite: "Normale" };
}

function TacheFormModal({ initial, onClose }: { initial?: Tache; onClose: () => void }) {
  const save = useSaveTache();
  const [form, setForm] = useState<Tache>(initial ?? emptyTache());

  const set = (k: keyof Tache, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.texte.trim()) return;
    save.mutate({ ...form, id: form.id || uid() });
    onClose();
  };

  return (
    <>
      <Field label="Tâche *">
        <Textarea rows={2} value={form.texte} onChange={(e) => set("texte", e.target.value)} placeholder="Décrire l'action à réaliser..." />
      </Field>
      <Grid2>
        <Field label="Priorité">
          <Select value={form.priorite} onChange={(v) => set("priorite", v)} options={PRIORITE_OPTIONS} />
        </Field>
        <Field label="Date d'échéance">
          <Input type="date" value={form.dateEcheance ?? ""} onChange={(e) => set("dateEcheance", e.target.value || undefined)} />
        </Field>
      </Grid2>
      <FormActions onSave={handleSave} onClose={onClose} label={initial ? "Modifier" : "Créer la tâche"} disabled={save.isPending} />
    </>
  );
}

type Filter = "actives" | "terminees" | "toutes";

export function TachesView() {
  const { data: taches, isLoading } = useTaches();
  const save = useSaveTache();
  const del = useDeleteTache();

  const [modal, setModal] = useState<{ item?: Tache } | null>(null);
  const [filter, setFilter] = useState<Filter>("actives");
  const [quickTxt, setQuickTxt] = useState("");

  const filtered = taches
    .filter((t) => {
      if (filter === "actives") return !t.done;
      if (filter === "terminees") return t.done;
      return true;
    })
    .sort((a, b) => (PRIO_ORDER[a.priorite] ?? 1) - (PRIO_ORDER[b.priorite] ?? 1));

  const toggle = (t: Tache) => save.mutate({ ...t, done: !t.done });

  const quickAdd = () => {
    if (!quickTxt.trim()) return;
    save.mutate({ id: uid(), texte: quickTxt.trim(), done: false, priorite: "Normale" });
    setQuickTxt("");
  };

  const counts = {
    actives: taches.filter((t) => !t.done).length,
    terminees: taches.filter((t) => t.done).length,
  };

  return (
    <div className="mx-auto max-w-[720px] px-4 py-5">
      <PageHeader
        title="Mes tâches"
        subtitle={`${counts.actives} active(s) · ${counts.terminees} terminée(s)`}
        actions={
          <button className="btn-primary" onClick={() => setModal({})}>
            <Plus size={14} /> Nouvelle tâche
          </button>
        }
      />

      {/* Quick add */}
      <div className="mb-4 flex gap-2">
        <Input
          value={quickTxt}
          onChange={(e) => setQuickTxt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && quickAdd()}
          placeholder="Ajouter rapidement (Entrée)..."
        />
        <button className="btn-primary shrink-0" onClick={quickAdd}><Plus size={14} /></button>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex gap-1.5">
        {(["actives", "terminees", "toutes"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f
              ? "rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-medium text-white"
              : "rounded-full px-3.5 py-1.5 text-[13px] font-medium text-ink-sub hover:bg-line/60"}
          >
            {f === "actives" ? `Actives (${counts.actives})` : f === "terminees" ? `Terminées (${counts.terminees})` : "Toutes"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-ink-muted text-sm">Chargement…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          Icon={CheckCircle2}
          text={filter === "actives" ? "Aucune tâche active" : "Aucune tâche terminée"}
          sub="Ajoutez votre première tâche via le bouton + ou la saisie rapide."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((t) => (
            <div key={t.id} className={`card flex items-start gap-3 p-3 transition-opacity ${t.done ? "opacity-60" : ""}`}>
              <button
                className="mt-0.5 shrink-0 text-ink-muted hover:text-primary"
                onClick={() => toggle(t)}
              >
                {t.done ? <CheckCircle2 size={18} className="text-emerald" /> : <Circle size={18} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-[13.5px] font-medium ${t.done ? "line-through text-ink-muted" : "text-ink"}`}>
                  {t.texte}
                </div>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <StatusPill label={t.priorite} tone={PRIO_TONE[t.priorite]?.tone} />
                  {t.dateEcheance && (
                    <span className="text-[11.5px] text-ink-muted">
                      Échéance : {new Date(t.dateEcheance + "T12:00").toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  className="flex size-7 items-center justify-center rounded text-ink-muted hover:bg-line/60 hover:text-ink"
                  onClick={() => setModal({ item: t })}
                >
                  <Flag size={12} />
                </button>
                <button
                  className="flex size-7 items-center justify-center rounded text-ink-muted hover:bg-danger-soft hover:text-danger"
                  onClick={() => { if (confirm("Supprimer ?")) del.mutate(t.id); }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.item ? "Modifier la tâche" : "Nouvelle tâche"}
          onClose={() => setModal(null)}
        >
          <TacheFormModal initial={modal.item} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
