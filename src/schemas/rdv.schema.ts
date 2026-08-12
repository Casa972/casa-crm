import { z } from "zod";
import { isoDate } from "./enums";

export const TypeRdv = z.enum(["Visite", "Appel", "RDV Signature", "Estimation", "Suivi Agent", "Autre"]);
export type TypeRdv = z.infer<typeof TypeRdv>;

export const StatutRdv = z.enum(["Planifié", "Fait", "Annulé"]);
export type StatutRdv = z.infer<typeof StatutRdv>;

export const RdvSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().optional(),
  titre: z.string().min(1, "Titre requis"),
  clientId: z.string().optional(),
  bienRef: z.string().optional(),
  participantNom: z.string().optional(),
  date: isoDate,
  heureDebut: z.string().min(1, "Heure début requise"),
  heureFin: z.string().min(1, "Heure fin requise"),
  typeRdv: TypeRdv,
  rappelMinutes: z.number().optional(),
  notes: z.string().optional(),
  statut: StatutRdv,
});

export type Rdv = z.infer<typeof RdvSchema>;
export type RdvForm = Omit<Rdv, "id">;
