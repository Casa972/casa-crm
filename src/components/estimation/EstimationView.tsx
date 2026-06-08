import { useState, useCallback, Suspense, lazy } from "react";
import { Plus, FileText, Edit2, Trash2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { EmptyState } from "../ui/Modal";
import { StatusPill } from "../shared/StatusPill";
import { useEstimations, useSaveEstimation, useDeleteEstimation, uid } from "../../hooks/queries/useEstimations";
import { useSessionStore } from "../../store/session.store";
import type { Estimation, RefMarche, CritereMarche } from "../../schemas/estimation.schema";
import {
  TypeBienEstimation, EtatGeneral, ImpactCritere, COMMUNES_MARTINIQUE,
} from "../../schemas/enums";
import { eur } from "../../lib/format";
import { nombreEnLettres } from "../../schemas/estimation.schema";

const EstimationPDFDownload = lazy(() => import("./EstimationPDFDownload"));

const today = () => new Date().toISOString().slice(0, 10);
const newRefMarche = (): RefMarche => ({ id: uid(), type: "", surface: 0, prix: 0, prixM2: 0, observations: "", source: "Annonce active" });
const newCritere = (): CritereMarche => ({ id: uid(), critere: "", analyse: "", impact: "Neutre" });

const CRITERES_DEFAUT = [
  "Surface habitable", "Terrasse / extérieur", "Étage / exposition", "État général",
  "Vendu meublé", "Cave / parking", "Potentiel locatif saisonnier", "Localisation",
  "Charges de copropriété",
];

function newEstimation(agentId?: string): Estimation {
  return {
    id: uid(), clientId: "", agentId, statut: "Brouillon",
    typeBien: "Appartement en copropriété", residence: "", adresse: "", commune: "", codePostal: "97200",
    sectionCadastrale: "", parcelles: "", demandeur: "", redacteur: "M. Luc CLEMENTE",
    dateEstimation: today(), photoBase64: "",
    etage: "", regimeJuridique: "Copropriété – appartement privatif", chargesCopro: 0,
    surfaceHabitable: 0, surfaceTerrasse: 0, surfaceJardin: 0, surfaceTerrain: 0,
    modeConstructif: "Béton", etatGeneral: "Bon état", distribution: "", parking: "", cave: false, piscine: false, venduMeuble: false, notesDescription: "",
    structureGeneral: "Bon état", finitionsInterieures: "Bon état", equipementsSanitaires: "Bon état", travauxAPrevoir: "Aucun à court terme",
    descriptionEnvironnement: "",
    refsAnnonces: [], refsDVF: [], commentaireMarche: "",
    avecLocatif: false,
    saisons: [
      { periode: "Haute saison (juil.–août, fêtes)", tarifNuit: 0, nbNuits: 0 },
      { periode: "Moyenne saison (vacances scolaires)", tarifNuit: 0, nbNuits: 0 },
      { periode: "Basse saison", tarifNuit: 0, nbNuits: 0 },
    ],
    criteres: CRITERES_DEFAUT.map((c) => ({ id: uid(), critere: c, analyse: "", impact: "Neutre" as const })),
    argumentaireValeur: "", prixM2Retenu: 0, valeurVenale: 0, valeurCoupDeCœur: 0, argumentaireCoupDeCœur: "",
    limites: "La présente estimation ne constitue pas une expertise immobilière au sens de la Charte de l'Expertise en Évaluation Immobilière. Le rédacteur n'a pas procédé à des investigations techniques approfondies (diagnostics termites, amiante, mesurage Carrez contradictoire, état daté de copropriété). Il appartient aux parties de faire réaliser les diagnostics obligatoires.",
  };
}

const STEPS = [
  { id: 1, label: "Page de garde" },
  { id: 2, label: "Identification" },
  { id: 3, label: "État & Environnement" },
  { id: 4, label: "Étude de marché" },
  { id: 5, label: "Locatif" },
  { id: 6, label: "Estimation" },
];

/* ─── Éditeur multi-étapes ─── */
function EstimationEditor({ initial, onSave, onBack }: {
  initial: Estimation; onSave: (e: Estimation) => void; onBack: () => void;
}) {
  const [e, setE] = useState<Estimation>(initial);
  const [step, setStep] = useState(1);
  const upd = useCallback(<K extends keyof Estimation>(k: K, v: Estimation[K]) => setE((p) => ({ ...p, [k]: v })), []);

  const prixM2Calc = e.surfaceHabitable > 0 ? Math.round(e.valeurVenale / e.surfaceHabitable) : 0;

  const handlePhoto = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => upd("photoBase64", String(r.result));
    r.readAsDataURL(file);
  };

  const handleCSV = (ev: React.ChangeEvent<HTMLInputElement>, target: "refsAnnonces" | "refsDVF") => {
    const file = ev.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      const lines = String(r.result).split("\n").slice(1).filter(Boolean);
      const refs: RefMarche[] = lines.map((l) => {
        const cols = l.split(";").map((c) => c.replace(/^"|"$/g, "").trim());
        const prix = parseFloat((cols[2] ?? "").replace(/\s/g, "")) || 0;
        const surface = parseFloat(cols[1] ?? "") || 0;
        return { id: uid(), type: cols[0] ?? "", surface, prix, prixM2: surface > 0 ? Math.round(prix / surface) : 0, observations: cols[3] ?? "", source: target === "refsDVF" ? "DVF" : "Annonce active" };
      });
      upd(target, [...(e[target] ?? []), ...refs]);
    };
    r.readAsText(file, "utf-8");
  };

  const addRef = (target: "refsAnnonces" | "refsDVF") => upd(target, [...e[target], newRefMarche()]);
  const updRef = (target: "refsAnnonces" | "refsDVF", idx: number, k: keyof RefMarche, v: string) => {
    const next = e[target].map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, [k]: k === "type" || k === "observations" || k === "source" ? v : (parseFloat(v) || 0) };
      if ((k === "prix" || k === "surface") && updated.surface > 0 && updated.prix > 0) {
        updated.prixM2 = Math.round(updated.prix / updated.surface);
      }
      return updated;
    });
    upd(target, next);
  };
  const delRef = (target: "refsAnnonces" | "refsDVF", idx: number) => upd(target, e[target].filter((_, i) => i !== idx));

  const updCritere = (idx: number, k: keyof CritereMarche, v: string) => {
    upd("criteres", e.criteres.map((c, i) => i === idx ? { ...c, [k]: v } : c));
  };

  return (
    <div className="flex h-full">
      {/* Sidebar étapes */}
      <div className="w-48 shrink-0 border-r border-line bg-surface p-3">
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-[12.5px] text-ink-muted hover:text-ink">
          <ChevronLeft size={14} /> Retour
        </button>
        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wide text-ink-muted">Sections</div>
        {STEPS.map((st) => (
          <button key={st.id} onClick={() => setStep(st.id)}
            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-[12.5px] font-medium mb-0.5 ${step === st.id ? "bg-primary-soft font-semibold text-primary" : "text-ink-sub hover:bg-line/50"}`}>
            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${step === st.id ? "bg-primary text-white" : "bg-line2 text-ink-muted"}`}>{st.id}</span>
            {st.label}
          </button>
        ))}
        <div className="mt-4 border-t border-line pt-3">
          <button className="btn-primary w-full justify-center text-[12px]" onClick={() => onSave({ ...e, statut: "Finalisée" })}>
            Finaliser
          </button>
          <button className="btn-ghost mt-1.5 w-full justify-center text-[12px]" onClick={() => onSave({ ...e, statut: "Brouillon" })}>
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ÉTAPE 1 — Page de garde */}
        {step === 1 && (
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold text-ink">Page de garde</h2>
            <Grid2>
              <Field label="Type de bien"><Select value={e.typeBien} onChange={(v) => upd("typeBien", v as Estimation["typeBien"])} options={TypeBienEstimation.options} /></Field>
              <Field label="Commune"><Select value={e.commune} onChange={(v) => upd("commune", v)} options={COMMUNES_MARTINIQUE} /></Field>
              <Field label="Résidence / Lotissement"><Input value={e.residence} onChange={(ev) => upd("residence", ev.target.value)} placeholder="Résidence La Pagerie..." /></Field>
              <Field label="Adresse"><Input value={e.adresse} onChange={(ev) => upd("adresse", ev.target.value)} /></Field>
              <Field label="Code postal"><Input value={e.codePostal} onChange={(ev) => upd("codePostal", ev.target.value)} /></Field>
              <Field label="Section cadastrale"><Input value={e.sectionCadastrale} onChange={(ev) => upd("sectionCadastrale", ev.target.value)} placeholder="C" /></Field>
              <Field label="Parcelles"><Input value={e.parcelles} onChange={(ev) => upd("parcelles", ev.target.value)} placeholder="n°2138 et 2139" /></Field>
              <Field label="Demandeur"><Input value={e.demandeur} onChange={(ev) => upd("demandeur", ev.target.value)} placeholder="M. et Mme DUPONT" /></Field>
              <Field label="Rédacteur"><Input value={e.redacteur} onChange={(ev) => upd("redacteur", ev.target.value)} /></Field>
              <Field label="Date"><Input type="date" value={e.dateEstimation} onChange={(ev) => upd("dateEstimation", ev.target.value)} /></Field>
            </Grid2>
            <Field label="Photo de couverture (optionnel)">
              <input type="file" accept="image/*" onChange={handlePhoto} className="text-[13px] text-ink-sub" />
              {e.photoBase64 && <img src={e.photoBase64} className="mt-2 h-36 w-full rounded object-cover" />}
            </Field>
          </div>
        )}

        {/* ÉTAPE 2 — Identification */}
        {step === 2 && (
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold text-ink">Identification du bien</h2>
            <Grid2>
              <Field label="Surface habitable (m²)"><Input type="number" value={String(e.surfaceHabitable || "")} onChange={(ev) => upd("surfaceHabitable", +ev.target.value)} /></Field>
              <Field label="Surface terrasse (m²)"><Input type="number" value={String(e.surfaceTerrasse || "")} onChange={(ev) => upd("surfaceTerrasse", +ev.target.value)} /></Field>
              <Field label="Surface jardin (m²)"><Input type="number" value={String(e.surfaceJardin || "")} onChange={(ev) => upd("surfaceJardin", +ev.target.value)} /></Field>
              <Field label="Surface terrain (m²)"><Input type="number" value={String(e.surfaceTerrain || "")} onChange={(ev) => upd("surfaceTerrain", +ev.target.value)} /></Field>
              <Field label="Étage"><Input value={e.etage} onChange={(ev) => upd("etage", ev.target.value)} placeholder="1er étage (R+5)" /></Field>
              <Field label="Régime juridique"><Input value={e.regimeJuridique} onChange={(ev) => upd("regimeJuridique", ev.target.value)} /></Field>
              <Field label="Charges copro (€/trim.)"><Input type="number" value={String(e.chargesCopro || "")} onChange={(ev) => upd("chargesCopro", +ev.target.value)} /></Field>
              <Field label="Mode constructif"><Input value={e.modeConstructif} onChange={(ev) => upd("modeConstructif", ev.target.value)} placeholder="Béton + Bardage bois" /></Field>
              <Field label="État général"><Select value={e.etatGeneral} onChange={(v) => upd("etatGeneral", v as Estimation["etatGeneral"])} options={EtatGeneral.options} /></Field>
              <Field label="Parking"><Input value={e.parking} onChange={(ev) => upd("parking", ev.target.value)} placeholder="1 place extérieure attitrée" /></Field>
            </Grid2>
            <div className="mb-3 flex flex-wrap gap-4">
              {[["cave", "Cave privative"], ["piscine", "Piscine"], ["venduMeuble", "Vendu meublé"]].map(([k, lbl]) => (
                <label key={k} className="flex items-center gap-2 text-[13px] font-medium text-ink-sub cursor-pointer">
                  <input type="checkbox" checked={Boolean(e[k as keyof Estimation])} onChange={(ev) => upd(k as keyof Estimation, ev.target.checked as never)} className="size-4 accent-primary" />
                  {lbl}
                </label>
              ))}
            </div>
            <Field label="Distribution"><Textarea rows={2} value={e.distribution} onChange={(ev) => upd("distribution", ev.target.value)} placeholder="Séjour, cuisine ouverte, 2 chambres, 1 salle d'eau, 1 WC..." /></Field>
            <Field label="Notes complémentaires"><Textarea rows={2} value={e.notesDescription} onChange={(ev) => upd("notesDescription", ev.target.value)} /></Field>
          </div>
        )}

        {/* ÉTAPE 3 — État & Environnement */}
        {step === 3 && (
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold text-ink">État général & Environnement</h2>
            <div className="card mb-5 p-4">
              <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted">État général</div>
              <Grid2>
                <Field label="Structure générale"><Select value={e.structureGeneral} onChange={(v) => upd("structureGeneral", v as Estimation["structureGeneral"])} options={EtatGeneral.options} /></Field>
                <Field label="Finitions intérieures"><Select value={e.finitionsInterieures} onChange={(v) => upd("finitionsInterieures", v as Estimation["finitionsInterieures"])} options={EtatGeneral.options} /></Field>
                <Field label="Équipements sanitaires"><Select value={e.equipementsSanitaires} onChange={(v) => upd("equipementsSanitaires", v as Estimation["equipementsSanitaires"])} options={EtatGeneral.options} /></Field>
                <Field label="Travaux à prévoir"><Input value={e.travauxAPrevoir} onChange={(ev) => upd("travauxAPrevoir", ev.target.value)} /></Field>
              </Grid2>
            </div>
            <Field label="Description de l'environnement et de la situation">
              <Textarea rows={8} value={e.descriptionEnvironnement} onChange={(ev) => upd("descriptionEnvironnement", ev.target.value)} placeholder="Décrivez le quartier, la commune, les atouts de l'emplacement, la demande locative, les services de proximité..." />
            </Field>
          </div>
        )}

        {/* ÉTAPE 4 — Étude de marché */}
        {step === 4 && (
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold text-ink">Étude de marché</h2>
            {/* Annonces actives */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-ink">Références — Annonces actives</span>
              <div className="flex gap-2">
                <label className="btn-ghost cursor-pointer text-[12px]">
                  📥 Import CSV
                  <input type="file" accept=".csv" className="hidden" onChange={(ev) => handleCSV(ev, "refsAnnonces")} />
                </label>
                <button className="btn-ghost text-[12px]" onClick={() => addRef("refsAnnonces")}><Plus size={13} /> Ajouter</button>
              </div>
            </div>
            {e.refsAnnonces.length === 0 ? (
              <div className="mb-4 rounded border border-dashed border-line2 py-6 text-center text-[12.5px] text-ink-muted">Aucune référence. Ajoutez manuellement ou importez un CSV.</div>
            ) : (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead><tr className="bg-primary text-white"><th className="px-2 py-1.5 text-left">Type</th><th className="px-2 py-1.5">Surface</th><th className="px-2 py-1.5">Prix</th><th className="px-2 py-1.5">€/m²</th><th className="px-2 py-1.5">Observations</th><th /></tr></thead>
                  <tbody>
                    {e.refsAnnonces.map((r, i) => (
                      <tr key={r.id} className={i % 2 === 0 ? "bg-surface" : "bg-bg"}>
                        <td className="px-1 py-1"><Input value={r.type} onChange={(ev) => updRef("refsAnnonces", i, "type", ev.target.value)} placeholder="T3" className="h-7 text-[12px]" /></td>
                        <td className="px-1 py-1"><Input type="number" value={String(r.surface || "")} onChange={(ev) => updRef("refsAnnonces", i, "surface", ev.target.value)} className="h-7 w-20 text-[12px]" /></td>
                        <td className="px-1 py-1"><Input type="number" value={String(r.prix || "")} onChange={(ev) => updRef("refsAnnonces", i, "prix", ev.target.value)} className="h-7 w-24 text-[12px]" /></td>
                        <td className="px-2 py-1 font-semibold text-primary">{r.prixM2 ? `${r.prixM2.toLocaleString("fr-FR")} €` : "—"}</td>
                        <td className="px-1 py-1"><Input value={r.observations} onChange={(ev) => updRef("refsAnnonces", i, "observations", ev.target.value)} placeholder="Meublé, piscine..." className="h-7 text-[12px]" /></td>
                        <td className="px-1 py-1"><button onClick={() => delRef("refsAnnonces", i)} className="text-ink-muted hover:text-danger"><Trash2 size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* DVF */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-ink">Données DVF — Transactions réelles</span>
              <div className="flex gap-2">
                <label className="btn-ghost cursor-pointer text-[12px]">
                  📥 Import CSV
                  <input type="file" accept=".csv" className="hidden" onChange={(ev) => handleCSV(ev, "refsDVF")} />
                </label>
                <button className="btn-ghost text-[12px]" onClick={() => addRef("refsDVF")}><Plus size={13} /> Ajouter</button>
              </div>
            </div>
            {e.refsDVF.length === 0 ? (
              <div className="mb-4 rounded border border-dashed border-line2 py-6 text-center text-[12.5px] text-ink-muted">Aucune donnée DVF. Importez un CSV ou ajoutez manuellement.</div>
            ) : (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead><tr className="bg-primary text-white"><th className="px-2 py-1.5 text-left">Type</th><th className="px-2 py-1.5">Surface</th><th className="px-2 py-1.5">Valeur foncière</th><th className="px-2 py-1.5">€/m²</th><th className="px-2 py-1.5">Observations</th><th /></tr></thead>
                  <tbody>
                    {e.refsDVF.map((r, i) => (
                      <tr key={r.id} className={i % 2 === 0 ? "bg-surface" : "bg-bg"}>
                        <td className="px-1 py-1"><Input value={r.type} onChange={(ev) => updRef("refsDVF", i, "type", ev.target.value)} placeholder="T3" className="h-7 text-[12px]" /></td>
                        <td className="px-1 py-1"><Input type="number" value={String(r.surface || "")} onChange={(ev) => updRef("refsDVF", i, "surface", ev.target.value)} className="h-7 w-20 text-[12px]" /></td>
                        <td className="px-1 py-1"><Input type="number" value={String(r.prix || "")} onChange={(ev) => updRef("refsDVF", i, "prix", ev.target.value)} className="h-7 w-24 text-[12px]" /></td>
                        <td className="px-2 py-1 font-semibold text-primary">{r.prixM2 ? `${r.prixM2.toLocaleString("fr-FR")} €` : "—"}</td>
                        <td className="px-1 py-1"><Input value={r.observations} onChange={(ev) => updRef("refsDVF", i, "observations", ev.target.value)} placeholder="Vente familiale..." className="h-7 text-[12px]" /></td>
                        <td className="px-1 py-1"><button onClick={() => delRef("refsDVF", i)} className="text-ink-muted hover:text-danger"><Trash2 size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Field label="Commentaire de marché"><Textarea rows={3} value={e.commentaireMarche} onChange={(ev) => upd("commentaireMarche", ev.target.value)} /></Field>
          </div>
        )}

        {/* ÉTAPE 5 — Potentiel locatif */}
        {step === 5 && (
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold text-ink">Potentiel locatif saisonnier</h2>
            <label className="mb-5 flex items-center gap-2.5 text-[13.5px] font-medium text-ink cursor-pointer">
              <input type="checkbox" checked={e.avecLocatif} onChange={(ev) => upd("avecLocatif", ev.target.checked)} className="size-4 accent-primary" />
              Inclure une analyse du potentiel locatif saisonnier dans le rapport
            </label>
            {e.avecLocatif && (
              <div className="card p-4">
                <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted">Scénario locatif</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead><tr className="border-b border-line"><th className="pb-2 text-left font-semibold text-ink-sub">Période</th><th className="pb-2 text-right font-semibold text-ink-sub">Tarif/nuit (€)</th><th className="pb-2 text-right font-semibold text-ink-sub">Nb nuits</th><th className="pb-2 text-right font-semibold text-ink-sub">Revenu brut</th></tr></thead>
                    <tbody>
                      {e.saisons.map((ss, i) => (
                        <tr key={i} className="border-b border-line/50">
                          <td className="py-2 pr-3 text-ink-sub">{ss.periode}</td>
                          <td className="py-2 pr-2"><Input type="number" value={String(ss.tarifNuit || "")} onChange={(ev) => upd("saisons", e.saisons.map((s, j) => j === i ? { ...s, tarifNuit: +ev.target.value } : s))} className="h-8 w-24 text-right text-[13px]" /></td>
                          <td className="py-2 pr-2"><Input type="number" value={String(ss.nbNuits || "")} onChange={(ev) => upd("saisons", e.saisons.map((s, j) => j === i ? { ...s, nbNuits: +ev.target.value } : s))} className="h-8 w-20 text-right text-[13px]" /></td>
                          <td className="py-2 text-right font-semibold text-ink">{eur(ss.tarifNuit * ss.nbNuits)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 flex items-center justify-between rounded bg-primary-soft px-3 py-2.5">
                    <span className="text-[12.5px] font-semibold text-primary">Total estimé ({e.saisons.reduce((s, x) => s + x.nbNuits, 0)} nuits/an)</span>
                    <span className="font-heading text-base font-bold text-primary">{eur(e.saisons.reduce((s, x) => s + x.tarifNuit * x.nbNuits, 0))} brut</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 6 — Estimation */}
        {step === 6 && (
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold text-ink">Grille d'analyse & Valeur vénale</h2>

            <div className="card mb-5 overflow-hidden">
              <div className="border-b border-line bg-primary px-4 py-2.5">
                <div className="grid grid-cols-3 gap-2 text-[11px] font-bold uppercase tracking-wide text-white">
                  <span>Critère</span><span>Analyse</span><span>Impact</span>
                </div>
              </div>
              {e.criteres.map((c, i) => (
                <div key={c.id} className={`grid grid-cols-3 gap-2 border-b border-line p-2.5 ${i % 2 === 0 ? "" : "bg-bg"}`}>
                  <Input value={c.critere} onChange={(ev) => updCritere(i, "critere", ev.target.value)} className="h-8 text-[12px]" />
                  <Input value={c.analyse} onChange={(ev) => updCritere(i, "analyse", ev.target.value)} className="h-8 text-[12px]" placeholder="Description..." />
                  <Select value={c.impact} onChange={(v) => updCritere(i, "impact", v)} options={ImpactCritere.options} className="h-8 text-[12px]" />
                </div>
              ))}
              <div className="p-2.5">
                <button className="btn-ghost text-[12px]" onClick={() => upd("criteres", [...e.criteres, newCritere()])}><Plus size={13} /> Ajouter un critère</button>
              </div>
            </div>

            <Field label="Argumentation de la valeur">
              <Textarea rows={5} value={e.argumentaireValeur} onChange={(ev) => upd("argumentaireValeur", ev.target.value)} placeholder="Compte tenu de la surface habitable de X m², de l'état parfait..." />
            </Field>

            <div className="card mb-5 border-l-4 border-l-primary bg-primary-soft p-5">
              <div className="mb-4 text-[11px] font-bold uppercase tracking-wide text-primary">Valeur vénale estimée</div>
              <div className="mb-3 flex items-center gap-4">
                <div className="flex-1">
                  <Field label="Valeur vénale (€)">
                    <Input type="number" value={String(e.valeurVenale || "")} onChange={(ev) => upd("valeurVenale", +ev.target.value)} className="text-xl font-bold" />
                  </Field>
                </div>
                <div className="text-right">
                  {prixM2Calc > 0 && <div className="text-[13px] font-semibold text-primary">{prixM2Calc.toLocaleString("fr-FR")} €/m²</div>}
                  <div className="text-[11.5px] italic text-ink-muted">{e.valeurVenale > 0 ? nombreEnLettres(e.valeurVenale) : "—"}</div>
                </div>
              </div>
            </div>

            <div className="card mb-5 border-l-4 border-l-amber bg-amber-soft p-5">
              <div className="mb-4 text-[11px] font-bold uppercase tracking-wide text-amber">Valeur coup de cœur (optionnel)</div>
              <Grid2>
                <Field label="Valeur coup de cœur (€)">
                  <Input type="number" value={String(e.valeurCoupDeCœur || "")} onChange={(ev) => upd("valeurCoupDeCœur", +ev.target.value)} />
                </Field>
              </Grid2>
              <Field label="Argumentation coup de cœur">
                <Textarea rows={3} value={e.argumentaireCoupDeCœur} onChange={(ev) => upd("argumentaireCoupDeCœur", ev.target.value)} />
              </Field>
            </div>

            <Field label="Limites & réserves">
              <Textarea rows={4} value={e.limites} onChange={(ev) => upd("limites", ev.target.value)} />
            </Field>
          </div>
        )}

        {/* Navigation étapes */}
        <div className="mt-6 flex justify-between border-t border-line pt-4">
          <button className="btn-ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}><ChevronLeft size={14} /> Précédent</button>
          {step < STEPS.length
            ? <button className="btn-primary" onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}>Suivant <ChevronRight size={14} /></button>
            : <button className="btn-primary !bg-emerald" onClick={() => onSave({ ...e, statut: "Finalisée" })}>Finaliser l'estimation</button>}
        </div>
      </div>
    </div>
  );
}

/* ─── Liste des estimations ─── */
export function EstimationView() {
  const { data: estimations, isLoading } = useEstimations();
  const save = useSaveEstimation();
  const del = useDeleteEstimation();
  const user = useSessionStore((s) => s.user);
  const [editing, setEditing] = useState<Estimation | null>(null);

  if (editing) {
    return (
      <EstimationEditor
        initial={editing}
        onBack={() => setEditing(null)}
        onSave={(e) => { save.mutate(e); setEditing(null); }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 py-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Estimations de valeur vénale</h1>
          <p className="text-[13px] text-ink-muted">{estimations.length} estimation(s) enregistrée(s)</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing(newEstimation(user?.id))}>
          <Plus size={14} /> Nouvelle estimation
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-ink-muted">Chargement…</div>
      ) : estimations.length === 0 ? (
        <EmptyState Icon={FileText} text="Aucune estimation" sub="Créez votre première estimation de valeur vénale." />
      ) : (
        <div className="flex flex-col gap-3">
          {estimations.map((est) => {
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
                    <div className="text-[12px] text-ink-muted">Demandeur : {est.demandeur || "—"} · Rédacteur : {est.redacteur}</div>
                    {est.surfaceHabitable > 0 && (
                      <div className="mt-1 text-[12px] text-ink-muted">{est.surfaceHabitable} m² habitable</div>
                    )}
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
                <div className="mt-3 flex gap-2 border-t border-line pt-3" onClick={(ev) => ev.stopPropagation()}>
                  <button className="btn-ghost text-[12px]" onClick={() => setEditing(est)}><Edit2 size={13} /> Modifier</button>
                  {est.statut === "Finalisée" && est.valeurVenale > 0 && (
                    <Suspense fallback={<button className="btn-ghost text-[12px] opacity-60"><Download size={13} /> PDF…</button>}>
                      <EstimationPDFDownload estimation={est} />
                    </Suspense>
                  )}
                  <button className="btn-ghost text-[12px] text-danger hover:bg-danger-soft" onClick={() => { if (confirm("Supprimer ?")) del.mutate(est.id); }}>
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
