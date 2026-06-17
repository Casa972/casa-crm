import { useState } from "react";
import { KpiCard, StatusPill } from "../shared/StatusPill";
import { EmptyState } from "../ui/Modal";
import { CheckCircle, Calendar, CheckCircle2, Circle, Target, Phone, Users, Home, FileText, Handshake, Key, TrendingUp } from "lucide-react";
import { daysDiff, fdate } from "../../lib/format";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { useUiStore } from "../../store/ui.store";
import { useRdv } from "../../hooks/queries/useRdv";
import { useTaches } from "../../hooks/queries/useTaches";
import { useActivites } from "../../hooks/queries/useActivites";

const ETAPES = ["Prospect", "Visite", "Offre", "Compromis", "Acte"] as const;

// ─── Objectifs débutant ───────────────────────────────────────────────────────
const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

interface Objectif {
  icon: React.ReactNode;
  label: string;
  detail: string;
  valeur: number;
  cible: number;
  couleur: string;
}

function BarreObjectif({ obj }: { obj: Objectif }) {
  const pct = Math.min(100, obj.cible > 0 ? Math.round((obj.valeur / obj.cible) * 100) : 0);
  const atteint = pct >= 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex size-7 items-center justify-center rounded-full ${atteint ? "bg-emerald-100 text-emerald-600" : "bg-bg text-ink-muted"}`}>
            {obj.icon}
          </span>
          <div>
            <div className="text-[13px] font-semibold text-ink">{obj.label}</div>
            <div className="text-[11px] text-ink-muted">{obj.detail}</div>
          </div>
        </div>
        <div className="text-right shrink-0 ml-4">
          <span className={`text-[14px] font-bold ${atteint ? "text-emerald-600" : "text-ink"}`}>{obj.valeur}</span>
          <span className="text-[12px] text-ink-muted"> / {obj.cible}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ${atteint ? "bg-emerald-500" : obj.couleur}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-[11px] font-semibold w-8 text-right ${atteint ? "text-emerald-600" : "text-ink-muted"}`}>{pct}%</span>
      </div>
    </div>
  );
}

