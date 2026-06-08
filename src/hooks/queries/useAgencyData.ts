import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadAgencyData } from "../../services/agency.service";
import {
  bienService, mandatService, clientService, revenuService,
} from "../../services/entity.services";
import { saveCompromisWithRevenu, encaisserCommission } from "../../services/compromis.service";
import { useSessionStore } from "../../store/session.store";
import type { AgencyData, Bien, Mandat, Client, Revenu, Compromis } from "../../types/domain";

const EMPTY: AgencyData = { biens: [], mandats: [], compromis: [], clients: [], revenus: [] };
const KEY = ["agency"] as const;

/** Source unique des données — cache TanStack Query. */
export function useAgencyData() {
  const user = useSessionStore((s) => s.user);
  const result = useQuery<AgencyData>({
    queryKey: [...KEY, user?.id],
    queryFn: () => loadAgencyData(user!),
    enabled: !!user,
    staleTime: 30_000,
  });
  return { ...result, data: result.data ?? EMPTY };
}

/** Patch local du cache après mutation (réactivité immédiate). */
function useCachePatch() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return (fn: (d: AgencyData) => AgencyData) =>
    qc.setQueryData<AgencyData>([...KEY, user?.id], (prev) => fn(prev ?? EMPTY));
}

export function useSaveBien() {
  const patch = useCachePatch();
  const agentId = useSessionStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (b: Bien) => bienService.save(b, agentId),
    onSuccess: (saved) =>
      patch((d) => ({
        ...d,
        biens: d.biens.some((x) => x.id === saved.id)
          ? d.biens.map((x) => (x.id === saved.id ? saved : x))
          : [...d.biens, saved],
      })),
  });
}

export function useDeleteBien() {
  const patch = useCachePatch();
  return useMutation({
    mutationFn: (id: string) => bienService.remove(id),
    onSuccess: (_v, id) => patch((d) => ({ ...d, biens: d.biens.filter((x) => x.id !== id) })),
  });
}

export function useSaveMandat() {
  const patch = useCachePatch();
  const agentId = useSessionStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (m: Mandat) => mandatService.save(m, agentId),
    onSuccess: (saved) =>
      patch((d) => ({
        ...d,
        mandats: d.mandats.some((x) => x.id === saved.id)
          ? d.mandats.map((x) => (x.id === saved.id ? saved : x))
          : [...d.mandats, saved],
      })),
  });
}

export function useDeleteMandat() {
  const patch = useCachePatch();
  return useMutation({
    mutationFn: (id: string) => mandatService.remove(id),
    onSuccess: (_v, id) => patch((d) => ({ ...d, mandats: d.mandats.filter((x) => x.id !== id) })),
  });
}

export function useSaveClient() {
  const patch = useCachePatch();
  const agentId = useSessionStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (c: Client) => clientService.save(c, agentId),
    onSuccess: (saved) =>
      patch((d) => ({
        ...d,
        clients: d.clients.some((x) => x.id === saved.id)
          ? d.clients.map((x) => (x.id === saved.id ? saved : x))
          : [...d.clients, saved],
      })),
  });
}

export function useDeleteClient() {
  const patch = useCachePatch();
  return useMutation({
    mutationFn: (id: string) => clientService.remove(id),
    onSuccess: (_v, id) => patch((d) => ({ ...d, clients: d.clients.filter((x) => x.id !== id) })),
  });
}

export function useSaveRevenu() {
  const patch = useCachePatch();
  return useMutation({
    mutationFn: (r: Revenu) => revenuService.save(r),
    onSuccess: (saved) =>
      patch((d) => ({
        ...d,
        revenus: d.revenus.some((x) => x.id === saved.id)
          ? d.revenus.map((x) => (x.id === saved.id ? saved : x))
          : [...d.revenus, saved],
      })),
  });
}

export function useDeleteRevenu() {
  const patch = useCachePatch();
  return useMutation({
    mutationFn: (id: string) => revenuService.remove(id),
    onSuccess: (_v, id) => patch((d) => ({ ...d, revenus: d.revenus.filter((x) => x.id !== id) })),
  });
}

/** Sauvegarde compromis + sync transactionnelle du revenu lié. */
export function useSaveCompromis() {
  const patch = useCachePatch();
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: (c: Compromis) => {
      const data = qc.getQueryData<AgencyData>([...KEY, user?.id]) ?? EMPTY;
      return saveCompromisWithRevenu(c, data.revenus, user?.id);
    },
    onSuccess: ({ compromis, revenu }) =>
      patch((d) => mergeCompromisRevenu(d, compromis, revenu)),
  });
}

export function useEncaisserCommission() {
  const patch = useCachePatch();
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: (c: Compromis) => {
      const data = qc.getQueryData<AgencyData>([...KEY, user?.id]) ?? EMPTY;
      return encaisserCommission(c, data.revenus);
    },
    onSuccess: ({ compromis, revenu }) =>
      patch((d) => mergeCompromisRevenu(d, compromis, revenu)),
  });
}

function mergeCompromisRevenu(d: AgencyData, c: Compromis, r: Revenu | null): AgencyData {
  const compromis = d.compromis.some((x) => x.id === c.id)
    ? d.compromis.map((x) => (x.id === c.id ? c : x))
    : [...d.compromis, c];
  let revenus = d.revenus;
  if (r) {
    revenus = d.revenus.some((x) => x.id === r.id)
      ? d.revenus.map((x) => (x.id === r.id ? r : x))
      : [...d.revenus, r];
  }
  return { ...d, compromis, revenus };
}
