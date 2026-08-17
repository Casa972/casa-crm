import { useMemo, useState, useEffect } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Plus, Edit2, Trash2, Clock, Upload, User, Download, Filter } from "lucide-react";
import { DataTable } from "../shared/DataTable";
import { StatusPill } from "../shared/StatusPill";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Field";
import { PageHeader } from "../shared/PageHeader";
import { ClientForm } from "../pilotage/forms";
import { ClientHistorique } from "./ClientHistorique";
import { ImportCSVModal } from "../import/ImportCSVModal";
import { eur, fdate, daysDiff } from "../../lib/format";
import { useAgencyData, useSaveClient, useDeleteClient } from "../../hooks/queries/useAgencyData";
import { useFiltersStore } from "../../store/filters.store";
import { useUiStore } from "../../store/ui.store";
import { useSessionStore } from "../../store/session.store";
import type { Client } from "../../types/domain";

const col = createColumnHelper<Client>();

export function ClientsView() {
  const { data } = useAgencyData();
  const save = useSaveClient();
  const del = useDeleteClient();
  const { search, setSearch } = useFiltersStore();
  const [modal, setModal] = useState<{ item?: Client } | null>(null);
  const [historiqueClient, setHistoriqueClient] = useState<Client | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [monPortefeuille, setMonPortefeuille] = useState(false);
  const [filtreEtape, setFiltreEtape] = useState<string>("");
  const user = useSessionStore((s) => s.user);
  const isDir = useSessionStore((s) => s.isDirecteur());

  // Auto-ouvre la fiche si on vient de TodayView via "À relancer"
  const focusClientId = useUiStore((s) => s.focusClientId);
  const setFocusClientId = useUiStore((s) => s.setFocusClientId);
  useEffect(() => {
    if (focusClientId && data.clients.length > 0) {
      const client = data.clients.find((c) => c.id === focusClientId);
      if (client) setModal({ item: client });
      setFocusClientId(null);
    }
  }, [focusClientId, data.clients, setFocusClientId]);

  const filteredClients = useMemo(() => {
    let list = data.clients;
    if (monPortefeuille && user) list = list.filter((c) => c.agentId === user.id || !c.agentId);
    if (filtreEtape) list = list.filter((c) => c.statut === filtreEtape);
    return list;
  }, [data.clients, monPortefeuille, user, filtreEtape]);

  const exportCSV = () => {
    const headers = ["Prénom", "Nom", "Type", "Étape", "Téléphone", "Email", "Budget", "Commune", "Relance", "Dernier contact", "Notes"];
    const rows = filteredClients.map((c) => [
      c.prenom, c.nom, c.type, c.statut, c.tel, c.email,
      c.budgetMax > 0 ? c.budgetMax : "", c.commune, c.relanceDate, c.dernierContact, c.notes,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const columns = useMemo<ColumnDef<Client, any>[]>(() => [
    col.accessor((c) => `${c.prenom} ${c.nom}`, {
      id: "nom", header: "Client",
      cell: (i) => <span className="font-semibold text-ink">{i.getValue<string>()}</span>,
    }),
    col.accessor("type", {
      header: "Profil",
      cell: (i) => {
        const type = i.getValue<string>();
        const isAcheteur = type === "Acheteur";
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isAcheteur ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
            {type}
          </span>
        );
      },
    }),
    col.accessor("tel", {
      header: "Téléphone",
      cell: (i) => {
        const tel = i.getValue<string>();
        if (tel) return <a href={`tel:${tel}`} className="text-primary font-medium hover:underline">{tel}</a>;
        return <span className="text-ink-muted text-sm">—</span>;
      },
    }),
    col.accessor("statut", {
      header: "Étape",
      cell: (i) => <StatusPill label={i.getValue<string>()} />,
    }),
    col.display({
      id: "info",
      header: "Info clé",
      cell: (i) => {
        const client = i.row.original;
        if (client.budgetMax > 0) {
          return <span className="text-sm text-ink">{eur(client.budgetMax)}</span>;
        }
        if (client.commune) return <span className="text-sm text-ink-sub">{client.commune}</span>;
        return <span className="text-ink-muted text-sm">—</span>;
      },
    }),
    col.accessor("relanceDate", {
      header: "Relance",
      cell: (i) => {
        const d = i.getValue<string>();
        const diff = d ? daysDiff(d) : null;
        if (!d) return <span className="text-ink-muted text-sm">—</span>;
        if (diff !== null && diff <= 0) return <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger">{fdate(d)}</span>;
        return <span className="text-sm text-ink-sub">{fdate(d)}</span>;
      },
    }),
    col.accessor("dernierContact", {
      header: "Dernier contact",
      cell: (i) => {
        const d = i.getValue<string>();
        if (!d) return <span className="text-ink-muted text-sm">—</span>;
        const jours = -(daysDiff(d) ?? 0);
        const label = jours === 0 ? "Aujourd'hui" : jours === 1 ? "Hier" : `il y a ${jours}j`;
        const stale = jours > 30;
        return <span className={`text-[12px] ${stale ? "text-danger font-medium" : "text-ink-sub"}`}>{label}</span>;
      },
    }),
    col.accessor("notes", {
      header: "Notes",
      cell: (i) => {
        const notes = i.getValue<string>();
        if (!notes) return null;
        const truncated = notes.length > 50 ? notes.slice(0, 50) + "…" : notes;
        return <span className="text-[12px] text-ink-sub italic">{truncated}</span>;
      },
    }),
    col.display({
      id: "actions", header: "",
      cell: (i) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="flex size-7 items-center justify-center rounded text-ink-muted hover:bg-primary-soft hover:text-primary" title="Historique" onClick={() => setHistoriqueClient(i.row.original)}><Clock size={13} /></button>
          <button className="flex size-7 items-center justify-center rounded text-ink-muted hover:bg-line/60 hover:text-ink" onClick={() => setModal({ item: i.row.original })}><Edit2 size={13} /></button>
          <button className="flex size-7 items-center justify-center rounded text-ink-muted hover:bg-danger-soft hover:text-danger" onClick={() => { if (confirm("Supprimer ?")) del.mutate(i.row.original.id); }}><Trash2 size={13} /></button>
        </div>
      ),
    }),
  ], [del, setHistoriqueClient]);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-5">
      <PageHeader
        title="Clients"
        subtitle={`${filteredClients.length} fiche(s)${monPortefeuille ? " dans mon portefeuille" : " au total"}`}
        actions={
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={exportCSV}><Download size={14} /> Exporter</button>
            <button className="btn-ghost" onClick={() => setImportOpen(true)}><Upload size={14} /> Importer CSV</button>
            <button className="btn-primary" onClick={() => setModal({})}><Plus size={14} /> Nouveau</button>
          </div>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="max-w-xs flex-1">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client..." />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-ink-muted" />
          <select
            value={filtreEtape}
            onChange={(e) => setFiltreEtape(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-[12px] text-ink-sub focus:outline-none"
          >
            <option value="">Toutes les étapes</option>
            {["Prospect", "Visite", "Offre", "Compromis", "Acte", "Perdu"].map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
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
      <DataTable data={filteredClients} columns={columns} globalFilter={search} emptyMessage="Aucun client" />
      {modal && (
        <Modal title={modal.item ? "Modifier le client" : "Nouveau client"} wide onClose={() => setModal(null)}>
          <ClientForm initial={modal.item} onClose={() => setModal(null)} onSave={(c) => { save.mutate(c); setModal(null); }} />
        </Modal>
      )}
      {historiqueClient && (
        <ClientHistorique client={historiqueClient} onClose={() => setHistoriqueClient(null)} />
      )}
      {importOpen && (
        <ImportCSVModal type="clients" onClose={() => setImportOpen(false)} />
      )}
    </div>
  );
}
