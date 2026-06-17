import { z } from "zod";
import { isoDate, positiveNumber } from "../enums";

export const partieOffreSchema = z.object({
  civilite: z.string().default("M."),
  prenom: z.string().default(""),
  nom: z.string().default(""),
  nationalite: z.string().default("française"),
  dateNaissance: isoDate.default(""),
  lieuNaissance: z.string().default(""),
  adresse: z.string().default(""),
  codePostal: z.string().default(""),
  ville: z.string().default(""),
  etatCivil: z.string().default("célibataire"),
  email: z.string().default(""),
  tel: z.string().default(""),
});
export type PartieOffre = z.infer<typeof partieOffreSchema>;

export const offreAchatSchema = z.object({
  numero: z.string().default(""),
  date: isoDate.default(""),
  lieu: z.string().default("Fort-de-France"),
  redacteur: z.string().default(""),

  // Acquéreurs
  acquereurs: z.array(partieOffreSchema).min(1),

  // Bien
  typeBien: z.string().default("Appartement"),
  adresseBien: z.string().default(""),
  commune: z.string().default(""),
  codePostal: z.string().default("97200"),
  descriptionBien: z.string().default(""),
  mandatRef: z.string().default(""),
  nomVendeur: z.string().default(""),

  // Prix
  prixOffert: positiveNumber.default(0),

  // Financement
  typeFinancement: z.enum(["Comptant", "Prêt bancaire"]).default("Prêt bancaire"),
  montantPret: positiveNumber.default(0),
  apportPersonnel: positiveNumber.default(0),
  banqueSollicitee: z.string().default(""),
  tauxMax: z.number().default(4.5),
  dureePretMois: z.number().default(300),

  // Conditions suspensives
  conditionPret: z.boolean().default(true),
  conditionVenteBien: z.boolean().default(false),
  descriptionBienVente: z.string().default(""),
  autresConditions: z.string().default(""),

  // Modalités
  validiteJours: z.number().default(5),
  dateEntreeJouissance: z.string().default(""),
  sequestre: positiveNumber.default(0),
  notaire: z.string().default(""),
});

export type OffreAchat = z.infer<typeof offreAchatSchema>;
export type OffreAchatForm = Omit<OffreAchat, never>;
