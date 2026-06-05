import { create } from "zustand";
import type { SessionUser } from "../types/domain";

interface SessionState {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
  isDirecteur: () => boolean;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  isDirecteur: () => get().user?.role === "directeur",
}));
