import { useMemo, useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Plus, Edit2, Trash2, AlertCircle, MapPin, FileText, Upload } from "lucide-react";
import { DataTable } from "../shared/DataTable";
import { StatusPill } from "../shared/StatusPill";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Field";
import { BienForm, MandatForm } from "./forms";
import { FicheCommercialeModal } from "./FicheCommercialeModal";
import { eur, fdate, daysDiff } from "../../lib/format";
import { useAgencyData, useSaveBien, useDeleteBien, useSaveMandat, useDeleteMandat } from "../../hooks/queries/useAgencyData";
import { useFiltersStore } from "../../store/filters.store";
import { ImportCSVModal } from "../import/ImportCSVModal";
import type { Bien, Mandat } from "../../types/domain";

type Tab = "biens" | "mandats";
type Modal_ = { kind: Tab; item?: Bien | Mandat } | null;

export function BiensView() {
  const { data } = useAgencyData();
  const saveBien = useSaveBien();
  const delBien = useDeleteBien();
  const saveMandat = useSaveMandat();
  const delMandat = useDeleteMandat();
  const { search, setSearch } = useFiltersStore();

  const [tab, setTab] = useState<Tab>("biens");
  const [modal, setModal] = useState<Modal_>(null);
  const [ficheBien, setFicheBien] = useState<Bien | null>(null);
  const [importOpen, setImportOpen] = useState(false);

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

  const bienCols = useBienColumns(
    (b) => setModal({ kind: "biens", item: b }),
    (id) => confirm("Supprimer ce bien ?") && delBien.mutate(id),
    (b) => setFicheBien(b),
  );
  const mandatCols = useMandatColumns(
    data.biens,
    (m) => setModal({ kind: "mandats", item: m }),
    (id) => confirm("Supprimer ce mandat ?") && delMandat.mutate(id),
  );

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
          <button className="btn-primary" onClick={() => setModal({ kind: tab })}>
            <Plus size={14} /> {tab === "biens" ? "Nouveau bien" : "Nouveau mandat"}
          </button>
        </div>
      </div>

      <div className="mb-4 max-w-sm">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." />
      </div>

      {tab === "biens" ? (
        <DataTable data={data.biens} columns={bienCols} globalFilter={search}
          emptyMessage="Aucun bien" />
      ) : (
        <DataTable data={data.mandats} columns={mandatCols} globalFilter={search}
          emptyMessage="Aucun mandat" />
      )}

      {modal?.kind === "biens" && (
        <Modal title={modal.item ? "Modifier le bien" : "Nouveau bien"} wide onClose={() => setModal(null)}>
          <BienForm initial={modal.item as Bien | undefined}
            onSave={(b) => { saveBien.mutate(b); setModal(null); }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.kind === "mandats" && (
        <Modal title={modal.item ? "Modifier le mandat" : "Nouveau mandat"} wide onClose={() => setModal(null)}>
          <MandatForm initial={modal.item as Mandat | undefined} biens={data.biens}
            onSave={(m) => { saveMandat.mutate(m); setModal(null); }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {ficheBien && (
        <FicheCommercialeModal bien={ficheBien} onClose={() => setFicheBien(null)} />
      )}
      {importOpen && (
        <ImportCSVModal type="biens" onClose={() => setImportOpen(false)} />
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
function useBienColumns(onEdit: (b: Bien) => void, onDelete: (id: string) => void, onFiche: (b: Bien) => void): ColumnDef<Bien, any>[] {
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
      cell: (c) => <RowActions onEdit={() => onEdit(c.row.original)} onDelete={() => onDelete(c.row.original.id)} onFiche={() => onFiche(c.row.original)} />,
    }),
  ] as ColumnDef<Bien, any>[], [onEdit, onDelete, onFiche]);
}

const mh = createColumnHelper<Mandat>();
function useMandatColumns(biens: Bien[], onEdit: (m: Mandat) => void, onDelete: (id: string) => void): ColumnDef<Mandat, any>[] {
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
      cell: (c) => <RowActions onEdit={() => onEdit(c.row.original)} onDelete={() => onDelete(c.row.original.id)} />,
    }),
  ] as ColumnDef<Mandat, any>[], [biens, onEdit, onDelete]);
}

function RowActions({ onEdit, onDelete, onFiche }: { onEdit: () => void; onDelete: () => void; onFiche?: () => void }) {
  return (
    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {onFiche && (
        <button onClick={onFiche} title="Générer fiche commerciale" className="flex size-8 items-center justify-center rounded text-ink-muted hover:bg-primary-soft hover:text-primary"><FileText size={13} /></button>
      )}
      <button onClick={onEdit} className="flex size-8 items-center justify-center rounded text-ink-muted hover:bg-line/60 hover:text-ink"><Edit2 size={13} /></button>
      <button onClick={onDelete} className="flex size-8 items-center justify-center rounded text-ink-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={13} /></button>
    </div>
  );
}
