import { z } from "zod";
import {
  id, isoDate, positiveNumber,
  StatutCompromis, StatutCommission, TypeHonoraires,
} from "./enums";

/**
 * Compromis — le cœur financier. La validation conditionnelle garantit
 * qu'on ne peut pas générer/encaisser un dossier sans les montants requis.
 */
export const compromisFormSchema = z
  .object({
    ref: z.string().min(1, "Référence requise"),
    acheteur: z.string().min(1, "Acheteur requis"),
    vendeur: z.string().default(""),
    bienRef: z.string().default(""),
    bienDesc: z.string().default(""),
    prixVente: positiveNumber.refine((n) => n > 0, "Prix de vente requis"),
    typeHonoraires: TypeHonoraires,
    honoraires: positiveNumber,
    statut: StatutCompromis,
    commissionStatut: StatutCommission,
    notaire: z.string().default(""),
    financement: z.string().default(""),
    dateOffre: isoDate.default(""),
    dateCompromis: isoDate.default(""),
    dateActePrev: isoDate.default(""),
    dateActeReel: isoDate.default(""),
    sruExpire: isoDate.default(""),
    condSuspExpire: isoDate.default(""),
    notes: z.string().default(""),
  })
  .refine(
    (c) => c.typeHonoraires !== "pct" || c.honoraires > 0,
    { message: "Pourcentage d'honoraires requis", path: ["honoraires"] },
  )
  .refine(
    // Un acte signé doit avoir une date d'acte réelle
    (c) => c.statut !== "Acte signé" || c.dateActeReel !== "",
    { message: "Date d'acte réelle requise pour un acte signé", path: ["dateActeReel"] },
  );

export type CompromisForm = z.infer<typeof compromisFormSchema>;

export const compromisSchema = z.object({
  id,
  ref: z.string(),
  acheteur: z.string(),
  vendeur: z.string(),
  bienRef: z.string(),
  bienDesc: z.string(),
  prixVente: z.number(),
  typeHonoraires: TypeHonoraires,
  honoraires: z.number(),
  statut: StatutCompromis,
  commissionStatut: StatutCommission,
  notaire: z.string(),
  financement: z.string(),
  dateOffre: z.string(),
  dateCompromis: z.string(),
  dateActePrev: z.string(),
  dateActeReel: z.string(),
  sruExpire: z.string(),
  condSuspExpire: z.string(),
  notes: z.string(),
  agentId: z.string().optional(),
});
export type Compromis = z.infer<typeof compromisSchema>;

/** Calcul unique du montant de commission — utilisé partout (DRY). */
export function commissionMontant(c: Pick<Compromis, "typeHonoraires" | "prixVente" | "honoraires">): number {
  return c.typeHonoraires === "pct"
    ? Math.round((c.prixVente || 0) * (c.honoraires || 0) / 100)
    : (c.honoraires || 0);
}
