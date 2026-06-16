import { useState } from "react";
import { Users, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "../shared/PageHeader";
import { StatusPill } from "../shared/StatusPill";
import { EmptyState } from "../ui/Modal";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { eur } from "../../lib/format";
import type { Client, Bien } from "../../types/domain";

interface MatchResult {
  bien: Bien;
  score: number;
  reasons: string[];
}

function computeMatches(client: Client, biens: Bien[]): MatchResult[] {
  const disponibles = biens.filter((b) => b.statut === "Disponible");
  const results: MatchResult[] = [];

  for (const bien of disponibles) {
    const reasons: string[] = [];
    let matched = 0;
    let total = 0;

    // Cat: Acheteur/Investisseur → vente ; Locataire → location
    if (client.type === "Locataire") {
      total++;
      if (bien.cat === "location") { matched++; reasons.push("Location ✓"); }
    } else {
      total++;
      if (bien.cat === "vente") { matched++; reasons.push("Vente ✓"); }
    }

    // Commune
    if (client.commune) {
      total++;
      if (bien.commune.toLowerCase() === client.commune.toLowerCase()) {
        matched++; reasons.push(`Commune (${bien.commune}) ✓`);
      }
    }

    // Type bien
    if (client.typeBien) {
      total++;
      if (bien.type.toLowerCase().includes(client.typeBien.toLowerCase()) || client.typeBien.toLowerCase().includes(bien.type.toLowerCase())) {
        matched++; reasons.push(`Type (${bien.type}) ✓`);
      }
    }

    // Budget
    if (client.budgetMax > 0) {
      total++;
      if (bien.prix <= client.budgetMax) {
        matched++; reasons.push(`Prix dans budget ✓`);
      }
    }

    // Chambres
    if (client.chambresMin > 0) {
      total++;
      if (bien.chambres >= client.chambresMin) {
        matched++; reasons.push(`${bien.chambres} ch. ≥ ${client.chambresMin} ✓`);
      }
    }

    if (total === 0) continue;
    const score = Math.round((matched / total) * 100);
    if (score > 0) results.push({ bien, score, reasons });
  }

  return results.sort((a, b) => b.score - a.score);
}

function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 80 ? "emerald" : score >= 50 ? "amber" : "neutral";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold bg-${tone}-soft text-${tone}`}>
      {score}%
    </span>
  );
}

function ClientMatchRow({ client, biens }: { client: Client; biens: Bien[] }) {
  const [open, setOpen] = useState(false);
  const matches = computeMatches(client, biens);

  return (
    <div className="card mb-2 overflow-hidden">
      <button
        className="flex w-full items-center gap-3 p-3 text-left hover:bg-bg/50"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded bg-primary-soft font-bold text-primary text-sm">
          {client.prenom[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold text-ink">{client.prenom} {client.nom}</div>
          <div className="text-[11.5px] text-ink-muted">
            {client.type} · {client.commune || "Commune non définie"}
            {client.budgetMax > 0 ? ` · Budget ${eur(client.budgetMax)}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-ink-sub">{matches.length} bien(s) compatible(s)</span>
          {open ? <ChevronUp size={14} className="text-ink-muted" /> : <ChevronDown size={14} className="text-ink-muted" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-line px-3 pb-3 pt-2">
          {matches.length === 0 ? (
            <p className="text-[13px] text-ink-muted py-2">Aucun bien compatible actuellement.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {matches.map(({ bien, score, reasons }) => (
                <div key={bien.id} className="flex items-start gap-3 rounded bg-bg p-2.5">
                  <ScoreBadge score={score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-ink">{bien.ref}</span>
                      <StatusPill label={bien.type} />
                      <span className="text-[12px] text-ink-sub">{bien.commune}</span>
                    </div>
                    <div className="text-[12px] text-ink-sub mt-0.5">
                      {eur(bien.prix)} · {bien.surface} m² · {bien.chambres} ch.
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {reasons.map((r, i) => (
                        <span key={i} className="rounded bg-emerald-soft px-1.5 py-0.5 text-[10.5px] font-medium text-emerald">{r}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MatchingView() {
  const { data } = useAgencyData();
  const user = useSessionStore((s) => s.user);
  const isDir = useSessionStore((s) => s.isDirecteur());

  const acquéreurs = data.clients.filter((c) =>
    ["Acheteur", "Locataire", "Investisseur"].includes(c.type) &&
    !["Acte", "Perdu"].includes(c.statut) &&
    (!isDir ? c.agentId === user?.id : true)
  );

  return (
    <div className="mx-auto max-w-[860px] px-4 py-5">
      <PageHeader
        title="Matching clients ↔ biens"
        subtitle={`${acquéreurs.length} client(s) actif(s) analysé(s)`}
      />

      <div className="mb-4 card p-3 bg-primary-soft border-l-4 border-l-primary text-[13px] text-primary font-medium">
        Calcul automatique : chaque client actif (Acheteur, Locataire, Investisseur) est comparé aux biens disponibles selon commune, type, budget et chambres.
      </div>

      {acquéreurs.length === 0 ? (
        <EmptyState Icon={Users} text="Aucun client actif" sub="Ajoutez des clients acheteurs ou locataires pour voir le matching." />
      ) : (
        <div>
          {acquéreurs.map((client) => (
            <ClientMatchRow key={client.id} client={client} biens={data.biens} />
          ))}
        </div>
      )}
    </div>
  );
}
