import { useState } from "react";
import {
  Plus, Trash2, Edit2, ChevronLeft, ChevronRight, List, CalendarDays,
} from "lucide-react";
import { Modal, FormActions, EmptyState } from "../ui/Modal";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { PageHeader } from "../shared/PageHeader";
import { StatusPill } from "../shared/StatusPill";
import { useRdv, useSaveRdv, useDeleteRdv } from "../../hooks/queries/useRdv";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import type { Rdv } from "../../types/domain";
import { TypeRdv, StatutRdv } from "../../schemas/rdv.schema";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().slice(0, 10);

const TYPE_RDV_OPTIONS = TypeRdv.options;
const STATUT_RDV_OPTIONS = StatutRdv.options;

const MONTH_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAY_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const TYPE_TONE: Record<string, string> = {
  Visite: "primary", Appel: "emerald", "RDV Signature": "violet",
  Estimation: "amber", "Suivi Agent": "sky", Autre: "neutral",
};

function emptyRdv(): Rdv {
  return {
    id: "", titre: "", date: today(), heureDebut: "09:00", heureFin: "10:00",
    typeRdv: "Visite", statut: "Planifié",
  };
}

const RAPPEL_OPTIONS = [
  { value: "", label: "— Aucun rappel —" },
  { value: "10", label: "10 min avant" },
  { value: "30", label: "30 min avant" },
  { value: "60", label: "1h avant" },
  { value: "1440", label: "La veille" },
];

const RECURRENCE_OPTIONS = [
  { value: "0", label: "— Pas de récurrence —" },
  { value: "4", label: "4 semaines" },
  { value: "8", label: "8 semaines" },
  { value: "12", label: "12 semaines" },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function scheduleNotification(rdv: Rdv) {
  if (!rdv.rappelMinutes || Notification.permission !== "granted") return;
  const rdvDate = new Date(`${rdv.date}T${rdv.heureDebut}`);
  const fireAt = rdvDate.getTime() - rdv.rappelMinutes * 60 * 1000;
  const delay = fireAt - Date.now();
  if (delay <= 0) return;
  setTimeout(() => {
    new Notification(`Rappel RDV — ${rdv.titre}`, {
      body: `Aujourd'hui à ${rdv.heureDebut}${rdv.participantNom ? ` avec ${rdv.participantNom}` : ""}`,
      icon: "/favicon.ico",
    });
  }, delay);
}

function RdvFormModal({ initial, onClose }: { initial?: Rdv; onClose: () => void }) {
  const save = useSaveRdv();
  const { data } = useAgencyData();
  const [form, setForm] = useState<Rdv>(initial ?? emptyRdv());
  const [recurrenceWeeks, setRecurrenceWeeks] = useState("0");

  const set = (k: keyof Rdv, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.titre.trim() || !form.date) return;

    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }

    const weeks = parseInt(recurrenceWeeks, 10);
    if (weeks > 0 && !initial) {
      for (let i = 0; i < weeks; i++) {
        const occurrence: Rdv = { ...form, id: uid(), date: addDays(form.date, i * 7) };
        save.mutate(occurrence);
        scheduleNotification(occurrence);
      }
    } else {
      const rdv = { ...form, id: form.id || uid() };
      save.mutate(rdv);
      scheduleNotification(rdv);
    }
    onClose();
  };

  return (
    <>
      <Grid2>
        <Field label="Titre *">
          <Input value={form.titre} onChange={(e) => set("titre", e.target.value)} placeholder="Ex: Suivi formation — Module 1" />
        </Field>
        <Field label="Type">
          <Select value={form.typeRdv} onChange={(v) => set("typeRdv", v)} options={TYPE_RDV_OPTIONS} />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Avec (commercial / agent)">
          <Input
            value={form.participantNom ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, participantNom: e.target.value || undefined }))}
            placeholder="Nom du commercial présent"
          />
        </Field>
        <Field label="Statut">
          <Select value={form.statut} onChange={(v) => set("statut", v)} options={STATUT_RDV_OPTIONS} />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Date *">
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        {!initial && (
          <Field label="Récurrence hebdomadaire">
            <Select value={recurrenceWeeks} onChange={setRecurrenceWeeks} options={RECURRENCE_OPTIONS} />
          </Field>
        )}
      </Grid2>
      <Grid2>
        <Field label="Heure début">
          <Input type="time" value={form.heureDebut} onChange={(e) => set("heureDebut", e.target.value)} />
        </Field>
        <Field label="Heure fin">
          <Input type="time" value={form.heureFin} onChange={(e) => set("heureFin", e.target.value)} />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Rappel navigateur">
          <Select
            value={form.rappelMinutes?.toString() ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, rappelMinutes: v ? parseInt(v, 10) : undefined }))}
            options={RAPPEL_OPTIONS}
          />
        </Field>
        <Field label="Client lié">
          <Select
            value={form.clientId ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, clientId: v || undefined }))}
            options={data.clients.map((c) => ({ value: c.id, label: `${c.prenom} ${c.nom}` }))}
            placeholder="— Aucun —"
          />
        </Field>
      </Grid2>
      <Field label="Notes">
        <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || undefined }))} placeholder="Détails du rendez-vous, points à aborder..." />
      </Field>
      <FormActions onSave={handleSave} onClose={onClose} label={initial ? "Modifier" : recurrenceWeeks !== "0" ? `Créer ${recurrenceWeeks} RDV` : "Créer le RDV"} disabled={save.isPending} />
    </>
  );
}

