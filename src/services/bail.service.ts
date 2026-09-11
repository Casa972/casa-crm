import { supabase } from "./supabase.client";
import { ApiError } from "./api";
import { bailSchema, type Bail } from "../schemas/bail.schema";

const TABLE = "baux";
const LOCAL_KEY = "casa.bail.v1";
const MIGRATED_KEY = "casa.bail.v1.migrated";

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

function toRow(b: Bail): Record<string, unknown> {
  return {
    id: b.id,
    agent_id: b.agentId ?? null,
    statut: b.statut,
    type_bail: b.typeBail,
    numero: b.numero || null,
    commune: b.commune || null,
    adresse_bien: b.adresseBien || null,
    date_debut: b.dateDebut || null,
    date_fin: b.dateFin || null,
    loyer_hc: b.loyerHc || 0,
    payload: b,
    updated_at: new Date().toISOString(),
  };
}

function fromRow(r: Record<string, unknown>): Bail {
  const payload = r.payload && typeof r.payload === "object" ? r.payload : {};
  const parsed = bailSchema.safeParse({
    ...(payload as object),
    id: String(r.id ?? (payload as { id?: string }).id ?? ""),
    agentId: r.agent_id ? String(r.agent_id) : (payload as { agentId?: string }).agentId,
    statut: r.statut ?? (payload as { statut?: string }).statut,
  });
  if (parsed.success) return parsed.data;
  return bailSchema.parse({
    id: String(r.id ?? ""),
    statut: r.statut === "Finalisé" ? "Finalisé" : "Brouillon",
    agentId: r.agent_id ? String(r.agent_id) : undefined,
    typeBail: String(r.type_bail ?? "Bail d'habitation meublé"),
    numero: String(r.numero ?? ""),
    commune: String(r.commune ?? ""),
    adresseBien: String(r.adresse_bien ?? ""),
    dateDebut: String(r.date_debut ?? ""),
    dateFin: String(r.date_fin ?? ""),
    loyerHc: Number(r.loyer_hc ?? 0),
  });
}

function readLocal(): Bail[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => x && typeof x === "object") as Bail[] : [];
  } catch {
    return [];
  }
}

export const bailService = {
  async list(agentId?: string): Promise<Bail[]> {
    let q = supabase.from(TABLE).select("*").order("updated_at", { ascending: false });
    if (agentId) q = q.eq("agent_id", agentId);
    const { data, error } = await q;
    if (error) throw new ApiError("Lecture des baux impossible", TABLE, "list", error);
    return (data ?? []).map((r) => fromRow(r as Record<string, unknown>));
  },

  async save(b: Bail, agentId?: string): Promise<Bail> {
    const row = toRow({ ...b, id: b.id || uid(), agentId: agentId ?? b.agentId });
    const { data, error } = await supabase.from(TABLE).upsert(row, { onConflict: "id" }).select().single();
    if (error) throw new ApiError("Sauvegarde du bail impossible", TABLE, "save", error);
    return fromRow(data as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw new ApiError("Suppression du bail impossible", TABLE, "remove", error);
  },

  /** Importe une seule fois les brouillons restés dans le navigateur. */
  async migrateFromLocal(agentId?: string): Promise<number> {
    if (typeof window === "undefined") return 0;
    if (localStorage.getItem(MIGRATED_KEY) === "1") return 0;
    const local = readLocal();
    if (local.length === 0) {
      localStorage.setItem(MIGRATED_KEY, "1");
      return 0;
    }
    const rows = local.map((b) => toRow({ ...b, agentId: b.agentId ?? agentId }));
    const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: "id" });
    if (error) throw new ApiError("Migration des baux locaux impossible", TABLE, "migrate", error);
    localStorage.setItem(MIGRATED_KEY, "1");
    return local.length;
  },
};
