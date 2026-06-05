import { z } from "zod";
import { isoDate, positiveNumber } from "../enums";

/**
 * Schéma du document juridique "Mandat de vente".
 * La génération PDF/export est BLOQUÉE tant que ce schéma ne valide pas —
 * garantit prixVente, honorairesPct etc. correctement saisis et typés.
 */
export const mandatVenteDocSchema = z.object({
  typeMandat: z.enum(["Exclusif", "Simple", "Semi-exclusif"]),
  mandant: z.string().min(1, "Nom du mandant requis"),
  mandantAdr: z.string().min(1, "Adresse du mandant requise"),
  mandantTel: z.string().default(""),
  bienType: z.string().min(1, "Type de bien requis"),
  bienAdr: z.string().min(1, "Adresse du bien requise"),
  bienCommune: z.string().min(1, "Commune requise"),
  bienSurface: positiveNumber.refine((n) => n > 0, "Surface requise"),
  prixVente: positiveNumber.refine((n) => n > 0, "Prix de vente requis"),
  honorairesPct: positiveNumber
    .refine((n) => n > 0, "Honoraires requis")
    .refine((n) => n <= 20, "Honoraires ≤ 20%"),
  chargeHono: z.enum(["de l'acquéreur", "du vendeur"]),
  dureeMois: positiveNumber.refine((n) => n >= 1, "Durée ≥ 1 mois"),
  dateDebut: isoDate.refine((d) => d !== "", "Date de prise d'effet requise"),
});

export type MandatVenteDoc = z.infer<typeof mandatVenteDocSchema>;
