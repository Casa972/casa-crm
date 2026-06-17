import { create } from "zustand";

export type ViewId =
  | "today" | "clients" | "biens" | "redacteur" | "documents"
  | "pilotage" | "revenus" | "reporting" | "estimation"
  | "pilotage_agent" | "agenda" | "taches" | "calculatrice" | "compte_rendu"
  | "kanban" | "matching" | "import";

export type PrefillRedacteur = {
  docType: "mandat" | "compromis" | "offre";
  sourceId: string;
};

interface UiState {
  activeView: ViewId;
  sidebarOpen: boolean;
  prefillRedacteur: PrefillRedacteur | null;
  setView: (v: ViewId) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  setPrefillRedacteur: (v: PrefillRedacteur | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: "today",
  sidebarOpen: false,
  prefillRedacteur: null,
  setView: (activeView) => set({ activeView, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  setPrefillRedacteur: (prefillRedacteur) => set({ prefillRedacteur }),
}));
