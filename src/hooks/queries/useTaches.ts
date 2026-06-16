import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tacheService } from "../../services/entity.services";
import { useSessionStore } from "../../store/session.store";
import type { Tache } from "../../types/domain";

const KEY = ["taches"] as const;

export function useTaches() {
  const user = useSessionStore((s) => s.user);
  const isDir = useSessionStore((s) => s.isDirecteur());
  const result = useQuery({
    queryKey: [...KEY, user?.id],
    queryFn: () => tacheService.list(isDir ? undefined : user?.id),
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return { ...result, data: result.data ?? [] };
}

function upsert(arr: Tache[], item: Tache): Tache[] {
  return arr.some((x) => x.id === item.id)
    ? arr.map((x) => (x.id === item.id ? item : x))
    : [...arr, item];
}

export function useSaveTache() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: (t: Tache) => tacheService.save(t, user?.id),
    onSuccess: (saved) => {
      qc.setQueryData<Tache[]>([...KEY, user?.id], (prev = []) => upsert(prev, saved));
    },
  });
}

export function useDeleteTache() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: (id: string) => tacheService.remove(id),
    onSuccess: (_v, id) => {
      qc.setQueryData<Tache[]>([...KEY, user?.id], (prev = []) => prev.filter((x) => x.id !== id));
    },
  });
}
