import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rdvService } from "../../services/entity.services";
import { supabase } from "../../services/supabase.client";
import { useSessionStore } from "../../store/session.store";
import type { Rdv } from "../../types/domain";

const KEY = ["rdv"] as const;

const AGENTS_EMAILS: Record<string, string> = {
  Steeve: "steeve@casacaraibes.com",
  Noham: "noham@casacaraibes.com",
  Luc: "contact@casacaraibes.com",
};

async function notifyRdv(rdv: Rdv, isNew: boolean) {
  console.log("[notifyRdv] appelé — participantNom:", rdv.participantNom);
  if (!rdv.participantNom) { console.warn("[notifyRdv] participantNom vide, abandon"); return; }
  const to = AGENTS_EMAILS[rdv.participantNom];
  console.log("[notifyRdv] email résolu:", to);
  if (!to) { console.warn("[notifyRdv] aucun email pour", rdv.participantNom); return; }
  try {
    console.log("[notifyRdv] invocation edge function...");
    const { data, error } = await supabase.functions.invoke("notify-rdv", { body: { ...rdv, _isNew: isNew, _to: to } });
    if (error) console.error("[notifyRdv] Erreur invocation:", error);
    else console.log("[notifyRdv] Réponse:", data);
  } catch (e) {
    console.error("[notifyRdv] Exception:", e);
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
