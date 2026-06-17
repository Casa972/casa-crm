import {
  Sun, Users, Building2, FileText, Target, TrendingUp, Home, ClipboardList,
  BarChart2, Calendar, CheckCircle, Calculator, LogOut, Kanban, Shuffle, Library,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { useUiStore, type ViewId } from "../../store/ui.store";
import { useSessionStore } from "../../store/session.store";

interface NavItem { id: ViewId; label: string; Icon: LucideIcon; }

const NAV_DIR: NavItem[] = [
  { id: "today", label: "Aujourd'hui", Icon: Sun },
  { id: "clients", label: "Clients", Icon: Users },
  { id: "kanban", label: "Pipeline Kanban", Icon: Kanban },
  { id: "matching", label: "Matching", Icon: Shuffle },
  { id: "biens", label: "Biens & Mandats", Icon: Building2 },
  { id: "estimation", label: "Estimations", Icon: Home },
  { id: "compte_rendu", label: "Comptes rendus", Icon: ClipboardList },
  { id: "redacteur", label: "Rédacteur Actes", Icon: FileText },
  { id: "documents", label: "Documents", Icon: Library },
  { id: "agenda", label: "Agenda", Icon: Calendar },
  { id: "taches", label: "Tâches", Icon: CheckCircle },
  { id: "pilotage", label: "Pilotage", Icon: Target },
  { id: "revenus", label: "Revenus", Icon: TrendingUp },
  { id: "reporting", label: "Reporting", Icon: BarChart2 },
];

const NAV_AGENT: NavItem[] = [
  { id: "pilotage_agent", label: "Mon tableau de bord", Icon: Target },
  { id: "clients", label: "Mes clients", Icon: Users },
  { id: "kanban", label: "Pipeline Kanban", Icon: Kanban },
  { id: "matching", label: "Matching", Icon: Shuffle },
  { id: "biens", label: "Biens & Mandats", Icon: Building2 },
  { id: "estimation", label: "Estimations", Icon: Home },
  { id: "compte_rendu", label: "Comptes rendus", Icon: ClipboardList },
  { id: "redacteur", label: "Rédacteur Actes", Icon: FileText },
  { id: "documents", label: "Documents", Icon: Library },
  { id: "agenda", label: "Agenda", Icon: Calendar },
  { id: "taches", label: "Tâches", Icon: CheckCircle },
  { id: "calculatrice", label: "Calculatrice", Icon: Calculator },
];

export function Sidebar() {
  const { activeView, setView, sidebarOpen, closeSidebar } = useUiStore();
  const { user, setUser, isDirecteur } = useSessionStore();
  if (!user) return null;

  const nav = isDirecteur() ? NAV_DIR : NAV_AGENT;

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-ink/30 md:hidden" onClick={closeSidebar} />
      )}
      <aside
        className={cn(
          "z-50 flex h-screen w-[210px] shrink-0 flex-col border-r border-line bg-surface",
          "max-md:fixed max-md:left-0 max-md:top-0 max-md:w-[78vw] max-md:max-w-[300px]",
          "max-md:transition-transform max-md:duration-300",
          sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
        )}
      >
        <div className="border-b border-line px-4 pb-4 pt-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded bg-primary">
              <Building2 size={16} className="text-white" />
            </div>
            <div>
              <div className="font-heading text-sm font-semibold text-ink">Casa Caraïbes</div>
              <div className="text-[11px] font-medium text-primary">
                {isDirecteur() ? "Espace directeur" : `Espace ${user.name}`}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {nav.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-[13px] font-medium transition-colors",
                activeView === id
                  ? "bg-primary-soft font-semibold text-primary"
                  : "text-ink-sub hover:bg-line/50 hover:text-ink",
              )}
            >
              <Icon size={15} className="shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="border-t border-line p-2">
          <div className="mb-1.5 flex items-center gap-2.5 rounded bg-bg px-2.5 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded bg-primary text-xs font-bold text-white">
              {user.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold text-ink">{user.name}</div>
              <div className="text-[11px] text-ink-muted">{user.label}</div>
            </div>
          </div>
          <button
            onClick={() => setUser(null)}
            className="flex w-full items-center gap-2.5 rounded px-3 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
