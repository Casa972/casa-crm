import { api } from "./api";
import { TABLES, type BienRow, type MandatRow, type ClientRow, type RevenuRow } from "../types/database";
import {
  bienToRow, bienFromRow, mandatToRow, mandatFromRow,
  clientToRow, clientFromRow, revenuToRow, revenuFromRow,
} from "./mappers";
import type { Bien, Mandat, Client, Revenu } from "../types/domain";

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
