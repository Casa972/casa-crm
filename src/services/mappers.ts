/**
 * Mappers snake_case (DB) ↔ camelCase (domaine), entièrement typés.
 * Centralisés ici pour éviter les divergences silencieuses sur les jointures.
 *
 * Règle : "" (formulaire) → null en base ; null (base) → "" / 0 dans le domaine.
 */
import type {
  BienRow, MandatRow, CompromisRow, ClientRow, RevenuRow,
  RdvRow, TacheRow, ActiviteRow,
} from "../types/database";
import type { Bien, Mandat, Compromis, Client, Revenu, Rdv, Tache, Activite } from "../types/domain";
import type { TypeRdv, StatutRdv } from "../schemas/rdv.schema";
import type { PrioriteTache } from "../schemas/tache.schema";
import type { TypeActivite } from "../schemas/activite.schema";
import type {
  TypeBien, CategorieBien, StatutBien, TypeMandat, StatutMandat,
  StatutCompromis, StatutCommission, TypeHonoraires, TypeClient,
  EtapePipeline, StatutRevenu, TypeRevenu,
} from "../schemas/enums";

const s = (v: string | null | undefined): string => v ?? "";
const n = (v: number | null | undefined): number => v ?? 0;
const nn = (v: string): string | null => (v === "" ? null : v);
const nz = (v: number): number | null => v;

/* ── Bien ── */
export const bienFromRow = (r: BienRow): Bien => ({
  id: r.id,
  ref: r.ref,
  type: r.type as TypeBien,
  adresse: s(r.adresse),
  commune: r.commune,
  surface: n(r.surface),
  chambres: n(r.chambres),
  prix: n(r.prix),
  cat: r.cat as CategorieBien,
  statut: r.statut as StatutBien,
  desc: s(r.description),
  mandatId: s(r.mandat_id),
});

export const bienToRow = (b: Bien, agentId?: string): Partial<BienRow> => ({
  id: b.id,
  ref: b.ref,
  type: b.type,
  adresse: nn(b.adresse),
  commune: b.commune,
  surface: nz(b.surface),
  chambres: nz(b.chambres),
  prix: nz(b.prix),
  cat: b.cat,
  statut: b.statut,
  description: nn(b.desc),
  mandat_id: nn(b.mandatId),
  ...(agentId ? { agent_id: agentId } : {}),
});

/* ── Mandat ── */
export const mandatFromRow = (r: MandatRow): Mandat => ({
  id: r.id,
  ref: r.ref,
  bienId: s(r.bien_id),
  type: r.type as TypeMandat,
  mandant: r.mandant,
  tel: s(r.tel),
  email: s(r.email),
  dateDebut: s(r.date_debut),
  dateFin: s(r.date_fin),
  honoraires: n(r.honoraires),
  statut: r.statut as StatutMandat,
  notes: s(r.notes),
  agentId: r.agent_id ?? undefined,
});

export const mandatToRow = (m: Mandat, agentId?: string): Partial<MandatRow> => ({
  id: m.id,
  ref: m.ref,
  bien_id: nn(m.bienId),
  type: m.type,
  mandant: m.mandant,
  tel: nn(m.tel),
  email: nn(m.email),
  date_debut: nn(m.dateDebut),
  date_fin: nn(m.dateFin),
  honoraires: nz(m.honoraires),
  statut: m.statut,
  notes: nn(m.notes),
  ...(agentId ? { agent_id: agentId } : {}),
});

/* ── Compromis ── */
export const compromisFromRow = (r: CompromisRow): Compromis => ({
  id: r.id,
  ref: r.ref,
  acheteur: r.acheteur,
  vendeur: s(r.vendeur),
  bienRef: s(r.bien_ref),
  bienDesc: s(r.bien_desc),
  prixVente: n(r.prix_vente),
  typeHonoraires: r.type_honoraires as TypeHonoraires,
  honoraires: n(r.honoraires),
  statut: r.statut as StatutCompromis,
  commissionStatut: r.commission_statut as StatutCommission,
  notaire: s(r.notaire),
  financement: s(r.financement),
  dateOffre: s(r.date_offre),
  dateCompromis: s(r.date_compromis),
  dateActePrev: s(r.date_acte_prev),
  dateActeReel: s(r.date_acte_reel),
  sruExpire: s(r.sru_expire),
  condSuspExpire: s(r.cond_susp_expire),
  notes: s(r.notes),
  agentId: r.agent_id ?? undefined,
});

