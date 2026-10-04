import { z } from "zod";
import {
  id, isoDate, positiveNumber,
  StatutCompromis, StatutCommission, TypeHonoraires,
} from "./enums";

/** Origine du dossier. L'interagence ne reverse à Casa que sa quote-part. */
export const OrigineDossier = z.enum([
  "Maison",
  "Interagence entrant",
  "Interagence sortant",
]);
export type OrigineDossier = z.infer<typeof OrigineDossier>;

export interface InteragenceMeta {
  origine: OrigineDossier;
  agencePartenaire: string;
  pctAgence: number;
}

const IA_MARK = "[[casa-ia]]";

export function unpackInteragence(notes: string): { meta: InteragenceMeta; notes: string } {
  const raw = notes ?? "";
  if (!raw.startsWith(IA_MARK)) {
    return { meta: { origine: "Maison", agencePartenaire: "", pctAgence: 100 }, notes: raw };
  }
  const nl = raw.indexOf("\n");
  const payload = nl === -1 ? raw.slice(IA_MARK.length) : raw.slice(IA_MARK.length, nl);
  const rest = nl === -1 ? "" : raw.slice(nl + 1);
  try {
    const j = JSON.parse(payload) as Partial<InteragenceMeta>;
    const origine = OrigineDossier.safeParse(j.origine).success ? (j.origine as OrigineDossier) : "Maison";
    const pct = Number(j.pctAgence);
    return {
      meta: {
        origine,
        agencePartenaire: String(j.agencePartenaire ?? ""),
        pctAgence: Number.isFinite(pct) ? Math.min(100, Math.max(0, Math.round(pct))) : (origine === "Maison" ? 100 : 50),
      },
      notes: rest,
    };
  } catch {
    return { meta: { origine: "Maison", agencePartenaire: "", pctAgence: 100 }, notes: raw };
  }
}

export function packInteragence(notes: string, meta: InteragenceMeta): string {
  const clean = notes.startsWith(IA_MARK) ? unpackInteragence(notes).notes : notes;
  if (meta.origine === "Maison" && !meta.agencePartenaire && (meta.pctAgence === 100 || !meta.pctAgence)) {
    return clean;
  }
  const payload = JSON.stringify({
    origine: meta.origine,
    agencePartenaire: meta.agencePartenaire,
    pctAgence: meta.pctAgence,
  });
  return clean ? `${IA_MARK}${payload}\n${clean}` : `${IA_MARK}${payload}`;
}

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
    agentEntree: z.string().default(""),
    agentSortie: z.string().default(""),
    pctEntree: z.coerce.number().int().min(0).max(100).default(50),
    pctSortie: z.coerce.number().int().min(0).max(100).default(50),
    origine: OrigineDossier.default("Maison"),
    agencePartenaire: z.string().default(""),
    pctAgence: z.coerce.number().int().min(0).max(100).default(100),
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
  agentEntree: z.string().optional(),
  agentSortie: z.string().optional(),
  pctEntree: z.number().optional(),
  pctSortie: z.number().optional(),
  origine: OrigineDossier.optional(),
  agencePartenaire: z.string().optional(),
  pctAgence: z.number().optional(),
});
export type Compromis = z.infer<typeof compromisSchema>;

/** Calcul unique du montant de commission — utilisé partout (DRY). */
export function commissionMontant(c: Pick<Compromis, "typeHonoraires" | "prixVente" | "honoraires">): number {
  return c.typeHonoraires === "pct"
    ? Math.round((c.prixVente || 0) * (c.honoraires || 0) / 100)
    : (c.honoraires || 0);
}

/** Part Casa après rétrocession interagence. 100 % si dossier maison. */
export function commissionAgence(c: Pick<Compromis, "typeHonoraires" | "prixVente" | "honoraires" | "pctAgence" | "origine">): number {
  const brut = commissionMontant(c);
  const pct = c.origine && c.origine !== "Maison" ? (c.pctAgence ?? 50) : (c.pctAgence ?? 100);
  return Math.round(brut * pct / 100);
}

export function commissionPartenaire(c: Pick<Compromis, "typeHonoraires" | "prixVente" | "honoraires" | "pctAgence" | "origine">): number {
  return Math.max(0, commissionMontant(c) - commissionAgence(c));
}
