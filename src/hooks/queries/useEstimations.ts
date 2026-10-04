import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { estimationService, uid } from "../../services/estimation.service";
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
    mutationFn: (e: Estimation) => estimationService.save(e, user?.id),
    onSuccess: (saved) => {
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
