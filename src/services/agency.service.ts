import { api } from "./api";
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
export async function loadAgencyData(_user: SessionUser): Promise<AgencyData> {
  const clientsPromise = api.list<ClientRow>(TABLES.clients);

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
