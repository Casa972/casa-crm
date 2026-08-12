import { supabase } from "./supabase.client";
import { ApiError } from "./api";
import type { Estimation } from "../schemas/estimation.schema";

const TABLE = "estimations";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

function toRow(e: Estimation): Record<string, unknown> {
  return {
    id: e.id,
    client_id: e.clientId || null,
    agent_id: e.agentId || null,
    statut: e.statut,
    type_bien: e.typeBien,
    residence: e.residence || null,
    adresse: e.adresse || null,
    commune: e.commune || null,
    code_postal: e.codePostal || null,
    section_cadastrale: e.sectionCadastrale || null,
    parcelles: e.parcelles || null,
    demandeur: e.demandeur,
    redacteur: e.redacteur,
    date_estimation: e.dateEstimation || null,
    photo_base64: e.photoBase64 || null,
    etage: e.etage || null,
    regime_juridique: e.regimeJuridique || null,
    charges_copro: e.chargesCopro || 0,
    surface_habitable: e.surfaceHabitable,
    surface_terrasse: e.surfaceTerrasse || 0,
    surface_jardin: e.surfaceJardin || 0,
    surface_terrain: e.surfaceTerrain || 0,
    mode_constructif: e.modeConstructif || null,
    etat_general: e.etatGeneral,
    distribution: e.distribution || null,
    parking: e.parking || null,
    cave: e.cave,
    piscine: e.piscine,
    vendu_meuble: e.venduMeuble,
    notes_description: e.notesDescription || null,
    structure_general: e.structureGeneral,
    finitions_interieures: e.finitionsInterieures,
    equipements_sanitaires: e.equipementsSanitaires,
    travaux_a_prevoir: e.travauxAPrevoir || null,
    description_environnement: e.descriptionEnvironnement || null,
    refs_annonces: JSON.stringify(e.refsAnnonces),
    refs_dvf: JSON.stringify(e.refsDVF),
    commentaire_marche: e.commentaireMarche || null,
    avec_locatif: e.avecLocatif,
    saisons: JSON.stringify(e.saisons),
    criteres: JSON.stringify(e.criteres),
    argumentaire_valeur: e.argumentaireValeur || null,
    prix_m2_retenu: e.prixM2Retenu || 0,
    valeur_venale: e.valeurVenale,
    valeur_coup_de_coeur: e.valeurCoupDeCœur || 0,
    argumentaire_coup_de_coeur: e.argumentaireCoupDeCœur || null,
    limites: e.limites || null,
    // Nouveaux champs — stockés en JSON dans la colonne extra_json
    extra_json: JSON.stringify({
      lieu: e.lieu ?? "Le Lamentin (Martinique)",
      certificationExpert: e.certificationExpert ?? "Expert Immobilier Certifié INIGEP®",
      diagnosticsDDT: e.diagnosticsDDT ?? [],
      observationsVisuelles: e.observationsVisuelles ?? [],
      indicateursMarche: e.indicateursMarche ?? [],
      synthesePonderation: e.synthesePonderation ?? [],
      fourchetteBasse: e.fourchetteBasse ?? 0,
      fourchetteHaute: e.fourchetteHaute ?? 0,
      piecesAnalysees: e.piecesAnalysees ?? [],
      sourcesExpertise: e.sourcesExpertise ?? [],
      loyerBrut: e.loyerBrut ?? 0,
      loyerRetenu: e.loyerRetenu ?? 0,
      chargesLocatif: e.chargesLocatif ?? 0,
      taxeFonciere: e.taxeFonciere ?? 0,
      partNonRecuperable: e.partNonRecuperable ?? 0,
      tauxVacance: e.tauxVacance ?? "",
      delaiRelocation: e.delaiRelocation ?? "",
      cibleLocataire: e.cibleLocataire ?? "",
    }),
    type_doc: e.typeDoc ?? "expertise",
    updated_at: new Date().toISOString(),
  };
}

