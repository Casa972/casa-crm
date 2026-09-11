import {
  Sun, Users, Building2, Target, TrendingUp, ClipboardList,
  BarChart2, Calendar, CheckCircle, Calculator, LogOut, Shuffle, Library,
  GraduationCap, ExternalLink, Landmark, BookOpen, Briefcase,
  Columns, Clipboard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { useUiStore, type ViewId } from "../../store/ui.store";
import { useSessionStore } from "../../store/session.store";
import { signOut } from "../../services/auth.service";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { daysDiff } from "../../lib/format";
import logo from "../../assets/logo.png";

const FORMATION_URL = "https://casa-formation.vercel.app";

interface NavItem  { kind: "item";  id: ViewId; label: string; Icon: LucideIcon; href?: string; badge?: () => number; }
interface NavGroup { kind: "group"; label: string; }
type NavEntry = NavItem | NavGroup;

const NAV_DIR: NavEntry[] = [
  { kind: "group", label: "Tableau de bord" },
  { kind: "item", id: "today",       label: "Aujourd'hui",    Icon: Sun },

  { kind: "group", label: "Pipeline" },
  { kind: "item", id: "clients",          label: "Clients",          Icon: Users },
  { kind: "item", id: "pipeline_clients", label: "Pipeline clients",  Icon: Columns },
  { kind: "item", id: "matching",    label: "Matching",       Icon: Shuffle },

  { kind: "group", label: "Terrain" },
  { kind: "item", id: "biens",        label: "Biens & Mandats", Icon: Building2 },
  { kind: "item", id: "compte_rendu", label: "Comptes rendus",  Icon: ClipboardList },
  { kind: "item", id: "agenda",       label: "Agenda",          Icon: Calendar },
  { kind: "item", id: "taches",       label: "Tâches",          Icon: CheckCircle },

  { kind: "group", label: "Documents" },
  { kind: "item", id: "documents",    label: "Documents",       Icon: Library },
  { kind: "item", id: "registre",     label: "Registre mandats", Icon: BookOpen },

  { kind: "group", label: "Analyse" },
  { kind: "item", id: "finance",     label: "Tableau financier", Icon: Landmark },
  { kind: "item", id: "pilotage",    label: "Pilotage",       Icon: Target },
  { kind: "item", id: "revenus",     label: "Revenus",        Icon: TrendingUp },
  { kind: "item", id: "reporting",   label: "Reporting",      Icon: BarChart2 },

  { kind: "group", label: "Outils" },
  { kind: "item", id: "notes", label: "Notes", Icon: Clipboard },

  { kind: "group", label: "Ressources" },
  { kind: "item", id: "import", label: "Formation", Icon: GraduationCap, href: FORMATION_URL },
];

const NAV_AGENT: NavEntry[] = [
  { kind: "group", label: "Tableau de bord" },
  { kind: "item", id: "pilotage_agent", label: "Mon tableau de bord", Icon: Target },

  { kind: "group", label: "Pipeline" },
  { kind: "item", id: "clients",          label: "Mes clients",      Icon: Users },
  { kind: "item", id: "pipeline_clients", label: "Pipeline clients",  Icon: Columns },
  { kind: "item", id: "mes_dossiers",label: "Mes dossiers",   Icon: Briefcase },
  { kind: "item", id: "matching",    label: "Matching",       Icon: Shuffle },

  { kind: "group", label: "Terrain" },
  { kind: "item", id: "biens",        label: "Biens & Mandats", Icon: Building2 },
  { kind: "item", id: "compte_rendu", label: "Comptes rendus",  Icon: ClipboardList },
  { kind: "item", id: "agenda",       label: "Agenda",          Icon: Calendar },
  { kind: "item", id: "taches",       label: "Tâches",          Icon: CheckCircle },

  { kind: "group", label: "Documents" },
  { kind: "item", id: "documents",    label: "Documents",       Icon: Library },

  { kind: "group", label: "Outils" },
  { kind: "item", id: "notes",       label: "Notes",          Icon: Clipboard },
  { kind: "item", id: "calculatrice",label: "Calculatrice",   Icon: Calculator },

  { kind: "group", label: "Ressources" },
  { kind: "item", id: "import", label: "Formation", Icon: GraduationCap, href: FORMATION_URL },
];

function useMandatExpBadge(): number {
  const { data } = useAgencyData();
  return data.mandats.filter((m) => {
    const d = daysDiff(m.dateFin);
    return m.statut === "Actif" && d !== null && d >= 0 && d <= 30;
  }).length;
}

export function Sidebar() {
  const { activeView, setView, sidebarOpen, closeSidebar } = useUiStore();
  const { user, setUser, isDirecteur } = useSessionStore();
  const mandatBadge = useMandatExpBadge();
  if (!user) return null;

  const isDir = isDirecteur();
  const nav = isDir ? NAV_DIR : NAV_AGENT;

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
        <div className="border-b border-line px-3 pb-3 pt-4">
          <img src={logo} alt="Casa Caraïbes" className="mb-1.5 h-8 w-auto max-w-full object-contain object-left" />
          <div className="text-[11px] font-medium text-primary">
            {isDir ? "Espace directeur" : `Espace ${user.name}`}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {nav.map((entry, i) => {
            if (entry.kind === "group") {
              return (
                <div
                  key={`g-${i}`}
                  className={cn(
                    "px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted",
                    i > 0 && "mt-4",
                  )}
                >
                  {entry.label}
                </div>
              );
            }

            const { id, label, Icon, href } = entry;
            const showBadge = id === "registre" && mandatBadge > 0;

            if (href) {
              return (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-[13px] font-medium transition-colors text-ink-sub hover:bg-line/50 hover:text-ink"
                >
                  <Icon size={15} className="shrink-0" />
                  {label}
                  <ExternalLink size={11} className="ml-auto shrink-0 opacity-40" />
                </a>
              );
            }

            return (
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
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                    {mandatBadge > 9 ? "9+" : mandatBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-line px-3 py-2">
          <div className="mb-1 text-[10px] text-ink-muted opacity-60">
            Alt+1–6 pour navigation rapide
          </div>
        </div>

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
            onClick={() => { void signOut(); setUser(null); }}
            className="flex w-full items-center gap-2.5 rounded px-3 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
