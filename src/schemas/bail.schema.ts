import { z } from "zod";

export const TYPES_BAIL = [
  "Bail d'habitation nu",
  "Bail d'habitation meublé",
  "Bail mobilité",
  "Location saisonnière",
] as const;
export type TypeBail = (typeof TYPES_BAIL)[number];

export const partieBailSchema = z.object({
  id: z.string(),
  civilite: z.string().default("M."),
  prenom: z.string().default(""),
  nom: z.string().default(""),
  dateNaissance: z.string().default(""),
  lieuNaissance: z.string().default(""),
  nationalite: z.string().default("Française"),
  adresse: z.string().default(""),
  codePostal: z.string().default(""),
  ville: z.string().default(""),
  tel: z.string().default(""),
  email: z.string().default(""),
  qualite: z.string().default(""),
});
export type PartieBail = z.infer<typeof partieBailSchema>;

export const bailSchema = z.object({
  id: z.string(),
  statut: z.enum(["Brouillon", "Finalisé"]).default("Brouillon"),
  agentId: z.string().optional(),
  typeBail: z.string().default("Bail d'habitation meublé"),
  numero: z.string().default(""),
  dateDocument: z.string().default(""),
  lieuSignature: z.string().default("Le Lamentin"),
  bailleurs: z.array(partieBailSchema).default([]),
  preneurs: z.array(partieBailSchema).default([]),
  garant: partieBailSchema.optional(),
  typeBien: z.string().default("Appartement"),
  adresseBien: z.string().default(""),
  commune: z.string().default(""),
  codePostal: z.string().default("97232"),
  sectionCadastrale: z.string().default(""),
  parcelle: z.string().default(""),
  surfaceHabitable: z.coerce.number().default(0),
  nbPieces: z.string().default(""),
  etage: z.string().default(""),
  descriptionBien: z.string().default(""),
  usage: z.string().default("Résidence principale du preneur"),
  regimeFoncier: z.string().default(""),
  annexes: z.string().default(""),
  copropriete: z.string().default(""),
  dateDebut: z.string().default(""),
  dateFin: z.string().default(""),
  dureeMois: z.coerce.number().default(12),
  motifMobilite: z.string().default(""),
  loyerHc: z.coerce.number().default(0),
  charges: z.coerce.number().default(0),
  typeCharges: z.string().default("Provision sur charges"),
  jourPaiement: z.coerce.number().default(5),
  modePaiement: z.string().default("Virement bancaire"),
  iban: z.string().default(""),
  titulaireCompte: z.string().default(""),
  depotGarantie: z.coerce.number().default(0),
  revisionIrl: z.boolean().default(true),
  trimestreIrl: z.string().default("T1"),
  honorairesAgence: z.coerce.number().default(0),
  chargeHonoraires: z.string().default("Partagé par moitié"),
  agenceNom: z.string().default("Casa Caraïbes SARL"),
  agenceMention: z.string().default("CPI 97212024000000007 — RCS Fort-de-France 928 647 981"),
  dpeClasse: z.string().default(""),
  gesClasse: z.string().default(""),
  dateDpe: z.string().default(""),
  termites: z.string().default(""),
  ernmt: z.string().default(""),
  animauxAutorises: z.boolean().default(true),
  sousLocationAutorisee: z.boolean().default(false),
  clausesSpecifiques: z.string().default(""),
  inventaireMeubles: z.string().default(""),
  observations: z.string().default(""),
});
export type Bail = z.infer<typeof bailSchema>;

export function loyerCc(b: Pick<Bail, "loyerHc" | "charges">): number {
  return Math.round((b.loyerHc || 0) + (b.charges || 0));
}

export function depotDefaut(typeBail: string, loyerHc: number): number {
  const l = Math.round(loyerHc || 0);
  if (typeBail === "Bail d'habitation nu") return l;
  if (typeBail === "Bail d'habitation meublé") return l * 2;
  if (typeBail === "Bail mobilité") return 0;
  return l;
}

export function dureeDefaut(typeBail: string): number {
  if (typeBail === "Bail d'habitation nu") return 36;
  if (typeBail === "Bail d'habitation meublé") return 12;
  if (typeBail === "Bail mobilité") return 6;
  return 1;
}

export function usageDefaut(typeBail: string): string {
  if (typeBail === "Location saisonnière") return "Location saisonnière / meublé de tourisme — occupation temporaire";
  if (typeBail === "Bail mobilité") return "Résidence temporaire du preneur (bail mobilité)";
  return "Résidence principale du preneur";
}

export function titreBail(typeBail: string): string {
  switch (typeBail) {
    case "Bail d'habitation nu": return "BAIL D'HABITATION NON MEUBLÉ";
    case "Bail mobilité": return "BAIL MOBILITÉ";
    case "Location saisonnière": return "CONTRAT DE LOCATION SAISONNIÈRE";
    default: return "BAIL D'HABITATION MEUBLÉ";
  }
}

export function sousTitreLegal(typeBail: string): string {
  switch (typeBail) {
    case "Bail d'habitation nu":
      return "Régi par la loi n° 89-462 du 6 juillet 1989 (titre Ier) — logement nu";
    case "Bail mobilité":
      return "Régi par les articles 25-12 et suivants de la loi n° 89-462 du 6 juillet 1989 (bail mobilité — loi ELAN)";
    case "Location saisonnière":
      return "Location meublée de tourisme — occupation temporaire, hors bail d'habitation de longue durée";
    default:
      return "Régi par la loi n° 89-462 du 6 juillet 1989 (titre Ier bis) et le décret n° 2015-981 du 31 juillet 2015";
  }
}

export { articlesBail } from "./bail.articles";
