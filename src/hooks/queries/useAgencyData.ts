import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadAgencyData } from "../../services/agency.service";
import { api } from "../../services/api";
import { TABLES } from "../../types/database";
import {
  bienService, mandatService, clientService, revenuService,
} from "../../services/entity.services";
import { saveCompromisWithRevenu, encaisserCommission } from "../../services/compromis.service";
import { useSessionStore } from "../../store/session.store";
import type { AgencyData, Bien, Mandat, Client, Revenu, Compromis } from "../../types/domain";

const EMPTY: AgencyData = { biens: [], mandats: [], compromis: [], clients: [], revenus: [] };
const KEY = ["agency"] as const;

// ─── Source unique de vérité ──────────────────────────────────────────────────
/**
 * Un seul cache TanStack Query pour toutes les données.
 * staleTime = 60s : les données se rafraîchissent depuis Supabase au plus tard
 * toutes les 60 secondes à chaque focus fenêtre ou navigation entre vues.
 * Toutes les mutations patchent ce cache immédiatement (réactivité zéro latence)
 * ET envoient la requête en base → pas de désynchronisation possible.
 */
export function useAgencyData() {
  const user = useSessionStore((s) => s.user);
  const result = useQuery<AgencyData>({
    queryKey: [...KEY, user?.id],
    queryFn: () => loadAgencyData(user!),
    enabled: !!user,
    staleTime: 60_000,          // Rafraîchi depuis Supabase toutes les 60s
    refetchOnWindowFocus: true, // Re-fetch quand l'utilisateur revient sur l'onglet
    refetchInterval: 120_000,   // Polling toutes les 2 minutes (multi-utilisateur)
  });
  return { ...result, data: result.data ?? EMPTY };
}

/** Patch optimiste du cache après mutation. */
function useCachePatch() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return (fn: (d: AgencyData) => AgencyData) =>
    qc.setQueryData<AgencyData>([...KEY, user?.id], (prev) => fn(prev ?? EMPTY));
}

/** Invalidation complète — force un re-fetch depuis Supabase. */
export function useInvalidateAll() {
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return () => qc.invalidateQueries({ queryKey: [...KEY, user?.id] });
}

// ─── Helpers de merge ─────────────────────────────────────────────────────────
function upsert<T extends { id: string }>(arr: T[], item: T): T[] {
  return arr.some((x) => x.id === item.id)
    ? arr.map((x) => (x.id === item.id ? item : x))
    : [...arr, item];
}

function removeById<T extends { id: string }>(arr: T[], id: string): T[] {
  return arr.filter((x) => x.id !== id);
}

// ─── BIENS ────────────────────────────────────────────────────────────────────
export function useSaveBien() {
  const patch = useCachePatch();
  const agentId = useSessionStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (b: Bien) => bienService.save(b, agentId),
    onSuccess: (saved) =>
      patch((d) => {
        // Sync mandats liés : si bien vendu → expirer les mandats actifs
        const prev = d.biens.find((x) => x.id === saved.id);
        let mandats = d.mandats;
        if (prev && prev.statut !== saved.statut && saved.statut === "Vendu") {
          mandats = d.mandats.map((m) =>
            (m.bienId === saved.id || m.bienId === saved.ref) && m.statut === "Actif"
              ? { ...m, statut: "Expiré" as const }
              : m,
          );
        }
        return { ...d, biens: upsert(d.biens, saved), mandats };
      }),
  });
}

export function useDeleteBien() {
  const patch = useCachePatch();
  return useMutation({
    mutationFn: (id: string) => bienService.remove(id),
    onSuccess: (_v, id) =>
      patch((d) => ({
        ...d,
        biens: removeById(d.biens, id),
        // Expirer les mandats actifs liés au bien supprimé
        mandats: d.mandats.map((m) =>
          m.bienId === id && m.statut === "Actif" ? { ...m, statut: "Expiré" as const } : m,
        ),
      })),
  });
}

// ─── MANDATS ──────────────────────────────────────────────────────────────────
export function useSaveMandat() {
  const patch = useCachePatch();
  const agentId = useSessionStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (m: Mandat) => mandatService.save(m, agentId),
    onSuccess: (saved) =>
      patch((d) => ({ ...d, mandats: upsert(d.mandats, saved) })),
  });
}

