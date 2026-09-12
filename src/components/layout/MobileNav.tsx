import { Sun, Users, Building2, Calendar, Menu, Target } from "lucide-react";
import { cn } from "../../lib/cn";
import { useUiStore, type ViewId } from "../../store/ui.store";
import { useSessionStore } from "../../store/session.store";

export function MobileNav() {
  const { activeView, setView, toggleSidebar } = useUiStore();
  const isDir = useSessionStore((s) => s.isDirecteur());
  const home: ViewId = isDir ? "today" : "pilotage_agent";
  const items = [
    { id: home, label: isDir ? "Accueil" : "Board", Icon: isDir ? Sun : Target },
    { id: "clients" as ViewId, label: "Clients", Icon: Users },
    { id: "biens" as ViewId, label: "Biens", Icon: Building2 },
    { id: "agenda" as ViewId, label: "Agenda", Icon: Calendar },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="grid grid-cols-5">
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cn(
              "flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold",
              activeView === id ? "text-primary" : "text-ink-muted",
            )}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
        <button
          onClick={toggleSidebar}
          className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-ink-muted"
        >
          <Menu size={18} />
          Menu
        </button>
      </div>
    </nav>
  );
}
