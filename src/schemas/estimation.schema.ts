import { z } from "zod";

export const TypeBienEstimation = z.enum([
  "Appartement en copropriété",
  "Maison individuelle",
  "Villa",
  "Terrain",
  "Local commercial",
  "Fonds de commerce",
]);

export const EtatGeneral = z.enum(["Parfait état", "Très bon état", "Bon état", "État moyen", "Travaux à prévoir"]);
export const ImpactCritere = z.enum(["Positif fort", "Positif", "Neutre", "Négatif", "Négatif fort"]);

// ── Sous-schémas nouveaux ──────────────────────────────────────────────────────

export const diagnosticDDTSchema = z.object({
  id: z.string(),
  diagnostic: z.string().default(""),
  resultat: z.string().default(""),
  impact: z.string().default("Sans impact"),
});
export type DiagnosticDDT = z.infer<typeof diagnosticDDTSchema>;

export const observationVisuelleSchema = z.object({
  id: z.string(),
  zone: z.string().default(""),
  constat: z.string().default(""),
  preconisation: z.string().default(""),
});
export type ObservationVisuelle = z.infer<typeof observationVisuelleSchema>;

export const indicateurMarcheSchema = z.object({
  id: z.string(),
  indicateur: z.string().default(""),
  valeur: z.string().default(""),
  source: z.string().default(""),
});
export type IndicateurMarche = z.infer<typeof indicateurMarcheSchema>;

export const synthesePonderationSchema = z.object({
  id: z.string(),
  methode: z.string().default(""),
  valeurIndicative: z.coerce.number().default(0),
  ponderation: z.string().default(""),
  contribution: z.coerce.number().default(0),
});
export type SynthesePonderation = z.infer<typeof synthesePonderationSchema>;

export const pieceAnalyseeSchema = z.object({
  id: z.string(),
  reference: z.string().default(""),
  nature: z.string().default(""),
  date: z.string().default(""),
  emetteur: z.string().default(""),
});
export type PieceAnalysee = z.infer<typeof pieceAnalyseeSchema>;

export const sourceExpertiseSchema = z.object({
  id: z.string(),
  source: z.string().default(""),
  usage: z.string().default(""),
  date: z.string().default(""),
});
export type SourceExpertise = z.infer<typeof sourceExpertiseSchema>;

// ── Schémas existants enrichis ────────────────────────────────────────────────

export const refMarcheSchema = z.object({
  id: z.string(),
  type: z.string().default(""),
  surface: z.coerce.number().default(0),
  prix: z.coerce.number().default(0),
  prixM2: z.coerce.number().default(0),
  observations: z.string().default(""),
  source: z.enum(["Annonce active", "DVF"]).default("Annonce active"),
  // Nouveaux champs pour le rapport d'expertise
  reference: z.string().default(""),
  localisation: z.string().default(""),
  differences: z.string().default(""),
});
export type RefMarche = z.infer<typeof refMarcheSchema>;

export const critereMarcheSchema = z.object({
  id: z.string(),
  critere: z.string(),
  analyse: z.string().default(""),
  impact: ImpactCritere,
  // Nouveaux champs pour la grille d'ajustements 4 colonnes
  situationBien: z.string().default(""),
  ajustement: z.string().default(""),
});
export type CritereMarche = z.infer<typeof critereMarcheSchema>;

export const saisonLocatifSchema = z.object({
  periode: z.string(),
  tarifNuit: z.coerce.number().default(0),
  nbNuits: z.coerce.number().default(0),
});
export type SaisonLocatif = z.infer<typeof saisonLocatifSchema>;

// ── Schéma principal ───────────────────────────────────────────────────────────

