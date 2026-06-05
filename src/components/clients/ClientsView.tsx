import { useMemo, useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { DataTable } from "../shared/DataTable";
import { StatusPill } from "../shared/StatusPill";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Field";
import { PageHeader } from "../shared/PageHeader";
import { ClientForm } from "../pilotage/forms";
import { eur, fdate } from "../../lib/format";
import { useAgencyData, useSaveClient, useDeleteClient } from "../../hooks/queries/useAgencyData";
import { useFiltersStore } from "../../store/filters.store";
import type { Client } from "../../types/domain";

const col = createColumnHelper<Client>();

export function ClientsView() {
  const { data } = useAgencyData();
  const save = useSaveClient();
  const del = useDeleteClient();
  const { search, setSearch } = useFiltersStore();
  const [modal, setModal] = useState<{ item?: Client } | null>(null);

  const columns = useMemo<ColumnDef<Client, any>[]>(() => [
    col.accessor((c) => `${c.prenom} ${c.nom}`, {
      id: "nom", header: "Client",
      cell: (i) => <span className="font-semibold text-ink">{i.getValue<string>()}</span>,
    }),
    col.accessor("type", { header: "Profil", cell: (i) => i.getValue<string>() }),
    col.accessor("statut", { header: "Étape", cell: (i) => <StatusPill label={i.getValue<string>()} /> }),
    col.accessor("budgetMax", { header: "Budget", cell: (i) => eur(i.getValue<number>()) }),
    col.accessor("relanceDate", { header: "Relance", cell: (i) => fdate(i.getValue<string>()) }),
    col.display({
      id: "actions", header: "",
      cell: (i) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button className="text-ink-muted hover:text-ink" onClick={() => setModal({ item: i.row.original })}><Edit2 size={13} /></button>
          <button className="text-ink-muted hover:text-danger" onClick={() => { if (confirm("Supprimer ?")) del.mutate(i.row.original.id); }}><Trash2 size={13} /></button>
        </div>
      ),
    }),
  ], [del]);

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-5">
      <PageHeader
        title="Clients"
        subtitle={`${data.clients.length} fiche(s) au portefeuille`}
        actions={<button className="btn-primary" onClick={() => setModal({})}><Plus size={14} /> Nouveau</button>}
      />
      <div className="mb-3 max-w-xs">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client..." />
      </div>
      <DataTable data={data.clients} columns={columns} globalFilter={search} emptyMessage="Aucun client" />

      {modal && (
        <Modal title={modal.item ? "Modifier le client" : "Nouveau client"} wide onClose={() => setModal(null)}>
          <ClientForm initial={modal.item} onClose={() => setModal(null)} onSave={(c) => { save.mutate(c); setModal(null); }} />
        </Modal>
      )}
    </div>
  );
}
