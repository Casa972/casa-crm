import { KpiCard, StatusPill } from "../shared/StatusPill";
import { EmptyState } from "../ui/Modal";
import { CheckCircle, Calendar, CheckCircle2, Circle } from "lucide-react";
import { daysDiff, fdate } from "../../lib/format";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { useUiStore } from "../../store/ui.store";
import { useRdv } from "../../hooks/queries/useRdv";
import { useTaches } from "../../hooks/queries/useTaches";
import { useActivites } from "../../hooks/queries/useActivites";

const ETAPES = ["Prospect", "Visite", "Offre", "Compromis", "Acte"] as const;

export function PilotageAgentView() {
  const { data } = useAgencyData();
  const user = useSessionStore((s) => s.user);
  const setView = useUiStore((s) => s.setView);
  const { data: rdvList } = useRdv();
  const { data: taches } = useTaches();
  const { data: activites } = useActivites(undefined);
  if (!user) return null;

  const mesClients = data.clients.filter((c) => c.agentId === user.id);
  const actifs = mesClients.filter((c) => !["Acte", "Perdu"].includes(c.statut));
  const relances = mesClients.filter((c) => c.relanceDate && (daysDiff(c.relanceDate) ?? 99) <= 0 && !["Acte", "Perdu"].includes(c.statut));
  const mesBiens = data.biens.filter((b) => b.statut === "Disponible");

  const today = new Date().toISOString().slice(0, 10);
  const rdvAujourdhui = rdvList.filter((r) => r.date === today).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
  const tachesActives = taches.filter((t) => !t.done).slice(0, 5);

  // Activités récentes de l'agent (toutes)
  const activitesRecentes = activites.filter((a) => a.agentId === user.id).slice(0, 5);

  // Pipeline mini : nb par étape
  const byEtape = ETAPES.map((e) => ({ etape: e, count: mesClients.filter((c) => c.statut === e).length }));
  const maxCount = Math.max(...byEtape.map((x) => x.count), 1);

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6">
      <h1 className="mb-5 font-heading text-2xl font-semibold text-ink">Bonjour {user.name} 👋</h1>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Clients actifs" value={String(actifs.length)} tone="primary" />
        <KpiCard label="À relancer" value={String(relances.length)} tone={relances.length ? "danger" : "neutral"} />
        <KpiCard label="Biens disponibles" value={String(mesBiens.length)} tone="emerald" />
        <KpiCard label="Tâches en cours" value={String(taches.filter((t) => !t.done).length)} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Mini pipeline */}
        <div className="card p-4">
          <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted">Mini pipeline</h2>
          <div className="flex flex-col gap-2">
            {byEtape.map(({ etape, count }) => (
              <div key={etape} className="flex items-center gap-2">
                <span className="w-[80px] shrink-0 text-[12px] text-ink-sub">{etape}</span>
                <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-5 text-right text-[12px] font-semibold text-ink">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RDV du jour */}
        <div className="card p-4">
          <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted">RDV aujourd'hui</h2>
          {rdvAujourdhui.length === 0 ? (
            <div className="flex items-center gap-2 text-[13px] text-ink-muted py-3">
              <Calendar size={14} /> Aucun rendez-vous aujourd'hui
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rdvAujourdhui.map((r) => (
                <div key={r.id} className="flex items-center gap-2.5">
                  <span className="text-[11px] font-semibold text-ink-muted w-[80px] shrink-0">{r.heureDebut}–{r.heureFin}</span>
                  <div>
                    <div className="text-[13px] font-semibold text-ink">{r.titre}</div>
                    <StatusPill label={r.typeRdv} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="mt-3 text-[12px] font-medium text-primary hover:underline" onClick={() => setView("agenda")}>
            Voir l'agenda →
          </button>
        </div>

        {/* Tâches top 5 */}
        <div className="card p-4">
          <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted">Tâches en cours</h2>
          {tachesActives.length === 0 ? (
            <div className="flex items-center gap-2 text-[13px] text-ink-muted py-3">
              <CheckCircle2 size={14} /> Aucune tâche active
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {tachesActives.map((t) => (
                <div key={t.id} className="flex items-start gap-2">
                  <Circle size={14} className="mt-0.5 shrink-0 text-ink-muted" />
                  <span className="text-[13px] text-ink">{t.texte}</span>
                </div>
              ))}
            </div>
          )}
          <button className="mt-3 text-[12px] font-medium text-primary hover:underline" onClick={() => setView("taches")}>
            Voir toutes les tâches →
          </button>
        </div>

        {/* Clients à relancer */}
        <div className="card p-4">
          <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted">Relances imminentes</h2>
          {relances.length === 0 ? (
            <EmptyState Icon={CheckCircle} text="Rien d'urgent !" sub="Aucune relance imminente." />
          ) : (
            <div className="flex flex-col gap-2">
              {relances.slice(0, 4).map((c) => (
                <button key={c.id} onClick={() => setView("clients")} className="flex items-center gap-2.5 text-left rounded hover:bg-bg p-1.5 transition-colors">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-danger-soft font-bold text-danger text-sm">{c.prenom?.[0] ?? "?"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-ink truncate">{c.prenom} {c.nom}</div>
                    <div className="text-[11px] text-ink-muted">{c.tel || "—"} · {c.statut}</div>
                  </div>
                  <StatusPill label="Relance" tone="danger" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activité récente */}
      {activitesRecentes.length > 0 && (
        <div className="mt-4 card p-4">
          <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted">Activité récente</h2>
          <div className="flex flex-col gap-2">
            {activitesRecentes.map((a) => (
              <div key={a.id} className="flex items-start gap-2.5">
                <span className="mt-0.5 text-[11px] font-bold text-ink-muted w-[80px] shrink-0">{fdate(a.date)}</span>
                <div>
                  <span className="text-[12px] font-bold text-primary">{a.typeActivite}</span>
                  <span className="mx-1.5 text-ink-muted">·</span>
                  <span className="text-[12.5px] text-ink">{a.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
