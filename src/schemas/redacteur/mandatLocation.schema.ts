import { z } from "zod";
import { isoDate, positiveNumber } from "../enums";
import { mandantSchema, type Mandant } from "./mandatVenteFull.schema";

export type { Mandant };

export const mandatLocationSchema = z.object({
  numero: z.string().default(""),
  date: isoDate.default(""),
  lieu: z.string().default("Fort-de-France"),

  mandants: z.array(mandantSchema).min(1),

  adresseBien: z.string().default(""),
  commune: z.string().default(""),
  codePostal: z.string().default(""),
  typeBien: z.string().default("Appartement"),
  surfaceHabitable: positiveNumber.default(0),
  nbPieces: z.string().default(""),
  refCadastrale: z.string().default(""),
  descriptionBien: z.string().default(""),
  enCopropriete: z.boolean().default(false),
  syndic: z.string().default(""),

  regimeLocatif: z.enum([
    "Location nue (loi 1989)",
    "Location meublée (loi 1989)",
    "Bail mobilité",
    "Location saisonnière",
  ]).default("Location meublée (loi 1989)"),

  typeMandat: z.enum(["Exclusif", "Semi-exclusif", "Simple"]).default("Semi-exclusif"),
  mission: z.enum([
    "Recherche de locataire",
    "Gestion locative",
    "Recherche et gestion",
  ]).default("Recherche de locataire"),

  loyerSouhaite: positiveNumber.default(0),
  chargesMensuelles: positiveNumber.default(0),
  honorairesType: z.enum(["mois_de_loyer", "pourcentage", "forfait"]).default("mois_de_loyer"),
  honorairesValeur: positiveNumber.default(1),
  chargeHonoraires: z.enum(["bailleur", "locataire", "partage"]).default("partage"),

  dureeMois: positiveNumber.default(12),
  dateDebut: isoDate.default(""),

  avecPanneau: z.boolean().default(true),
  avecInterAgence: z.boolean().default(true),
  avecVisitesAutonomes: z.boolean().default(true),

  redacteur: z.string().default("M. Luc CLEMENTE"),
  observations: z.string().default(""),
});

export type MandatLocation = z.infer<typeof mandatLocationSchema>;

export function emptyMandatLocation(): MandatLocation {
  return mandatLocationSchema.parse({
    mandants: [{
      civilite: "M.", prenom: "", nom: "", dateNaissance: "", nationalite: "Française",
      adresse: "", codePostal: "", ville: "", pays: "FRANCE", tel: "", email: "", qualite: "Propriétaire",
    }],
    date: new Date().toISOString().slice(0, 10),
    dateDebut: new Date().toISOString().slice(0, 10),
  });
}

export function calcMandatLocation(f: MandatLocation) {
  const loyer = f.loyerSouhaite || 0;
  let honoraires = 0;
  if (f.honorairesType === "mois_de_loyer") honoraires = Math.round(loyer * f.honorairesValeur);
  else if (f.honorairesType === "pourcentage") honoraires = Math.round((loyer * f.honorairesValeur) / 100);
  else honoraires = Math.round(f.honorairesValeur);

  let dateFin = "";
  if (f.dateDebut && f.dureeMois) {
    const d = new Date(f.dateDebut + "T12:00");
    d.setMonth(d.getMonth() + Math.round(f.dureeMois));
    dateFin = d.toLocaleDateString("fr-FR");
  }
  return { honoraires, dateFin };
}
