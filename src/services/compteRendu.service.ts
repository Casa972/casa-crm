import { supabase } from "./supabase.client";
import { ApiError } from "./api";
import type { CompteRendu } from "../schemas/compteRendu.schema";

const TABLE = "comptes_rendus";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

function toRow(c: CompteRendu): Record<string, unknown> {
  return {
    id: c.id, agent_id: c.agentId ?? null,
    date: c.date || null, heure_debut: c.heureDebut || null, heure_fin: c.heureFin || null,
    redacteur: c.redacteur,
    bien_ref: c.bienRef || null, bien_adresse: c.bienAdresse || null,
    bien_commune: c.bienCommune || null, bien_type: c.bienType || null,
    bien_surface: c.bienSurface || 0, bien_prix: c.bienPrix || 0,
    proprietaire_nom: c.proprietaireNom || null, proprietaire_tel: c.proprietaireTel || null,
    client_id: c.clientId || null,
    visiteur_nom: c.visiteurNom, visiteur_tel: c.visiteurTel || null,
    visiteur_email: c.visiteurEmail || null, nb_personnes: c.nbPersonnes || 1,
    points_positifs: c.pointsPositifs || null, points_negatifs: c.pointsNegatifs || null,
    avis_client: c.avisClient, budget_client: c.budgetClient || 0,
    financement: c.financement || null, delai_achat: c.delaiAchat || null,
    suite_donner: c.suiteDonner, date_relance: c.dateRelance || null,
    observations: c.observations || null, statut: c.statut,
    updated_at: new Date().toISOString(),
  };
}

function fromRow(r: Record<string, unknown>): CompteRendu {
  const s = (v: unknown) => String(v ?? "");
  return {
    id: s(r.id), agentId: r.agent_id ? s(r.agent_id) : undefined,
    date: s(r.date), heureDebut: s(r.heure_debut), heureFin: s(r.heure_fin),
    redacteur: s(r.redacteur) || "M. Luc CLEMENTE",
    bienRef: s(r.bien_ref), bienAdresse: s(r.bien_adresse),
    bienCommune: s(r.bien_commune), bienType: s(r.bien_type),
    bienSurface: Number(r.bien_surface ?? 0), bienPrix: Number(r.bien_prix ?? 0),
    proprietaireNom: s(r.proprietaire_nom), proprietaireTel: s(r.proprietaire_tel),
    clientId: s(r.client_id),
    visiteurNom: s(r.visiteur_nom), visiteurTel: s(r.visiteur_tel),
    visiteurEmail: s(r.visiteur_email), nbPersonnes: Number(r.nb_personnes ?? 1),
    pointsPositifs: s(r.points_positifs), pointsNegatifs: s(r.points_negatifs),
    avisClient: (s(r.avis_client) as CompteRendu["avisClient"]) || "Intéressé",
    budgetClient: Number(r.budget_client ?? 0),
    financement: s(r.financement), delaiAchat: s(r.delai_achat),
    suiteDonner: (s(r.suite_donner) as CompteRendu["suiteDonner"]) || "En réflexion",
    dateRelance: s(r.date_relance),
    observations: s(r.observations),
    statut: (s(r.statut) as CompteRendu["statut"]) || "Brouillon",
  };
}

export const compteRenduService = {
  async list(agentId?: string): Promise<CompteRendu[]> {
    let q = supabase.from(TABLE).select("*").order("date", { ascending: false });
    if (agentId) q = q.eq("agent_id", agentId);
    const { data, error } = await q;
    if (error) throw new ApiError("Lecture CRV impossible", TABLE, "list", error);
    return (data ?? []).map(r => fromRow(r as Record<string, unknown>));
  },
  async save(c: CompteRendu, agentId?: string): Promise<CompteRendu> {
    const row = toRow({ ...c, id: c.id || uid(), agentId: agentId ?? c.agentId });
    const { data, error } = await supabase.from(TABLE).upsert(row, { onConflict: "id" }).select().single();
    if (error) throw new ApiError("Sauvegarde CRV impossible", TABLE, "save", error);
    return fromRow(data as Record<string, unknown>);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw new ApiError("Suppression CRV impossible", TABLE, "remove", error);
  },
};

export { uid };
