import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { compteRenduService, uid } from "../../services/compteRendu.service";
import { useSessionStore } from "../../store/session.store";
import type { CompteRendu } from "../../schemas/compteRendu.schema";

const KEY = ["comptes-rendus"] as const;

export function useCompteRendus() {
  const user = useSessionStore(s => s.user);
  const isDir = useSessionStore(s => s.isDirecteur());
  const result = useQuery({
    queryKey: [...KEY, user?.id],
    queryFn: () => compteRenduService.list(isDir ? undefined : user?.id),
    enabled: !!user,
    staleTime: 30_000,
  });
  return { ...result, data: result.data ?? [] };
}

export function useSaveCompteRendu() {
  const qc = useQueryClient();
  const user = useSessionStore(s => s.user);
  return useMutation({
    mutationFn: (c: CompteRendu) => compteRenduService.save(c, user?.id),
    onSuccess: saved => {
      qc.setQueryData<CompteRendu[]>([...KEY, user?.id], (prev = []) => {
        const exists = prev.some(x => x.id === saved.id);
        return exists ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev];
      });
    },
  });
}

export function useDeleteCompteRendu() {
  const qc = useQueryClient();
  const user = useSessionStore(s => s.user);
  return useMutation({
    mutationFn: (id: string) => compteRenduService.remove(id),
    onSuccess: (_v, id) => {
      qc.setQueryData<CompteRendu[]>([...KEY, user?.id], (prev = []) => prev.filter(x => x.id !== id));
    },
  });
}

export { uid };
