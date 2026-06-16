import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rdvService } from "../../services/entity.services";
import { useSessionStore } from "../../store/session.store";
import type { Rdv } from "../../types/domain";

const KEY = ["rdv"] as const;

export function useRdv() {
  const user = useSessionStore((s) => s.user);
  const isDir = useSessionStore((s) => s.isDirecteur());
  const result = useQuery({
    queryKey: [...KEY, user?.id],
    queryFn: () => rdvService.list(isDir ? undefined : user?.id),
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return { ...result, data: result.data ?? [] };
}

function upsert(arr: Rdv[], item: Rdv): Rdv[] {
  return arr.some((x) => x.id === item.id)
    ? arr.map((x) => (x.id === item.id ? item : x))
    : [...arr, item];
}

export function useSaveRdv() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: (rdv: Rdv) => rdvService.save(rdv, user?.id),
    onSuccess: (saved) => {
      qc.setQueryData<Rdv[]>([...KEY, user?.id], (prev = []) => upsert(prev, saved));
    },
  });
}

export function useDeleteRdv() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: (id: string) => rdvService.remove(id),
    onSuccess: (_v, id) => {
      qc.setQueryData<Rdv[]>([...KEY, user?.id], (prev = []) => prev.filter((x) => x.id !== id));
    },
  });
}
