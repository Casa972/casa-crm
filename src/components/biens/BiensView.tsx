import { useMemo, useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Plus, Edit2, Trash2, AlertCircle, MapPin, FileText, Upload, ScrollText, User, Sparkles } from "lucide-react";
import { NouveauDossierWizard } from "./NouveauDossierWizard";
import { DataTable } from "../shared/DataTable";
import { StatusPill } from "../shared/StatusPill";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Field";
import { BienForm, MandatForm } from "./forms";
import { FicheCommercialeModal } from "./FicheCommercialeModal";
import { eur, fdate, daysDiff } from "../../lib/format";
import { useAgencyData, useSaveBien, useDeleteBien, useSaveMandat, useDeleteMandat } from "../../hooks/queries/useAgencyData";
import { useFiltersStore } from "../../store/filters.store";
import { useUiStore } from "../../store/ui.store";
import { useSessionStore } from "../../store/session.store";
import { ImportCSVModal } from "../import/ImportCSVModal";
import type { Bien, Mandat } from "../../types/domain";

type Tab = "biens" | "mandats";
type Modal_ =
  | { kind: "biens"; item?: Bien }
  | { kind: "mandats"; item?: Mandat; prefillBienId?: string }
  | null;

export function BiensView() {
  const { data } = useAgencyData();
  const saveBien = useSaveBien();
  const delBien = useDeleteBien();
  const saveMandat = useSaveMandat();
  const delMandat = useDeleteMandat();
  const { search, setSearch } = useFiltersStore();
  const { setView, setPrefillRedacteur } = useUiStore();

  const [tab, setTab] = useState<Tab>("biens");
  const [modal, setModal] = useState<Modal_>(null);
  const [ficheBien, setFicheBien] = useState<Bien | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [monPortefeuille, setMonPortefeuille] = useState(false);
  const user = useSessionStore((s) => s.user);
  const isDir = useSessionStore((s) => s.isDirecteur());

  const mandatsExpSoon = data.mandats.filter((m) => {
    const d = daysDiff(m.dateFin);
    return d !== null && d >= 0 && d <= 30 && m.statut === "Actif";
  });

  const kpis = [
    { label: "Total biens", val: data.biens.length },
    { label: "En vente", val: data.biens.filter((b) => b.cat === "vente").length },
    { label: "En location", val: data.biens.filter((b) => b.cat === "location").length },
    { label: "Disponibles", val: data.biens.filter((b) => b.statut === "Disponible").length },
    { label: "Mandats actifs", val: data.mandats.filter((m) => m.statut === "Actif").length },
  ];

  const handleGenererMandat = (m: Mandat) => {
    setPrefillRedacteur({ docType: "mandat", sourceId: m.id });
    setView("redacteur");
  };

  const bienCols = useBienColumns(
    (b) => setModal({ kind: "biens", item: b }),
    (id) => confirm("Supprimer ce bien ?") && delBien.mutate(id),
    (b) => setFicheBien(b),
    (b) => setModal({ kind: "mandats", prefillBienId: b.ref }),
  );
  const mandatCols = useMandatColumns(
    data.biens,
    (m) => setModal({ kind: "mandats", item: m }),
    (id) => confirm("Supprimer ce mandat ?") && delMandat.mutate(id),
    handleGenererMandat,
  );

  // Mandat initial selon contexte (édition ou création depuis un bien)
  const mandatInitial = modal?.kind === "mandats"
    ? modal.item ?? (modal.prefillBienId ? { bienId: modal.prefillBienId } as Partial<Mandat> : undefined)
    : undefined;

  return (
    <div className="mx-auto max-w-6xl px-6 py-5">
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="card p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">{k.label}</div>
            <div className="mt-1 font-heading text-2xl font-semibold text-ink">{k.val}</div>
          </div>
        ))}
      </div>

      {mandatsExpSoon.length > 0 && (
        <div className="card mb-4 flex items-center gap-3 border-l-4 border-l-amber bg-amber-soft p-3">
          <AlertCircle size={16} className="shrink-0 text-amber" />
          <span className="text-[13px] font-medium text-amber">
            {mandatsExpSoon.length} mandat(s) expirent sous 30 jours — pensez au renouvellement.
          </span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex gap-1.5">
          <TabBtn active={tab === "biens"} onClick={() => setTab("biens")}>🏠 Biens ({data.biens.length})</TabBtn>
          <TabBtn active={tab === "mandats"} onClick={() => setTab("mandats")}>📋 Mandats ({data.mandats.length})</TabBtn>
        </div>
        <div className="flex gap-2">
          {tab === "biens" && (
            <button className="btn-ghost" onClick={() => setImportOpen(true)}><Upload size={14} /> Importer CSV</button>
          )}
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-primary bg-primary-soft px-3 py-1.5 text-[13px] font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
          >
            <Sparkles size={14} /> Nouveau dossier
          </button>
          <button className="btn-primary" onClick={() => setModal({ kind: tab })}>
            <Plus size={14} /> {tab === "biens" ? "Nouveau bien" : "Nouveau mandat"}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." />
        </div>
        {!isDir && (
          <button
            onClick={() => setMonPortefeuille((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${monPortefeuille ? "border-primary bg-primary-soft text-primary" : "border-line text-ink-sub hover:bg-bg"}`}
          >
            <User size={13} /> Mon portefeuille
          </button>
        )}
      </div>

      {tab === "biens" ? (
        <DataTable
          data={monPortefeuille && user
            ? data.biens.filter((b) => data.mandats.some((m) => (m.agentId === user.id || !m.agentId) && (m.bienId === b.id || m.bienId === b.ref)))
            : data.biens}
          columns={bienCols} globalFilter={search} emptyMessage="Aucun bien"
        />
      ) : (
        <DataTable
          data={monPortefeuille && user ? data.mandats.filter((m) => m.agentId === user.id || !m.agentId) : data.mandats}
          columns={mandatCols} globalFilter={search} emptyMessage="Aucun mandat"
        />
      )}

      {modal?.kind === "biens" && (
        <Modal title={modal.item ? "Modifier le bien" : "Nouveau bien"} wide onClose={() => setModal(null)}>
          <BienForm initial={modal.item}
            onSave={(b) => { saveBien.mutate(b); setModal(null); }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.kind === "mandats" && (
        <Modal
          title={modal.item ? "Modifier le mandat" : modal.prefillBienId ? `Nouveau mandat — ${modal.prefillBienId}` : "Nouveau mandat"}
          wide onClose={() => setModal(null)}
        >
          <MandatForm
            initial={mandatInitial}
            biens={data.biens}
            clients={data.clients}
            onSave={(m) => { saveMandat.mutate(m); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {ficheBien && (
        <FicheCommercialeModal bien={ficheBien} onClose={() => setFicheBien(null)} />
      )}
      {importOpen && (
        <ImportCSVModal type="biens" onClose={() => setImportOpen(false)} />
      )}
      {wizardOpen && (
        <Modal title="Nouveau dossier vendeur" wide onClose={() => setWizardOpen(false)}>
          <NouveauDossierWizard onClose={() => setWizardOpen(false)} />
        </Modal>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={active
        ? "rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-medium text-white"
        : "rounded-full px-3.5 py-1.5 text-[13px] font-medium text-ink-sub hover:bg-line/60"}>
      {children}
    </button>
  );
}

const bh = createColumnHelper<Bien>();
function useBienColumns(
  onEdit: (b: Bien) => void,
  onDelete: (id: string) => void,
  onFiche: (b: Bien) => void,
  onMandat: (b: Bien) => void,
): ColumnDef<Bien, any>[] {
  return useMemo(() => [
    bh.accessor("ref", { header: "Réf.", cell: (c) => <span className="font-semibold">{c.getValue()}</span> }),
    bh.accessor("type", { header: "Type" }),
    bh.accessor("commune", {
      header: "Localisation",
      cell: (c) => <span className="text-ink-sub"><MapPin size={11} className="mr-1 inline" />{c.getValue()}</span>,
    }),
    bh.accessor("cat", { header: "Catégorie", cell: (c) => <StatusPill label={c.getValue() === "vente" ? "Vente" : "Location"} tone={c.getValue() === "vente" ? "primary" : "emerald"} /> }),
    bh.accessor("statut", { header: "Statut", cell: (c) => <StatusPill label={c.getValue()} /> }),
    bh.accessor("prix", { header: "Prix", cell: (c) => <span className="font-semibold tabular-nums">{eur(c.getValue())}</span> }),
    bh.display({
      id: "actions", header: "",
      cell: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onFiche(c.row.original)} title="Fiche commerciale"
            className="flex size-8 items-center justify-center rounded text-ink-muted hover:bg-primary-soft hover:text-primary">
            <FileText size={13} />
          </button>
          <button onClick={() => onMandat(c.row.original)} title="Créer un mandat"
            className="flex size-8 items-center justify-center rounded text-ink-muted hover:bg-emerald-50 hover:text-emerald-600">
            <ScrollText size={13} />
          </button>
          <button onClick={() => onEdit(c.row.original)}
            className="flex size-8 items-center justify-center rounded text-ink-muted hover:bg-line/60 hover:text-ink">
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(c.row.original.id)}
            className="flex size-8 items-center justify-center rounded text-ink-muted hover:bg-danger-soft hover:text-danger">
            <Trash2 size={13} />
          </button>
        </div>
      ),
    }),
  ] as ColumnDef<Bien, any>[], [onEdit, onDelete, onFiche, onMandat]);
}

const mh = createColumnHelper<Mandat>();
function useMandatColumns(
  biens: Bien[],
  onEdit: (m: Mandat) => void,
  onDelete: (id: string) => void,
  onGenerer: (m: Mandat) => void,
): ColumnDef<Mandat, any>[] {
  return useMemo(() => [
    mh.accessor("ref", { header: "Réf.", cell: (c) => <span className="font-semibold">{c.getValue()}</span> }),
    mh.accessor("type", { header: "Type", cell: (c) => <StatusPill label={c.getValue()} tone="primary" /> }),
    mh.accessor("mandant", { header: "Mandant" }),
    mh.accessor("bienId", {
      header: "Bien", cell: (c) => {
        const b = biens.find((x) => x.ref === c.getValue() || x.id === c.getValue());
        return <span className="text-ink-sub">{b ? `${b.ref} · ${b.commune}` : "—"}</span>;
      },
    }),
    mh.accessor("honoraires", { header: "Honoraires", cell: (c) => <span className="font-semibold">{c.getValue()}%</span> }),
    mh.accessor("dateFin", {
      header: "Échéance", cell: (c) => {
        const d = daysDiff(c.getValue());
        if (d === null) return "—";
        if (d < 0) return <StatusPill label={`Expiré (${Math.abs(d)}j)`} tone="danger" />;
        if (d <= 30) return <StatusPill label={`${d}j restants`} tone="amber" />;
        return <span className="text-ink-sub">{fdate(c.getValue())}</span>;
      },
    }),
    mh.display({
      id: "actions", header: "",
      cell: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onGenerer(c.row.original)} title="Générer le document"
            className="flex items-center gap-1 rounded px-2 py-1 text-[11.5px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
            <FileText size={12} /> Générer
          </button>
          <button onClick={() => onEdit(c.row.original)}
            className="flex size-8 items-center justify-center rounded text-ink-muted hover:bg-line/60 hover:text-ink">
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(c.row.original.id)}
            className="flex size-8 items-center justify-center rounded text-ink-muted hover:bg-danger-soft hover:text-danger">
            <Trash2 size={13} />
          </button>
        </div>
      ),
    }),
  ] as ColumnDef<Mandat, any>[], [biens, onEdit, onDelete, onGenerer]);
}
