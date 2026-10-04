import { eur } from "../lib/format";
import { commissionAgence } from "../schemas/compromis.schema";
import { AGENTS_CONFIG } from "../config/agents";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { FinanceNav } from "../shared/FinanceNav";

export const PART_CA = 0.5;
export const PART_VENTE = 0.25;
export const PART_ESTIMATION = 0.5;

export function RegleRemuneration() {
  return (
    <p className="mb-4 rounded border border-line bg-bg px-3 py-2 text-[12.5px] text-ink-sub">
      Sur une vente, la part Casa est le chiffre de l'agence. Chaque commercial en rapporte 50 % (entrée ou sortie). Il en touche 25 %. Sur une estimation, il touche 50 % des honoraires.
    </p>
  );
}

type Ligne = { id: string; name: string; ca: number; toucheVente: number; toucheEst: number; aVenir: number };

export function useRemuneration(onlyAgentId?: string): Ligne[] {
  const { data } = useAgencyData();
  const agents = AGENTS_CONFIG.filter((a) => !onlyAgentId || a.id === onlyAgentId);
  return agents.map((agent) => {
    let ca = 0;
    let toucheVente = 0;
    let aVenir = 0;
    for (const c of data.compromis) {
      if (c.statut === "Annulé") continue;
      const part = commissionAgence(c);
      const entree = c.agentEntree === agent.name;
      const sortie = c.agentSortie === agent.name;
      if (!entree && !sortie) continue;
      const roles = Number(entree) + Number(sortie);
      const signe = c.statut === "Acte signé";
      ca += Math.round(part * PART_CA * roles);
      const paye = Math.round(part * PART_VENTE * roles);
      if (signe) toucheVente += paye;
      else aVenir += paye;
    }
    const toucheEst = data.revenus
      .filter((r) => r.type === "Estimation valeur vénale" && r.statut === "Encaissé" && r.desc.toLowerCase().includes(agent.name.toLowerCase()))
      .reduce((s, r) => s + Math.round(r.montant * PART_ESTIMATION), 0);
    return { id: agent.id, name: agent.name, ca, toucheVente, toucheEst, aVenir };
  });
}

export function RemunerationTable({ onlyAgentId }: { onlyAgentId?: string }) {
  const lignes = useRemuneration(onlyAgentId);
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-bg text-[11px] uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="px-3 py-2">Commercial</th>
            <th className="px-3 py-2">CA rapporté</th>
            <th className="px-3 py-2">Touché ventes</th>
            <th className="px-3 py-2">Touché estimations</th>
            <th className="px-3 py-2">À venir</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.id} className="border-t border-line">
              <td className="px-3 py-2 font-medium">{l.name}</td>
              <td className="px-3 py-2">{eur(l.ca)}</td>
              <td className="px-3 py-2">{eur(l.toucheVente)}</td>
              <td className="px-3 py-2">{eur(l.toucheEst)}</td>
              <td className="px-3 py-2">{eur(l.aVenir)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RemunerationView() {
  const isDir = useSessionStore((s) => s.isDirecteur());
  const user = useSessionStore((s) => s.user);
  return (
    <div className="mx-auto max-w-5xl px-6 py-5">
      {isDir && <FinanceNav active="remuneration" />}
      <h1 className="mb-1 font-heading text-2xl font-semibold text-ink">{isDir ? "Rémunération" : "Ma rémunération"}</h1>
      <RegleRemuneration />
      <RemunerationTable onlyAgentId={isDir ? undefined : user?.id} />
      <p className="mt-3 text-[12px] text-ink-muted">Le CA rapporté n'est pas le salaire. Une estimation est comptée si le nom du commercial est dans la description du revenu.</p>
    </div>
  );
}
