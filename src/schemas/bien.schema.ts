import { z } from "zod";
import {
  id, positiveNumber, TypeBien, CategorieBien, StatutBien,
} from "./enums";

/** Schéma du formulaire Bien (entrées UI tolérantes : coerce sur les nombres). */
export const bienFormSchema = z.object({
  ref: z.string().min(1, "Référence requise"),
  type: TypeBien,
  adresse: z.string().default(""),
  commune: z.string().min(1, "Commune requise"),
  surface: positiveNumber.default(0),
  chambres: positiveNumber.default(0),
  prix: positiveNumber.refine((n) => n > 0, "Prix requis"),
  cat: CategorieBien,
  statut: StatutBien,
  desc: z.string().default(""),
  mandatId: z.string().default(""),
});

export type BienForm = z.infer<typeof bienFormSchema>;

/** Entité Bien complète (avec id) telle que manipulée côté app. */
export const bienSchema = bienFormSchema.extend({ id });
export type Bien = z.infer<typeof bienSchema>;
