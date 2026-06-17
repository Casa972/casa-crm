import { z } from "zod";
import { id, isoDate, positiveNumber, TypeMandat, StatutMandat } from "./enums";

export const mandatFormSchema = z
  .object({
    ref: z.string().min(1, "Référence requise"),
    bienId: z.string().default(""),
    type: TypeMandat,
    mandant: z.string().min(1, "Mandant requis"),
    tel: z.string().default(""),
    email: z.string().email("Email invalide").or(z.literal("")).default(""),
    dateDebut: isoDate.default(""),
    dateFin: isoDate.default(""),
    honoraires: positiveNumber.max(20, "Honoraires ≤ 20%").default(0),
    statut: StatutMandat,
    notes: z.string().default(""),
  })
  .refine(
    (m) => !m.dateDebut || !m.dateFin || m.dateFin >= m.dateDebut,
    { message: "La date de fin doit suivre la date de début", path: ["dateFin"] },
  );

export type MandatForm = z.infer<typeof mandatFormSchema>;

export const mandatSchema = z.object({
  id,
  ref: z.string(),
  bienId: z.string(),
  type: TypeMandat,
  mandant: z.string(),
  tel: z.string(),
  email: z.string(),
  dateDebut: z.string(),
  dateFin: z.string(),
  honoraires: z.number(),
  statut: StatutMandat,
  notes: z.string(),
  agentId: z.string().optional(),
});
export type Mandat = z.infer<typeof mandatSchema>;
