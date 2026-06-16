/**
 * Barrel des types métier. Tous inférés depuis Zod (schemas/) :
 * une seule source de vérité, validation et typage ne divergent jamais.
 */
export type { Bien, BienForm } from "../schemas/bien.schema";
export type { Mandat, MandatForm } from "../schemas/mandat.schema";
export type { Compromis, CompromisForm } from "../schemas/compromis.schema";
export type { Client, ClientForm } from "../schemas/client.schema";
export type { Revenu, RevenuForm } from "../schemas/client.schema";
export type { Rdv, RdvForm } from "../schemas/rdv.schema";
export type { Tache, TacheForm } from "../schemas/tache.schema";
export type { Activite, ActiviteForm } from "../schemas/activite.schema";

export type {
  TypeBien, CategorieBien, StatutBien, TypeMandat, StatutMandat,
  StatutCompromis, StatutCommission, TypeHonoraires, StatutRevenu,
  TypeRevenu, TypeClient, EtapePipeline, RoleUtilisateur,
} from "../schemas/enums";

import type { Bien } from "../schemas/bien.schema";
import type { Mandat } from "../schemas/mandat.schema";
import type { Compromis } from "../schemas/compromis.schema";
import type { Client } from "../schemas/client.schema";
import type { Revenu } from "../schemas/client.schema";
import type { RoleUtilisateur } from "../schemas/enums";

/** Snapshot complet des données de l'agence (cache applicatif). */
export interface AgencyData {
  biens: Bien[];
  mandats: Mandat[];
  compromis: Compromis[];
  clients: Client[];
  revenus: Revenu[];
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: RoleUtilisateur;
  label: string;
}
