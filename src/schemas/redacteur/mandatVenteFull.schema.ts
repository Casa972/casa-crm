import { z } from "zod";
import { isoDate, positiveNumber } from "../enums";

/** Mandant individuel (le document supporte plusieurs co-propriétaires) */
export const mandantSchema = z.object({
  civilite: z.string().default("M."),
  prenom: z.string().default(""),
  nom: z.string().default(""),
  dateNaissance: isoDate.default(""),
  nationalite: z.string().default("Française"),
  adresse: z.string().default(""),
  codePostal: z.string().default(""),
  ville: z.string().default(""),
  pays: z.string().default("FRANCE"),
  tel: z.string().default(""),
  email: z.string().default(""),
  qualite: z.string().default("Propriétaire"),
});
export type Mandant = z.infer<typeof mandantSchema>;

export const mandatVenteFullSchema = z.object({
  // Numéro et date
  numero: z.string().min(1, "Numéro requis"),
  date: isoDate.refine(d => d !== "", "Date requise"),
  lieu: z.string().default("Fort-de-France"),

  // Mandants (1 ou plusieurs)
  mandants: z.array(mandantSchema).min(1, "Au moins un mandant"),

  // Bien
  residence: z.string().default(""),
  adresseBien: z.string().min(1, "Adresse requise"),
  commune: z.string().min(1, "Commune requise"),
  codePostal: z.string().default(""),
  typeBien: z.string().min(1, "Type de bien requis"),
  surfaceTotale: positiveNumber.default(0),
  surfaceCarrez: positiveNumber.default(0),
  nbPieces: z.string().default(""),
  refCadastrale: z.string().default(""),
  descriptionBien: z.string().default(""),
  lots: z.string().default(""),

  // Copropriété
  infosCopro: z.string().default(""),
  nomsLots: z.string().default(""),
  syndic: z.string().default(""),
  chargesAnnuelles: positiveNumber.default(0),
  occupation: z.enum(["Libre", "Occupé"]).default("Libre"),

  // Prix
  prixFAI: positiveNumber.refine(n => n > 0, "Prix FAI requis"),
  honorairesPct: positiveNumber.refine(n => n > 0 && n <= 20, "Honoraires 1-20%"),
  chargeHonoraires: z.enum(["vendeur", "acquéreur"]).default("vendeur"),
  tvaApplicable: z.boolean().default(true),

  // Mandat
  typeMandat: z.enum(["Exclusif", "Semi-exclusif", "Simple"]).default("Semi-exclusif"),
  dureeAns: positiveNumber.default(1),
  dateDebut: isoDate.refine(d => d !== "", "Date de début requise"),
  avecApportDirect: z.boolean().default(true),
  avecSousMandat: z.boolean().default(false),
  avecInterAgence: z.boolean().default(true),

  // Contact agence
  redacteur: z.string().default("M. Luc CLEMENTE"),
});

export type MandatVenteFull = z.infer<typeof mandatVenteFullSchema>;

/** Calculs dérivés */
export function calcMandatVente(f: MandatVenteFull) {
  const tvaRate = f.tvaApplicable ? 0.085 : 0;
  const honorairesHT = Math.round((f.prixFAI * f.honorairesPct) / 100);
  const tva = Math.round(honorairesHT * tvaRate);
  const honorairesTTC = honorairesHT + tva;
  const prixNetVendeur = f.prixFAI - (f.chargeHonoraires === "vendeur" ? honorairesTTC : 0);
  const honoReduit = f.avecApportDirect ? Math.round(honorairesTTC / 2) : 0;
  const pctReduit = f.avecApportDirect ? f.honorairesPct / 2 : 0;
  return { honorairesHT, tva, honorairesTTC, prixNetVendeur, honoReduit, pctReduit, tvaRate };
}
