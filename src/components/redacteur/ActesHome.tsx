import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useUiStore } from "../../store/ui.store";
import { RedacteurView } from "./RedacteurView";
import { MandatLocationView } from "../bail/MandatLocationView";
import { downloadFicheApportAffaires } from "../../reports/FicheApportAffairesPDF";
import { downloadFicheApportPromo } from "../../reports/FicheApportPromo";

const VENTE = [
  { id: "mandat" as const, title: "Mandat de vente", sub: "Simple, exclusif ou semi-exclusif — Hoguet / ALUR" },
  { id: "offre" as const, title: "Offre d'achat", sub: "Offre ferme, conditions suspensives, validité" },
  { id: "compromis" as const, title: "Compromis de vente", sub: "Promesse synallagmatique — articles ALUR" },
];

export function ActesHome() {
  const [open, setOpen] = useState<(typeof VENTE)[number]["id"] | "mandat_loc" | null>(null);
  const setPrefillRedacteur = useUiStore((s) => s.setPrefillRedacteur);
  const setView = useUiStore((s) => s.setView);
  const openTitle =
    open === "mandat_loc" ? "Mandat de location" : VENTE.find((d) => d.id === open)?.title;

  const openDoc = (id: (typeof VENTE)[number]["id"]) => {
    setPrefillRedacteur({ docType: id, sourceId: "" });
    setOpen(id);
  };

  if (open === "mandat_loc") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3">
          <button className="btn-ghost text-[13px]" onClick={() => setOpen(null)}>
            <ChevronLeft size={14} /> Tous les actes
          </button>
          <span className="font-heading text-sm font-semibold text-ink">Mandat de location</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <MandatLocationView />
        </div>
      </div>
    );
  }

  if (open) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3">
          <button className="btn-ghost text-[13px]" onClick={() => setOpen(null)}>
            <ChevronLeft size={14} /> Tous les actes
          </button>
          {openTitle && (
            <span className="font-heading text-sm font-semibold text-ink">{openTitle}</span>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden [&_aside]:hidden [&_h2.mb-5]:hidden">
          <RedacteurView />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 py-5">
      <h1 className="font-heading text-2xl font-semibold text-ink">Rédaction</h1>
      <p className="mb-6 text-[13px] text-ink-muted">
        Actes de vente et mandat de location. Les baux détaillés sont dans le menu Baux.
      </p>

      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Cycle de vente</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {VENTE.map((d, i) => (
          <button key={d.id} onClick={() => openDoc(d.id)} className="card p-4 text-left hover:border-primary/40">
            <div className="mb-2 text-[11px] font-bold text-primary">{i + 1}</div>
            <div className="font-heading text-[15px] font-semibold text-ink">{d.title}</div>
            <p className="mt-1 text-[12px] text-ink-muted">{d.sub}</p>
          </button>
        ))}
      </div>

      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Location</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <button onClick={() => setOpen("mandat_loc")} className="card p-4 text-left hover:border-primary/40">
          <div className="font-heading text-[15px] font-semibold text-ink">Mandat de location</div>
          <p className="mt-1 text-[12px] text-ink-muted">
            Recherche de locataire, exclusif ou simple — honoraires et mission
          </p>
        </button>
        <button onClick={() => setView("bail")} className="card p-4 text-left hover:border-primary/40">
          <div className="font-heading text-[15px] font-semibold text-ink">Rédiger un bail</div>
          <p className="mt-1 text-[12px] text-ink-muted">Bail d'habitation, meublé, mobilité ou saisonnier</p>
        </button>
      </div>

      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Fiches</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          className="card p-4 text-left hover:border-primary/40"
          onClick={() => void downloadFicheApportAffaires()}
        >
          <div className="font-heading text-[15px] font-semibold text-ink">Fiche apport d'affaires</div>
          <p className="mt-1 text-[12px] text-ink-muted">Document partenaire à télécharger</p>
        </button>
        <button
          className="card p-4 text-left hover:border-primary/40"
          onClick={() => void downloadFicheApportPromo()}
        >
          <div className="font-heading text-[15px] font-semibold text-ink">Fiche apport promo</div>
          <p className="mt-1 text-[12px] text-ink-muted">Version promotionnelle</p>
        </button>
      </div>
    </div>
  );
}
