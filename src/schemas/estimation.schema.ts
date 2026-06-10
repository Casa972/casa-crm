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

export const refMarcheSchema = z.object({
  id: z.string(),
  type: z.string().default(""),
  surface: z.coerce.number().default(0),
  prix: z.coerce.number().default(0),
  prixM2: z.coerce.number().default(0),
  observations: z.string().default(""),
  source: z.enum(["Annonce active", "DVF"]).default("Annonce active"),
});
export type RefMarche = z.infer<typeof refMarcheSchema>;

export const critereMarcheSchema = z.object({
  id: z.string(),
  critere: z.string(),
  analyse: z.string().default(""),
  impact: ImpactCritere,
});
export type CritereMarche = z.infer<typeof critereMarcheSchema>;

export const saisonLocatifSchema = z.object({
  periode: z.string(),
  tarifNuit: z.coerce.number().default(0),
  nbNuits: z.coerce.number().default(0),
});
export type SaisonLocatif = z.infer<typeof saisonLocatifSchema>;

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

  // Section 3 — État général
  structureGeneral: EtatGeneral,
  finitionsInterieures: EtatGeneral,
  equipementsSanitaires: EtatGeneral,
  travauxAPrevoir: z.string().default(""),

  // Section 4 — Environnement
  descriptionEnvironnement: z.string().default(""),

  // Section 5 — Étude de marché
  refsAnnonces: z.array(refMarcheSchema).default([]),
  refsDVF: z.array(refMarcheSchema).default([]),
  commentaireMarche: z.string().default(""),

  // Section 6 — Potentiel locatif
  avecLocatif: z.boolean().default(false),
  saisons: z.array(saisonLocatifSchema).default([
    { periode: "Haute saison (juil.–août, fêtes)", tarifNuit: 0, nbNuits: 0 },
    { periode: "Moyenne saison (vacances scolaires)", tarifNuit: 0, nbNuits: 0 },
    { periode: "Basse saison", tarifNuit: 0, nbNuits: 0 },
  ]),

  // Section 7 — Grille d'analyse
  criteres: z.array(critereMarcheSchema).default([]),
  argumentaireValeur: z.string().default(""),
  prixM2Retenu: z.coerce.number().default(0),
  valeurVenale: z.coerce.number().min(1, "Valeur vénale requise"),
  valeurCoupDeCœur: z.coerce.number().default(0),
  argumentaireCoupDeCœur: z.string().default(""),
  limites: z.string().default(""),

  statut: z.enum(["Brouillon", "Finalisée"]).default("Brouillon"),
  agentId: z.string().optional(),
});

export type Estimation = z.infer<typeof estimationSchema>;
export type EstimationForm = Omit<Estimation, "id">;

/** Valeur en lettres (milliers arrondis) */
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
