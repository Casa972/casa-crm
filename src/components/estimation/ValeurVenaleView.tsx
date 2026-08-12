import { useState, useCallback, Suspense, lazy, useEffect } from "react";
import {
  Plus, FileSearch, Edit2, Trash2, Download, ChevronLeft, ChevronRight,
  Sparkles, Save, CheckCircle2,
} from "lucide-react";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { EmptyState } from "../ui/Modal";
import { StatusPill } from "../shared/StatusPill";
import { useEstimations, useSaveEstimation, useDeleteEstimation, uid } from "../../hooks/queries/useEstimations";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { useAutosave } from "../../hooks/useAutosave";
import type { Estimation, RefMarche } from "../../schemas/estimation.schema";
import { TypeBienEstimation, EtatGeneral, COMMUNES_MARTINIQUE } from "../../schemas/enums";
import { eur } from "../../lib/format";
import { nombreEnLettres } from "../../schemas/estimation.schema";

const ValeurVenalePDFDownload = lazy(() => import("./ValeurVenalePDFDownload"));

const today = () => new Date().toISOString().slice(0, 10);
const newRefMarche = (): RefMarche => ({
  id: uid(), type: "", surface: 0, prix: 0, prixM2: 0,
  observations: "", source: "Annonce active", reference: "", localisation: "", differences: "",
});

// ─── Proposition de prix ──────────────────────────────────────────────────────
interface PrixSuggestion {
  prixMin: number; prixRetenu: number; prixMax: number;
  prixM2Moyen: number; prixM2Min: number; prixM2Max: number;
  nbRefs: number; coupDeCœur: number; methode: string;
}

function calculerPrix(e: Estimation): PrixSuggestion | null {
  const allRefs = [...e.refsAnnonces, ...e.refsDVF].filter(r => r.prixM2 > 0 && r.surface > 0);
  if (allRefs.length === 0 || e.surfaceHabitable === 0) return null;
  const vals = allRefs.map(r => r.prixM2).sort((a, b) => a - b);
  const trim = Math.floor(vals.length * 0.1);
  const trimmed = vals.slice(trim, vals.length - trim || undefined);
  const moy = Math.round(trimmed.reduce((s, v) => s + v, 0) / trimmed.length);
  const COEF: Record<string, number> = {
    "Parfait état": 1.08, "Très bon état": 1.04, "Bon état": 1.0,
    "État moyen": 0.93, "Travaux à prévoir": 0.85,
  };
  const coef = COEF[e.etatGeneral] ?? 1.0;
  let bonus = 1.0;
  if (e.venduMeuble) bonus += 0.03;
  if (e.surfaceTerrasse > e.surfaceHabitable * 0.3) bonus += 0.04;
  if (e.cave) bonus += 0.01;
  if (e.piscine) bonus += 0.03;
  const m2 = Math.round(moy * coef * bonus);
  const round = (n: number) => Math.round(n / 1000) * 1000;
  return {
    prixMin: round((vals[0] ?? moy) * coef * e.surfaceHabitable),
    prixRetenu: round(m2 * e.surfaceHabitable),
    prixMax: round((vals[vals.length - 1] ?? moy) * coef * bonus * e.surfaceHabitable),
    prixM2Moyen: moy, prixM2Min: vals[0] ?? moy, prixM2Max: vals[vals.length - 1] ?? moy,
    nbRefs: allRefs.length,
    coupDeCœur: round(round((vals[vals.length - 1] ?? moy) * coef * bonus * e.surfaceHabitable) * 1.05),
    methode: `Médiane ajustée × état (${coef}) × prestations (${bonus.toFixed(2)})`,
  };
}