function ObjectifsPanel({ userId, data, activites, rdvList }: {
  userId: string;
  data: ReturnType<typeof useAgencyData>["data"];
  activites: ReturnType<typeof useActivites>["data"];
  rdvList: ReturnType<typeof useRdv>["data"];
}) {
  const now = new Date();
  const moisLabel = `${MOIS_FR[now.getMonth()]} ${now.getFullYear()}`;
  const moisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const trimLabel = `T${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;
  const trimMois = [0, 1, 2].map((i) => {
    const m = now.getMonth() - (now.getMonth() % 3) + i + 1;
    return `${now.getFullYear()}-${String(m).padStart(2, "0")}`;
  });

  // Clients de l'agent (inclut les données legacy sans agentId)
  const mesClients = data.clients.filter((c) => c.agentId === userId || !c.agentId);
  const agentClientIds = new Set(mesClients.map((c) => c.id));

  // Activités de l'agent ce mois (agentId match ou client appartenant à l'agent)
  const actMois = activites.filter((a) =>
    a.date.startsWith(moisKey) &&
    (a.agentId === userId || agentClientIds.has(a.clientId))
  );
  const appels  = actMois.filter((a) => a.typeActivite === "Appel").length;
  const visites = actMois.filter((a) => a.typeActivite === "Visite").length;
  const offres  = actMois.filter((a) => a.typeActivite === "Offre").length;

  // RDV ce mois : source agenda (officielle)
  const rdvMois = rdvList.filter((r) => (r.agentId === userId || !r.agentId) && r.date.startsWith(moisKey)).length;

  // Mandats pris ce mois (inclut legacy sans agentId)
  const mandatsMois = data.mandats.filter((m) =>
    (m.agentId === userId || !m.agentId) && m.dateDebut.startsWith(moisKey)
  ).length;

  // Pipeline
  const enCompromis = mesClients.filter((c) => c.statut === "Compromis").length;
  const actesTrim   = data.compromis.filter((c) =>
    (c.agentId === userId || !c.agentId) && trimMois.some((m) => c.dateActeReel?.startsWith(m))
  ).length;

  const objectifsMois: Objectif[] = [
    { icon: <Phone size={14} />,    label: "Appels / prospection", detail: "Contacts sortants ce mois",    valeur: appels,      cible: 20, couleur: "bg-sky-500" },
    { icon: <Users size={14} />,    label: "RDV clients",          detail: "Rendez-vous enregistrés",       valeur: rdvMois,     cible: 6,  couleur: "bg-violet-500" },
    { icon: <Home size={14} />,     label: "Visites réalisées",    detail: "Visites de biens effectuées",   valeur: visites,     cible: 6,  couleur: "bg-amber-500" },
    { icon: <FileText size={14} />, label: "Offres présentées",    detail: "Offres remises à un vendeur",   valeur: offres,      cible: 2,  couleur: "bg-orange-500" },
    { icon: <Key size={14} />,      label: "Mandats pris",         detail: "Nouveaux mandats en agence",    valeur: mandatsMois, cible: 2,  couleur: "bg-primary" },
  ];

  const objectifsPipeline: Objectif[] = [
    { icon: <Handshake size={14} />, label: "Compromis actifs",     detail: "Dossiers en cours de l'agent", valeur: enCompromis, cible: 1, couleur: "bg-teal-500" },
    { icon: <CheckCircle size={14}/>, label: "Actes réalisés",      detail: `Objectif trimestriel · ${trimLabel}`, valeur: actesTrim, cible: 1, couleur: "bg-emerald-500" },
  ];

  // Score global
  const totalPct = Math.round(
    [...objectifsMois, ...objectifsPipeline].reduce((acc, o) =>
      acc + Math.min(1, o.cible > 0 ? o.valeur / o.cible : 0), 0
    ) / (objectifsMois.length + objectifsPipeline.length) * 100
  );

  const motivation =
    totalPct >= 80 ? "🏆 Excellent mois ! Tu es au top de tes objectifs." :
    totalPct >= 50 ? "💪 Bonne progression ! Garde ce rythme jusqu'à la fin du mois." :
    totalPct >= 25 ? "📈 Bon départ ! Concentre-toi sur les appels et les RDV." :
    "🚀 C'est le moment de se lancer ! Commence par 5 appels aujourd'hui.";

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="card p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-0.5">Période en cours</div>
          <div className="text-[15px] font-bold text-ink">{moisLabel}</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Objectifs mensuels · niveau débutant</div>
          <div className="text-[11px] text-ink-muted mt-1">{mesClients.length} client(s) actif(s) · Les données sans agent assigné sont incluses automatiquement</div>
        </div>
        <div className="flex shrink-0 flex-col items-center justify-center size-14 rounded-full border-2 border-primary bg-primary/5">
          <span className="text-[16px] font-bold text-primary leading-none">{totalPct}%</span>
          <span className="text-[10px] text-ink-muted">atteint</span>
        </div>
      </div>

      {/* Objectifs mensuels */}
      <div className="card p-4">
        <h2 className="mb-4 text-[12px] font-bold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
          <TrendingUp size={13} /> Activité mensuelle
        </h2>
        <div className="flex flex-col gap-4">
          {objectifsMois.map((o) => <BarreObjectif key={o.label} obj={o} />)}
        </div>
      </div>

      {/* Pipeline */}
      <div className="card p-4">
        <h2 className="mb-4 text-[12px] font-bold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
          <Target size={13} /> Pipeline & résultats
        </h2>
        <div className="flex flex-col gap-4">
          {objectifsPipeline.map((o) => <BarreObjectif key={o.label} obj={o} />)}
        </div>
        <div className="mt-4 rounded-lg bg-bg px-4 py-3 text-[12.5px] text-ink-muted border border-line">
          <span className="font-semibold text-ink">💡 Rappel : </span>
          En immobilier, 1 acte = en moyenne 15 appels → 5 RDV → 3 visites → 1 offre → 1 compromis → 1 acte. Sois régulier dans la prospection !
        </div>
      </div>

      {/* Message motivation */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-[13px] text-ink">
        {motivation}
      </div>
    </div>
  );
}

export function PilotageAgentView() {
  const { data } = useAgencyData();
  const user = useSessionStore((s) => s.user);
  const setView = useUiStore((s) => s.setView);
  const { data: rdvList } = useRdv();
  const { data: taches } = useTaches();
  const { data: activites } = useActivites(undefined);
  const [tab, setTab] = useState<"dashboard" | "objectifs">("dashboard");
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
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-semibold text-ink">Bonjour {user.name} 👋</h1>
        {/* Onglets */}
        <div className="flex rounded-lg border border-line bg-bg p-0.5 self-start">
          <button
            onClick={() => setTab("dashboard")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${tab === "dashboard" ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}
          >
            Tableau de bord
          </button>
          <button
            onClick={() => setTab("objectifs")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors flex items-center gap-1.5 ${tab === "objectifs" ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}
          >
            <Target size={13} /> Objectifs
          </button>
        </div>
      </div>

      {/* ── Onglet Objectifs ── */}
      {tab === "objectifs" && (
        <ObjectifsPanel userId={user.id} data={data} activites={activites} rdvList={rdvList} />
      )}

      {/* ── Onglet Dashboard ── */}
      {tab === "dashboard" && <>

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

      </>}
    </div>
  );
}
