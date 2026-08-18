import { z } from "zod";

/**
 * Enums métier — source de vérité unique.
 * Réutilisés par les schémas d'entités ET par l'UI (selects, pills).
 */
export const TypeBien = z.enum([
  "Appartement",
  "Villa",
  "Maison",
  "Terrain",
  "Local commercial",
  "Fonds de commerce",
]);
export type TypeBien = z.infer<typeof TypeBien>;

export const CategorieBien = z.enum(["vente", "location"]);
export type CategorieBien = z.infer<typeof CategorieBien>;

export const StatutVente = z.enum(["Disponible", "Sous compromis", "Vendu", "Retiré"]);
export const StatutLocation = z.enum(["Disponible", "Loué", "Retiré"]);
export const StatutBien = z.enum([
  ...StatutVente.options,
  ...StatutLocation.options,
]);
export type StatutBien = z.infer<typeof StatutBien>;

export const TypeMandat = z.enum(["Exclusif", "Simple", "Gestion", "Co-exclusif"]);
export type TypeMandat = z.infer<typeof TypeMandat>;

export const StatutMandat = z.enum(["Actif", "Suspendu", "Expiré", "Résilié"]);
export type StatutMandat = z.infer<typeof StatutMandat>;

export const StatutCompromis = z.enum([
  "Offre acceptée",
  "Compromis",
  "Acte prévu",
  "Acte signé",
  "Annulé",
]);
export type StatutCompromis = z.infer<typeof StatutCompromis>;

export const StatutCommission = z.enum(["À encaisser", "Encaissée", "Annulée"]);
export type StatutCommission = z.infer<typeof StatutCommission>;

export const TypeHonoraires = z.enum(["pct", "fixe"]);
export type TypeHonoraires = z.infer<typeof TypeHonoraires>;

export const StatutRevenu = z.enum(["Encaissé", "En attente"]);
export type StatutRevenu = z.infer<typeof StatutRevenu>;

export const TypeRevenu = z.enum([
  "Commission vente",
  "Commission location",
  "Expertise",
  "Estimation valeur vénale",
  "Gestion locative",
  "Honoraires conseil",
  "Frais divers",
]);
export type TypeRevenu = z.infer<typeof TypeRevenu>;

export const TypeClient = z.enum(["Acheteur", "Locataire", "Investisseur", "Vendeur"]);
export type TypeClient = z.infer<typeof TypeClient>;

export const EtapePipeline = z.enum([
  "Prospect",
  "Visite",
  "Offre",
  "Compromis",
  "Acte",
  "Perdu",
]);
export type EtapePipeline = z.infer<typeof EtapePipeline>;

export const RoleUtilisateur = z.enum(["directeur", "agent"]);
export type RoleUtilisateur = z.infer<typeof RoleUtilisateur>;

/* ── Primitives réutilisables ── */

/** Date ISO YYYY-MM-DD ou chaîne vide (formulaire) ; vide → null au save. */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (AAAA-MM-JJ)")
  .or(z.literal(""));

/** Nombre positif accepté depuis un <input> (string) ou number. */
export const positiveNumber = z.coerce
  .number({ invalid_type_error: "Doit être un nombre" })
  .nonnegative("Doit être positif");

/** UUID applicatif (Date.now+random) — string non vide. */
export const id = z.string().min(1);


export const TypeBienEstimation = z.enum([
  "Appartement en copropriété",
  "Maison individuelle",
  "Villa",
  "Terrain",
  "Local commercial",
  "Fonds de commerce",
]);
export type TypeBienEstimation = z.infer<typeof TypeBienEstimation>;

export const EtatGeneral = z.enum(["Parfait état", "Très bon état", "Bon état", "État moyen", "Travaux à prévoir"]);
export type EtatGeneral = z.infer<typeof EtatGeneral>;

export const ImpactCritere = z.enum(["Positif fort", "Positif", "Neutre", "Négatif", "Négatif fort"]);
export type ImpactCritere = z.infer<typeof ImpactCritere>;


export const AvisClient = z.enum(["Très intéressé", "Intéressé", "Mitigé", "Pas intéressé", "Offre possible"]);
export type AvisClient = z.infer<typeof AvisClient>;

export const SuiteDonner = z.enum(["Relance sous 48h", "Envoyer offre", "2ème visite à planifier", "Pas de suite", "Attente financement", "En réflexion"]);
export type SuiteDonner = z.infer<typeof SuiteDonner>;

export const COMMUNES_MARTINIQUE = [
  "Fort-de-France", "Le Lamentin", "Le Robert", "Sainte-Marie", "Le François",
  "Le Marin", "Sainte-Anne", "Les Trois-Îlets", "Le Diamant", "Le Vauclin",
  "La Trinité", "Case-Pilote", "Le Carbet", "Saint-Pierre", "Schoelcher",
  "Saint-Joseph", "Le Morne-Rouge", "Basse-Pointe", "Lorrain", "Marigot",
  "Sainte-Luce", "Rivière-Pilote", "Rivière-Salée", "Ducos", "Saint-Esprit",
  "Gros-Morne", "Bellefontaine", "Fonds-Saint-Denis", "Le Morne-Vert",
  "Grand-Rivière", "Macouba", "Le Prêcheur",
] as const;
