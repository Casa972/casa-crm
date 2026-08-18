import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase.client";
import { useSessionStore } from "../store/session.store";
import { TABLES } from "../types/database";

const WATCHED_TABLES = [
  TABLES.biens,
  TABLES.mandats,
  TABLES.compromis,
  TABLES.clients,
  TABLES.revenus,
] as const;

/**
 * Écoute les changements Supabase Realtime sur les tables principales.
 * Quand un autre agent modifie des données, invalide le cache React Query
 * pour déclencher un re-fetch immédiat (sans attendre les 60s de staleTime).
 */
export function useRealtimeSync() {
  const qc = useQueryClient();
  const userId = useSessionStore((s) => s.user?.id);

  // Ref stable pour éviter de recréer le channel à chaque render
  const invalidateRef = useRef(() => {
    qc.invalidateQueries({ queryKey: ["agency", userId] });
  });
  useEffect(() => {
    invalidateRef.current = () => {
      qc.invalidateQueries({ queryKey: ["agency", userId] });
    };
  });

  useEffect(() => {
    if (!userId) return;

    let channel = supabase.channel("agency-realtime");
    for (const table of WATCHED_TABLES) {
      channel = channel.on(
        "postgres_changes" as Parameters<typeof channel.on>[0],
        { event: "*", schema: "public", table },
        () => invalidateRef.current(),
      );
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
