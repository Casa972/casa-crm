import { useMemo, useState } from "react";
import { ChevronRight, Edit2, Phone, User } from "lucide-react";
import { PageHeader } from "../shared/PageHeader";
import { Modal } from "../ui/Modal";
import { ClientForm } from "../pilotage/forms";
import { daysDiff, eur } from "../../lib/format";
import { useAgencyData, useSaveClient } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { useFiltersStore } from "../../store/filters.store";
import type { Client } from "../../types/domain";

const ETAPES = ["Prospect", "Visite", "Offre", "Compromis", "Acte", "Perdu"] as const;
type Etape = typeof ETAPES[number];

const ETAPE_STYLES: Record<Etape, { header: string; badge: string }> = {
  Prospect:  { header: "bg-slate-100 text-slate-700",   badge: "bg-slate-100 text-slate-700" },
  Visite:    { header: "bg-blue-100 text-blue-700",     badge: "bg-blue-100 text-blue-700" },
  Offre:     { header: "bg-amber-100 text-amber-700",   badge: "bg-amber-100 text-amber-700" },
  Compromis: { header: "bg-violet-100 text-violet-700", badge: "bg-violet-100 text-violet-700" },
  Acte:      { header: "bg-emerald-100 text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  Perdu:     { header: "bg-red-100 text-red-700",       badge: "bg-red-100 text-red-700" },
};

const TYPE_BADGE: Record<string, string> = {
  Acheteur: "bg-blue-50 text-blue-700",
  Vendeur:  "bg-emerald-50 text-emerald-700",
};

function prochaineEtape(etape: Etape): Etape | null {
  const idx = ETAPES.indexOf(etape);
  if (idx < 0 || idx >= ETAPES.length - 2) return null; // pas d'avancement depuis Acte ou Perdu
  return ETAPES[idx + 1] ?? null;
}

function ClientCard({ client, onEdit, onAdvance }: {
  client: Client;
  onEdit: (c: Client) => void;
  onAdvance: (c: Client, next: Etape) => void;
}) {
  const etape = client.statut as Etape;
  const next = prochaineEtape(etape);
  const needsRelance = client.relanceDate
    ? (daysDiff(client.relanceDate) ?? 99) <= 0
    : false;

  return (
    <div className="rounded-lg border border-line bg-surface p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Nom */}
      <div className="font-semibold text-ink text-[13px] mb-1">
        {client.prenom} {client.nom}
      </div>

      {/* Type badge */}
      <div className="flex flex-wrap gap-1 mb-2">
        {client.type && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_BADGE[client.type] ?? "bg-slate-100 text-slate-700"}`}>
            <User size={10} /> {client.type}
          </span>
        )}
        {needsRelance && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
            Relance
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="space-y-0.5 text-[12px] text-ink-sub mb-3">
        {client.tel && (
          <div>
            <a
              href={`tel:${client.tel}`}
              className="text-primary font-medium hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone size={11} /> {client.tel}
            </a>
          </div>
        )}
        {client.budgetMax > 0 && (
          <div className="text-ink">{eur(client.budgetMax)}</div>
        )}
        {client.commune && (
          <div>{client.commune}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 justify-end border-t border-line pt-2 mt-2">
        <button
          title="Modifier"
          onClick={() => onEdit(client)}
          className="flex size-7 items-center justify-center rounded text-ink-muted hover:bg-line/60 hover:text-ink transition-colors"
        >
          <Edit2 size={13} />
        </button>
        {next ? (
          <button
            title={`Passer à ${next}`}
            onClick={() => onAdvance(client, next)}
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-ink-muted hover:bg-primary-soft hover:text-primary transition-colors"
          >
            <ChevronRight size={13} /> {next}
          </button>
        ) : (etape === "Acte" || etape === "Perdu") && (
          <button
            title="Réouvrir comme prospect"
            onClick={() => onAdvance(client, "Prospect")}
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-ink-muted hover:bg-amber-soft hover:text-amber transition-colors"
          >
            ↩ Réouvrir
          </button>
        )}
      </div>
    </div>
  );
}

export function PipelineView() {
  const { data } = useAgencyData();
  const save = useSaveClient();
  const { search } = useFiltersStore();
  const [modal, setModal] = useState<{ item?: Client } | null>(null);
  const [monPortefeuille, setMonPortefeuille] = useState(false);
  const user = useSessionStore((s) => s.user);
  const isDir = useSessionStore((s) => s.isDirecteur());

  const filteredClients = useMemo(() => {
    let list = data.clients;
    if (monPortefeuille && user) {
      list = list.filter((c) => c.agentId === user.id || !c.agentId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          `${c.prenom} ${c.nom}`.toLowerCase().includes(q) ||
          c.commune?.toLowerCase().includes(q) ||
          c.tel?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data.clients, monPortefeuille, user, search]);

  const byEtape = useMemo(() => {
    const map: Record<Etape, Client[]> = {
      Prospect: [], Visite: [], Offre: [], Compromis: [], Acte: [], Perdu: [],
    };
    for (const c of filteredClients) {
      const etape = c.statut as Etape;
      if (etape in map) map[etape].push(c);
    }
    // Trier chaque colonne : relance urgente d'abord, pas de date à la fin
    const today = new Date().toISOString().slice(0, 10);
    for (const etape of Object.keys(map) as Etape[]) {
      map[etape].sort((a, b) => {
        const aLate = a.relanceDate && a.relanceDate <= today;
        const bLate = b.relanceDate && b.relanceDate <= today;
        if (aLate && !bLate) return -1;
        if (!aLate && bLate) return 1;
        if (a.relanceDate && b.relanceDate) return a.relanceDate.localeCompare(b.relanceDate);
        if (a.relanceDate) return -1;
        if (b.relanceDate) return 1;
        return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`);
      });
    }
    return map;
  }, [filteredClients]);

  function handleAdvance(client: Client, next: Etape) {
    save.mutate({ ...client, statut: next });
  }

  return (
    <div className="px-6 py-5 h-full flex flex-col">
      <PageHeader
        title="Pipeline clients"
        subtitle={`${filteredClients.length} client(s)${monPortefeuille ? " dans mon portefeuille" : " au total"}`}
        actions={
          !isDir ? (
            <button
              onClick={() => setMonPortefeuille((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${monPortefeuille ? "border-primary bg-primary-soft text-primary" : "border-line text-ink-sub hover:bg-bg"}`}
            >
              <User size={13} /> Mon portefeuille
            </button>
          ) : undefined
        }
      />

      {/* Grille kanban scrollable horizontalement */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {ETAPES.map((etape) => {
          const cards = byEtape[etape];
          const styles = ETAPE_STYLES[etape];
          return (
            <div
              key={etape}
              className="flex flex-col shrink-0 w-[220px] rounded-xl border border-line bg-bg"
            >
              {/* Header colonne */}
              <div className={`flex items-center justify-between rounded-t-xl px-3 py-2 ${styles.header}`}>
                <span className="text-[12px] font-bold uppercase tracking-wide">{etape}</span>
                <span className="flex size-5 items-center justify-center rounded-full bg-white/60 text-[11px] font-bold">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 overflow-y-auto p-2 flex-1">
                {cards.length === 0 && (
                  <div className="text-center text-[12px] text-ink-muted py-4">Aucun client</div>
                )}
                {cards.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onEdit={(c) => setModal({ item: c })}
                    onAdvance={handleAdvance}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal.item ? "Modifier le client" : "Nouveau client"} wide onClose={() => setModal(null)}>
          <ClientForm
            initial={modal.item}
            onClose={() => setModal(null)}
            onSave={(c) => { save.mutate(c); setModal(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