export function useDeleteMandat() {
  const patch = useCachePatch();
  return useMutation({
    mutationFn: (id: string) => mandatService.remove(id),
    onSuccess: (_v, id) =>
      patch((d) => ({ ...d, mandats: removeById(d.mandats, id) })),
  });
}

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
export function useSaveClient() {
  const patch = useCachePatch();
  const agentId = useSessionStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (c: Client) => clientService.save(c, agentId),
    onSuccess: (saved) =>
      patch((d) => ({ ...d, clients: upsert(d.clients, saved) })),
  });
}

export function useDeleteClient() {
  const patch = useCachePatch();
  return useMutation({
    mutationFn: (id: string) => clientService.remove(id),
    onSuccess: (_v, id) =>
      patch((d) => ({ ...d, clients: removeById(d.clients, id) })),
  });
}

// ─── REVENUS ──────────────────────────────────────────────────────────────────
export function useSaveRevenu() {
  const patch = useCachePatch();
  return useMutation({
    mutationFn: async (r: Revenu) => {
      const saved = await revenuService.save(r);
      // Si lié à un compromis → sync commissionStatut en base
      if (saved.sourceId && saved.source === "pilotage") {
        const newStatut = saved.statut === "Encaissé" ? "Encaissée" : "À encaisser";
        await api.update(TABLES.compromis, saved.sourceId, { commission_statut: newStatut });
      }
      return saved;
    },
    onSuccess: (saved) =>
      patch((d) => {
        const revenus = upsert(d.revenus, saved);
        // Cascade → compromis si revenu lié
        let compromis = d.compromis;
        if (saved.sourceId && saved.source === "pilotage") {
          const newStatut = saved.statut === "Encaissé" ? "Encaissée" : "À encaisser";
          compromis = d.compromis.map((c) =>
            c.id === saved.sourceId ? { ...c, commissionStatut: newStatut } : c,
          );
        }
        return { ...d, revenus, compromis };
      }),
  });
}

export function useDeleteRevenu() {
  const patch = useCachePatch();
  return useMutation({
    mutationFn: async (id: string) => {
      await revenuService.remove(id);
      return id;
    },
    onSuccess: (_v, id) =>
      patch((d) => {
        const deleted = d.revenus.find((r) => r.id === id);
        let compromis = d.compromis;
        // Cascade → remettre compromis à "À encaisser"
        if (deleted?.sourceId && deleted.source === "pilotage") {
          compromis = d.compromis.map((c) =>
            c.id === deleted.sourceId ? { ...c, commissionStatut: "À encaisser" as const } : c,
          );
        }
        return { ...d, revenus: removeById(d.revenus, id), compromis };
      }),
  });
}

// ─── COMPROMIS ────────────────────────────────────────────────────────────────
/**
 * Sauvegarde compromis + sync transactionnelle du revenu lié.
 * Si le compromis passe en "Acte signé" → revenu créé/mis à jour.
 * Si le compromis sort de "Acte signé" → revenu fantôme supprimé.
 * Les montants du revenu sont toujours recalculés depuis le compromis.
 */
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

export function useDeleteCompromis() {
  const patch = useCachePatch();
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: async (id: string) => {
      const data = qc.getQueryData<AgencyData>([...KEY, user?.id]) ?? EMPTY;
      // Supprimer le revenu lié en base
      const linked = data.revenus.find((r) => r.sourceId === id && r.source === "pilotage");
      if (linked) await api.remove(TABLES.revenus, linked.id);
      await api.remove(TABLES.compromis, id);
      return id;
    },
    onSuccess: (_v, id) =>
      patch((d) => ({
        ...d,
        compromis: removeById(d.compromis, id),
        revenus: d.revenus.filter((r) => r.sourceId !== id),
      })),
  });
}

// ─── Merge interne ────────────────────────────────────────────────────────────
function mergeCompromisRevenu(d: AgencyData, c: Compromis, r: Revenu | null): AgencyData {
  const compromis = upsert(d.compromis, c);
  let revenus = d.revenus;
  if (r) {
    revenus = upsert(d.revenus, r);
  } else {
    // Revenu retiré (compromis n'est plus acte signé)
    revenus = d.revenus.filter((x) => x.sourceId !== c.id);
  }
  return { ...d, compromis, revenus };
}
