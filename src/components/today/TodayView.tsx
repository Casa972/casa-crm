import { CheckCircle } from "lucide-react";
import { KpiCard, StatusPill } from "../shared/StatusPill";
import { EmptyState } from "../ui/Modal";
import { eur, daysDiff } from "../../lib/format";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useFinancials } from "../../hooks/useFinancials";
import { useSessionStore } from "../../store/session.store";
import { useUiStore } from "../../store/ui.store";

const RELANCE_SEUIL: Record<string, number> = { Prospect: 14, Visite: 7, Offre: 3, Compromis: 2, Acte: 1 };

export function TodayView() {
  const { data } = useAgencyData();
  const fin = useFinancials(data);
  const isDir = useSessionStore((s) => s.isDirecteur());
  const setView = useUiStore((s) => s.setView);

  const relances = data.clients.filter((c) => c.relanceDate && (daysDiff(c.relanceDate) ?? 99) <= 0);
  const negliges = data.clients.filter((c) => {
    if (["Acte", "Perdu"].includes(c.statut)) return false;
    const seuil = RELANCE_SEUIL[c.statut] ?? 14;
    const j = c.dernierContact ? -(daysDiff(c.dernierContact) ?? 99) : 99;
    return j > seuil && !relances.some((r) => r.id === c.id);
  });
  const aTraiter = [...relances, ...negliges].slice(0, 6);

  const biensDispo = data.biens.filter((b) => b.statut === "Disponible").length;
  const clientsActifs = data.clients.filter((c) => !["Acte", "Perdu"].includes(c.statut)).length;

  return (
    <div className="mx-auto max-w-[860px] px-6 py-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold capitalize text-ink">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </h1>
        <p className="text-[13px] text-ink-muted">Ce qui nécessite votre attention aujourd'hui.</p>
      </div>

      <div className={`mb-6 grid gap-3 ${isDir ? "grid-cols-3" : "grid-cols-2"}`}>
        <KpiCard label="Clients actifs" value={String(clientsActifs)} tone="primary" />
        <KpiCard label="Biens disponibles" value={String(biensDispo)} tone="violet" />
        {isDir && <KpiCard label="Encaissé" value={eur(fin.globalEncaisse)} tone="emerald" />}
      </div>

      {aTraiter.length > 0 ? (
        <>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-sub">⚠️ À relancer</h2>
          <div className="flex flex-col gap-2">
            {aTraiter.map((c) => {
              const j = daysDiff(c.relanceDate);
              const urgent = j !== null && j <= 0;
              return (
                <button
                  key={c.id}
                  onClick={() => setView("clients")}
                  className="card flex items-center gap-3.5 p-3 text-left transition-shadow hover:shadow-card-hover"
                >
                  <div className={`flex size-9 items-center justify-center rounded font-bold ${urgent ? "bg-danger-soft text-danger" : "bg-amber-soft text-amber"}`}>
                    {c.prenom[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-semibold text-ink">{c.prenom} {c.nom}</div>
                    <div className="text-xs text-ink-muted">{c.tel || "—"} · {c.statut}</div>
                  </div>
                  <StatusPill label={urgent ? "Urgent" : "À relancer"} tone={urgent ? "danger" : "amber"} />
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState Icon={CheckCircle} text="Tout est à jour !" sub="Aucune relance en attente." />
      )}
    </div>
  );
}
