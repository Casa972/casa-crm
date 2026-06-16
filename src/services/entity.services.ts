import { api } from "./api";
import { supabase } from "./supabase.client";
import { ApiError } from "./api";
import { TABLES, type BienRow, type MandatRow, type ClientRow, type RevenuRow, type RdvRow, type TacheRow, type ActiviteRow } from "../types/database";
import {
  bienToRow, bienFromRow, mandatToRow, mandatFromRow,
  clientToRow, clientFromRow, revenuToRow, revenuFromRow,
  rdvToRow, rdvFromRow, tacheToRow, tacheFromRow, activiteToRow, activiteFromRow,
} from "./mappers";
import type { Bien, Mandat, Client, Revenu, Rdv, Tache, Activite } from "../types/domain";

const uid = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2);

export const bienService = {
  async save(b: Bien, agentId?: string): Promise<Bien> {
    const row = { ...b, id: b.id || uid() };
    const [saved] = await api.upsertMany<BienRow>(TABLES.biens, [bienToRow(row, agentId)]);
    return saved ? bienFromRow(saved) : row;
  },
  remove: (id: string) => api.remove(TABLES.biens, id),
};

export const mandatService = {
  async save(m: Mandat, agentId?: string): Promise<Mandat> {
    const row = { ...m, id: m.id || uid() };
    const [saved] = await api.upsertMany<MandatRow>(TABLES.mandats, [mandatToRow(row, agentId)]);
    return saved ? mandatFromRow(saved) : row;
  },
  remove: (id: string) => api.remove(TABLES.mandats, id),
};

export const clientService = {
  async save(c: Client, agentId?: string): Promise<Client> {
    const row = { ...c, id: c.id || uid() };
    const [saved] = await api.upsertMany<ClientRow>(TABLES.clients, [clientToRow(row, agentId)]);
    return saved ? clientFromRow(saved) : row;
  },
  remove: (id: string) => api.remove(TABLES.clients, id),
};

export const revenuService = {
  async save(r: Revenu): Promise<Revenu> {
    const row = { ...r, id: r.id || uid() };
    const [saved] = await api.upsertMany<RevenuRow>(TABLES.revenus, [revenuToRow(row)]);
    return saved ? revenuFromRow(saved) : row;
  },
  remove: (id: string) => api.remove(TABLES.revenus, id),
};

export const rdvService = {
  async list(agentId?: string): Promise<Rdv[]> {
    let q = supabase.from(TABLES.rdv).select("*").order("date", { ascending: true }).order("heure_debut", { ascending: true });
    if (agentId) q = q.eq("agent_id", agentId);
    const { data, error } = await q;
    if (error) throw new ApiError("Lecture RDV impossible", TABLES.rdv, "list", error);
    return (data ?? []).map(r => rdvFromRow(r as RdvRow));
  },
  async save(rdv: Rdv, agentId?: string): Promise<Rdv> {
    const row = { ...rdv, id: rdv.id || uid() };
    const [saved] = await api.upsertMany<RdvRow>(TABLES.rdv, [rdvToRow(row, agentId)]);
    return saved ? rdvFromRow(saved) : row;
  },
  remove: (id: string) => api.remove(TABLES.rdv, id),
};

export const tacheService = {
  async list(agentId?: string): Promise<Tache[]> {
    let q = supabase.from(TABLES.taches).select("*").order("created_at", { ascending: false });
    if (agentId) q = q.eq("agent_id", agentId);
    const { data, error } = await q;
    if (error) throw new ApiError("Lecture tâches impossible", TABLES.taches, "list", error);
    return (data ?? []).map(r => tacheFromRow(r as TacheRow));
  },
  async save(t: Tache, agentId?: string): Promise<Tache> {
    const row = { ...t, id: t.id || uid() };
    const [saved] = await api.upsertMany<TacheRow>(TABLES.taches, [tacheToRow(row, agentId)]);
    return saved ? tacheFromRow(saved) : row;
  },
  remove: (id: string) => api.remove(TABLES.taches, id),
};

export const activiteService = {
  async list(clientId?: string, agentId?: string): Promise<Activite[]> {
    let q = supabase.from(TABLES.activites).select("*").order("date", { ascending: false });
    if (clientId) q = q.eq("client_id", clientId);
    if (agentId) q = q.eq("agent_id", agentId);
    const { data, error } = await q;
    if (error) throw new ApiError("Lecture activités impossible", TABLES.activites, "list", error);
    return (data ?? []).map(r => activiteFromRow(r as ActiviteRow));
  },
  async save(a: Activite, agentId?: string): Promise<Activite> {
    const row = { ...a, id: a.id || uid() };
    const [saved] = await api.upsertMany<ActiviteRow>(TABLES.activites, [activiteToRow(row, agentId)]);
    return saved ? activiteFromRow(saved) : row;
  },
  remove: (id: string) => api.remove(TABLES.activites, id),
};
