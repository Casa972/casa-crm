import type { MandatVenteDoc } from "../../schemas/redacteur/mandatVente.schema";
import { eur, fdate } from "../../lib/format";

const AGENCE = {
  nom: "CASA CARAÏBES",
  forme: "SARL au capital de 5 000 €",
  siege: "Le Lamentin (97232), Martinique",
  siret: "928 647 981 00010",
  cpi: "CPI 97212024000000007 délivrée par la CCI de Martinique",
};

const VIDE = "……………………………………";

/** Petits atomes de mise en page — tout est rendu via React (zéro innerHTML). */
function Article({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h4 className="mb-1 font-semibold text-ink">{titre}</h4>
      <div className="text-[13px] leading-relaxed text-ink-sub">{children}</div>
    </div>
  );
}

/**
 * Aperçu du Mandat de vente — composant React typé.
 * Toutes les valeurs sont injectées comme texte React (échappées par défaut) :
 * aucune faille XSS possible, contrairement à dangerouslySetInnerHTML.
 */
export function MandatVentePreview({ f }: { f: Partial<MandatVenteDoc> }) {
  const prix = f.prixVente ?? 0;
  const pct = f.honorairesPct ?? 0;
  const honoMontant = Math.round((prix * pct) / 100);
  const fai = f.chargeHono === "de l'acquéreur" ? prix + honoMontant : prix;

  return (
    <div className="font-serif text-ink">
      <div className="mb-4 border-b-2 border-ink pb-3 text-center">
        <div className="font-heading text-xl font-bold tracking-wide">{AGENCE.nom}</div>
        <div className="mt-1 text-[10px] text-ink-muted">
          {AGENCE.forme} — {AGENCE.siege}<br />SIRET {AGENCE.siret} — {AGENCE.cpi}
        </div>
      </div>

      <div className="mb-4 text-center font-heading text-base font-bold uppercase tracking-wide">
        Mandat de vente {(f.typeMandat ?? "").toUpperCase()}
      </div>

      <Article titre="Entre les soussignés">
        <p><b>Le Mandant :</b> {f.mandant || VIDE}, demeurant {f.mandantAdr || VIDE}
          {f.mandantTel ? `, téléphone ${f.mandantTel}` : ""}, ci-après « le Mandant ».</p>
        <p className="mt-1"><b>Le Mandataire :</b> {AGENCE.nom}, {AGENCE.forme}, dont le siège est à {AGENCE.siege},
          titulaire de la carte professionnelle {AGENCE.cpi}, ci-après « le Mandataire ».</p>
      </Article>

      <Article titre="Article 1 — Objet du mandat">
        Le Mandant confie au Mandataire le mandat <b>{(f.typeMandat ?? "simple").toLowerCase()}</b> de
        rechercher un acquéreur pour le bien suivant : {f.bienType || VIDE}, sis {f.bienAdr || VIDE},
        commune de {f.bienCommune || VIDE}, d'une surface d'environ <b>{f.bienSurface ?? VIDE} m²</b>.
      </Article>

      <Article titre="Article 2 — Prix et honoraires">
        <p>Prix net vendeur : <b>{eur(prix)}</b>.</p>
        <p>Honoraires du Mandataire : <b>{pct}%</b> soit <b>{eur(honoMontant)}</b>, à la charge {f.chargeHono || "de l'acquéreur"}.</p>
        <p>Prix de présentation (FAI) : <b>{eur(fai)}</b>.</p>
      </Article>

      <Article titre="Article 3 — Durée">
        Le présent mandat est consenti pour <b>{f.dureeMois ?? VIDE} mois</b> à compter du {fdate(f.dateDebut ?? "")}.
        {f.typeMandat === "Exclusif" && (
          <span> Passé un délai de trois mois, le mandat exclusif peut être dénoncé à tout moment par
            lettre recommandée avec accusé de réception, moyennant un préavis de quinze jours.</span>
        )}
      </Article>

      <Article titre="Article 4 — Faculté de rétractation">
        Lorsque le mandat est conclu hors établissement, le Mandant dispose d'un délai de quatorze jours
        pour exercer son droit de rétractation (art. L.221-18 du Code de la consommation).
      </Article>

      <div className="mt-6 flex justify-between text-[12px]">
        <div>Le Mandant<br /><span className="text-ink-muted">Signature</span></div>
        <div className="text-right">Le Mandataire (Casa Caraïbes)<br /><span className="text-ink-muted">Signature</span></div>
      </div>
    </div>
  );
}
