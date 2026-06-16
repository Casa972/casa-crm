import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { activiteService } from "../../services/entity.services";
import { useSessionStore } from "../../store/session.store";
import type { Activite } from "../../types/domain";

const KEY = ["activites"] as const;

export function useActivites(clientId?: string) {
  const user = useSessionStore((s) => s.user);
  const isDir = useSessionStore((s) => s.isDirecteur());
  const result = useQuery({
    queryKey: [...KEY, clientId ?? "all", user?.id],
    queryFn: () => activiteService.list(clientId, isDir ? undefined : user?.id),
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return { ...result, data: result.data ?? [] };
}

function upsert(arr: Activite[], item: Activite): Activite[] {
  return arr.some((x) => x.id === item.id)
    ? arr.map((x) => (x.id === item.id ? item : x))
    : [item, ...arr];
}

export function useSaveActivite(clientId?: string) {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: (a: Activite) => activiteService.save(a, user?.id),
    onSuccess: (saved) => {
      // Invalidate both specific client and "all" keys
      qc.setQueryData<Activite[]>([...KEY, saved.clientId, user?.id], (prev = []) => upsert(prev, saved));
      qc.setQueryData<Activite[]>([...KEY, "all", user?.id], (prev = []) => upsert(prev, saved));
      if (clientId && clientId !== saved.clientId) {
        qc.setQueryData<Activite[]>([...KEY, clientId, user?.id], (prev = []) => upsert(prev, saved));
      }
    },
  });
}

export function useDeleteActivite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activiteService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
