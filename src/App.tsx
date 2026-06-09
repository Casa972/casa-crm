import { useEffect, type ReactElement } from "react";
import { useSessionStore } from "./store/session.store";
import { useUiStore, type ViewId } from "./store/ui.store";
import { useAgencyData } from "./hooks/queries/useAgencyData";
import { useFinancials } from "./hooks/useFinancials";
import { Login } from "./components/auth/Login";
import { AppShell } from "./components/layout/AppShell";
import { TodayView } from "./components/today/TodayView";
import { ClientsView } from "./components/clients/ClientsView";
import { BiensView } from "./components/biens/BiensView";
import { PilotageView } from "./components/pilotage/PilotageView";
import { PilotageAgentView } from "./components/pilotage/PilotageAgentView";
import { RevenusView } from "./components/revenus/RevenusView";
import { ReportingView } from "./components/reporting/ReportingView";
import { RedacteurView } from "./components/redacteur/RedacteurView";
import { EstimationView } from "./components/estimation/EstimationView";
import { CompteRenduView } from "./components/compteRendu/CompteRenduView";
import { CalculatriceView } from "./components/tools/CalculatriceView";
import { AgendaView, TachesView } from "./components/tools/AgendaTachesView";
import { daysDiff } from "./lib/format";

/** Vues réservées au directeur — un agent est redirigé vers son tableau de bord. */
const DIR_ONLY: ViewId[] = ["revenus", "reporting", "pilotage"];

function CurrentView(): ReactElement {
  const view = useUiStore((s) => s.activeView);
  const isDir = useSessionStore((s) => s.isDirecteur());
  const safe: ViewId = !isDir && DIR_ONLY.includes(view) ? "pilotage_agent" : view;

  switch (safe) {
    case "today": return <TodayView />;
    case "clients": return <ClientsView />;
    case "biens": return <BiensView />;
    case "redacteur": return <RedacteurView />;
    case "pilotage": return <PilotageView />;
    case "pilotage_agent": return <PilotageAgentView />;
    case "revenus": return <RevenusView />;
    case "reporting": return <ReportingView />;
    case "estimation": return <EstimationView />;
    case "compte_rendu": return <CompteRenduView />;
    case "agenda": return <AgendaView />;
    case "taches": return <TachesView />;
    case "calculatrice": return <CalculatriceView />;
    default: return <TodayView />;
  }
}

function useAlertCount(): number {
  const { data } = useAgencyData();
  const fin = useFinancials(data);
  const relances = data.clients.filter((c) => c.relanceDate && (daysDiff(c.relanceDate) ?? 99) <= 0).length;
  return relances + fin.alertesDelais.length;
}

export function App() {
  const user = useSessionStore((s) => s.user);
  const { isLoading, isError } = useAgencyData();
  const alertCount = useAlertCount();

  // Réinitialise la vue active vers une vue autorisée au login agent.
  const setView = useUiStore((s) => s.setView);
  const isDir = useSessionStore((s) => s.isDirecteur());
  useEffect(() => {
    if (user && !isDir) setView("pilotage_agent");
  }, [user, isDir, setView]);

  if (!user) return <Login />;
  if (isLoading) return <div className="flex h-screen items-center justify-center text-ink-sub">Chargement…</div>;
  if (isError) return <div className="flex h-screen items-center justify-center text-danger">Erreur de chargement des données.</div>;

  return (
    <AppShell alertCount={alertCount}>
      <CurrentView />
    </AppShell>
  );
}
