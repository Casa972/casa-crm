import { create } from "zustand";

export type ViewId =
  | "today" | "clients" | "biens" | "redacteur"
  | "pilotage" | "revenus" | "reporting" | "estimation"
  | "pilotage_agent" | "agenda" | "taches" | "calculatrice";

interface UiState {
  activeView: ViewId;
  sidebarOpen: boolean;
  setView: (v: ViewId) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: "today",
  sidebarOpen: false,
  setView: (activeView) => set({ activeView, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
