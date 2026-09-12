import { useEffect, useState } from "react";
import { Menu, Search } from "lucide-react";
import { useUiStore, type ViewId } from "../../store/ui.store";
import { useSessionStore } from "../../store/session.store";
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

export function Topbar() {
  const { activeView, toggleSidebar } = useUiStore();
  const user = useSessionStore((s) => s.user);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex min-h-12 shrink-0 items-center justify-between border-b border-line bg-surface px-3 py-2 md:px-4" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="hidden size-11 items-center justify-center rounded border border-line bg-surface max-md:flex"
            aria-label="Menu"
          >
            <Menu size={20} className="text-ink" />
          </button>
          <span className="truncate font-heading text-[15px] font-semibold text-ink md:text-sm">
            {PAGE_LABELS[activeView]}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex size-11 items-center justify-center rounded border border-line bg-bg md:size-auto md:gap-2 md:px-2.5 md:py-1.5"
            title="Recherche globale"
          >
            <Search size={16} />
            <span className="hidden sm:inline text-[13px]">Rechercher</span>
          </button>
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
