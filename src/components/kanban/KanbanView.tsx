import { useState } from "react";
import { PageHeader } from "../shared/PageHeader";
import { StatusPill } from "../shared/StatusPill";
import { Select } from "../ui/Field";
import { useAgencyData, useSaveClient } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { eur } from "../../lib/format";
import type { Client } from "../../types/domain";
import type { EtapePipeline } from "../../schemas/enums";

const ETAPES: EtapePipeline[] = ["Prospect", "Visite", "Offre", "Compromis", "Acte", "Perdu"];

const ETAPE_STYLES: Record<EtapePipeline, { header: string; badge: string; count: string }> = {
  Prospect:  { header: "bg-line/60",         badge: "text-ink-sub",    count: "bg-line text-ink-sub" },
  Visite:    { header: "bg-primary-soft",     badge: "text-primary",    count: "bg-primary text-white" },
  Offre:     { header: "bg-amber-soft",       badge: "text-amber",      count: "bg-amber text-white" },
  Compromis: { header: "bg-amber-soft",       badge: "text-amber",      count: "bg-amber text-white" },
  Acte:      { header: "bg-violet-soft",      badge: "text-violet",     count: "bg-violet text-white" },
  Perdu:     { header: "bg-danger-soft",      badge: "text-danger",     count: "bg-danger text-white" },
};

function ClientCard({ client, onMove }: { client: Client; onMove: (etape: EtapePipeline) => void }) {
  const [showMove, setShowMove] = useState(false);

  return (
    <div className="card p-3 mb-2 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="text-[13.5px] font-semibold text-ink">{client.prenom} {client.nom}</div>
          <div className="text-[11.5px] text-ink-muted">{client.tel || "—"}</div>
        </div>
        <StatusPill label={client.type} />
      </div>
      {client.budgetMax > 0 && (
        <div className="text-[12px] text-ink-sub mb-2">Budget : <span className="font-semibold text-ink">{eur(client.budgetMax)}</span></div>
      )}
      {client.commune && (
        <div className="text-[11.5px] text-ink-muted mb-2">{client.commune}</div>
      )}
      {showMove ? (
        <div className="flex flex-col gap-1.5">
          <Select
            value={client.statut}
            onChange={(v) => { onMove(v as EtapePipeline); setShowMove(false); }}
            options={ETAPES}
            placeholder="— Changer étape —"
          />
          <button className="btn-ghost text-xs py-1" onClick={() => setShowMove(false)}>Annuler</button>
        </div>
      ) : (
        <button
          className="text-[11px] font-medium text-primary hover:underline"
          onClick={() => setShowMove(true)}
        >
          Changer étape →
        </button>
      )}
    </div>
  );
}

export function KanbanView() {
  const { data } = useAgencyData();
  const save = useSaveClient();
  const user = useSessionStore((s) => s.user);
  const isDir = useSessionStore((s) => s.isDirecteur());

  const [agentFilter, setAgentFilter] = useState("");

  // Build agent list for directeur
  const agents: string[] = isDir
    ? Array.from(new Set(data.clients.map((c) => c.agentId).filter((id): id is string => !!id)))
    : [];

  const clients = data.clients.filter((c) => {
    if (agentFilter) return c.agentId === agentFilter;
    if (!isDir) return c.agentId === user?.id;
    return true;
  });

  const byEtape = (etape: EtapePipeline) => clients.filter((c) => c.statut === etape);

  const handleMove = (client: Client, etape: EtapePipeline) => {
    save.mutate({ ...client, statut: etape });
  };

  return (
    <div className="px-4 py-5">
      <PageHeader
        title="Pipeline clients"
        subtitle={`${clients.length} client(s) dans le pipeline`}
        actions={
          isDir && agents.length > 0 ? (
            <Select
              value={agentFilter}
              onChange={setAgentFilter}
              options={agents}
              placeholder="Tous les agents"
              className="w-[180px]"
            />
          ) : undefined
        }
      />

      <div className="flex gap-3 overflow-x-auto pb-4">
        {ETAPES.map((etape) => {
          const items = byEtape(etape);
          return (
            <div key={etape} className="flex-shrink-0 w-[220px]">
              <div className={`mb-2 flex items-center justify-between rounded-t px-3 py-2 ${ETAPE_STYLES[etape].header}`}>
                <span className={`text-[12px] font-bold uppercase tracking-wide ${ETAPE_STYLES[etape].badge}`}>
                  {etape}
                </span>
                <span className={`flex size-5 items-center justify-center rounded-full text-[11px] font-bold ${ETAPE_STYLES[etape].count}`}>
                  {items.length}
                </span>
              </div>
              <div className="min-h-[200px]">
                {items.length === 0 ? (
                  <div className="py-6 text-center text-[11.5px] text-ink-muted border-2 border-dashed border-line rounded-b">
                    Aucun client
                  </div>
                ) : (
                  items.map((c) => (
                    <ClientCard
                      key={c.id}
                      client={c}
                      onMove={(etape) => handleMove(c, etape)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
