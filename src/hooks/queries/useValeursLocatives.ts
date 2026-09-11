import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { valeurLocativeService, uid } from "../../services/valeurLocative.service";
import { useSessionStore } from "../../store/session.store";
import type { ValeurLocative } from "../../schemas/valeurLocative.schema";

const KEY = ["valeurs-locatives"] as const;

export function useValeursLocatives() {
  const user = useSessionStore((s) => s.user);
  const isDir = useSessionStore((s) => s.isDirecteur());
  const result = useQuery({
    queryKey: [...KEY, user?.id],
    queryFn: () => valeurLocativeService.list(isDir ? undefined : user?.id),
    enabled: !!user,
    staleTime: 15_000,
    retry: 1,
  });
  return { ...result, data: result.data ?? [] };
}

export function useSaveValeurLocative() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: (d: ValeurLocative) => valeurLocativeService.save(d, user?.id),
    onSuccess: (saved) => {
      qc.setQueryData<ValeurLocative[]>([...KEY, user?.id], (prev = []) => {
        const exists = prev.some((x) => x.id === saved.id);
        return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
      });
    },
  });
}

export function useDeleteValeurLocative() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: (id: string) => valeurLocativeService.remove(id),
    onSuccess: (_v, id) => {
      qc.setQueryData<ValeurLocative[]>([...KEY, user?.id], (prev = []) => prev.filter((x) => x.id !== id));
    },
  });
}

export function useMigrateLocalValeursLocatives() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: () => valeurLocativeService.migrateFromLocal(user?.id),
    onSuccess: (n) => {
      if (n > 0) void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export { uid };
