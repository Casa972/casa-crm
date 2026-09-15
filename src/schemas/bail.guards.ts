import type { Bail } from "./bail.schema";

export function erreursBail(b: Bail): string[] {
  const err: string[] = [];
  if (!b.bailleurs[0]?.nom?.trim()) err.push("Nom du bailleur");
  if (!b.preneurs[0]?.nom?.trim()) err.push("Nom du preneur");
  if (!b.adresseBien?.trim() && !b.commune?.trim()) err.push("Adresse ou commune du bien");
  if (!b.dateDebut) err.push("Date de prise d'effet");
  if (b.typeBail !== "Bail mobilit\u00e9" && !(b.loyerHc > 0)) err.push("Loyer hors charges");
  return err;
}
