import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "../types/domain";

interface SessionState {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
  isDirecteur: () => boolean;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      isDirecteur: () => get().user?.role === "directeur",
    }),
    { name: "casa-session" },
  ),
);
