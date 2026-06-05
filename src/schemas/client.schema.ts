import { z } from "zod";
import {
  id, isoDate, positiveNumber,
  TypeClient, EtapePipeline, StatutRevenu, TypeRevenu,
} from "./enums";

export const clientFormSchema = z.object({
  prenom: z.string().min(1, "Prénom requis"),
  nom: z.string().default(""),
  email: z.string().email("Email invalide").or(z.literal("")).default(""),
  tel: z.string().default(""),
  type: TypeClient,
  statut: EtapePipeline,
  budgetMax: positiveNumber.default(0),
  commune: z.string().default(""),
  typeBien: z.string().default(""),
  chambresMin: positiveNumber.default(0),
  notes: z.string().default(""),
  bienId: z.string().default(""),
  dernierContact: isoDate.default(""),
  relanceDate: isoDate.default(""),
  financement: z.string().default(""),
});
export type ClientForm = z.infer<typeof clientFormSchema>;

export const clientSchema = clientFormSchema.extend({
  id,
  agentId: z.string().optional(),
});
export type Client = z.infer<typeof clientSchema>;

export const revenuFormSchema = z.object({
  date: isoDate,
  type: TypeRevenu,
  montant: positiveNumber.refine((n) => n > 0, "Montant requis"),
  desc: z.string().default(""),
  statut: StatutRevenu,
});
export type RevenuForm = z.infer<typeof revenuFormSchema>;

export const revenuSchema = revenuFormSchema.extend({
  id,
  /** Lien vers le compromis source pour la sync atomique. */
  source: z.string().optional(),
  sourceId: z.string().optional(),
});
export type Revenu = z.infer<typeof revenuSchema>;
