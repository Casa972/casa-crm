import { useState } from "react";
import { FileText, Lock, Printer } from "lucide-react";
import { Field, Grid2, Input, Select } from "../ui/Field";
import { MandatVentePreview } from "./MandatVentePreview";
import { mandatVenteDocSchema, type MandatVenteDoc } from "../../schemas/redacteur/mandatVente.schema";
import { COMMUNES_MARTINIQUE } from "../../schemas/enums";

type DocType = "mandat_vente";
const DOC_TYPES: { id: DocType; label: string; icon: string; cat: string }[] = [
  { id: "mandat_vente", label: "Mandat de vente", icon: "📋", cat: "Vente" },
];

type Errors = Record<string, string>;
type MVKeys = keyof MandatVenteDoc;

export function RedacteurView() {
  const [docType, setDocType] = useState<DocType>("mandat_vente");
  const [errors, setErrors] = useState<Errors>({});
  const [f, setF] = useState<Record<string, string>>({
    typeMandat: "Exclusif", chargeHono: "de l'acquéreur", dureeMois: "3", dateDebut: "",
  });
  const set = (k: MVKeys) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const parsed = mandatVenteDocSchema.safeParse(f);
  const valid = parsed.success;
  const previewData: Partial<MandatVenteDoc> = valid ? parsed.data : coerce(f);

  const onExport = () => {
    const res = mandatVenteDocSchema.safeParse(f);
    if (!res.success) {
      const e: Errors = {};
      for (const i of res.error.issues) { const k = String(i.path[0] ?? "_"); if (!(k in e)) e[k] = i.message; }
      setErrors(e);
      return;
    }
    setErrors({});
    window.print();
  };

  return (
    <div className="flex h-full">
      {/* Onglets latéraux */}
      <aside className="w-56 shrink-0 border-r border-line bg-surface p-3">
        <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Documents</div>
        {DOC_TYPES.map((d) => (
          <button
            key={d.id}
            onClick={() => setDocType(d.id)}
            className={`flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-[13px] font-medium ${docType === d.id ? "bg-primary-soft font-semibold text-primary" : "text-ink-sub hover:bg-line/50"}`}
          >
            <span>{d.icon}</span>{d.label}
          </button>
        ))}
      </aside>

      {/* Formulaire + Aperçu */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-2">
          {/* Form */}
          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-ink">
              <FileText size={16} /> Mandat de vente
            </h2>
            <Grid2>
              <Field label="Type de mandat"><Select value={f.typeMandat ?? ""} onChange={set("typeMandat")} options={["Exclusif", "Simple", "Semi-exclusif"]} /></Field>
              <Field label="Charge honoraires"><Select value={f.chargeHono ?? ""} onChange={set("chargeHono")} options={["de l'acquéreur", "du vendeur"]} /></Field>
              <Field label="Nom du mandant" error={errors.mandant}><Input value={f.mandant ?? ""} onChange={(e) => set("mandant")(e.target.value)} /></Field>
              <Field label="Téléphone"><Input value={f.mandantTel ?? ""} onChange={(e) => set("mandantTel")(e.target.value)} /></Field>
              <Field label="Adresse du mandant" error={errors.mandantAdr}><Input value={f.mandantAdr ?? ""} onChange={(e) => set("mandantAdr")(e.target.value)} /></Field>
              <Field label="Type de bien" error={errors.bienType}><Input value={f.bienType ?? ""} onChange={(e) => set("bienType")(e.target.value)} /></Field>
              <Field label="Adresse du bien" error={errors.bienAdr}><Input value={f.bienAdr ?? ""} onChange={(e) => set("bienAdr")(e.target.value)} /></Field>
              <Field label="Commune" error={errors.bienCommune}><Select value={f.bienCommune ?? ""} onChange={set("bienCommune")} options={COMMUNES_MARTINIQUE} /></Field>
              <Field label="Surface (m²)" error={errors.bienSurface}><Input type="number" value={f.bienSurface ?? ""} onChange={(e) => set("bienSurface")(e.target.value)} /></Field>
              <Field label="Prix net vendeur (€)" error={errors.prixVente}><Input type="number" value={f.prixVente ?? ""} onChange={(e) => set("prixVente")(e.target.value)} /></Field>
              <Field label="Honoraires (%)" error={errors.honorairesPct}><Input type="number" value={f.honorairesPct ?? ""} onChange={(e) => set("honorairesPct")(e.target.value)} /></Field>
              <Field label="Durée (mois)" error={errors.dureeMois}><Input type="number" value={f.dureeMois ?? ""} onChange={(e) => set("dureeMois")(e.target.value)} /></Field>
              <Field label="Date de prise d'effet" error={errors.dateDebut}><Input type="date" value={f.dateDebut ?? ""} onChange={(e) => set("dateDebut")(e.target.value)} /></Field>
            </Grid2>
            <button
              className="btn-primary mt-3 w-full justify-center disabled:opacity-50"
              onClick={onExport}
            >
              {valid ? <Printer size={14} /> : <Lock size={14} />}
              {valid ? "Imprimer / Exporter" : "Compléter les champs requis"}
            </button>
            {!valid && <p className="mt-2 text-center text-[11.5px] text-ink-muted">L'export se débloque une fois tous les champs requis valides.</p>}
          </div>

          {/* Aperçu sécurisé */}
          <div className="card overflow-hidden">
            <div className="border-b border-line bg-bg px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Aperçu</div>
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto bg-white px-8 py-7">
              <MandatVentePreview f={previewData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Coercition tolérante pour l'aperçu live (valeurs partielles non validées). */
function coerce(f: Record<string, string>): Partial<MandatVenteDoc> {
  return {
    typeMandat: (f.typeMandat as MandatVenteDoc["typeMandat"]) || undefined,
    mandant: f.mandant, mandantAdr: f.mandantAdr, mandantTel: f.mandantTel,
    bienType: f.bienType, bienAdr: f.bienAdr, bienCommune: f.bienCommune,
    bienSurface: f.bienSurface ? Number(f.bienSurface) : undefined,
    prixVente: f.prixVente ? Number(f.prixVente) : undefined,
    honorairesPct: f.honorairesPct ? Number(f.honorairesPct) : undefined,
    chargeHono: (f.chargeHono as MandatVenteDoc["chargeHono"]) || undefined,
    dureeMois: f.dureeMois ? Number(f.dureeMois) : undefined,
    dateDebut: f.dateDebut,
  };
}
