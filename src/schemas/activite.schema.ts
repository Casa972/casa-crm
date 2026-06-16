import { z } from "zod";
import { isoDate } from "./enums";

export const TypeActivite = z.enum(["Appel", "Email", "Visite", "Note", "RDV", "Offre", "Relance", "Autre"]);
export type TypeActivite = z.infer<typeof TypeActivite>;

export const ActiviteSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  agentId: z.string().optional(),
  typeActivite: TypeActivite,
  note: z.string().min(1, "Note requise"),
  date: isoDate,
});

export type Activite = z.infer<typeof ActiviteSchema>;
export type ActiviteForm = Omit<Activite, "id">;
