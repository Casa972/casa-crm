import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rdvService } from "../../services/entity.services";
import { supabase } from "../../services/supabase.client";
import { useSessionStore } from "../../store/session.store";
import type { Rdv } from "../../types/domain";

const KEY = ["rdv"] as const;

async function notifyRdv(rdv: Rdv, isNew: boolean) {
  if (!rdv.participantNom) return;
  try {
    await supabase.functions.invoke("notify-rdv", { body: { ...rdv, _isNew: isNew } });
  } catch {
    // notification silencieuse — ne bloque pas la sauvegarde
  }
}

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
    mutationFn: async (rdv: Rdv) => {
      const existing = qc.getQueryData<Rdv[]>([...KEY, user?.id]) ?? [];
      const isNew = !existing.some((x) => x.id === rdv.id);
      const saved = await rdvService.save(rdv, user?.id);
      notifyRdv(saved, isNew);
      return saved;
    },
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
