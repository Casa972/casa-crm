import { Menu, Bell } from "lucide-react";
import { useUiStore, type ViewId } from "../../store/ui.store";
import { useSessionStore } from "../../store/session.store";

const PAGE_LABELS: Record<ViewId, string> = {
  today: "Aujourd'hui",
  clients: "Clients",
  biens: "Biens & Mandats",
  redacteur: "Rédacteur Juridique",
  pilotage: "Pilotage",
  revenus: "Revenus",
  reporting: "Reporting",
  pilotage_agent: "Mon tableau de bord",
  agenda: "Agenda",
  taches: "Tâches",
  calculatrice: "Calculatrice",
  estimation: "Estimations de valeur vénale",
};

export function Topbar({ alertCount = 0 }: { alertCount?: number }) {
  const { activeView, toggleSidebar } = useUiStore();
  const user = useSessionStore((s) => s.user);

  return (
    <header className="sticky top-0 z-20 flex h-13 shrink-0 items-center justify-between border-b border-line bg-surface px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="flex size-9 items-center justify-center rounded border border-line bg-surface md:hidden"
          aria-label="Menu"
        >
          <Menu size={20} className="text-ink" />
        </button>
        <span className="truncate font-heading text-sm font-semibold text-ink">
          {PAGE_LABELS[activeView]}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {alertCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber-soft px-2.5 py-1">
            <Bell size={12} className="text-amber" />
            <span className="text-xs font-semibold text-amber">{alertCount}</span>
          </div>
        )}
        {user && (
          <span className="text-[12.5px] text-ink-muted">
            Bonjour,&nbsp;<b className="text-ink">{user.name}</b>
          </span>
        )}
      </div>
    </header>
  );
}
