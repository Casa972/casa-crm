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

export interface MonthStat {
  month: string;   // "2026-01"
  label: string;   // "Jan."
  encaisse: number;
  enAttente: number;
}

export interface Financials {
  globalEncaisse: number;
  globalAEncaisser: number;
  totalPotentiel: number;
  pctRealise: number;
  revMois: number;
  revMoisPrev: number;
  revAnneeCourante: number;
  actesEncaisses: Compromis[];
  totalActesEncaisses: number;
  compromisAEncaisser: Compromis[];
  totalCompromisAEncaisser: number;
  mandatsEnCours: Mandat[];
  alertesDelais: Compromis[];
  commMontant: (c: Compromis) => number;
  agentPerformance: AgentPerf[];
  monthly: MonthStat[];
  funnel: {
    mandats: number;
    compromis: number;
    actes: number;
    txMC: number;
    txCA: number;
  };
}

const AGENT_META: Record<string, { name: string; color: string }> = {
  dir:    { name: "Luc",    color: "#1A3A52" },
  noham:  { name: "Noham",  color: "#9A6D22" },
  steeve: { name: "Steeve", color: "#5B4E8C" },
};

export function useFinancials(data: AgencyData): Financials {
  return useMemo<Financials>(() => {
    const { compromis, revenus, mandats } = data;

    const totalRevEnc = revenus.filter(r => r.statut === "Encaissé").reduce((s, r) => s + r.montant, 0);
    const totalRevAtt = revenus.filter(r => r.statut === "En attente").reduce((s, r) => s + r.montant, 0);

    const globalEncaisse = totalRevEnc;

    const caPotentiel = compromis
      .filter(c => !["Acte signé", "Annulé"].includes(c.statut))
      .reduce((s, c) => s + commissionMontant(c), 0);

    const globalAEncaisser = caPotentiel + totalRevAtt;
    const totalPotentiel = globalEncaisse + globalAEncaisser;
    const pctRealise = totalPotentiel > 0 ? Math.round((globalEncaisse / totalPotentiel) * 100) : 0;

    const actesEncaisses = compromis.filter(
      c => c.statut === "Acte signé" && c.commissionStatut === "Encaissée"
    );
    const totalActesEncaisses = actesEncaisses.reduce((s, c) => s + commissionMontant(c), 0);

    const compromisAEncaisser = compromis.filter(
      c => c.statut !== "Annulé" && c.commissionStatut !== "Encaissée"
    );
    const totalCompromisAEncaisser = compromisAEncaisser.reduce((s, c) => s + commissionMontant(c), 0);

    const mandatsEnCours = mandats.filter(m => m.statut === "Actif");

    const alertesDelais = compromis.filter(c => {
      if (["Acte signé", "Annulé"].includes(c.statut)) return false;
      const sru = daysDiff(c.sruExpire);
      const cond = daysDiff(c.condSuspExpire);
      return (sru !== null && sru <= 3) || (cond !== null && cond <= 7);
    });

    const now = new Date();
    const moisCourant = now.getMonth();
    const anneeCourante = now.getFullYear();

    const revMois = revenus
      .filter(r => r.statut === "Encaissé" && r.date && new Date(r.date).getMonth() === moisCourant && new Date(r.date).getFullYear() === anneeCourante)
      .reduce((s, r) => s + r.montant, 0);

    const prevMonth = moisCourant === 0 ? 11 : moisCourant - 1;
    const prevYear = moisCourant === 0 ? anneeCourante - 1 : anneeCourante;
    const revMoisPrev = revenus
      .filter(r => r.statut === "Encaissé" && r.date && new Date(r.date).getMonth() === prevMonth && new Date(r.date).getFullYear() === prevYear)
      .reduce((s, r) => s + r.montant, 0);

    const revAnneeCourante = revenus
      .filter(r => r.statut === "Encaissé" && r.date && new Date(r.date).getFullYear() === anneeCourante)
      .reduce((s, r) => s + r.montant, 0);

    // Données mensuelles sur 12 mois glissants
    const monthly: MonthStat[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
      const encaisse = revenus.filter(r => r.statut === "Encaissé" && r.date?.startsWith(monthKey)).reduce((s, r) => s + r.montant, 0);
      const enAttente = revenus.filter(r => r.statut === "En attente" && r.date?.startsWith(monthKey)).reduce((s, r) => s + r.montant, 0);
      monthly.push({ month: monthKey, label, encaisse, enAttente });
    }

    // Funnel de conversion
    const funnelMandats = mandats.filter(m => m.statut !== "Expiré").length;
    const funnelCompromis = compromis.filter(c => c.statut !== "Annulé").length;
    const funnelActes = compromis.filter(c => c.statut === "Acte signé").length;
    const txMC = funnelMandats > 0 ? Math.round((funnelCompromis / funnelMandats) * 100) : 0;
    const txCA = funnelCompromis > 0 ? Math.round((funnelActes / funnelCompromis) * 100) : 0;

    // Performance agents
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
      globalEncaisse, globalAEncaisser, totalPotentiel, pctRealise,
      revMois, revMoisPrev, revAnneeCourante,
      actesEncaisses, totalActesEncaisses,
      compromisAEncaisser, totalCompromisAEncaisser,
      mandatsEnCours, alertesDelais,
      commMontant: commissionMontant,
      agentPerformance: Object.values(perf),
      monthly,
      funnel: { mandats: funnelMandats, compromis: funnelCompromis, actes: funnelActes, txMC, txCA },
    };
  }, [data]);
}