export const compromisToRow = (c: Compromis, agentId?: string): Partial<CompromisRow> => ({
  id: c.id,
  ref: c.ref,
  acheteur: c.acheteur,
  vendeur: nn(c.vendeur),
  bien_ref: nn(c.bienRef),
  bien_desc: nn(c.bienDesc),
  prix_vente: nz(c.prixVente),
  type_honoraires: c.typeHonoraires,
  honoraires: nz(c.honoraires),
  statut: c.statut,
  commission_statut: c.commissionStatut,
  notaire: nn(c.notaire),
  financement: nn(c.financement),
  date_offre: nn(c.dateOffre),
  date_compromis: nn(c.dateCompromis),
  date_acte_prev: nn(c.dateActePrev),
  date_acte_reel: nn(c.dateActeReel),
  sru_expire: nn(c.sruExpire),
  cond_susp_expire: nn(c.condSuspExpire),
  notes: nn(c.notes),
  ...(agentId ? { agent_id: agentId } : c.agentId ? { agent_id: c.agentId } : {}),
});

/* ── Client ── */
export const clientFromRow = (r: ClientRow): Client => ({
  id: r.id,
  prenom: r.prenom,
  nom: s(r.nom),
  email: s(r.email),
  tel: s(r.tel),
  type: r.type as TypeClient,
  statut: r.statut as EtapePipeline,
  budgetMax: n(r.budget_max),
  commune: s(r.commune),
  typeBien: s(r.type_bien),
  chambresMin: n(r.chambres_min),
  notes: s(r.notes),
  bienId: s(r.bien_id),
  dernierContact: s(r.dernier_contact),
  relanceDate: s(r.relance_date),
  financement: s(r.financement),
  agentId: r.agent_id ?? undefined,
});

export const clientToRow = (c: Client, agentId?: string): Partial<ClientRow> => ({
  id: c.id,
  prenom: c.prenom,
  nom: nn(c.nom),
  email: nn(c.email),
  tel: nn(c.tel),
  type: c.type,
  statut: c.statut,
  budget_max: nz(c.budgetMax),
  commune: nn(c.commune),
  type_bien: nn(c.typeBien),
  chambres_min: nz(c.chambresMin),
  notes: nn(c.notes),
  bien_id: nn(c.bienId),
  dernier_contact: nn(c.dernierContact),
  relance_date: nn(c.relanceDate),
  financement: nn(c.financement),
  ...(agentId ? { agent_id: agentId } : c.agentId ? { agent_id: c.agentId } : {}),
});

/* ── Revenu ── */
export const revenuFromRow = (r: RevenuRow): Revenu => ({
  id: r.id,
  date: s(r.date),
  type: r.type as TypeRevenu,
  montant: n(r.montant),
  desc: s(r.description),
  statut: r.statut as StatutRevenu,
  source: r.source ?? undefined,
  sourceId: r.source_id ?? undefined,
});

export const revenuToRow = (r: Revenu): Partial<RevenuRow> => ({
  id: r.id,
  date: nn(r.date),
  type: r.type,
  montant: nz(r.montant),
  description: nn(r.desc),
  statut: r.statut,
  source: r.source ?? null,
  source_id: r.sourceId ?? null,
});

/* ── Rdv ── */
export const rdvFromRow = (r: RdvRow): Rdv => ({
  id: r.id,
  agentId: r.agent_id ?? undefined,
  titre: r.titre,
  clientId: r.client_id ?? undefined,
  bienRef: r.bien_ref ?? undefined,
  date: r.date,
  heureDebut: r.heure_debut,
  heureFin: r.heure_fin,
  typeRdv: r.type_rdv as TypeRdv,
  notes: r.notes ?? undefined,
  statut: r.statut as StatutRdv,
});

export const rdvToRow = (rdv: Rdv, agentId?: string): Partial<RdvRow> => ({
  id: rdv.id,
  agent_id: agentId ?? rdv.agentId ?? null,
  titre: rdv.titre,
  client_id: rdv.clientId ?? null,
  bien_ref: rdv.bienRef ?? null,
  date: rdv.date,
  heure_debut: rdv.heureDebut,
  heure_fin: rdv.heureFin,
  type_rdv: rdv.typeRdv,
  notes: rdv.notes ?? null,
  statut: rdv.statut,
});

/* ── Tache ── */
export const tacheFromRow = (r: TacheRow): Tache => ({
  id: r.id,
  agentId: r.agent_id ?? undefined,
  texte: r.texte,
  done: r.done,
  priorite: r.priorite as PrioriteTache,
  dateEcheance: r.date_echeance ?? undefined,
});

export const tacheToRow = (t: Tache, agentId?: string): Partial<TacheRow> => ({
  id: t.id,
  agent_id: agentId ?? t.agentId ?? null,
  texte: t.texte,
  done: t.done,
  priorite: t.priorite,
  date_echeance: t.dateEcheance ?? null,
});

/* ── Activite ── */
export const activiteFromRow = (r: ActiviteRow): Activite => ({
  id: r.id,
  clientId: r.client_id,
  agentId: r.agent_id ?? undefined,
  typeActivite: r.type_activite as TypeActivite,
  note: r.note,
  date: r.date,
});

export const activiteToRow = (a: Activite, agentId?: string): Partial<ActiviteRow> => ({
  id: a.id,
  client_id: a.clientId,
  agent_id: agentId ?? a.agentId ?? null,
  type_activite: a.typeActivite,
  note: a.note,
  date: a.date,
});
