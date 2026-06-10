import { KpiCard, StatusPill } from "../shared/StatusPill";
import { EmptyState } from "../ui/Modal";
import { CheckCircle } from "lucide-react";
import { daysDiff } from "../../lib/format";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { useUiStore } from "../../store/ui.store";

export function PilotageAgentView() {
  const { data } = useAgencyData();
  const user = useSessionStore((s) => s.user);
  const setView = useUiStore((s) => s.setView);
  if (!user) return null;

  const mesClients = data.clients.filter((c) => c.agentId === user.id);
  const actifs = mesClients.filter((c) => !["Acte", "Perdu"].includes(c.statut));
  const relances = mesClients.filter((c) => c.relanceDate && (daysDiff(c.relanceDate) ?? 99) <= 0 && !["Acte", "Perdu"].includes(c.statut));

  return (
    <div className="mx-auto max-w-[900px] px-6 py-6">
      <h1 className="mb-5 font-heading text-2xl font-semibold text-ink">Bonjour {user.name}</h1>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard label="👥 Clients actifs" value={String(actifs.length)} tone="primary" />
        <KpiCard label="🔔 À relancer" value={String(relances.length)} tone={relances.length ? "danger" : "neutral"} />
        <KpiCard label="📁 Portefeuille" value={String(mesClients.length)} tone="violet" />
      </div>

      {relances.length > 0 ? (
        <>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-sub">🔔 Clients à relancer</h2>
          <div className="flex flex-col gap-2">
            {relances.map((c) => (
              <button key={c.id} onClick={() => setView("clients")} className="card flex items-center gap-3.5 p-3 text-left hover:shadow-card-hover">
                <div className="flex size-9 items-center justify-center rounded bg-danger-soft font-bold text-danger">{c.prenom?.[0] ?? "?"}</div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold text-ink">{c.prenom} {c.nom}</div>
                  <div className="text-xs text-ink-muted">{c.tel || "—"} · {c.statut}</div>
                </div>
                <StatusPill label="À relancer" tone="danger" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <EmptyState Icon={CheckCircle} text="Rien d'urgent !" sub="Aucune relance imminente." />
      )}
    </div>
  );
}
