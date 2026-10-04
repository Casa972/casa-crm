import { api } from "./api";
import { TABLES, type RevenuRow } from "../types/database";
import { revenuFromRow, revenuToRow } from "./mappers";
import type { TypeRevenu } from "../schemas/enums";

const uid = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2);

/** Crée, met à jour ou retire le revenu lié à un document (bail, expertise, estimation). */
export async function syncSourceRevenu(input: {
  sourceId: string;
  source: string;
  type: TypeRevenu;
  montant: number;
  desc: string;
  date?: string;
  active: boolean;
}): Promise<void> {
  const rows = await api.list<RevenuRow>(TABLES.revenus);
  const linked = rows.map(revenuFromRow).find((r) => r.sourceId === input.sourceId && r.source === input.source);
  if (!input.active || input.montant <= 0) {
    if (linked) await api.remove(TABLES.revenus, linked.id);
    return;
  }
  const next = {
    id: linked?.id ?? uid(),
    date: linked?.date || input.date || new Date().toISOString().slice(0, 10),
    type: input.type,
    montant: Math.round(input.montant),
    desc: input.desc,
    statut: linked?.statut ?? "En attente" as const,
    source: input.source,
    sourceId: input.sourceId,
  };
  await api.upsertMany(TABLES.revenus, [revenuToRow(next)]);
}
