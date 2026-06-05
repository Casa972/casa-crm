import { create } from "zustand";
import type { CategorieBien } from "../types/domain";

interface FiltersState {
  search: string;
  bienCategorie: CategorieBien | "tous";
  bienStatut: string | "tous";
  setSearch: (q: string) => void;
  setBienCategorie: (c: CategorieBien | "tous") => void;
  setBienStatut: (s: string | "tous") => void;
  reset: () => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  search: "",
  bienCategorie: "tous",
  bienStatut: "tous",
  setSearch: (search) => set({ search }),
  setBienCategorie: (bienCategorie) => set({ bienCategorie }),
  setBienStatut: (bienStatut) => set({ bienStatut }),
  reset: () => set({ search: "", bienCategorie: "tous", bienStatut: "tous" }),
}));
