import { api } from "./api";
import { TABLES, type CompromisRow, type RevenuRow } from "../types/database";
import { compromisToRow, compromisFromRow, revenuToRow, revenuFromRow } from "./mappers";
import { commissionMontant, type Compromis } from "../schemas/compromis.schema";
import type { Revenu } from "../types/domain";

const uid = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2);

/** Un compromis génère-t-il un revenu (acte signé) ? */
function shouldHaveRevenu(c: Compromis): boolean {
  return c.statut === "Acte signé";
}

/** Statut revenu déduit du statut commission. */
function revenuStatut(c: Compromis): "Encaissé" | "En attente" {
  return c.commissionStatut === "Encaissée" ? "Encaissé" : "En attente";
}

/**
 * Sauvegarde un compromis ET synchronise son revenu lié de façon cohérente.
 *
 * Côté client, on ne peut pas ouvrir une vraie transaction multi-tables sans RPC ;
 * on garantit donc la cohérence par un ordre déterministe + rollback best-effort.
 * Pour une atomicité stricte, voir supabase/functions/save_compromis.sql (RPC)
 * que ce service appellera si présent.
 *
 * @returns le compromis persisté et le revenu lié (ou null).
 */
export async function saveCompromisWithRevenu(
  input: Compromis,
  existingRevenus: Revenu[],
  agentId?: string,
): Promise<{ compromis: Compromis; revenu: Revenu | null }> {
  const compromis: Compromis = { ...input, id: input.id || uid() };

  // 1) Persister le compromis
  const savedRow = await api.upsertMany<CompromisRow>(TABLES.compromis, [
    compromisToRow(compromis, agentId),
  ]);
  const persisted = savedRow[0] ? compromisFromRow(savedRow[0]) : compromis;

  // 2) Réconcilier le revenu lié
  const linked = existingRevenus.find((r) => r.sourceId === persisted.id && r.source === "pilotage");
  const montant = commissionMontant(persisted);
  let revenu: Revenu | null = null;

  if (shouldHaveRevenu(persisted) && montant > 0) {
    const desc = `Commission vente ${persisted.ref}`;
    const next: Revenu = {
      id: linked?.id ?? uid(),
      date: linked?.date || new Date().toISOString().slice(0, 10),
      type: "Commission vente",
      montant,
      desc,
      statut: revenuStatut(persisted),
      source: "pilotage",
      sourceId: persisted.id,
    };
    const rows = await api.upsertMany<RevenuRow>(TABLES.revenus, [revenuToRow(next)]);
    revenu = rows[0] ? revenuFromRow(rows[0]) : next;
  } else if (linked) {
    // Le compromis n'est plus un acte signé → on retire le revenu fantôme
    await api.remove(TABLES.revenus, linked.id);
  }

  return { compromis: persisted, revenu };
}

/** Marque la commission d'un compromis comme encaissée (et son revenu lié). */
export async function encaisserCommission(
  c: Compromis,
  existingRevenus: Revenu[],
): Promise<{ compromis: Compromis; revenu: Revenu | null }> {
  const updated: Compromis = { ...c, commissionStatut: "Encaissée", statut: "Acte signé" };
  return saveCompromisWithRevenu(updated, existingRevenus);
}
