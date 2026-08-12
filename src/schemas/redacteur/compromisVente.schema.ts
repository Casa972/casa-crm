import { z } from "zod";
import { isoDate, positiveNumber } from "../enums";

const partieSchema = z.object({
  civilite: z.string().default(""),
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
export type PartieCompromis = z.infer<typeof partieSchema>;

export const compromisVenteSchema = z.object({
  // Dates & lieu
  date: isoDate.refine(d => d !== "", "Date requise"),
  lieu: z.string().default("Fort-de-France"),

  // Parties
  vendeurs: z.array(partieSchema).min(1),
  acquereurs: z.array(partieSchema).min(1),

  // Bien
  typeBien: z.string().min(1, "Type de bien requis"),
  residence: z.string().default(""),
  adresseBien: z.string().default(""),
  quartier: z.string().default(""),
  commune: z.string().default(""),
  codePostal: z.string().default(""),
  numLot: z.string().default(""),
  surfaceCarrez: positiveNumber.default(0),
  surfaceTotale: positiveNumber.default(0),
  descriptionSurfaces: z.string().default(""),
  tantiemes: z.string().default(""),
  occupation: z.enum(["résidence principale", "résidence secondaire", "bien locatif", "bien libre"]).default("résidence principale"),

  // Copropriété
  nomCopro: z.string().default(""),
  numImmatCopro: z.string().default(""),
  nomSyndic: z.string().default(""),
  adresseSyndic: z.string().default(""),
  nbLotsCopro: z.coerce.number().default(0),
  anneeConstruction: z.string().default(""),
  assureurCopro: z.string().default(""),

  // DDT
  diagnostiqueur: z.string().default(""),
  dateDDT: isoDate.default(""),
  surfaceCarrezDDT: positiveNumber.default(0),
  classeDPE: z.string().default(""),
  anomaliesElec: z.string().default(""),
  etatTermites: z.enum(["Absence", "Présence"]).default("Absence"),
  infoTermites: z.string().default(""),

  // Prix
  prixFAI: positiveNumber.refine(n => n > 0, "Prix requis"),
  honorairesTTC: positiveNumber.default(0),
  chargeHonoraires: z.enum(["vendeur", "acquéreur"]).default("vendeur"),
  sequestrePct: positiveNumber.default(5),

  // Financement acquéreur
  typeFinancement: z.enum(["Prêt bancaire", "Fonds propres", "Mixte"]).default("Prêt bancaire"),
  apportPersonnel: positiveNumber.default(0),
  montantPret: positiveNumber.default(0),
  tauxMaxPret: positiveNumber.default(4.5),
  dureePretMois: positiveNumber.default(300),
  banqueSollicitee: z.string().default(""),
  fraisNotaireEstimes: positiveNumber.default(0),

  // Délais
  dateReiterationMax: isoDate.default(""),
  notaire: z.string().default(""),
  adresseNotaire: z.string().default(""),
  delaiPretJours: positiveNumber.default(60),
  delaiDepotDossierJours: positiveNumber.default(15),

  // Situation financière copro
  sommesDuesVendeur: positiveNumber.default(0),
  detailSommesDues: z.string().default(""),
  remboursementFondsTravaux: positiveNumber.default(0),
  travauxVotesRestants: positiveNumber.default(0),
  detailTravauxVotes: z.string().default(""),

  // Fiscalité
  taxeFonciere: positiveNumber.default(0),
  anneeRef: z.string().default(""),

  // Agence
  redacteur: z.string().default("M. Luc CLEMENTE"),
  mandatRef: z.string().default(""),

  // Observations libres (optionnel — visible dans le PDF seulement si renseigné)
  observations: z.string().default(""),
});

export type CompromisVente = z.infer<typeof compromisVenteSchema>;

export function calcCompromis(f: CompromisVente) {
  const prixNetVendeur = f.prixFAI - (f.chargeHonoraires === "vendeur" ? f.honorairesTTC : 0);
  const sequestre = Math.round((f.prixFAI * f.sequestrePct) / 100);
  const clausePenale = Math.round(f.prixFAI * 0.1);
  const totalProjet = f.prixFAI + f.fraisNotaireEstimes + (f.montantPret > 0 ? Math.round(f.montantPret * 0.017) : 0);
  return { prixNetVendeur, sequestre, clausePenale, totalProjet };
}
