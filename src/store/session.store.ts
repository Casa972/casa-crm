import { create } from "zustand";
import type { SessionUser } from "../types/domain";

interface SessionState {
  user: SessionUser | null;
  ready: boolean;
  setUser: (u: SessionUser | null) => void;
  setReady: (ready: boolean) => void;
  isDirecteur: () => boolean;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user }),
  setReady: (ready) => set({ ready }),
  isDirecteur: () => get().user?.role === "directeur",
}));
