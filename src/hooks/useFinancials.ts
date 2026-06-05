import { useMemo } from "react";
import { commissionMontant } from "../schemas/compromis.schema";
import { daysDiff } from "../lib/format";
import type { AgencyData, Compromis, Mandat } from "../types/domain";

export interface AgentPerf {
  id: string;
  name: string;
  color: string;
  clients: number;
  compromis: number;
  caVentes: number;
}

export interface Financials {
  // Totaux consolidés
  globalEncaisse: number;
  globalAEncaisser: number;
  totalPotentiel: number;
  pctRealise: number;
  revMois: number;
  // Vues dédiées (harmonisées avec le pilotage)
  actesEncaisses: Compromis[];
  totalActesEncaisses: number;
  compromisAEncaisser: Compromis[];
  totalCompromisAEncaisser: number;
  mandatsEnCours: Mandat[];
  // Pilotage opérationnel
  alertesDelais: Compromis[];
  commMontant: (c: Compromis) => number;
  agentPerformance: AgentPerf[];
}

const AGENT_META: Record<string, { name: string; color: string }> = {
  dir: { name: "Luc", color: "#1A3A52" },
  noham: { name: "Noham", color: "#9A6D22" },
  steeve: { name: "Steeve", color: "#5B4E8C" },
};

/**
 * Calcul financier centralisé et MÉMOÏSÉ. Ne recalcule que si les tableaux
 * sources changent de référence — un changement d'onglet ne déclenche rien.
 */
export function useFinancials(data: AgencyData): Financials {
  return useMemo<Financials>(() => {
    const { compromis, revenus, mandats } = data;

    const totalRevEnc = revenus
      .filter((r) => r.statut === "Encaissé")
      .reduce((s, r) => s + r.montant, 0);
    const totalRevAtt = revenus
      .filter((r) => r.statut === "En attente")
      .reduce((s, r) => s + r.montant, 0);

    const globalEncaisse = totalRevEnc;

    const caPotentiel = compromis
      .filter((c) => !["Acte signé", "Annulé"].includes(c.statut))
      .reduce((s, c) => s + commissionMontant(c), 0);

    const globalAEncaisser = caPotentiel + totalRevAtt;
    const totalPotentiel = globalEncaisse + globalAEncaisser;
    const pctRealise = totalPotentiel > 0 ? Math.round((globalEncaisse / totalPotentiel) * 100) : 0;

    const actesEncaisses = compromis.filter(
      (c) => c.statut === "Acte signé" && c.commissionStatut === "Encaissée",
    );
    const totalActesEncaisses = actesEncaisses.reduce((s, c) => s + commissionMontant(c), 0);

    const compromisAEncaisser = compromis.filter(
      (c) => c.statut !== "Annulé" && c.commissionStatut !== "Encaissée",
    );
    const totalCompromisAEncaisser = compromisAEncaisser.reduce((s, c) => s + commissionMontant(c), 0);

    const mandatsEnCours = mandats.filter((m) => m.statut === "Actif");

    const alertesDelais = compromis.filter((c) => {
      if (["Acte signé", "Annulé"].includes(c.statut)) return false;
      const sru = daysDiff(c.sruExpire);
      const cond = daysDiff(c.condSuspExpire);
      return (sru !== null && sru <= 3) || (cond !== null && cond <= 7);
    });

    const moisCourant = new Date().getMonth();
    const revMois = revenus
      .filter((r) => r.statut === "Encaissé" && r.date && new Date(r.date).getMonth() === moisCourant)
      .reduce((s, r) => s + r.montant, 0);

    // Performance par agent
    const perf: Record<string, AgentPerf> = {};
    for (const [agentId, meta] of Object.entries(AGENT_META)) {
      perf[agentId] = { id: agentId, ...meta, clients: 0, compromis: 0, caVentes: 0 };
    }
    for (const c of data.clients) {
      const a = c.agentId && perf[c.agentId];
      if (a && !["Acte", "Perdu"].includes(c.statut)) a.clients += 1;
    }
    for (const cp of compromis) {
      const a = cp.agentId && perf[cp.agentId];
      if (a && cp.statut !== "Annulé") {
        a.compromis += 1;
        a.caVentes += commissionMontant(cp);
      }
    }

    return {
      globalEncaisse, globalAEncaisser, totalPotentiel, pctRealise, revMois,
      actesEncaisses, totalActesEncaisses,
      compromisAEncaisser, totalCompromisAEncaisser,
      mandatsEnCours, alertesDelais,
      commMontant: commissionMontant,
      agentPerformance: Object.values(perf),
    };
  }, [data]);
}