function fromRow(r: Record<string, unknown>): Estimation {
  const parse = (v: unknown) => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") { try { return JSON.parse(v); } catch { return []; } }
    return [];
  };
  return {
    id: String(r.id ?? ""),
    clientId: String(r.client_id ?? ""),
    agentId: r.agent_id ? String(r.agent_id) : undefined,
    statut: (r.statut as Estimation["statut"]) ?? "Brouillon",
    typeDoc: (r.type_doc as "valeur_venale" | "expertise") ?? "expertise",
    typeBien: (r.type_bien as Estimation["typeBien"]) ?? "Appartement en copropriété",
    residence: String(r.residence ?? ""),
    adresse: String(r.adresse ?? ""),
    commune: String(r.commune ?? ""),
    codePostal: String(r.code_postal ?? "97200"),
    sectionCadastrale: String(r.section_cadastrale ?? ""),
    parcelles: String(r.parcelles ?? ""),
    demandeur: String(r.demandeur ?? ""),
    redacteur: String(r.redacteur ?? "M. Luc CLEMENTE"),
    dateEstimation: String(r.date_estimation ?? ""),
    photoBase64: String(r.photo_base64 ?? ""),
    etage: String(r.etage ?? ""),
    regimeJuridique: String(r.regime_juridique ?? ""),
    chargesCopro: Number(r.charges_copro ?? 0),
    surfaceHabitable: Number(r.surface_habitable ?? 0),
    surfaceTerrasse: Number(r.surface_terrasse ?? 0),
    surfaceJardin: Number(r.surface_jardin ?? 0),
    surfaceTerrain: Number(r.surface_terrain ?? 0),
    modeConstructif: String(r.mode_constructif ?? ""),
    etatGeneral: (r.etat_general as Estimation["etatGeneral"]) ?? "Bon état",
    distribution: String(r.distribution ?? ""),
    parking: String(r.parking ?? ""),
    cave: Boolean(r.cave),
    piscine: Boolean(r.piscine),
    venduMeuble: Boolean(r.vendu_meuble),
    notesDescription: String(r.notes_description ?? ""),
    structureGeneral: (r.structure_general as Estimation["structureGeneral"]) ?? "Bon état",
    finitionsInterieures: (r.finitions_interieures as Estimation["finitionsInterieures"]) ?? "Bon état",
    equipementsSanitaires: (r.equipements_sanitaires as Estimation["equipementsSanitaires"]) ?? "Bon état",
    travauxAPrevoir: String(r.travaux_a_prevoir ?? "Aucun à court terme"),
    descriptionEnvironnement: String(r.description_environnement ?? ""),
    refsAnnonces: parse(r.refs_annonces),
    refsDVF: parse(r.refs_dvf),
    commentaireMarche: String(r.commentaire_marche ?? ""),
    avecLocatif: Boolean(r.avec_locatif),
    saisons: parse(r.saisons).length > 0 ? parse(r.saisons) : [
      { periode: "Haute saison (juil.–août, fêtes)", tarifNuit: 0, nbNuits: 0 },
      { periode: "Moyenne saison (vacances scolaires)", tarifNuit: 0, nbNuits: 0 },
      { periode: "Basse saison", tarifNuit: 0, nbNuits: 0 },
    ],
    criteres: parse(r.criteres),
    argumentaireValeur: String(r.argumentaire_valeur ?? ""),
    prixM2Retenu: Number(r.prix_m2_retenu ?? 0),
    valeurVenale: Number(r.valeur_venale ?? 0),
    valeurCoupDeCœur: Number(r.valeur_coup_de_coeur ?? 0),
    argumentaireCoupDeCœur: String(r.argumentaire_coup_de_coeur ?? ""),
    limites: String(r.limites ?? ""),
    // Nouveaux champs depuis extra_json
    ...(() => {
      const x: Record<string, unknown> = {};
      try { Object.assign(x, JSON.parse(String(r.extra_json ?? "{}"))); } catch { /* ignore */ }
      return {
        lieu: String(x.lieu ?? "Le Lamentin (Martinique)"),
        certificationExpert: String(x.certificationExpert ?? "Expert Immobilier Certifié INIGEP®"),
        diagnosticsDDT: Array.isArray(x.diagnosticsDDT) ? x.diagnosticsDDT : [],
        observationsVisuelles: Array.isArray(x.observationsVisuelles) ? x.observationsVisuelles : [],
        indicateursMarche: Array.isArray(x.indicateursMarche) ? x.indicateursMarche : [],
        synthesePonderation: Array.isArray(x.synthesePonderation) ? x.synthesePonderation : [],
        fourchetteBasse: Number(x.fourchetteBasse ?? 0),
        fourchetteHaute: Number(x.fourchetteHaute ?? 0),
        piecesAnalysees: Array.isArray(x.piecesAnalysees) ? x.piecesAnalysees : [],
        sourcesExpertise: Array.isArray(x.sourcesExpertise) ? x.sourcesExpertise : [],
        loyerBrut: Number(x.loyerBrut ?? 0),
        loyerRetenu: Number(x.loyerRetenu ?? 0),
        chargesLocatif: Number(x.chargesLocatif ?? 0),
        taxeFonciere: Number(x.taxeFonciere ?? 0),
        partNonRecuperable: Number(x.partNonRecuperable ?? 0),
        tauxVacance: String(x.tauxVacance ?? ""),
        delaiRelocation: String(x.delaiRelocation ?? ""),
        cibleLocataire: String(x.cibleLocataire ?? ""),
      };
    })(),
  };
}

export const estimationService = {
  async list(agentId?: string): Promise<Estimation[]> {
    let q = supabase.from(TABLE).select("*").order("updated_at", { ascending: false });
    if (agentId) q = q.eq("agent_id", agentId);
    const { data, error } = await q;
    if (error) throw new ApiError("Lecture estimations impossible", TABLE, "list", error);
    return (data ?? []).map((r) => fromRow(r as Record<string, unknown>));
  },

  async save(e: Estimation, agentId?: string): Promise<Estimation> {
    const row = toRow({ ...e, id: e.id || uid(), agentId: agentId ?? e.agentId });
    const { data, error } = await supabase.from(TABLE).upsert(row, { onConflict: "id" }).select().single();
    if (error) throw new ApiError("Sauvegarde estimation impossible", TABLE, "save", error);
    return fromRow(data as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw new ApiError("Suppression estimation impossible", TABLE, "remove", error);
  },
};

export { uid };
