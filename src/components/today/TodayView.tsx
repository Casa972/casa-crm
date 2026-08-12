import { CheckCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { StatusPill } from "../shared/StatusPill";
import { EmptyState } from "../ui/Modal";
import { eur, daysDiff, fdate } from "../../lib/format";
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
  const setFocusClientId = useUiStore((s) => s.setFocusClientId);

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
  const retardCount = relances.length;
  const alertesCount = fin.alertesDelais.length;

  const goToClient = (id: string) => {
    setFocusClientId(id);
    setView("clients");
  };

  return (
    <div className="mx-auto max-w-[860px] px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold capitalize text-ink">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </h1>
        <p className="text-[13px] text-ink-muted">Ce qui nécessite votre attention aujourd'hui.</p>
      </div>

      {/* KPIs actionnables */}
      <div className={`mb-6 grid gap-3 ${isDir ? "grid-cols-4" : "grid-cols-3"}`}>
        <button
          onClick={() => setView("clients")}
          className="card border-l-4 border-l-primary bg-primary-soft p-4 text-left transition-shadow hover:shadow-card-hover"
        >
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-primary">Clients actifs</div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-primary">{clientsActifs}</div>
        </button>

        <button
          onClick={() => setView("biens")}
          className="card border-l-4 border-l-violet bg-violet-soft p-4 text-left transition-shadow hover:shadow-card-hover"
        >
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-violet">Biens disponibles</div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-violet">{biensDispo}</div>
        </button>

        <button
          onClick={() => setView("clients")}
          className={`card border-l-4 p-4 text-left transition-shadow hover:shadow-card-hover ${
            retardCount > 0 ? "border-l-danger bg-danger-soft" : "border-l-emerald bg-emerald-soft"
          }`}
        >
          <div className={`text-[10.5px] font-bold uppercase tracking-wide ${retardCount > 0 ? "text-danger" : "text-emerald"}`}>
            Relances en retard
          </div>
          <div className={`mt-1.5 font-heading text-2xl font-semibold tabular-nums ${retardCount > 0 ? "text-danger" : "text-emerald"}`}>
            {retardCount}
          </div>
          {retardCount === 0 && <div className="mt-1 text-[11px] text-emerald opacity-85">Tout est à jour ✓</div>}
        </button>

        {isDir && (
          <button
            onClick={() => setView("revenus")}
            className={`card border-l-4 p-4 text-left transition-shadow hover:shadow-card-hover ${
              alertesCount > 0 ? "border-l-amber bg-amber-soft" : "border-l-emerald bg-emerald-soft"
            }`}
          >
            <div className={`text-[10.5px] font-bold uppercase tracking-wide ${alertesCount > 0 ? "text-amber" : "text-emerald"}`}>
              Alertes délais
            </div>
            <div className={`mt-1.5 font-heading text-2xl font-semibold tabular-nums ${alertesCount > 0 ? "text-amber" : "text-emerald"}`}>
              {alertesCount}
            </div>
            {alertesCount > 0 && <div className="mt-1 text-[11px] text-amber opacity-85">compromis à surveiller</div>}
          </button>
        )}
      </div>

      {/* Alertes délais compromis */}
      {isDir && fin.alertesDelais.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-amber">
            <AlertTriangle size={14} /> Compromis — délais à surveiller
          </h2>
          <div className="flex flex-col gap-2">
            {fin.alertesDelais.slice(0, 3).map((c) => (
              <button
                key={c.id}
                onClick={() => setView("revenus")}
                className="card flex items-center gap-3.5 p-3 text-left transition-shadow hover:shadow-card-hover"
              >
                <div className="flex size-9 items-center justify-center rounded bg-amber-soft font-bold text-amber">
                  <TrendingUp size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold text-ink">{c.acheteur || "Compromis"}</div>
                  <div className="text-xs text-ink-muted">
                    Acte prévu : {fdate(c.dateActePrev)} · {eur(fin.commMontant(c))}
                  </div>
                </div>
                <StatusPill label="Acte prévu" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* À relancer */}
      {aTraiter.length > 0 ? (
        <>
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-ink-sub">
            <Clock size={14} /> À relancer
          </h2>
          <div className="flex flex-col gap-2">
            {aTraiter.map((c) => {
              const j = daysDiff(c.relanceDate);
              const urgent = j !== null && j <= 0;
              return (
                <button
                  key={c.id}
                  onClick={() => goToClient(c.id)}
                  className="card flex items-center gap-3.5 p-3 text-left transition-shadow hover:shadow-card-hover"
                >
                  <div className={`flex size-9 items-center justify-center rounded font-bold ${urgent ? "bg-danger-soft text-danger" : "bg-amber-soft text-amber"}`}>
                    {c.prenom?.[0] ?? "?"}
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
