import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useUiStore } from "../../store/ui.store";
import { RedacteurView } from "./RedacteurView";
import { downloadFicheApportAffaires } from "../../reports/FicheApportAffairesPDF";
import { downloadFicheApportPromo } from "../../reports/FicheApportPromo";

const VENTE = [
  { id: "mandat" as const, title: "Mandat de vente", sub: "Simple, exclusif ou semi-exclusif — Hoguet / ALUR" },
  { id: "offre" as const, title: "Offre d'achat", sub: "Offre ferme, conditions suspensives, validité" },
  { id: "compromis" as const, title: "Compromis de vente", sub: "Promesse synallagmatique — articles ALUR" },
];

export function ActesHome() {
  const [open, setOpen] = useState<(typeof VENTE)[number]["id"] | null>(null);
  const setPrefillRedacteur = useUiStore((s) => s.setPrefillRedacteur);
  const setView = useUiStore((s) => s.setView);

  const openDoc = (id: (typeof VENTE)[number]["id"]) => {
    setPrefillRedacteur({ docType: id, sourceId: "" });
    setOpen(id);
  };

  if (open) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3">
          <button className="btn-ghost text-[13px]" onClick={() => setOpen(null)}>
            <ChevronLeft size={14} /> Tous les actes
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <RedacteurView />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[860px] px-6 py-6">
      <h1 className="font-heading text-2xl font-semibold text-ink">Rédaction vente</h1>
      <p className="mb-6 text-[13px] text-ink-muted">
        Un acte à la fois, dans l'ordre du dossier. Baux et estimations ont leurs propres écrans.
      </p>

      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Cycle de vente</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {VENTE.map((d, i) => (
          <button key={d.id} onClick={() => openDoc(d.id)} className="card p-4 text-left hover:border-primary/40">
            <div className="mb-2 text-[11px] font-bold text-primary">{i + 1}</div>
            <div className="font-heading text-[15px] font-semibold text-ink">{d.title}</div>
            <div className="mt-1 text-[12px] text-ink-muted">{d.sub}</div>
          </button>
        ))}
      </div>

      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Apport d'affaires</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <button onClick={() => downloadFicheApportPromo()} className="card p-4 text-left hover:border-primary/40">
          <div className="font-heading text-[15px] font-semibold text-ink">Flyer apport</div>
          <div className="mt-1 text-[12px] text-ink-muted">Fiche commerciale à remettre — PDF</div>
        </button>
        <button onClick={() => downloadFicheApportAffaires()} className="card p-4 text-left hover:border-primary/40">
          <div className="font-heading text-[15px] font-semibold text-ink">Déclaration d'apport</div>
          <div className="mt-1 text-[12px] text-ink-muted">Contrat à faire signer — PDF</div>
        </button>
      </div>

      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Autres rédactions</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <button onClick={() => setView("bail")} className="card p-4 text-left hover:border-primary/40">
          <div className="font-heading text-[15px] font-semibold text-ink">Baux</div>
          <div className="mt-1 text-[12px] text-ink-muted">Nu, meublé, mobilité, saisonnier</div>
        </button>
        <button onClick={() => setView("valeur_venale")} className="card p-4 text-left hover:border-primary/40">
          <div className="font-heading text-[15px] font-semibold text-ink">Valeur vénale</div>
          <div className="mt-1 text-[12px] text-ink-muted">Estimation à la vente</div>
        </button>
        <button onClick={() => setView("valeur_locative")} className="card p-4 text-left hover:border-primary/40">
          <div className="font-heading text-[15px] font-semibold text-ink">Valeur locative</div>
          <div className="mt-1 text-[12px] text-ink-muted">Estimation à la location</div>
        </button>
      </div>
    </div>
  );
}
