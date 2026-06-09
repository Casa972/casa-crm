import { z } from "zod";

export const AvisClient = z.enum(["Très intéressé", "Intéressé", "Mitigé", "Pas intéressé", "Offre possible"]);
export type AvisClient = z.infer<typeof AvisClient>;

export const SuiteDonner = z.enum(["Relance sous 48h", "Envoyer offre", "2ème visite à planifier", "Pas de suite", "Attente financement", "En réflexion"]);
export type SuiteDonner = z.infer<typeof SuiteDonner>;

export const compteRenduSchema = z.object({
  id: z.string(),
  agentId: z.string().optional(),

  // Identification
  date: z.string().min(1, "Date requise"),
  heureDebut: z.string().default(""),
  heureFin: z.string().default(""),
  redacteur: z.string().default("M. Luc CLEMENTE"),

  // Bien visité
  bienRef: z.string().default(""),
  bienAdresse: z.string().default(""),
  bienCommune: z.string().default(""),
  bienType: z.string().default(""),
  bienSurface: z.coerce.number().default(0),
  bienPrix: z.coerce.number().default(0),

  // Propriétaire / mandant
  proprietaireNom: z.string().default(""),
  proprietaireTel: z.string().default(""),
  clientId: z.string().default(""),

  // Visiteurs
  visiteurNom: z.string().min(1, "Nom du visiteur requis"),
  visiteurTel: z.string().default(""),
  visiteurEmail: z.string().default(""),
  nbPersonnes: z.coerce.number().default(1),

  // Formulaire structuré
  pointsPositifs: z.string().default(""),
  pointsNegatifs: z.string().default(""),
  avisClient: AvisClient,
  budgetClient: z.coerce.number().default(0),
  financement: z.string().default(""),
  delaiAchat: z.string().default(""),
  suiteDonner: SuiteDonner,
  dateRelance: z.string().default(""),

  // Texte libre
  observations: z.string().default(""),

  statut: z.enum(["Brouillon", "Finalisé"]).default("Brouillon"),
});

export type CompteRendu = z.infer<typeof compteRenduSchema>;
