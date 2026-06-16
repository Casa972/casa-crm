/**
 * Types des lignes Supabase (snake_case), conformes au schéma SQL.
 * Le mapping snake↔camel est centralisé dans services/mappers.ts.
 *
 * Convention : <Table>Row = ligne lue, <Table>Insert = payload écriture.
 */

export interface BienRow {
  id: string;
  ref: string;
  type: string;
  adresse: string | null;
  commune: string;
  surface: number | null;
  chambres: number | null;
  prix: number | null;
  cat: string;
  statut: string;
  description: string | null; // ⚠ "desc" est réservé en SQL → "description"
  mandat_id: string | null;
  agent_id: string | null;
  created_at?: string;
}

export interface MandatRow {
  id: string;
  ref: string;
  bien_id: string | null;
  type: string;
  mandant: string;
  tel: string | null;
  email: string | null;
  date_debut: string | null;
  date_fin: string | null;
  honoraires: number | null;
  statut: string;
  notes: string | null;
  agent_id: string | null;
  created_at?: string;
}

export interface CompromisRow {
  id: string;
  ref: string;
  acheteur: string;
  vendeur: string | null;
  bien_ref: string | null;
  bien_desc: string | null;
  prix_vente: number | null;
  type_honoraires: string;
  honoraires: number | null;
  statut: string;
  commission_statut: string;
  notaire: string | null;
  financement: string | null;
  date_offre: string | null;
  date_compromis: string | null;
  date_acte_prev: string | null;
  date_acte_reel: string | null;
  sru_expire: string | null;
  cond_susp_expire: string | null;
  notes: string | null;
  agent_id: string | null;
  created_at?: string;
}

export interface ClientRow {
  id: string;
  prenom: string;
  nom: string | null;
  email: string | null;
  tel: string | null;
  type: string;
  statut: string;
  budget_max: number | null;
  commune: string | null;
  type_bien: string | null;
  chambres_min: number | null;
  notes: string | null;
  bien_id: string | null;
  dernier_contact: string | null;
  relance_date: string | null;
  financement: string | null;
  agent_id: string | null;
  created_at?: string;
}

export interface RevenuRow {
  id: string;
  date: string | null;
  type: string;
  montant: number | null;
  description: string | null;
  statut: string;
  source: string | null;
  source_id: string | null;
  created_at?: string;
}

export interface RdvRow {
  id: string;
  agent_id: string | null;
  titre: string;
  client_id: string | null;
  bien_ref: string | null;
  date: string;
  heure_debut: string;
  heure_fin: string;
  type_rdv: string;
  notes: string | null;
  statut: string;
  created_at?: string;
}

export interface TacheRow {
  id: string;
  agent_id: string | null;
  texte: string;
  done: boolean;
  priorite: string;
  date_echeance: string | null;
  created_at?: string;
}

export interface ActiviteRow {
  id: string;
  client_id: string;
  agent_id: string | null;
  type_activite: string;
  note: string;
  date: string;
  created_at?: string;
}

/** Nom logique → nom de table Supabase. */
export const TABLES = {
  biens: "biens",
  mandats: "mandats",
  compromis: "compromis",
  clients: "clients",
  revenus: "revenus",
  rdv: "rdv",
  taches: "taches",
  activites: "activites",
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
