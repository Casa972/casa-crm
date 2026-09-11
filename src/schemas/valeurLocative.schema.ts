import { z } from "zod";
import { analyseLocativeAuto } from "../lib/estimationTextes";

export const REGIMES_LOCATIFS = [
  "Location longue durée meublée",
  "Location longue durée nue",
  "Location saisonnière",
  "Bail mobilité",
] as const;
export type RegimeLocatif = (typeof REGIMES_LOCATIFS)[number];

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

export const REFERENCES_AGENCE_DEFAUT =
  "La présente estimation est établie par Casa Caraïbes SARL, agence immobilière exerçant en Martinique, titulaire de la carte professionnelle n° CPI 97212024000000007 (mention Transaction sur immeubles et fonds de commerce), délivrée par la CCI Martinique. RCS Fort-de-France 928 647 981.\n\nFort d'une connaissance approfondie du marché locatif martiniquais, l'agence s'appuie sur son historique de mises en location dans le secteur, une veille active des annonces comparables et son réseau de gestionnaires et propriétaires bailleurs locaux.";

export const DISCLAIMER_DEFAUT =
  "Le présent document est établi sur la base des informations transmises et d'une analyse du marché locatif à la date de l'estimation. Il constitue une estimation et non une garantie de loyer. L'agence Casa Caraïbes SARL décline toute responsabilité quant aux conditions définitives de mise en location. Toute évolution des diagnostics, de l'état du bien ou du marché peut conduire à réviser le loyer proposé.";

export function analyseMarcheDefaut(regime: string, commune = ""): string {
  const cadre =
    regime === "Location longue durée nue"
      ? "Le logement est proposé non meublé. Le cadre juridique est le bail d'habitation régi par la loi du 6 juillet 1989."
      : regime === "Location saisonnière"
        ? "Le cadre est celui de la location meublée de tourisme. Le loyer indiqué est un équivalent mensuel hors charges, à adapter selon le taux d'occupation réel et la saisonnalité martiniquaise."
        : regime === "Bail mobilité"
          ? "Le cadre est le bail mobilité (logement meublé, 1 à 10 mois non renouvelable, loi ELAN)."
          : "Le cadre est la location longue durée meublée (bail d'un an renouvelable, loi du 6 juillet 1989 et décret n° 2015-981 du 31 juillet 2015).";
  return `${analyseLocativeAuto({ regime, commune })}\n\n${cadre}`;
}

const ANALYSES_DEFAUT = [
  analyseMarcheDefaut("Location longue durée meublée"),
  analyseMarcheDefaut("Location longue durée nue"),
  analyseMarcheDefaut("Location saisonnière"),
  analyseMarcheDefaut("Bail mobilité"),
];

export function estAnalyseParDefaut(texte: string): boolean {
  const t = (texte || "").trim();
  if (!t) return true;
  if (ANALYSES_DEFAUT.some((d) => d.trim() === t)) return true;
  return t.includes("décret n° 2015-981") || t.includes("decret n° 2015-981") || t.includes("L'estimation porte sur une");
}

export function estMeuble(regime: string): boolean {
  return regime !== "Location longue durée nue";
}

export function libelleLoyer(regime: string): string {
  return regime === "Location saisonnière"
    ? "Loyer mensuel équivalent estimé HC (€)"
    : "Loyer mensuel estimé HC (€)";
}

export function syntheseRevenus(regime: string, annuel: string): string {
  if (regime === "Location saisonnière") {
    return `soit ${annuel} en équivalent 12 mois — à proratiser selon le taux d'occupation`;
  }
  if (regime === "Bail mobilité") {
    return `soit ${annuel} en équivalent annuel — bail mobilité de 1 à 10 mois`;
  }
  return `soit ${annuel} de revenus bruts annuels`;
}

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
  referencesAgence: z.string().default(REFERENCES_AGENCE_DEFAUT),
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
  disclaimer: z.string().default(DISCLAIMER_DEFAUT),
});

export type ValeurLocative = z.infer<typeof valeurLocativeSchema>;

export function loyerAnnuel(n: number): number {
  return Math.round((n || 0) * 12);
}