function newValeurVenale(agentId?: string): Estimation {
  return {
    id: uid(), clientId: "", agentId, statut: "Brouillon", typeDoc: "valeur_venale",
    typeBien: "Appartement en copropriété", residence: "", adresse: "",
    commune: "Les Trois-Îlets", codePostal: "97229",
    sectionCadastrale: "", parcelles: "",
    demandeur: "", redacteur: "M. Luc CLEMENTE",
    dateEstimation: today(), photoBase64: "",
    lieu: "Le Lamentin (Martinique)", certificationExpert: "Expert Immobilier Certifié INIGEP®",
    etage: "", regimeJuridique: "", chargesCopro: 0,
    surfaceHabitable: 0, surfaceTerrasse: 0, surfaceJardin: 0, surfaceTerrain: 0,
    modeConstructif: "", etatGeneral: "Bon état", distribution: "", parking: "",
    cave: false, piscine: false, venduMeuble: false, notesDescription: "",
    structureGeneral: "Bon état", finitionsInterieures: "Bon état",
    equipementsSanitaires: "Bon état", travauxAPrevoir: "",
    diagnosticsDDT: [], observationsVisuelles: [],
    descriptionEnvironnement: "",
    indicateursMarche: [],
    refsAnnonces: [], refsDVF: [], commentaireMarche: "",
    avecLocatif: false,
    saisons: [
      { periode: "Haute saison (juil.–août, fêtes)", tarifNuit: 0, nbNuits: 0 },
      { periode: "Moyenne saison (vacances scolaires)", tarifNuit: 0, nbNuits: 0 },
      { periode: "Basse saison", tarifNuit: 0, nbNuits: 0 },
    ],
    loyerBrut: 0, loyerRetenu: 0, chargesLocatif: 0, taxeFonciere: 0,
    partNonRecuperable: 0, tauxVacance: "", delaiRelocation: "", cibleLocataire: "",
    criteres: [],
    argumentaireValeur: "", prixM2Retenu: 0, valeurVenale: 0,
    valeurCoupDeCœur: 0, argumentaireCoupDeCœur: "",
    synthesePonderation: [],
    fourchetteBasse: 0, fourchetteHaute: 0,
    limites: "",
    piecesAnalysees: [], sourcesExpertise: [],
  };
}

const STEPS = [
  { id: 1, label: "Identification" },
  { id: 2, label: "Marché" },
  { id: 3, label: "Conclusion" },
];

// ─── DVF INSEE codes ──────────────────────────────────────────────────────────
const INSEE: Record<string, string> = {
  "Fort-de-France": "97209", "Le Lamentin": "97213", "Le Robert": "97228",
  "Sainte-Marie": "97231", "Le François": "97208", "Le Marin": "97214",
  "Sainte-Anne": "97227", "Les Trois-Îlets": "97229", "Le Diamant": "97204",
  "Le Vauclin": "97234", "La Trinité": "97233", "Case-Pilote": "97201",
  "Le Carbet": "97202", "Saint-Pierre": "97230", "Schoelcher": "97232",
  "Sainte-Luce": "97226", "Rivière-Pilote": "97224", "Rivière-Salée": "97225",
  "Ducos": "97206", "Saint-Esprit": "97229", "Gros-Morne": "97211",
};

