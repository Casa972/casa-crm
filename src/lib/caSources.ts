import type { Revenu } from "../types/domain";

export interface CaSources {
  ventes: number;
  locations: number;
  expertises: number;
  estimations: number;
  autres: number;
}

export function caSources(revenus: Revenu[], onlyEncaisse = true): CaSources {
  const rows = revenus.filter((r) => !onlyEncaisse || r.statut === "Encaissé");
  const sum = (pred: (type: string) => boolean) => rows.filter((r) => pred(r.type)).reduce((s, r) => s + r.montant, 0);
  const ventes = sum((t) => t === "Commission vente");
  const locations = sum((t) => t === "Commission location" || t === "Gestion locative");
  const expertises = sum((t) => t === "Expertise");
  const estimations = sum((t) => t === "Estimation valeur vénale");
  const autres = rows.reduce((s, r) => s + r.montant, 0) - ventes - locations - expertises - estimations;
  return { ventes, locations, expertises, estimations, autres };
}
