import { useState, useMemo } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { MandatLocationPDF } from "../../reports/MandatLocationPDF";
import {
  emptyMandatLocation, calcMandatLocation, type MandatLocation, type Mandant,
} from "../../schemas/redacteur/mandatLocation.schema";
import { COMMUNES_MARTINIQUE } from "../../schemas/enums";
import { eur } from "../../lib/format";

function emptyMandant(): Mandant {
  return {
    civilite: "M.", prenom: "", nom: "", dateNaissance: "", nationalite: "Fran\u00e7aise",
    adresse: "", codePostal: "", ville: "", pays: "FRANCE", tel: "", email: "", qualite: "Propri\u00e9taire",
  };
}

export function MandatLocationView() {
  const [f, setF] = useState<MandatLocation>(() => emptyMandatLocation());
  const [busy, setBusy] = useState(false);
  const upd = <K extends keyof MandatLocation>(k: K, v: MandatLocation[K]) => setF((p) => ({ ...p, [k]: v }));
  const setMandant = (i: number, patch: Partial<Mandant>) =>
    upd("mandants", f.mandants.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const calc = useMemo(() => calcMandatLocation(f), [f]);

  const download = async () => {
    setBusy(true);
    try {
      const blob = await pdf(<MandatLocationPDF f={f} />).toBlob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Mandat_location_${f.numero || f.commune || "Casa"}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[860px] px-6 py-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Mandat de location</h1>
          <p className="text-[13px] text-ink-muted">Hoguet / ALUR \u2014 recherche locataire et gestion</p>
        </div>
        <button className="btn-primary" disabled={busy} onClick={() => void download()}>
          <Download size={14} /> {busy ? "PDF\u2026" : "T\u00e9l\u00e9charger PDF"}
        </button>
      </div>

      <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-muted">Document</h2>
      <Grid2>
        <Field label="N\u00b0 mandat"><Input value={f.numero} onChange={(e) => upd("numero", e.target.value)} placeholder="ML-2026-001" /></Field>
        <Field label="Date"><Input type="date" value={f.date} onChange={(e) => upd("date", e.target.value)} /></Field>
        <Field label="Lieu de signature"><Input value={f.lieu} onChange={(e) => upd("lieu", e.target.value)} /></Field>
        <Field label="R\u00e9dacteur"><Input value={f.redacteur} onChange={(e) => upd("redacteur", e.target.value)} /></Field>
      </Grid2>

      <h2 className="mb-2 mt-4 text-[12px] font-bold uppercase tracking-wide text-ink-muted">Mandant(s)</h2>
      {f.mandants.map((m, i) => (
        <div key={i} className="mb-3 rounded-lg border border-line p-3">
          <Grid2>
            <Field label="Civilit\u00e9"><Select value={m.civilite} onChange={(v) => setMandant(i, { civilite: v })} options={["M.", "Mme", "M. et Mme"]} /></Field>
            <Field label="Nom"><Input value={m.nom} onChange={(e) => setMandant(i, { nom: e.target.value })} /></Field>
            <Field label="Pr\u00e9nom"><Input value={m.prenom} onChange={(e) => setMandant(i, { prenom: e.target.value })} /></Field>
            <Field label="T\u00e9l."><Input value={m.tel} onChange={(e) => setMandant(i, { tel: e.target.value })} /></Field>
            <Field label="Email"><Input value={m.email} onChange={(e) => setMandant(i, { email: e.target.value })} /></Field>
            <Field label="Ville"><Input value={m.ville} onChange={(e) => setMandant(i, { ville: e.target.value })} /></Field>
          </Grid2>
          {f.mandants.length > 1 && (
            <button className="btn-ghost text-[12px] text-danger" onClick={() => upd("mandants", f.mandants.filter((_, j) => j !== i))}>
              <Trash2 size={12} /> Retirer
            </button>
          )}
        </div>
      ))}
      <button className="btn-ghost mb-4 text-[12px]" onClick={() => upd("mandants", [...f.mandants, emptyMandant()])}>
        <Plus size={12} /> Co-mandant
      </button>

      <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-muted">Bien</h2>
      <Grid2>
        <Field label="Adresse"><Input value={f.adresseBien} onChange={(e) => upd("adresseBien", e.target.value)} /></Field>
        <Field label="Commune"><Select value={f.commune} onChange={(v) => upd("commune", v)} options={COMMUNES_MARTINIQUE} /></Field>
        <Field label="Code postal"><Input value={f.codePostal} onChange={(e) => upd("codePostal", e.target.value)} /></Field>
        <Field label="Type de bien"><Select value={f.typeBien} onChange={(v) => upd("typeBien", v)} options={["Appartement", "Maison", "Villa", "Studio", "Local"]} /></Field>
        <Field label="Surface (m\u00b2)"><Input type="number" value={f.surfaceHabitable || ""} onChange={(e) => upd("surfaceHabitable", Number(e.target.value))} /></Field>
        <Field label="Pi\u00e8ces"><Input value={f.nbPieces} onChange={(e) => upd("nbPieces", e.target.value)} placeholder="T3, 2 chambres\u2026" /></Field>
        <Field label="R\u00e9f. cadastrale"><Input value={f.refCadastrale} onChange={(e) => upd("refCadastrale", e.target.value)} /></Field>
      </Grid2>
      <Field label="Description"><Textarea rows={3} value={f.descriptionBien} onChange={(e) => upd("descriptionBien", e.target.value)} /></Field>

      <h2 className="mb-2 mt-4 text-[12px] font-bold uppercase tracking-wide text-ink-muted">Mandat & conditions</h2>
      <Grid2>
        <Field label="R\u00e9gime locatif">
          <Select value={f.regimeLocatif} onChange={(v) => upd("regimeLocatif", v as MandatLocation["regimeLocatif"])} options={[
            "Location nue (loi 1989)", "Location meubl\u00e9e (loi 1989)", "Bail mobilit\u00e9", "Location saisonni\u00e8re",
          ]} />
        </Field>
        <Field label="Type de mandat">
          <Select value={f.typeMandat} onChange={(v) => upd("typeMandat", v as MandatLocation["typeMandat"])} options={["Exclusif", "Semi-exclusif", "Simple"]} />
        </Field>
        <Field label="Mission">
          <Select value={f.mission} onChange={(v) => upd("mission", v as MandatLocation["mission"])} options={[
            "Recherche de locataire", "Gestion locative", "Recherche et gestion",
          ]} />
        </Field>
        <Field label="Dur\u00e9e (mois)"><Input type="number" value={f.dureeMois || ""} onChange={(e) => upd("dureeMois", Number(e.target.value))} /></Field>
        <Field label="Date de d\u00e9but"><Input type="date" value={f.dateDebut} onChange={(e) => upd("dateDebut", e.target.value)} /></Field>
        <Field label="Loyer souhait\u00e9 HC"><Input type="number" value={f.loyerSouhaite || ""} onChange={(e) => upd("loyerSouhaite", Number(e.target.value))} /></Field>
        <Field label="Charges / mois"><Input type="number" value={f.chargesMensuelles || ""} onChange={(e) => upd("chargesMensuelles", Number(e.target.value))} /></Field>
        <Field label="Honoraires \u2014 mode">
          <Select value={f.honorairesType} onChange={(v) => upd("honorairesType", v as MandatLocation["honorairesType"])} options={[
            { value: "mois_de_loyer", label: "Mois de loyer" },
            { value: "pourcentage", label: "% du loyer" },
            { value: "forfait", label: "Forfait \u20ac" },
          ]} />
        </Field>
        <Field label="Valeur honoraires"><Input type="number" step="0.1" value={f.honorairesValeur || ""} onChange={(e) => upd("honorairesValeur", Number(e.target.value))} /></Field>
        <Field label="Charge honoraires">
          <Select value={f.chargeHonoraires} onChange={(v) => upd("chargeHonoraires", v as MandatLocation["chargeHonoraires"])} options={[
            { value: "bailleur", label: "Bailleur" },
            { value: "locataire", label: "Locataire" },
            { value: "partage", label: "Partage" },
          ]} />
        </Field>
      </Grid2>

      {calc.honoraires > 0 && (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary-soft px-4 py-3 text-[13px] text-primary">
          Honoraires calcul\u00e9s : <b>{eur(calc.honoraires)}</b>
          {calc.dateFin && <> \u00b7 \u00c9ch\u00e9ance indicative : {calc.dateFin}</>}
        </div>
      )}

      <Field label="Observations"><Textarea rows={3} value={f.observations} onChange={(e) => upd("observations", e.target.value)} /></Field>

      <div className="mt-4 flex justify-end">
        <button className="btn-primary" disabled={busy} onClick={() => void download()}>
          <Download size={14} /> {busy ? "G\u00e9n\u00e9ration\u2026" : "T\u00e9l\u00e9charger le PDF"}
        </button>
      </div>
    </div>
  );
}
