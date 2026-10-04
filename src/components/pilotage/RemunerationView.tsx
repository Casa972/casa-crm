import { eur } from "../../lib/format";
import { commissionAgence } from "../../schemas/compromis.schema";
import { AGENTS_CONFIG } from "../../config/agents";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { FinanceNav } from "../shared/FinanceNav";

export const PART_CA = 0.5;
export const PART_VENTE = 0.25;
export const PART_ESTIMATION = 0.5;

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

function Carte({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 font-heading text-2xl font-semibold text-ink">{value}</div>
      <div className="mt-1 text-[12px] text-ink-sub">{hint}</div>
    </div>
  );
}

export function RemunerationView() {
  const isDir = useSessionStore((s) => s.isDirecteur());
  const user = useSessionStore((s) => s.user);
  const lignes = useRemuneration(isDir ? undefined : user?.id);
  const totalCa = lignes.reduce((s, l) => s + l.ca, 0);
  const totalPaye = lignes.reduce((s, l) => s + l.toucheVente + l.toucheEst, 0);
  const totalVenir = lignes.reduce((s, l) => s + l.aVenir, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-5">
      {isDir && <FinanceNav active="remuneration" />}
      <h1 className="font-heading text-2xl font-semibold text-ink">{isDir ? "Commission des commerciaux" : "Ma commission"}</h1>
      <p className="mb-4 mt-1 max-w-2xl text-[13px] text-ink-sub">
        Deux colonnes, comme en agence. Le CA rapporté est la part de l'affaire attribuée au commercial. La commission est ce qu'il touche.
      </p>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Carte label="CA rapporté" value={eur(totalCa)} hint="50 % entrée, 50 % sortie de la part Casa" />
        <Carte label="Commission due" value={eur(totalPaye)} hint="25 % par rôle sur une vente, 50 % sur une estimation" />
        <Carte label="Commission à venir" value={eur(totalVenir)} hint="Dossiers pas encore signés" />
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-bg text-[11px] uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-3 py-2">Commercial</th>
              <th className="px-3 py-2">CA rapporté</th>
              <th className="px-3 py-2">Commission ventes</th>
              <th className="px-3 py-2">Commission estimations</th>
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
                <td className="px-3 py-2 text-ink-sub">{eur(l.aVenir)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] text-ink-muted">Exemple : part Casa 10 000 €. L'entrée rapporte 5 000 € à l'agence et touche 2 500 €. La sortie, pareil. Une estimation de 400 € rapporte 200 € au commercial dont le nom est dans la description.</p>
    </div>
  );
}
