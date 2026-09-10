import { z } from "zod";

export const ligneSurfaceSchema = z.object({
  id: z.string(),
  nom: z.string().default(""),
  surface: z.coerce.number().default(0),
  detail: z.string().default(""),
});
export type LigneSurface = z.infer<typeof ligneSurfaceSchema>;

export const ligneEquipementSchema = z.object({
  id: z.string(),
  label: z.string().default(""),
  valeur: z.string().default(""),
});
export type LigneEquipement = z.infer<typeof ligneEquipementSchema>;

export const valeurLocativeSchema = z.object({
  id: z.string(),
  statut: z.enum(["Brouillon", "Finalisée"]).default("Brouillon"),
  agentId: z.string().optional(),
  titreBien: z.string().default(""),
  regimeLocatif: z.string().default("Location longue durée meublée"),
  mentionCouverture: z.string().default(""),
  adresse: z.string().default(""),
  commune: z.string().default(""),
  codePostal: z.string().default("97200"),
  sectionCadastrale: z.string().default(""),
  parcelle: z.string().default(""),
  mandantNom: z.string().default(""),
  mandantVille: z.string().default(""),
  agenceNom: z.string().default("Casa Caraïbes SARL"),
  agenceMention: z.string().default("Agence Immobilière — Martinique"),
  dateDocument: z.string().default(""),
  lieuSignature: z.string().default("FORT-DE-FRANCE"),
  dateSignature: z.string().default(""),
  referencesAgence: z.string().default(
    "La présente estimation est établie par Casa Caraïbes SARL, agence immobilière exerçant en Martinique, titulaire de la carte professionnelle n° CPI 97212024000000007 (mention Transaction sur immeubles et fonds de commerce), délivrée par la CCI Martinique. RCS Fort-de-France 928 647 981.\n\nFort d'une connaissance approfondie du marché locatif martiniquais, l'agence s'appuie sur son historique de mises en location dans le secteur, une veille active des annonces comparables et son réseau de gestionnaires et propriétaires bailleurs locaux.",
  ),
  superficieTerrain: z.coerce.number().default(0),
  zonagePlu: z.string().default(""),
  natureBien: z.string().default(""),
  surfaceShon: z.coerce.number().default(0),
  empriseSol: z.coerce.number().default(0),
  descriptionBien: z.string().default(""),
  pieces: z.array(ligneSurfaceSchema).default([]),
  exterieurs: z.array(ligneSurfaceSchema).default([]),
  noteSurfaces: z.string().default(""),
  equipements: z.array(ligneEquipementSchema).default([]),
  localisation: z.string().default(""),
  atouts: z.array(z.string()).default([]),
  analyseMarche: z.string().default(""),
  loyerMensuelHc: z.coerce.number().default(0),
  syntheseLoyer: z.string().default(""),
  vigilance: z.string().default(""),
  mentionPrevisionnelle: z.string().default(""),
  disclaimer: z.string().default(
    "Le présent document est établi sur la base des informations transmises et d'une analyse du marché locatif à la date de l'estimation. Il constitue une estimation et non une garantie de loyer. L'agence Casa Caraïbes SARL décline toute responsabilité quant aux conditions définitives de mise en location.",
  ),
});

export type ValeurLocative = z.infer<typeof valeurLocativeSchema>;

export function loyerAnnuel(n: number): number {
  return Math.round((n || 0) * 12);
}
