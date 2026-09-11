import { supabase } from "./supabase.client";
import { ApiError } from "./api";
import type { ValeurLocative } from "../schemas/valeurLocative.schema";

const TABLE = "valeurs_locatives";
const LOCAL_KEY = "casa.valeur_locative.v1";
const MIGRATED_KEY = "casa.valeur_locative.v1.migrated";

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

function toRow(d: ValeurLocative): Record<string, unknown> {
  return {
    id: d.id,
    agent_id: d.agentId ?? null,
    statut: d.statut,
    titre_bien: d.titreBien || null,
    regime_locatif: d.regimeLocatif || null,
    commune: d.commune || null,
    mandant_nom: d.mandantNom || null,
    loyer_mensuel_hc: d.loyerMensuelHc || 0,
    payload: d,
    updated_at: new Date().toISOString(),
  };
}

function fromRow(r: Record<string, unknown>): ValeurLocative {
  const payload = (r.payload && typeof r.payload === "object" ? r.payload : {}) as ValeurLocative;
  return {
    ...payload,
    id: String(r.id ?? payload.id ?? ""),
    agentId: r.agent_id ? String(r.agent_id) : payload.agentId,
    statut: (r.statut as ValeurLocative["statut"]) ?? payload.statut ?? "Brouillon",
  };
}

function readLocal(): ValeurLocative[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as ValeurLocative[] : [];
  } catch {
    return [];
  }
}

export const valeurLocativeService = {
  async list(agentId?: string): Promise<ValeurLocative[]> {
    let q = supabase.from(TABLE).select("*").order("updated_at", { ascending: false });
    if (agentId) q = q.eq("agent_id", agentId);
    const { data, error } = await q;
    if (error) throw new ApiError("Lecture des valeurs locatives impossible", TABLE, "list", error);
    return (data ?? []).map((r) => fromRow(r as Record<string, unknown>));
  },

  async save(d: ValeurLocative, agentId?: string): Promise<ValeurLocative> {
    const row = toRow({ ...d, id: d.id || uid(), agentId: agentId ?? d.agentId });
    const { data, error } = await supabase.from(TABLE).upsert(row, { onConflict: "id" }).select().single();
    if (error) throw new ApiError("Sauvegarde de la valeur locative impossible", TABLE, "save", error);
    return fromRow(data as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw new ApiError("Suppression de la valeur locative impossible", TABLE, "remove", error);
  },

  async migrateFromLocal(agentId?: string): Promise<number> {
    if (typeof window === "undefined") return 0;
    if (localStorage.getItem(MIGRATED_KEY) === "1") return 0;
    const local = readLocal();
    if (local.length === 0) {
      localStorage.setItem(MIGRATED_KEY, "1");
      return 0;
    }
    const rows = local.map((d) => toRow({ ...d, agentId: d.agentId ?? agentId }));
    const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: "id" });
    if (error) throw new ApiError("Migration des valeurs locatives locales impossible", TABLE, "migrate", error);
    localStorage.setItem(MIGRATED_KEY, "1");
    return local.length;
  },
};
