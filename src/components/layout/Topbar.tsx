import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { useUiStore, type ViewId } from "../../store/ui.store";
import { useSessionStore } from "../../store/session.store";
import { NotificationsBell } from "./NotificationsBell";
import { SearchModal } from "../search/SearchModal";

const PAGE_LABELS: Record<ViewId, string> = {
  today: "Aujourd'hui",
  clients: "Clients",
  biens: "Biens & Mandats",
  redacteur: "Vente",
  bail: "Baux",
  pilotage: "Pilotage",
  revenus: "Revenus",
  reporting: "Reporting",
  finance: "Tableau financier",
  pilotage_agent: "Mon tableau de bord",
  agenda: "Agenda",
  taches: "Tâches",
  calculatrice: "Calculatrice",
  estimation: "Expertises immobilières",
  valeur_venale: "Valeur vénale",
  valeur_locative: "Valeur locative",
  compte_rendu: "Comptes rendus de visite",
  matching: "Matching clients \u2194 biens",
  documents: "Bibliothèque",
  registre: "Registre des mandats",
  mes_dossiers: "Mes dossiers",
  pipeline_clients: "Pipeline clients",
  notes: "Notes",
  import: "Import CSV",
};

export function Topbar({ alertCount: _alertCount = 0 }: { alertCount?: number }) {
  const { activeView, toggleSidebar } = useUiStore();
  const user = useSessionStore((s) => s.user);
  const [searchOpen, setSearchOpen] = useState(false);

  useState(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  return (
    <>
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
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded border border-line bg-bg px-2.5 py-1.5 text-[12.5px] text-ink-muted hover:border-primary/40 hover:text-ink transition-colors"
            title="Recherche globale (Ctrl+K)"
          >
            <Search size={13} />
            <span className="hidden sm:inline">Rechercher</span>
            <kbd className="hidden rounded border border-line px-1 text-[10px] sm:inline">\u2318K</kbd>
          </button>
          <NotificationsBell />
          {user && (
            <span className="hidden text-[12.5px] text-ink-muted sm:inline">
              Bonjour,&nbsp;<b className="text-ink">{user.name}</b>
            </span>
          )}
        </div>
      </header>
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