export const estimationSchema = z.object({
  id: z.string(),
  clientId: z.string().default(""),

  // Page de garde
  typeBien: TypeBienEstimation,
  residence: z.string().default(""),
  adresse: z.string().default(""),
  commune: z.string().default(""),
  codePostal: z.string().default("97200"),
  sectionCadastrale: z.string().default(""),
  parcelles: z.string().default(""),
  demandeur: z.string().min(1, "Demandeur requis"),
  redacteur: z.string().default("M. Luc CLEMENTE"),
  dateEstimation: z.string().default(""),
  photoBase64: z.string().default(""),
  lieu: z.string().default("Le Lamentin (Martinique)"),
  certificationExpert: z.string().default("Expert Immobilier Certifié INIGEP®"),

  // Section 2 — Identification
  etage: z.string().default(""),
  regimeJuridique: z.string().default(""),
  chargesCopro: z.coerce.number().default(0),
  surfaceHabitable: z.coerce.number().min(1, "Surface requise"),
  surfaceTerrasse: z.coerce.number().default(0),
  surfaceJardin: z.coerce.number().default(0),
  surfaceTerrain: z.coerce.number().default(0),
  modeConstructif: z.string().default(""),
  etatGeneral: EtatGeneral,
  distribution: z.string().default(""),
  parking: z.string().default(""),
  cave: z.boolean().default(false),
  piscine: z.boolean().default(false),
  venduMeuble: z.boolean().default(false),
  notesDescription: z.string().default(""),

  // Section 3.1 — État général
  structureGeneral: EtatGeneral,
  finitionsInterieures: EtatGeneral,
  equipementsSanitaires: EtatGeneral,
  travauxAPrevoir: z.string().default(""),

  // Section 3.2 — Diagnostics DDT
  diagnosticsDDT: z.array(diagnosticDDTSchema).default([]),

  // Section 3.3 — Observations visuelles
  observationsVisuelles: z.array(observationVisuelleSchema).default([]),

  // Section 4 — Environnement
  descriptionEnvironnement: z.string().default(""),

  // Section 5 — Étude de marché
  indicateursMarche: z.array(indicateurMarcheSchema).default([]),
  refsAnnonces: z.array(refMarcheSchema).default([]),
  refsDVF: z.array(refMarcheSchema).default([]),
  commentaireMarche: z.string().default(""),

  // Section 6 (optionnel) — Locatif saisonnier
  avecLocatif: z.boolean().default(false),
  saisons: z.array(saisonLocatifSchema).default([
    { periode: "Haute saison (juil.–août, fêtes)", tarifNuit: 0, nbNuits: 0 },
    { periode: "Moyenne saison (vacances scolaires)", tarifNuit: 0, nbNuits: 0 },
    { periode: "Basse saison", tarifNuit: 0, nbNuits: 0 },
  ]),

  // Section 7 — Analyse locative longue durée
  loyerBrut: z.coerce.number().default(0),
  loyerRetenu: z.coerce.number().default(0),
  chargesLocatif: z.coerce.number().default(0),
  taxeFonciere: z.coerce.number().default(0),
  partNonRecuperable: z.coerce.number().default(0),
  tauxVacance: z.string().default(""),
  delaiRelocation: z.string().default(""),
  cibleLocataire: z.string().default(""),

  // Section 6 — Grille d'ajustements & estimation
  criteres: z.array(critereMarcheSchema).default([]),
  argumentaireValeur: z.string().default(""),
  prixM2Retenu: z.coerce.number().default(0),
  valeurVenale: z.coerce.number().min(1, "Valeur vénale requise"),
  valeurCoupDeCœur: z.coerce.number().default(0),
  argumentaireCoupDeCœur: z.string().default(""),

  // Synthèse pondération des méthodes
  synthesePonderation: z.array(synthesePonderationSchema).default([]),

  // Fourchette de marché
  fourchetteBasse: z.coerce.number().default(0),
  fourchetteHaute: z.coerce.number().default(0),

  limites: z.string().default(""),

  // Annexes
  piecesAnalysees: z.array(pieceAnalyseeSchema).default([]),
  sourcesExpertise: z.array(sourceExpertiseSchema).default([]),

  statut: z.enum(["Brouillon", "Finalisée"]).default("Brouillon"),
  agentId: z.string().optional(),
});

export type Estimation = z.infer<typeof estimationSchema>;
export type EstimationForm = Omit<Estimation, "id">;

// ── Conversion valeur en lettres ───────────────────────────────────────────────

const UNITES = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const DIZAINES = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

function centainesEnLettres(n: number): string {
  if (n === 0) return "";
  if (n < 20) return UNITES[n] ?? "";
  const d = Math.floor(n / 10), u = n % 10;
  const diz = DIZAINES[d] ?? "";
  if (d === 7 || d === 9) {
    const sub = UNITES[10 + u] ?? "";
    return d === 9 && u === 0 ? "quatre-vingt-dix" : `${diz}-${sub}`;
  }
  if (d === 8) return u === 0 ? "quatre-vingts" : `quatre-vingt-${UNITES[u] ?? ""}`;
  return u === 0 ? diz : u === 1 ? `${diz}-et-un` : `${diz}-${UNITES[u] ?? ""}`;
}

export function nombreEnLettres(n: number): string {
  if (!n || n <= 0) return "zéro euro";
  const milliers = Math.floor(n / 1000);
  const reste = n % 1000;
  let resultat = "";
  if (milliers > 0) {
    resultat += milliers === 1 ? "mille" : `${centainesEnLettres(milliers)} mille`;
  }
  if (reste > 0) {
    if (milliers > 0) resultat += " ";
    resultat += centainesEnLettres(reste);
  }
  return resultat.trim() + " euros";
}
