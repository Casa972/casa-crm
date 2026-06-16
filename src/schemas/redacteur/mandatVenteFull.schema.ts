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
  surfaceHabitable: positiveNumber.default(0),
  surfaceTerrain: positiveNumber.default(0),
  surfacePiscine: positiveNumber.default(0),
  surfaceFonciere: positiveNumber.default(0),
  nbPieces: z.string().default(""),
  refCadastrale: z.string().default(""),
  descriptionBien: z.string().default(""),
  lots: z.string().default(""),
  tantiemes: z.string().default(""),

  // Copropriété
  infosCopro: z.string().default(""),
  nomsLots: z.string().default(""),
  syndic: z.string().default(""),
  chargesAnnuelles: positiveNumber.default(0),
  enCopropriete: z.boolean().default(false),

  // Occupation
  occupation: z.enum(["Libre", "Occupé"]).default("Libre"),
  bailType: z.enum(["Loi 89 (résidentiel)", "Bail commercial", "Bail saisonnier", "Bail rural", "Autre"]).default("Loi 89 (résidentiel)"),
  loyerMensuel: positiveNumber.default(0),
  datFinBail: isoDate.default(""),
  nomLocataire: z.string().default(""),

  // Fonds de commerce
  chiffreAffaires: positiveNumber.default(0),

  // Servitudes
  servitudes: z.string().default(""),

  // Diagnostics techniques
  classeDPE: z.string().default(""),
  classeGES: z.string().default(""),
  dateDDT: isoDate.default(""),
  diagnostiqueur: z.string().default(""),
  etatTermites: z.enum(["Absence", "Présence", "Non réalisé"]).default("Non réalisé"),
  anomaliesElec: z.string().default(""),
  ernmt: z.string().default(""),
  risquesNaturels: z.boolean().default(true),

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
  avecPanneau: z.boolean().default(true),
  bienIndivision: z.boolean().default(false),

  // Contact agence
  redacteur: z.string().default("M. Luc CLEMENTE"),
});

export type MandatVenteFull = z.infer<typeof mandatVenteFullSchema>;

// ─── Helpers logique conditionnelle (réutilisés formulaire & PDF) ─────────────
export const isCopro = (t: string) => t === "Appartement" || t === "Local commercial";
export const isTerrain = (t: string) => t === "Terrain";
export const isFonds = (t: string) => t === "Fonds de commerce";
export const needsCarrez = (t: string) => t === "Appartement";
export const needsDPE = (t: string) => !["Terrain", "Fonds de commerce"].includes(t);

/** Calculs dérivés */
export function calcMandatVente(f: MandatVenteFull) {
  const tvaRate = f.tvaApplicable ? 0.085 : 0;
  const honorairesHT = Math.round((f.prixFAI * f.honorairesPct) / 100);
  const tva = Math.round(honorairesHT * tvaRate);
  const honorairesTTC = honorairesHT + tva;
  const prixNetVendeur = f.prixFAI - (f.chargeHonoraires === "vendeur" ? honorairesTTC : 0);
  const honoReduit = f.avecApportDirect ? Math.round(honorairesTTC / 2) : 0;
  const pctReduit = f.avecApportDirect ? f.honorairesPct / 2 : 0;

  // Date de fin calculée
  let dateFin = "";
  if (f.dateDebut) {
    const d = new Date(f.dateDebut + "T12:00");
    d.setFullYear(d.getFullYear() + Math.round(f.dureeAns));
    dateFin = d.toLocaleDateString("fr-FR");
  }

  return { honorairesHT, tva, honorairesTTC, prixNetVendeur, honoReduit, pctReduit, tvaRate, dateFin };
}