function RdvCard({ rdv, onEdit, onDelete }: { rdv: Rdv; onEdit: () => void; onDelete: () => void }) {
  const tone = (TYPE_TONE[rdv.typeRdv] ?? "neutral") as any;
  return (
    <div className="card flex items-start gap-3 p-3">
      <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded text-[11px] font-bold bg-${tone}-soft text-${tone}`}>
        {rdv.heureDebut}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-semibold text-ink truncate">{rdv.titre}</span>
          <StatusPill label={rdv.typeRdv} tone={tone} />
          {rdv.statut !== "Planifié" && <StatusPill label={rdv.statut} />}
        </div>
        <div className="text-xs text-ink-muted mt-0.5">
          {rdv.heureDebut} → {rdv.heureFin}
          {rdv.participantNom && ` · avec ${rdv.participantNom}`}
          {rdv.bienRef && ` · Bien ${rdv.bienRef}`}
        </div>
        {rdv.notes && <div className="text-[12px] text-ink-sub mt-1 line-clamp-1">{rdv.notes}</div>}
      </div>
      <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button className="flex size-7 items-center justify-center rounded text-ink-muted hover:bg-line/60 hover:text-ink" onClick={onEdit}><Edit2 size={12} /></button>
        <button className="flex size-7 items-center justify-center rounded text-ink-muted hover:bg-danger-soft hover:text-danger" onClick={onDelete}><Trash2 size={12} /></button>
      </div>
    </div>
  );
}

export function AgendaView() {
  const { data: rdvList } = useRdv();
  const del = useDeleteRdv();

  const [modal, setModal] = useState<{ item?: Rdv } | null>(null);
  const [view, setView] = useState<"month" | "list">("month");
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const todayStr = today();

  const rdvInMonth = rdvList.filter((r) => {
    const [y, m] = r.date.split("-").map(Number);
    return y === current.year && m === current.month + 1;
  });

  const rdvToday = rdvList.filter((r) => r.date === todayStr).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

  const prevMonth = () => setCurrent((c) => {
    if (c.month === 0) return { year: c.year - 1, month: 11 };
    return { ...c, month: c.month - 1 };
  });
  const nextMonth = () => setCurrent((c) => {
    if (c.month === 11) return { year: c.year + 1, month: 0 };
    return { ...c, month: c.month + 1 };
  });

  // Build calendar grid
  const firstDay = new Date(current.year, current.month, 1);
  const lastDay = new Date(current.year, current.month + 1, 0);
  // Monday-first: 0=Mon...6=Sun
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last week
  while (cells.length % 7 !== 0) cells.push(null);

  const rdvByDay = (day: number): Rdv[] => {
    const dateStr = `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return rdvList.filter((r) => r.date === dateStr).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const dateStr = `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === todayStr;
  };

  return (
    <div className="mx-auto max-w-[960px] px-4 py-5">
      <PageHeader
        title="Agenda"
        subtitle={`${rdvList.length} rendez-vous`}
        actions={
          <div className="flex items-center gap-2">
            <button
              className={view === "month" ? "btn-primary" : "btn-ghost"}
              onClick={() => setView("month")}
              title="Vue mois"
            >
              <CalendarDays size={14} />
            </button>
            <button
              className={view === "list" ? "btn-primary" : "btn-ghost"}
              onClick={() => setView("list")}
              title="Vue liste"
            >
              <List size={14} />
            </button>
            <button className="btn-primary" onClick={() => setModal({})}>
              <Plus size={14} /> Nouveau RDV
            </button>
          </div>
        }
      />

      {/* Aujourd'hui */}
      {rdvToday.length > 0 && (
        <div className="mb-4 card border-l-4 border-l-primary p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-primary mb-2">Aujourd'hui</div>
          <div className="flex flex-col gap-1.5">
            {rdvToday.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-[13px]">
                <span className="text-ink-muted w-[90px] shrink-0">{r.heureDebut}–{r.heureFin}</span>
                <span className="font-semibold text-ink">{r.titre}</span>
                <StatusPill label={r.typeRdv} tone={(TYPE_TONE[r.typeRdv] ?? "neutral") as any} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation mois */}
      <div className="mb-4 flex items-center justify-between">
        <button className="btn-ghost" onClick={prevMonth}><ChevronLeft size={16} /></button>
        <span className="font-heading text-lg font-semibold text-ink">
          {MONTH_FR[current.month]} {current.year}
        </span>
        <button className="btn-ghost" onClick={nextMonth}><ChevronRight size={16} /></button>
      </div>

      {view === "month" ? (
        <div className="card overflow-hidden">
          {/* Header jours */}
          <div className="grid grid-cols-7 border-b border-line">
            {DAY_FR.map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                {d}
              </div>
            ))}
          </div>
          {/* Grid jours */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dayRdv = day ? rdvByDay(day) : [];
              const today_ = isToday(day);
              return (
                <div
                  key={i}
                  className={`min-h-[80px] border-b border-r border-line p-1.5 ${!day ? "bg-bg/50" : ""} ${today_ ? "bg-primary-soft/30" : ""}`}
                >
                  {day && (
                    <>
                      <div className={`flex size-6 items-center justify-center rounded-full text-[12px] font-semibold mb-1 ${today_ ? "bg-primary text-white" : "text-ink-sub"}`}>
                        {day}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {dayRdv.slice(0, 3).map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setModal({ item: r })}
                            className={`w-full truncate rounded px-1 py-0.5 text-left text-[10.5px] font-medium bg-${(TYPE_TONE[r.typeRdv] ?? "neutral") === "neutral" ? "line/60 text-ink-sub" : `${TYPE_TONE[r.typeRdv]}-soft text-${TYPE_TONE[r.typeRdv]}`}`}
                          >
                            {r.heureDebut} {r.titre}
                          </button>
                        ))}
                        {dayRdv.length > 3 && (
                          <span className="text-[10px] text-ink-muted px-1">+{dayRdv.length - 3} autre(s)</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Vue liste */
        <div className="flex flex-col gap-2">
          {rdvInMonth.length === 0 ? (
            <EmptyState Icon={CalendarDays} text="Aucun RDV ce mois" sub="Cliquez sur + pour créer un rendez-vous." />
          ) : (
            rdvInMonth
              .sort((a, b) => a.date.localeCompare(b.date) || a.heureDebut.localeCompare(b.heureDebut))
              .map((r) => (
                <RdvCard
                  key={r.id}
                  rdv={r}
                  onEdit={() => setModal({ item: r })}
                  onDelete={() => { if (confirm("Supprimer ce RDV ?")) del.mutate(r.id); }}
                />
              ))
          )}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.item ? "Modifier le RDV" : "Nouveau rendez-vous"}
          wide
          onClose={() => setModal(null)}
        >
          <RdvFormModal initial={modal.item} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
