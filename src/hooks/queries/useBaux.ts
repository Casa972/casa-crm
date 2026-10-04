import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bailService, uid } from "../../services/bail.service";
import { syncSourceRevenu } from "../../services/sourceRevenu";
import { useSessionStore } from "../../store/session.store";
import type { Bail } from "../../schemas/bail.schema";

const KEY = ["baux"] as const;

export function useBaux() {
  const user = useSessionStore((s) => s.user);
  const isDir = useSessionStore((s) => s.isDirecteur());
  const result = useQuery({
    queryKey: [...KEY, user?.id],
    queryFn: () => bailService.list(isDir ? undefined : user?.id),
    enabled: !!user,
    staleTime: 15_000,
    retry: 1,
  });
  return { ...result, data: result.data ?? [] };
}

export function useSaveBail() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: async (b: Bail) => {
      const saved = await bailService.save(b, user?.id);
      await syncSourceRevenu({
        sourceId: saved.id,
        source: "bail",
        type: "Commission location",
        montant: saved.honorairesAgence || 0,
        desc: `Honoraires location ${saved.adresse || saved.id}`,
        date: saved.dateDebut || saved.dateDocument,
        active: saved.statut === "Finalisé",
      }).catch(() => undefined);
      return saved;
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["agency"] });
      qc.setQueryData<Bail[]>([...KEY, user?.id], (prev = []) => {
        const exists = prev.some((x) => x.id === saved.id);
        return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
      });
    },
  });
}

export function useDeleteBail() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: (id: string) => bailService.remove(id),
    onSuccess: (_v, id) => {
      qc.setQueryData<Bail[]>([...KEY, user?.id], (prev = []) => prev.filter((x) => x.id !== id));
    },
  });
}

export function useMigrateLocalBaux() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: () => bailService.migrateFromLocal(user?.id),
    onSuccess: (n) => {
      if (n > 0) void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export { uid };
