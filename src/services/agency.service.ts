import { api, ApiError } from "./api";
import { supabase } from "./supabase.client";
import { TABLES, type BienRow, type MandatRow, type CompromisRow, type ClientRow, type RevenuRow } from "../types/database";
import {
  bienFromRow, mandatFromRow, compromisFromRow, clientFromRow, revenuFromRow,
} from "./mappers";
import type { AgencyData, SessionUser } from "../types/domain";

/**
 * Charge l'intégralité des données de l'agence selon le rôle.
 * Le filtrage par agent est appliqué côté requête (et garanti par RLS en base).
 * Pour les non-directeurs, les clients sans agent_id (données legacy) sont inclus.
 */
export async function loadAgencyData(user: SessionUser): Promise<AgencyData> {
  const isDir = user.role === "directeur";

  // For non-directors: include both clients assigned to them AND legacy clients (agent_id = null)
  const clientsPromise = isDir
    ? api.list<ClientRow>(TABLES.clients)
    : supabase
        .from(TABLES.clients)
        .select("*")
        .or(`agent_id.eq.${user.id},agent_id.is.null`)
        .then(({ data, error }) => {
          if (error) throw new ApiError("Lecture clients impossible", TABLES.clients, "list", error);
          return (data ?? []) as ClientRow[];
        });

  const [biens, mandats, compromis, clients, revenus] = await Promise.all([
    api.list<BienRow>(TABLES.biens),
    api.list<MandatRow>(TABLES.mandats),
    api.list<CompromisRow>(TABLES.compromis),
    clientsPromise,
    api.list<RevenuRow>(TABLES.revenus),
  ]);

  return {
    biens: biens.map(bienFromRow),
    mandats: mandats.map(mandatFromRow),
    compromis: compromis.map(compromisFromRow),
    clients: clients.map(clientFromRow),
    revenus: revenus.map(revenuFromRow),
  };
}
