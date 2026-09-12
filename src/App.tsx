import { useEffect, type ReactElement } from "react";
import { useSessionStore } from "./store/session.store";
import { useAuthBootstrap } from "./hooks/useAuthBootstrap";
import { useUiStore, type ViewId } from "./store/ui.store";
import { useAgencyData } from "./hooks/queries/useAgencyData";
import { Login } from "./components/auth/Login";
import { AppShell } from "./components/layout/AppShell";
import { TodayView } from "./components/today/TodayView";
import { ClientsView } from "./components/clients/ClientsView";
import { PipelineView } from "./components/clients/PipelineView";
import { BiensView } from "./components/biens/BiensView";
import { PilotageView } from "./components/pilotage/PilotageView";
import { PilotageAgentView } from "./components/pilotage/PilotageAgentView";
import { RevenusView } from "./components/revenus/RevenusView";
import { ReportingView } from "./components/reporting/ReportingView";
import { FinanceView } from "./components/finance/FinanceView";
import { ActesHome } from "./components/redacteur/ActesHome";
import { EstimationView } from "./components/estimation/EstimationView";
import { ValeurVenaleView } from "./components/estimation/ValeurVenaleView";
import { ValeurLocativeView } from "./components/estimation/ValeurLocativeView";
import { BailView } from "./components/bail/BailView";
import { CompteRenduView } from "./components/compteRendu/CompteRenduView";
import { CalculatriceView } from "./components/tools/CalculatriceView";
import { AgendaView, TachesView } from "./components/tools/AgendaTachesView";
import { MatchingView } from "./components/matching/MatchingView";
import { DocumentsView } from "./components/documents/DocumentsView";
import { RegistreView } from "./components/registre/RegistreView";
import { MesDossiersView } from "./components/pilotage/MesDossiersView";
import { NotesView } from "./components/notes/NotesView";
import { Toaster } from "./components/ui/Toaster";
import { useRealtimeSync } from "./hooks/useRealtimeSync";

const DIR_ONLY: ViewId[] = ["revenus", "reporting", "pilotage", "finance", "estimation"];

function CurrentView(): ReactElement {
  const view = useUiStore((s) => s.activeView);
  const isDir = useSessionStore((s) => s.isDirecteur());
  const safe: ViewId = !isDir && DIR_ONLY.includes(view) ? "pilotage_agent" : view;

  switch (safe) {
    case "today": return <TodayView />;
    case "clients": return <ClientsView />;
    case "pipeline_clients": return <PipelineView />;
    case "biens": return <BiensView />;
    case "pilotage": return <PilotageView />;
    case "revenus": return <RevenusView />;
    case "reporting": return <ReportingView />;
    case "finance": return <FinanceView />;
    case "redacteur": return <ActesHome />;
    case "estimation": return <EstimationView />;
    case "valeur_venale": return <ValeurVenaleView />;
    case "valeur_locative": return <ValeurLocativeView />;
    case "bail": return <BailView />;
    case "compte_rendu": return <CompteRenduView />;
    case "pilotage_agent": return <PilotageAgentView />;
    case "agenda": return <AgendaView />;
    case "taches": return <TachesView />;
    case "calculatrice": return <CalculatriceView />;
    case "matching": return <MatchingView />;
    case "documents": return <DocumentsView />;
    case "registre": return <RegistreView />;
    case "mes_dossiers": return <MesDossiersView />;
    case "notes": return <NotesView />;
    case "import": return <TodayView />;
    default: return <TodayView />;
  }
}

function useKeyboardShortcuts() {
  const setView = useUiStore((s) => s.setView);
  const isDir = useSessionStore((s) => s.isDirecteur());

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!e.altKey) return;
      switch (e.key) {
        case "1": setView(isDir ? "today" : "pilotage_agent"); break;
        case "2": setView("clients"); break;
        case "3": setView("biens"); break;
        case "4": setView("agenda"); break;
        case "5": setView(isDir ? "pilotage" : "mes_dossiers"); break;
        case "6": setView("redacteur"); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setView, isDir]);
}

export function App() {
  useAuthBootstrap();
  const user = useSessionStore((s) => s.user);
  const ready = useSessionStore((s) => s.ready);
  const { isLoading, isError } = useAgencyData();

  const setView = useUiStore((s) => s.setView);
  const isDir = useSessionStore((s) => s.isDirecteur());
  useEffect(() => {
    if (user && !isDir) setView("pilotage_agent");
  }, [user, isDir, setView]);

  useKeyboardShortcuts();
  useRealtimeSync();

  if (!ready) return <div className="flex h-[100dvh] items-center justify-center text-ink-sub">Connexion\u2026</div>;
  if (!user) return <Login />;
  if (isLoading) return <div className="flex h-[100dvh] items-center justify-center text-ink-sub">Chargement\u2026</div>;
  if (isError) return <div className="flex h-[100dvh] items-center justify-center text-danger">Erreur de chargement des données.</div>;

  return (
    <>
      <AppShell>
        <CurrentView />
      </AppShell>
      <Toaster />
    </>
  );
}
