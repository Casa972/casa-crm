import { z } from "zod";
import { isoDate } from "./enums";

export const PrioритеTache = z.enum(["Haute", "Normale", "Basse"]);
export type PrioriteTache = z.infer<typeof PrioритеTache>;

export const TacheSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().optional(),
  texte: z.string().min(1, "Texte requis"),
  done: z.boolean(),
  priorite: PrioритеTache,
  dateEcheance: isoDate.optional(),
});

export type Tache = z.infer<typeof TacheSchema>;
export type TacheForm = Omit<Tache, "id">;
