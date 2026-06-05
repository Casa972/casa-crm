import { api } from "./api";
import { TABLES, type BienRow, type MandatRow, type CompromisRow, type ClientRow, type RevenuRow } from "../types/database";
import {
  bienFromRow, mandatFromRow, compromisFromRow, clientFromRow, revenuFromRow,
} from "./mappers";
import type { AgencyData, SessionUser } from "../types/domain";

/**
 * Charge l'intégralité des données de l'agence selon le rôle.
 * Le filtrage par agent est appliqué côté requête (et garanti par RLS en base).
 */
export async function loadAgencyData(user: SessionUser): Promise<AgencyData> {
  const isDir = user.role === "directeur";
  const clientFilter = isDir ? undefined : { agent_id: user.id };

  const [biens, mandats, compromis, clients, revenus] = await Promise.all([
    api.list<BienRow>(TABLES.biens),
    api.list<MandatRow>(TABLES.mandats),
    api.list<CompromisRow>(TABLES.compromis),
    api.list<ClientRow>(TABLES.clients, clientFilter),
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
