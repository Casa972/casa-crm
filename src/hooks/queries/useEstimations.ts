import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { estimationService, uid } from "../../services/estimation.service";
import { syncSourceRevenu } from "../../services/sourceRevenu";
import { useSessionStore } from "../../store/session.store";
import type { Estimation } from "../../schemas/estimation.schema";

const KEY = ["estimations"] as const;

export function useEstimations() {
  const user = useSessionStore((s) => s.user);
  const isDir = useSessionStore((s) => s.isDirecteur());
  const result = useQuery({
    queryKey: [...KEY, user?.id],
    queryFn: () => estimationService.list(isDir ? undefined : user?.id),
    enabled: !!user,
    staleTime: 30_000,
  });
  return { ...result, data: result.data ?? [] };
}

export function useSaveEstimation() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: async (e: Estimation) => {
      const saved = await estimationService.save(e, user?.id);
      const expertise = saved.typeDoc !== "valeur_venale";
      await syncSourceRevenu({
        sourceId: saved.id,
        source: "estimation",
        type: expertise ? "Expertise" : "Estimation valeur vénale",
        montant: saved.honorairesFactures || 0,
        desc: `${expertise ? "Expertise" : "Estimation"} ${saved.adresse || saved.commune || saved.id}`,
        date: saved.dateEstimation,
        active: saved.statut === "Finalisée",
      }).catch(() => undefined);
      return saved;
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["agency"] });
      qc.setQueryData<Estimation[]>([...KEY, user?.id], (prev = []) => {
        const exists = prev.some((x) => x.id === saved.id);
        return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
      });
    },
  });
}

export function useDeleteEstimation() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: (id: string) => estimationService.remove(id),
    onSuccess: (_v, id) => {
      qc.setQueryData<Estimation[]>([...KEY, user?.id], (prev = []) =>
        prev.filter((x) => x.id !== id),
      );
    },
  });
}

export { uid };