// ─── Éditeur 3 étapes ─────────────────────────────────────────────────────────
function ValeurVenaleEditor({ initial, onSave, onBack }: {
  initial: Estimation; onSave: (e: Estimation) => void; onBack: () => void;
}) {
  const [e, setE] = useState<Estimation>(initial);
  const [step, setStep] = useState(1);
  const [suggestion, setSuggestion] = useState<PrixSuggestion | null>(null);
  const { data } = useAgencyData();

  const upd = useCallback(<K extends keyof Estimation>(k: K, v: Estimation[K]) =>
    setE(p => ({ ...p, [k]: v })), []);

  const prixM2Calc = e.surfaceHabitable > 0 ? Math.round(e.valeurVenale / e.surfaceHabitable) : 0;

  useEffect(() => {
    setSuggestion(calculerPrix(e));
  }, [e.refsAnnonces, e.refsDVF, e.surfaceHabitable, e.etatGeneral, e.venduMeuble, e.surfaceTerrasse, e.cave, e.piscine]);

  // ─ Autosave ─
  const { lastSavedAt, saving } = useAutosave({ estimation: e, onSave, intervalMs: 30_000 });

  // ─ Handlers ─
  const handlePhoto = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]; if (!file) return;
    const r = new FileReader(); r.onload = () => upd("photoBase64", String(r.result)); r.readAsDataURL(file);
  };

  const handleCSV = (ev: React.ChangeEvent<HTMLInputElement>, target: "refsAnnonces" | "refsDVF") => {
    const file = ev.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      const refs: RefMarche[] = String(r.result).split("\n").slice(1).filter(Boolean).map(l => {
        const cols = l.split(";").map(c => c.replace(/^"|"$/g, "").trim());
        const prix = parseFloat((cols[2] ?? "").replace(/\s/g, "")) || 0;
        const surface = parseFloat(cols[1] ?? "") || 0;
        return {
          id: uid(), type: cols[0] ?? "", surface, prix,
          prixM2: surface > 0 ? Math.round(prix / surface) : 0,
          observations: cols[3] ?? "",
          source: target === "refsDVF" ? "DVF" as const : "Annonce active" as const,
          reference: "", localisation: "", differences: "",
        };
      });
      upd(target, [...(e[target] ?? []), ...refs]);
    };
    r.readAsText(file, "utf-8");
  };

  const addRef = (t: "refsAnnonces" | "refsDVF") => upd(t, [...e[t], newRefMarche()]);
  const updRef = (t: "refsAnnonces" | "refsDVF", idx: number, k: keyof RefMarche, v: string) => {
    upd(t, e[t].map((r, i) => {
      if (i !== idx) return r;
      const numKeys = new Set(["surface", "prix", "prixM2"]);
      const u = { ...r, [k]: numKeys.has(k) ? (parseFloat(v) || 0) : v };
      if ((k === "prix" || k === "surface") && u.surface > 0 && u.prix > 0) u.prixM2 = Math.round(u.prix / u.surface);
      return u;
    }));
  };
  const delRef = (t: "refsAnnonces" | "refsDVF", idx: number) => upd(t, e[t].filter((_, i) => i !== idx));

  const applySuggestion = () => {
    if (!suggestion) return;
    setE(p => ({
      ...p,
      valeurVenale: suggestion.prixRetenu,
      prixM2Retenu: suggestion.prixM2Moyen,
      valeurCoupDeCœur: suggestion.coupDeCœur,
      fourchetteBasse: suggestion.prixMin,
      fourchetteHaute: suggestion.prixMax,
    }));
  };

  // ─ RefTable component ─
  const RefTable = ({ target, label }: { target: "refsAnnonces" | "refsDVF"; label: string }) => {
    const vals = e[target].filter(r => r.prixM2 > 0).map(r => r.prixM2);
    const moy = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
    return (
      <>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-ink">{label}</span>
          <div className="flex gap-2">
            <label className="btn-ghost cursor-pointer text-[12px]">
              📥 CSV<input type="file" accept=".csv" className="hidden" onChange={ev => handleCSV(ev, target)} />
            </label>
            <button className="btn-ghost text-[12px]" onClick={() => addRef(target)}><Plus size={13} /> Ajouter</button>
          </div>
        </div>
        {e[target].length === 0 ? (
          <div className="mb-4 rounded border border-dashed border-line2 py-5 text-center text-[12.5px] text-ink-muted">
            Aucune référence. Ajoutez manuellement ou importez un CSV.
          </div>
        ) : (
          <div className="mb-4 overflow-x-auto rounded border border-line">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-2 py-1.5 text-left">Type</th>
                  <th className="px-2 py-1.5 text-left">Localisation</th>
                  <th className="px-2 py-1.5 text-right">Surface</th>
                  <th className="px-2 py-1.5 text-right">Prix</th>
                  <th className="px-2 py-1.5 text-right font-bold">€/m²</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {e[target].map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-surface" : "bg-bg"}>
                    <td className="px-1 py-1">
                      <Input value={r.type} onChange={ev => updRef(target, i, "type", ev.target.value)} placeholder="T3" className="h-7 text-[12px]" />
                    </td>
                    <td className="px-1 py-1">
                      <Input value={r.localisation} onChange={ev => updRef(target, i, "localisation", ev.target.value)} placeholder="Commune…" className="h-7 text-[12px]" />
                    </td>
                    <td className="px-1 py-1">
                      <Input type="number" value={String(r.surface || "")} onChange={ev => updRef(target, i, "surface", ev.target.value)} className="h-7 w-20 text-right text-[12px]" />
                    </td>
                    <td className="px-1 py-1">
                      <Input type="number" value={String(r.prix || "")} onChange={ev => updRef(target, i, "prix", ev.target.value)} className="h-7 w-24 text-right text-[12px]" />
                    </td>
                    <td className="px-2 py-1 text-right font-bold text-primary">
                      {r.prixM2 ? `${r.prixM2.toLocaleString("fr-FR")} €` : "—"}
                    </td>
                    <td className="px-1 py-1 text-center">
                      <button onClick={() => delRef(target, i)} className="text-ink-muted hover:text-danger"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vals.length >= 2 && (
              <div className="flex gap-4 border-t border-line bg-primary-soft px-3 py-2 text-[11.5px] text-primary">
                <span>Moy : <b>{moy.toLocaleString("fr-FR")} €/m²</b></span>
                <span>Min : <b>{Math.min(...vals).toLocaleString("fr-FR")} €/m²</b></span>
                <span>Max : <b>{Math.max(...vals).toLocaleString("fr-FR")} €/m²</b></span>
                <span>Réf. : <b>{vals.length}</b></span>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex h-full">
      {/* Sidebar étapes */}
      <div className="w-48 shrink-0 border-r border-line bg-surface p-3">
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-[12.5px] text-ink-muted hover:text-ink">
          <ChevronLeft size={14} /> Retour
        </button>
        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wide text-ink-muted">Étapes</div>
        {STEPS.map(st => (
          <button
            key={st.id}
            onClick={() => setStep(st.id)}
            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-[12.5px] font-medium mb-0.5 ${step === st.id ? "bg-primary-soft font-semibold text-primary" : "text-ink-sub hover:bg-line/50"}`}
          >
            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${step === st.id ? "bg-primary text-white" : "bg-line2 text-ink-muted"}`}>
              {st.id}
            </span>
            {st.label}
          </button>
        ))}
        <div className="mt-4 border-t border-line pt-3 flex flex-col gap-1.5">
          <button className="btn-primary w-full justify-center text-[12px]" onClick={() => onSave({ ...e, statut: "Finalisée" })}>
            ✓ Finaliser
          </button>
          <button className="btn-ghost w-full justify-center text-[12px]" onClick={() => onSave({ ...e, statut: "Brouillon" })}>
            <Save size={12} /> Sauvegarder
          </button>
          <div className="mt-1 text-center text-[10.5px] text-ink-muted">
            {saving
              ? <span className="text-amber">● Sauvegarde…</span>
              : lastSavedAt
                ? <span className="text-emerald flex items-center justify-center gap-1"><CheckCircle2 size={10} /> Sauvegardé {lastSavedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                : "Sauvegarde auto toutes les 30s"}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ÉTAPE 1 — Identification */}
        {step === 1 && (
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold text-ink">Identification du bien</h2>

            {/* Lien client */}
            {data.clients.length > 0 && (
              <div className="card mb-4 flex items-center gap-3 border-l-4 border-l-primary bg-primary-soft p-3.5">
                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-primary mb-1">Lier à un client existant</div>
                  <select
                    className="w-full rounded border border-line bg-white px-2.5 py-1.5 text-[12.5px]"
                    value={e.clientId}
                    onChange={ev => {
                      const client = data.clients.find(c => c.id === ev.target.value);
                      if (client) upd("demandeur", `${client.prenom} ${client.nom}`.trim());
                      upd("clientId", ev.target.value);
                    }}
                  >
                    <option value="">— Sélectionner un client —</option>
                    {data.clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>
              </div>
            )}

            <Grid2>
              <Field label="Type de bien">
                <Select value={e.typeBien} onChange={v => upd("typeBien", v as Estimation["typeBien"])} options={TypeBienEstimation.options} />
              </Field>
              <Field label="Commune">
                <Select value={e.commune} onChange={v => upd("commune", v)} options={[...COMMUNES_MARTINIQUE]} />
              </Field>
              <Field label="Résidence / Lotissement">
                <Input value={e.residence} onChange={ev => upd("residence", ev.target.value)} placeholder="Résidence La Pagerie…" />
              </Field>
              <Field label="Adresse">
                <Input value={e.adresse} onChange={ev => upd("adresse", ev.target.value)} />
              </Field>
              <Field label="Code postal">
                <Input value={e.codePostal} onChange={ev => upd("codePostal", ev.target.value)} />
              </Field>
              <Field label="Demandeur">
                <Input value={e.demandeur} onChange={ev => upd("demandeur", ev.target.value)} placeholder="M. et Mme DUPONT" />
              </Field>
              <Field label="Rédacteur">
                <Input value={e.redacteur} onChange={ev => upd("redacteur", ev.target.value)} />
              </Field>
              <Field label="Date">
                <Input type="date" value={e.dateEstimation} onChange={ev => upd("dateEstimation", ev.target.value)} />
              </Field>
              <Field label="Surface habitable (m²)">
                <Input type="number" value={String(e.surfaceHabitable || "")} onChange={ev => upd("surfaceHabitable", +ev.target.value)} />
              </Field>
              <Field label="Surface terrasse (m²)">
                <Input type="number" value={String(e.surfaceTerrasse || "")} onChange={ev => upd("surfaceTerrasse", +ev.target.value)} />
              </Field>
              <Field label="Surface jardin (m²)">
                <Input type="number" value={String(e.surfaceJardin || "")} onChange={ev => upd("surfaceJardin", +ev.target.value)} />
              </Field>
              <Field label="Surface terrain (m²)">
                <Input type="number" value={String(e.surfaceTerrain || "")} onChange={ev => upd("surfaceTerrain", +ev.target.value)} />
              </Field>
              <Field label="Étage">
                <Input value={e.etage} onChange={ev => upd("etage", ev.target.value)} placeholder="1er étage (R+5)" />
              </Field>
              <Field label="Parking">
                <Input value={e.parking} onChange={ev => upd("parking", ev.target.value)} placeholder="1 place extérieure attitrée" />
              </Field>
            </Grid2>

            <div className="mb-3 flex flex-wrap gap-4">
              {[["piscine", "Piscine"], ["cave", "Cave privative"], ["venduMeuble", "Vendu meublé"]].map(([k, lbl]) => (
                <label key={k} className="flex items-center gap-2 text-[13px] font-medium text-ink-sub cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(e[k as keyof Estimation])}
                    onChange={ev => upd(k as keyof Estimation, ev.target.checked as never)}
                    className="size-4 accent-primary"
                  />
                  {lbl}
                </label>
              ))}
            </div>

            <Field label="Photo (optionnel)">
              <input type="file" accept="image/*" onChange={handlePhoto} className="text-[13px] text-ink-sub" />
              {e.photoBase64 && <img src={e.photoBase64} className="mt-2 h-36 w-full rounded object-cover" />}
            </Field>
          </div>
        )}

        {/* ÉTAPE 2 — Marché */}
        {step === 2 && (
          <div>
            <h2 className="mb-1 font-heading text-base font-semibold text-ink">Étude de marché</h2>
            <p className="mb-4 text-[12.5px] text-ink-muted">Les références saisies ici alimentent la proposition de prix automatique à l'étape suivante.</p>

            {/* DVF download helper */}
            <div className="card mb-5 border-l-4 border-l-primary bg-primary-soft p-4">
              <div className="mb-2 text-[13px] font-semibold text-primary">🏛️ Données DVF — Transactions officielles DGFiP</div>
              {INSEE[e.commune] ? (
                <a
                  href={`https://files.data.gouv.fr/geo-dvf/latest/csv/${INSEE[e.commune]?.slice(0, 3)}/communes/${INSEE[e.commune]}.csv`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover transition-colors"
                >
                  <Download size={14} /> Télécharger {e.commune}.csv (DGFiP)
                </a>
              ) : (
                <div className="text-[12px] text-amber">Commune non reconnue — sélectionnez une commune à l'étape 1.</div>
              )}
            </div>

            <Field label="État général">
              <Select value={e.etatGeneral} onChange={v => upd("etatGeneral", v as Estimation["etatGeneral"])} options={EtatGeneral.options} />
            </Field>

            <Field label="Notes / Description">
              <Textarea rows={3} value={e.notesDescription} onChange={ev => upd("notesDescription", ev.target.value)} placeholder="Caractéristiques du bien, prestations…" />
            </Field>

            <div className="mt-4">
              <RefTable target="refsAnnonces" label="Références — Annonces actives" />
            </div>
            <div className="mt-2">
              <RefTable target="refsDVF" label="Données DVF — Transactions réelles (DGFiP)" />
            </div>

            <Field label="Commentaire de marché">
              <Textarea rows={3} value={e.commentaireMarche} onChange={ev => upd("commentaireMarche", ev.target.value)} placeholder="Contexte du marché local…" />
            </Field>
          </div>
        )}

        {/* ÉTAPE 3 — Conclusion */}
        {step === 3 && (
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold text-ink">Conclusion & Valeur vénale</h2>

            {/* Proposition automatique */}
            {suggestion ? (
              <div className="card mb-5 border-l-4 border-l-emerald bg-emerald-soft p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald" />
                    <span className="text-[13px] font-semibold text-emerald">Proposition de prix automatique</span>
                  </div>
                  <button className="btn-primary !bg-emerald text-[12px]" onClick={applySuggestion}>Appliquer</button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "Fourchette basse", val: suggestion.prixMin, m2: suggestion.prixM2Min, dim: true },
                    { label: "✓ Valeur retenue", val: suggestion.prixRetenu, m2: suggestion.prixM2Moyen, dim: false },
                    { label: "Coup de cœur", val: suggestion.coupDeCœur, m2: suggestion.prixM2Max, dim: true },
                  ].map(item => (
                    <div key={item.label} className={`rounded p-2.5 text-center ${item.dim ? "bg-white/60" : "bg-white border-2 border-emerald"}`}>
                      <div className="text-[10px] font-bold uppercase text-emerald/70 mb-1">{item.label}</div>
                      <div className={`font-heading font-bold text-emerald ${item.dim ? "text-lg" : "text-xl"}`}>{eur(item.val)}</div>
                      <div className="text-[11px] text-emerald/70">{item.m2.toLocaleString("fr-FR")} €/m²</div>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-emerald/80">{suggestion.nbRefs} réf. · {suggestion.methode}</div>
              </div>
            ) : (
              <div className="card mb-4 border-dashed border-line2 p-4 text-center text-[12.5px] text-ink-muted">
                <Sparkles size={16} className="mx-auto mb-2 text-ink-muted" />
                Ajoutez des références de marché (étape 2) pour obtenir une proposition automatique.
              </div>
            )}

            <Field label="Argumentation de la valeur">
              <Textarea rows={4} value={e.argumentaireValeur} onChange={ev => upd("argumentaireValeur", ev.target.value)} placeholder="Justification de la valeur retenue…" className="mb-5" />
            </Field>

            {/* Valeur vénale */}
            <div className="card mb-5 border-l-4 border-l-primary bg-primary-soft p-5">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-primary">Valeur vénale estimée</div>
              <div className="mb-3 flex items-center gap-4">
                <div className="flex-1">
                  <Field label="Valeur vénale (€)">
                    <Input type="number" value={String(e.valeurVenale || "")} onChange={ev => upd("valeurVenale", +ev.target.value)} className="text-xl font-bold" />
                  </Field>
                </div>
                <div className="text-right shrink-0">
                  {prixM2Calc > 0 && (
                    <div className="text-[14px] font-semibold text-primary">{prixM2Calc.toLocaleString("fr-FR")} €/m²</div>
                  )}
                  <div className="text-[11px] italic text-ink-muted">
                    {e.valeurVenale > 0 ? nombreEnLettres(e.valeurVenale) : "—"}
                  </div>
                </div>
              </div>
              <Grid2>
                <Field label="Prix/m² retenu (€/m²)">
                  <Input
                    type="number"
                    value={String(e.prixM2Retenu || prixM2Calc || "")}
                    onChange={ev => upd("prixM2Retenu", +ev.target.value)}
                    placeholder={prixM2Calc > 0 ? String(prixM2Calc) : ""}
                  />
                </Field>
              </Grid2>
              <Grid2>
                <Field label="Fourchette basse (€)">
                  <Input type="number" value={String(e.fourchetteBasse || "")} onChange={ev => upd("fourchetteBasse", +ev.target.value)} />
                </Field>
                <Field label="Fourchette haute (€)">
                  <Input type="number" value={String(e.fourchetteHaute || "")} onChange={ev => upd("fourchetteHaute", +ev.target.value)} />
                </Field>
              </Grid2>
            </div>

            {/* Coup de cœur */}
            <div className="card mb-5 border-l-4 border-l-amber bg-amber-soft p-5">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-amber">Valeur coup de cœur (optionnel)</div>
              <Grid2>
                <Field label="Valeur coup de cœur (€)">
                  <Input type="number" value={String(e.valeurCoupDeCœur || "")} onChange={ev => upd("valeurCoupDeCœur", +ev.target.value)} />
                </Field>
              </Grid2>
              <Field label="Argumentation coup de cœur">
                <Textarea rows={2} value={e.argumentaireCoupDeCœur} onChange={ev => upd("argumentaireCoupDeCœur", ev.target.value)} />
              </Field>
            </div>

            <Field label="Limites & réserves">
              <Textarea rows={3} value={e.limites} onChange={ev => upd("limites", ev.target.value)} />
            </Field>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between border-t border-line pt-4">
          <button className="btn-ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
            <ChevronLeft size={14} /> Précédent
          </button>
          {step < STEPS.length
            ? <button className="btn-primary" onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}>
                Suivant <ChevronRight size={14} />
              </button>
            : <button className="btn-primary !bg-emerald" onClick={() => onSave({ ...e, statut: "Finalisée" })}>
                ✓ Finaliser l'estimation
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Liste des estimations valeur vénale ──────────────────────────────────────
export function ValeurVenaleView() {
  const { data: allEstimations, isLoading } = useEstimations();
  const estimations = allEstimations.filter(e => e.typeDoc === "valeur_venale");
  const save = useSaveEstimation();
  const del = useDeleteEstimation();
  const user = useSessionStore(s => s.user);
  const [editing, setEditing] = useState<Estimation | null>(null);

  const handleSave = useCallback((e: Estimation) => {
    save.mutate(e, {
      onSuccess: (saved) => {
        if (saved.statut === "Finalisée") setEditing(null);
      },
      onError: (err) => alert("Erreur de sauvegarde : " + String(err)),
    });
  }, [save]);

  if (editing) return <ValeurVenaleEditor initial={editing} onBack={() => setEditing(null)} onSave={handleSave} />;

  return (
    <div className="mx-auto max-w-[900px] px-6 py-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Estimations de valeur vénale</h1>
          <p className="text-[13px] text-ink-muted">{estimations.length} estimation(s)</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing(newValeurVenale(user?.id ?? undefined))}>
          <Plus size={14} /> Nouvelle estimation
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-ink-muted">Chargement…</div>
      ) : estimations.length === 0 ? (
        <EmptyState Icon={FileSearch} text="Aucune estimation" sub="Créez votre première estimation de valeur vénale." />
      ) : (
        <div className="flex flex-col gap-3">
          {estimations.map(est => {
            const prixM2 = est.surfaceHabitable > 0 ? Math.round(est.valeurVenale / est.surfaceHabitable) : 0;
            return (
              <div key={est.id} className="card p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-heading text-[15px] font-semibold text-ink">
                        {est.residence || est.adresse || "Sans adresse"}
                      </span>
                      <StatusPill label={est.statut} tone={est.statut === "Finalisée" ? "emerald" : "amber"} />
                    </div>
                    <div className="text-[12.5px] text-ink-sub">{est.typeBien} · {est.commune}</div>
                    <div className="text-[12px] text-ink-muted">
                      Demandeur : {est.demandeur || "—"}
                      {est.surfaceHabitable > 0 && ` · ${est.surfaceHabitable} m²`}
                      {est.dateEstimation && ` · ${est.dateEstimation}`}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {est.valeurVenale > 0 && (
                      <>
                        <div className="font-heading text-lg font-bold text-primary">{eur(est.valeurVenale)}</div>
                        {prixM2 > 0 && <div className="text-[11.5px] text-ink-muted">{prixM2.toLocaleString("fr-FR")} €/m²</div>}
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  <button className="btn-ghost text-[12px]" onClick={() => setEditing(est)}>
                    <Edit2 size={13} /> Modifier
                  </button>
                  {est.statut === "Finalisée" && est.valeurVenale > 0 && (
                    <Suspense fallback={<button className="btn-ghost text-[12px] opacity-60"><Download size={13} /> PDF…</button>}>
                      <ValeurVenalePDFDownload estimation={est} />
                    </Suspense>
                  )}
                  <button
                    className="btn-ghost text-[12px] text-danger hover:bg-danger-soft"
                    onClick={() => { if (confirm("Supprimer ?")) del.mutate(est.id); }}
                  >
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
