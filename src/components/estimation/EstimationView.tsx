import { useState, useCallback, Suspense, lazy, useEffect } from "react";
import {
  Plus, FileText, Edit2, Trash2, Download, ChevronLeft, ChevronRight,
  Search, Loader2, Sparkles, Save, Link, CheckCircle2,
} from "lucide-react";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { EmptyState } from "../ui/Modal";
import { StatusPill } from "../shared/StatusPill";
import { useEstimations, useSaveEstimation, useDeleteEstimation, uid } from "../../hooks/queries/useEstimations";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { useAutosave } from "../../hooks/useAutosave";
import type { Estimation, RefMarche, CritereMarche } from "../../schemas/estimation.schema";
import { TypeBienEstimation, EtatGeneral, ImpactCritere, COMMUNES_MARTINIQUE } from "../../schemas/enums";
import { eur } from "../../lib/format";
import { nombreEnLettres } from "../../schemas/estimation.schema";
import {
  genEnvironnement, genArgumentaireValeur,
  genArgumentaireCoupDeCœur, genCriteres,
} from "../../services/estimation.ai";

const EstimationPDFDownload = lazy(() => import("./EstimationPDFDownload"));

const today = () => new Date().toISOString().slice(0, 10);
const newRefMarche = (): RefMarche => ({ id: uid(), type: "", surface: 0, prix: 0, prixM2: 0, observations: "", source: "Annonce active" });
const newCritere = (): CritereMarche => ({ id: uid(), critere: "", analyse: "", impact: "Neutre" });

const CRITERES_DEFAUT = [
  "Surface habitable", "Terrasse / extérieur", "Étage / exposition", "État général",
  "Vendu meublé", "Cave / parking", "Potentiel locatif saisonnier", "Localisation",
  "Charges de copropriété",
];

// ─── DVF API ──────────────────────────────────────────────────────────────────
const INSEE: Record<string, string> = {
  "Fort-de-France": "97209", "Le Lamentin": "97213", "Le Robert": "97228",
  "Sainte-Marie": "97231", "Le François": "97208", "Le Marin": "97214",
  "Sainte-Anne": "97227", "Les Trois-Îlets": "97229", "Le Diamant": "97204",
  "Le Vauclin": "97234", "La Trinité": "97233", "Case-Pilote": "97201",
  "Le Carbet": "97202", "Saint-Pierre": "97230", "Schoelcher": "97232",
  "Sainte-Luce": "97226", "Rivière-Pilote": "97224", "Rivière-Salée": "97225",
  "Ducos": "97206", "Saint-Esprit": "97229", "Gros-Morne": "97211",
};

async function fetchDVF(commune: string, typeBien: string): Promise<RefMarche[]> {
  const codeInsee = INSEE[commune];
  if (!codeInsee) return [];

  const typeLocal = typeBien.toLowerCase().includes("terrain") ? "Terrain"
    : typeBien.toLowerCase().includes("maison") || typeBien.toLowerCase().includes("villa") ? "Maison"
    : "Appartement";

  // Fichier CSV DVF officiel par commune (accessible depuis le navigateur)
  const dept = codeInsee.slice(0, 3); // "972"
  const url = `https://files.data.gouv.fr/geo-dvf/latest/csv/${dept}/communes/${codeInsee}.csv`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csv = await resp.text();
    const lines = csv.split("\n");
    const header = (lines[0] ?? "").split(",");

    const idx = (col: string) => header.indexOf(col);
    const iType = idx("type_local");
    const iSurf = idx("surface_reelle_bati");
    const iValeur = idx("valeur_fonciere");
    const iDate = idx("date_mutation");
    const iPieces = idx("nombre_pieces_principales");

    const results: RefMarche[] = [];
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      const cols = line.split(",");
      const type = cols[iType]?.trim().replace(/^"|"$/g, "") ?? "";
      if (typeLocal !== "Terrain" && type && type !== typeLocal) continue;
      const surf = parseFloat(cols[iSurf]?.replace(/"/g, "") ?? "") || 0;
      const prix = parseFloat(cols[iValeur]?.replace(/[" ]/g, "") ?? "") || 0;
      const date = (cols[iDate]?.replace(/"/g, "") ?? "").slice(0, 10);
      const pieces = cols[iPieces]?.replace(/"/g, "")?.trim() ?? "";
      if (surf < 15 || prix < 1000) continue;
      const prixM2 = Math.round(prix / surf);
      if (prixM2 < 500 || prixM2 > 20000) continue;
      results.push({
        id: uid(),
        type: pieces ? `${type || typeLocal} – ${pieces}p` : (type || typeLocal),
        surface: Math.round(surf),
        prix: Math.round(prix),
        prixM2,
        observations: date ? `Vendu le ${new Date(date + "T12:00").toLocaleDateString("fr-FR")}` : "",
        source: "DVF" as const,
      });
    }
    // Trier par date desc, garder les 25 plus récentes
    return results
      .sort((a, b) => b.observations.localeCompare(a.observations))
      .slice(0, 25);
  } catch {
    return [];
  }
}

// ─── Proposition de prix ──────────────────────────────────────────────────────
interface PrixSuggestion { prixMin: number; prixRetenu: number; prixMax: number; prixM2Moyen: number; prixM2Min: number; prixM2Max: number; nbRefs: number; coupDeCœur: number; methode: string; }

function calculerPrix(e: Estimation): PrixSuggestion | null {
  const allRefs = [...e.refsAnnonces, ...e.refsDVF].filter(r => r.prixM2 > 0 && r.surface > 0);
  if (allRefs.length === 0 || e.surfaceHabitable === 0) return null;
  const vals = allRefs.map(r => r.prixM2).sort((a, b) => a - b);
  const trim = Math.floor(vals.length * 0.1);
  const trimmed = vals.slice(trim, vals.length - trim || undefined);
  const moy = Math.round(trimmed.reduce((s, v) => s + v, 0) / trimmed.length);
  const COEF: Record<string, number> = { "Parfait état": 1.08, "Très bon état": 1.04, "Bon état": 1.0, "État moyen": 0.93, "Travaux à prévoir": 0.85 };
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

function newEstimation(agentId?: string): Estimation {
  return {
    id: uid(), clientId: "", agentId, statut: "Brouillon",
    typeBien: "Appartement en copropriété", residence: "", adresse: "", commune: "Les Trois-Îlets", codePostal: "97229",
    sectionCadastrale: "", parcelles: "", demandeur: "", redacteur: "M. Luc CLEMENTE",
    dateEstimation: today(), photoBase64: "",
    etage: "", regimeJuridique: "Copropriété – appartement privatif", chargesCopro: 0,
    surfaceHabitable: 0, surfaceTerrasse: 0, surfaceJardin: 0, surfaceTerrain: 0,
    modeConstructif: "Béton", etatGeneral: "Bon état", distribution: "", parking: "",
    cave: false, piscine: false, venduMeuble: false, notesDescription: "",
    structureGeneral: "Bon état", finitionsInterieures: "Bon état", equipementsSanitaires: "Bon état", travauxAPrevoir: "Aucun à court terme",
    descriptionEnvironnement: "",
    refsAnnonces: [], refsDVF: [], commentaireMarche: "",
    avecLocatif: false,
    saisons: [
      { periode: "Haute saison (juil.–août, fêtes)", tarifNuit: 0, nbNuits: 0 },
      { periode: "Moyenne saison (vacances scolaires)", tarifNuit: 0, nbNuits: 0 },
      { periode: "Basse saison", tarifNuit: 0, nbNuits: 0 },
    ],
    criteres: CRITERES_DEFAUT.map(c => ({ id: uid(), critere: c, analyse: "", impact: "Neutre" as const })),
    argumentaireValeur: "", prixM2Retenu: 0, valeurVenale: 0, valeurCoupDeCœur: 0, argumentaireCoupDeCœur: "",
    limites: "La présente estimation ne constitue pas une expertise immobilière au sens de la Charte de l'Expertise en Évaluation Immobilière. Le rédacteur n'a pas procédé à des investigations techniques approfondies (diagnostics termites, amiante, mesurage Carrez contradictoire, état daté de copropriété). Il appartient aux parties de faire réaliser les diagnostics obligatoires.",
  };
}

// ─── Bouton IA ────────────────────────────────────────────────────────────────
function AiButton({ label, onClick, loading }: { label: string; onClick: () => void; loading: boolean }) {
  return (
    <button
      className="flex items-center gap-1.5 rounded border border-violet/40 bg-violet-soft px-2.5 py-1 text-[11.5px] font-semibold text-violet hover:bg-violet/10 disabled:opacity-50"
      onClick={onClick} disabled={loading}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
      {loading ? "Génération…" : label}
    </button>
  );
}

const STEPS = [
  { id: 1, label: "Page de garde" },
  { id: 2, label: "Identification" },
  { id: 3, label: "État & Environnement" },
  { id: 4, label: "Étude de marché" },
  { id: 5, label: "Locatif" },
  { id: 6, label: "Estimation" },
];

// ─── Éditeur multi-étapes ─────────────────────────────────────────────────────
function EstimationEditor({ initial, onSave, onBack }: {
  initial: Estimation; onSave: (e: Estimation) => void; onBack: () => void;
}) {
  const [e, setE] = useState<Estimation>(initial);
  const [step, setStep] = useState(1);
  const [dvfLoading, setDvfLoading] = useState(false);
  const [dvfMsg, setDvfMsg] = useState("");
  const [suggestion, setSuggestion] = useState<PrixSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const { data } = useAgencyData();

  const upd = useCallback(<K extends keyof Estimation>(k: K, v: Estimation[K]) =>
    setE(p => ({ ...p, [k]: v })), []);

  const prixM2Calc = e.surfaceHabitable > 0 ? Math.round(e.valeurVenale / e.surfaceHabitable) : 0;

  useEffect(() => { setSuggestion(calculerPrix(e)); },
    [e.refsAnnonces, e.refsDVF, e.surfaceHabitable, e.etatGeneral, e.venduMeuble, e.surfaceTerrasse, e.cave, e.piscine]);

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
        return { id: uid(), type: cols[0] ?? "", surface, prix, prixM2: surface > 0 ? Math.round(prix / surface) : 0, observations: cols[3] ?? "", source: target === "refsDVF" ? "DVF" as const : "Annonce active" as const };
      });
      upd(target, [...(e[target] ?? []), ...refs]);
    };
    r.readAsText(file, "utf-8");
  };

  const addRef = (t: "refsAnnonces" | "refsDVF") => upd(t, [...e[t], newRefMarche()]);
  const updRef = (t: "refsAnnonces" | "refsDVF", idx: number, k: keyof RefMarche, v: string) => {
    upd(t, e[t].map((r, i) => {
      if (i !== idx) return r;
      const u = { ...r, [k]: k === "type" || k === "observations" || k === "source" ? v : (parseFloat(v) || 0) };
      if ((k === "prix" || k === "surface") && u.surface > 0 && u.prix > 0) u.prixM2 = Math.round(u.prix / u.surface);
      return u;
    }));
  };
  const delRef = (t: "refsAnnonces" | "refsDVF", idx: number) => upd(t, e[t].filter((_, i) => i !== idx));
  const updCritere = (idx: number, k: keyof CritereMarche, v: string) =>
    upd("criteres", e.criteres.map((c, i) => i === idx ? { ...c, [k]: v } : c));

  const searchDVF = async () => {
    if (!e.commune) { setDvfMsg("Renseignez la commune d'abord."); return; }
    setDvfLoading(true); setDvfMsg("Recherche en cours…");
    const refs = await fetchDVF(e.commune, e.typeBien);
    if (refs.length === 0) {
      setDvfMsg(`⚠ Fichier DVF inaccessible depuis ce navigateur (CORS).`);
    } else {
      upd("refsDVF", [...e.refsDVF, ...refs]);
      setDvfMsg(`✓ ${refs.length} transaction(s) DVF importée(s) pour ${e.commune}`);
    }
    setDvfLoading(false);
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    setE(p => ({ ...p, valeurVenale: suggestion.prixRetenu, prixM2Retenu: suggestion.prixM2Moyen, valeurCoupDeCœur: suggestion.coupDeCœur }));
  };

  const withAi = async (key: string, fn: () => Promise<string | Array<{ critere: string; analyse: string; impact: string }>>) => {
    setAiLoading(key);
    try {
      const result = await fn();
      if (typeof result === "string" && result) {
        if (key === "objet") upd("descriptionEnvironnement", e.descriptionEnvironnement); // trigger update
        setE(p => ({ ...p, ...(key === "objet" ? {} : key === "env" ? { descriptionEnvironnement: result } : key === "arg" ? { argumentaireValeur: result } : key === "coeur" ? { argumentaireCoupDeCœur: result } : {}) }));
        if (key === "objet") {
          // Store "objet" in a transient way - we'll just show it as a toast and let user paste
          navigator.clipboard?.writeText(result).catch(() => {});
          alert("Texte généré copié dans le presse-papier :\n\n" + result);
        }
      } else if (Array.isArray(result) && result.length > 0) {
        upd("criteres", result.map(c => ({ id: uid(), critere: c.critere, analyse: c.analyse, impact: (c.impact as CritereMarche["impact"]) || "Neutre" })));
      }
    } catch { alert("Erreur de génération IA. Vérifiez votre connexion."); }
    setAiLoading(null);
  };

  // ─ Lier à un client ─
  const linkClient = (clientId: string) => {
    const client = data.clients.find(c => c.id === clientId);
    if (client) upd("demandeur", `${client.prenom} ${client.nom}`.trim());
    upd("clientId", clientId);
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
            <label className="btn-ghost cursor-pointer text-[12px]">📥 CSV<input type="file" accept=".csv" className="hidden" onChange={ev => handleCSV(ev, target)} /></label>
            <button className="btn-ghost text-[12px]" onClick={() => addRef(target)}><Plus size={13} /> Ajouter</button>
          </div>
        </div>
        {e[target].length === 0 ? (
          <div className="mb-4 rounded border border-dashed border-line2 py-5 text-center text-[12.5px] text-ink-muted">Aucune référence. Ajoutez manuellement ou importez un CSV.</div>
        ) : (
          <div className="mb-4 overflow-x-auto rounded border border-line">
            <table className="w-full text-[12px]">
              <thead><tr className="bg-primary text-white">
                <th className="px-2 py-1.5 text-left">Type</th>
                <th className="px-2 py-1.5 text-right">Surface</th>
                <th className="px-2 py-1.5 text-right">Prix</th>
                <th className="px-2 py-1.5 text-right font-bold">€/m²</th>
                <th className="px-2 py-1.5 text-left">Observations</th>
                <th className="w-8" />
              </tr></thead>
              <tbody>
                {e[target].map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-surface" : "bg-bg"}>
                    <td className="px-1 py-1"><Input value={r.type} onChange={ev => updRef(target, i, "type", ev.target.value)} placeholder="T3" className="h-7 text-[12px]" /></td>
                    <td className="px-1 py-1"><Input type="number" value={String(r.surface || "")} onChange={ev => updRef(target, i, "surface", ev.target.value)} className="h-7 w-20 text-right text-[12px]" /></td>
                    <td className="px-1 py-1"><Input type="number" value={String(r.prix || "")} onChange={ev => updRef(target, i, "prix", ev.target.value)} className="h-7 w-24 text-right text-[12px]" /></td>
                    <td className="px-2 py-1 text-right font-bold text-primary">{r.prixM2 ? `${r.prixM2.toLocaleString("fr-FR")} €` : "—"}</td>
                    <td className="px-1 py-1"><Input value={r.observations} onChange={ev => updRef(target, i, "observations", ev.target.value)} placeholder="Meublé, piscine…" className="h-7 text-[12px]" /></td>
                    <td className="px-1 py-1 text-center"><button onClick={() => delRef(target, i)} className="text-ink-muted hover:text-danger"><Trash2 size={13} /></button></td>
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
      {/* Sidebar */}
      <div className="w-48 shrink-0 border-r border-line bg-surface p-3">
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-[12.5px] text-ink-muted hover:text-ink">
          <ChevronLeft size={14} /> Retour
        </button>
        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wide text-ink-muted">Sections</div>
        {STEPS.map(st => (
          <button key={st.id} onClick={() => setStep(st.id)}
            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-[12.5px] font-medium mb-0.5 ${step === st.id ? "bg-primary-soft font-semibold text-primary" : "text-ink-sub hover:bg-line/50"}`}>
            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${step === st.id ? "bg-primary text-white" : "bg-line2 text-ink-muted"}`}>{st.id}</span>
            {st.label}
          </button>
        ))}
        <div className="mt-4 border-t border-line pt-3 flex flex-col gap-1.5">
          <button className="btn-primary w-full justify-center text-[12px]" onClick={() => onSave({ ...e, statut: "Finalisée" })}>✓ Finaliser</button>
          <button className="btn-ghost w-full justify-center text-[12px]" onClick={() => onSave({ ...e, statut: "Brouillon" })}><Save size={12} /> Sauvegarder</button>
          {/* Autosave indicator */}
          <div className="mt-1 text-center text-[10.5px] text-ink-muted">
            {saving ? <span className="text-amber">● Sauvegarde…</span>
              : lastSavedAt ? <span className="text-emerald flex items-center justify-center gap-1"><CheckCircle2 size={10} /> Sauvegardé {lastSavedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              : "Sauvegarde auto toutes les 30s"}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ÉTAPE 1 — Page de garde */}
        {step === 1 && (
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold text-ink">Page de garde</h2>

            {/* Lien client */}
            {data.clients.length > 0 && (
              <div className="card mb-4 flex items-center gap-3 border-l-4 border-l-primary bg-primary-soft p-3.5">
                <Link size={14} className="shrink-0 text-primary" />
                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-primary mb-1">Lier à un client existant</div>
                  <select className="w-full rounded border border-line bg-white px-2.5 py-1.5 text-[12.5px]"
                    value={e.clientId} onChange={ev => linkClient(ev.target.value)}>
                    <option value="">— Sélectionner un client —</option>
                    {data.clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>
              </div>
            )}

            <Grid2>
              <Field label="Type de bien"><Select value={e.typeBien} onChange={v => upd("typeBien", v as Estimation["typeBien"])} options={TypeBienEstimation.options} /></Field>
              <Field label="Commune"><Select value={e.commune} onChange={v => upd("commune", v)} options={[...COMMUNES_MARTINIQUE]} /></Field>
              <Field label="Résidence / Lotissement"><Input value={e.residence} onChange={ev => upd("residence", ev.target.value)} placeholder="Résidence La Pagerie…" /></Field>
              <Field label="Adresse"><Input value={e.adresse} onChange={ev => upd("adresse", ev.target.value)} /></Field>
              <Field label="Code postal"><Input value={e.codePostal} onChange={ev => upd("codePostal", ev.target.value)} /></Field>
              <Field label="Section cadastrale"><Input value={e.sectionCadastrale} onChange={ev => upd("sectionCadastrale", ev.target.value)} placeholder="C" /></Field>
              <Field label="Parcelles"><Input value={e.parcelles} onChange={ev => upd("parcelles", ev.target.value)} placeholder="n°2138 et 2139" /></Field>
              <Field label="Demandeur"><Input value={e.demandeur} onChange={ev => upd("demandeur", ev.target.value)} placeholder="M. et Mme DUPONT" /></Field>
              <Field label="Rédacteur"><Input value={e.redacteur} onChange={ev => upd("redacteur", ev.target.value)} /></Field>
              <Field label="Date"><Input type="date" value={e.dateEstimation} onChange={ev => upd("dateEstimation", ev.target.value)} /></Field>
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
              <Field label="Surface habitable (m²)"><Input type="number" value={String(e.surfaceHabitable || "")} onChange={ev => upd("surfaceHabitable", +ev.target.value)} /></Field>
              <Field label="Surface terrasse (m²)"><Input type="number" value={String(e.surfaceTerrasse || "")} onChange={ev => upd("surfaceTerrasse", +ev.target.value)} /></Field>
              <Field label="Surface jardin (m²)"><Input type="number" value={String(e.surfaceJardin || "")} onChange={ev => upd("surfaceJardin", +ev.target.value)} /></Field>
              <Field label="Surface terrain (m²)"><Input type="number" value={String(e.surfaceTerrain || "")} onChange={ev => upd("surfaceTerrain", +ev.target.value)} /></Field>
              <Field label="Étage"><Input value={e.etage} onChange={ev => upd("etage", ev.target.value)} placeholder="1er étage (R+5)" /></Field>
              <Field label="Régime juridique"><Input value={e.regimeJuridique} onChange={ev => upd("regimeJuridique", ev.target.value)} /></Field>
              <Field label="Charges copro (€/trim.)"><Input type="number" value={String(e.chargesCopro || "")} onChange={ev => upd("chargesCopro", +ev.target.value)} /></Field>
              <Field label="Mode constructif"><Input value={e.modeConstructif} onChange={ev => upd("modeConstructif", ev.target.value)} placeholder="Béton + Bardage bois" /></Field>
              <Field label="État général"><Select value={e.etatGeneral} onChange={v => upd("etatGeneral", v as Estimation["etatGeneral"])} options={EtatGeneral.options} /></Field>
              <Field label="Parking"><Input value={e.parking} onChange={ev => upd("parking", ev.target.value)} placeholder="1 place extérieure attitrée" /></Field>
            </Grid2>
            <div className="mb-3 flex flex-wrap gap-4">
              {[["cave", "Cave privative"], ["piscine", "Piscine"], ["venduMeuble", "Vendu meublé"]].map(([k, lbl]) => (
                <label key={k} className="flex items-center gap-2 text-[13px] font-medium text-ink-sub cursor-pointer">
                  <input type="checkbox" checked={Boolean(e[k as keyof Estimation])} onChange={ev => upd(k as keyof Estimation, ev.target.checked as never)} className="size-4 accent-primary" />
                  {lbl}
                </label>
              ))}
            </div>
            <Field label="Distribution"><Textarea rows={2} value={e.distribution} onChange={ev => upd("distribution", ev.target.value)} placeholder="Séjour, cuisine ouverte, 2 chambres…" /></Field>
          </div>
        )}

        {/* ÉTAPE 3 — État & Environnement */}
        {step === 3 && (
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold text-ink">État général & Environnement</h2>
            <div className="card mb-5 p-4">
              <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted">État général</div>
              <Grid2>
                <Field label="Structure générale"><Select value={e.structureGeneral} onChange={v => upd("structureGeneral", v as Estimation["structureGeneral"])} options={EtatGeneral.options} /></Field>
                <Field label="Finitions intérieures"><Select value={e.finitionsInterieures} onChange={v => upd("finitionsInterieures", v as Estimation["finitionsInterieures"])} options={EtatGeneral.options} /></Field>
                <Field label="Équipements sanitaires"><Select value={e.equipementsSanitaires} onChange={v => upd("equipementsSanitaires", v as Estimation["equipementsSanitaires"])} options={EtatGeneral.options} /></Field>
                <Field label="Travaux à prévoir"><Input value={e.travauxAPrevoir} onChange={ev => upd("travauxAPrevoir", ev.target.value)} /></Field>
              </Grid2>
            </div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Description de l'environnement</label>
              <AiButton label="Générer avec IA" loading={aiLoading === "env"} onClick={() => withAi("env", () => genEnvironnement(e))} />
            </div>
            <Textarea rows={8} value={e.descriptionEnvironnement} onChange={ev => upd("descriptionEnvironnement", ev.target.value)} placeholder="Décrivez le quartier, la commune, les atouts de l'emplacement…" />
          </div>
        )}

        {/* ÉTAPE 4 — Marché */}
        {step === 4 && (
          <div>
            <h2 className="mb-1 font-heading text-base font-semibold text-ink">Étude de marché</h2>
            <p className="mb-4 text-[12.5px] text-ink-muted">Les références saisies ici alimentent la proposition de prix automatique à l'étape 6.</p>
            <div className="card mb-5 border-l-4 border-l-primary bg-primary-soft p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-primary">🏛️ Données DVF — Transactions officielles DGFiP</div>
                  <div className="text-[12px] text-primary/80">Ventes réelles enregistrées pour <b>{e.commune}</b></div>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={searchDVF} disabled={dvfLoading}>
                  {dvfLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  {dvfLoading ? "Chargement…" : "Importer DVF"}
                </button>
              </div>
              {dvfMsg && (
                <div className={`mt-2 text-[12px] font-medium ${dvfMsg.startsWith("✓") ? "text-emerald" : "text-amber"}`}>
                  {dvfMsg}
                </div>
              )}
              {dvfMsg.startsWith("⚠") && INSEE[e.commune] && (
                <div className="mt-3 rounded bg-white/70 p-3 text-[12px] text-ink-sub">
                  <div className="font-semibold text-ink mb-1.5">📥 Import manuel en 3 étapes :</div>
                  <div className="mb-1">1. Téléchargez le fichier CSV de {e.commune} :</div>
                  <a
                    href={`https://files.data.gouv.fr/geo-dvf/latest/csv/${INSEE[e.commune]?.slice(0,3)}/communes/${INSEE[e.commune]}.csv`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary-soft px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary hover:text-white transition-colors mb-2"
                  >
                    <Download size={13} /> Télécharger {e.commune}.csv
                  </a>
                  <div className="mb-1">2. Ouvrez-le dans Excel, supprimez les colonnes inutiles, sauvegardez en CSV (séparateur ;)</div>
                  <div>3. Importez-le avec le bouton <b>📥 CSV</b> dans le tableau DVF ci-dessous</div>
                </div>
              )}
            </div>
            <RefTable target="refsAnnonces" label="Références — Annonces actives (leboncoin, domimmo…)" />
            <RefTable target="refsDVF" label="Données DVF — Transactions réelles (DGFiP)" />
            <Field label="Commentaire de marché">
              <Textarea rows={3} value={e.commentaireMarche} onChange={ev => upd("commentaireMarche", ev.target.value)} placeholder="L'analyse comparative établit une valeur vénale moyenne de X €/m²…" />
            </Field>
          </div>
        )}

        {/* ÉTAPE 5 — Locatif */}
        {step === 5 && (
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold text-ink">Potentiel locatif saisonnier</h2>
            <label className="mb-5 flex items-center gap-2.5 text-[13.5px] font-medium text-ink cursor-pointer">
              <input type="checkbox" checked={e.avecLocatif} onChange={ev => upd("avecLocatif", ev.target.checked)} className="size-4 accent-primary" />
              Inclure une analyse du potentiel locatif saisonnier
            </label>
            {e.avecLocatif && (
              <div className="card p-4">
                <table className="w-full text-[13px]">
                  <thead><tr className="border-b border-line">
                    <th className="pb-2 text-left font-semibold text-ink-sub">Période</th>
                    <th className="pb-2 text-right font-semibold text-ink-sub">Tarif/nuit</th>
                    <th className="pb-2 text-right font-semibold text-ink-sub">Nb nuits</th>
                    <th className="pb-2 text-right font-semibold text-ink-sub">Revenu brut</th>
                  </tr></thead>
                  <tbody>
                    {e.saisons.map((ss, i) => (
                      <tr key={i} className="border-b border-line/50">
                        <td className="py-2 pr-3 text-ink-sub">{ss.periode}</td>
                        <td className="py-2 pr-2"><Input type="number" value={String(ss.tarifNuit || "")} onChange={ev => upd("saisons", e.saisons.map((s, j) => j === i ? { ...s, tarifNuit: +ev.target.value } : s))} className="h-8 w-24 text-right text-[13px]" /></td>
                        <td className="py-2 pr-2"><Input type="number" value={String(ss.nbNuits || "")} onChange={ev => upd("saisons", e.saisons.map((s, j) => j === i ? { ...s, nbNuits: +ev.target.value } : s))} className="h-8 w-20 text-right text-[13px]" /></td>
                        <td className="py-2 text-right font-semibold text-ink">{eur(ss.tarifNuit * ss.nbNuits)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex items-center justify-between rounded bg-primary-soft px-3 py-2.5">
                  <span className="text-[12.5px] font-semibold text-primary">Total ({e.saisons.reduce((s, x) => s + x.nbNuits, 0)} nuits/an)</span>
                  <span className="font-heading text-base font-bold text-primary">{eur(e.saisons.reduce((s, x) => s + x.tarifNuit * x.nbNuits, 0))} brut</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 6 — Estimation */}
        {step === 6 && (
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold text-ink">Grille d'analyse & Valeur vénale</h2>

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
                Ajoutez des références de marché (étape 4) pour obtenir une proposition automatique.
              </div>
            )}

            {/* Grille d'analyse */}
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wide text-ink-muted">Grille d'analyse</span>
              <AiButton label="Générer avec IA" loading={aiLoading === "criteres"} onClick={() => withAi("criteres", () => genCriteres(e))} />
            </div>
            <div className="card mb-5 overflow-hidden">
              <div className="grid grid-cols-3 gap-2 border-b border-line bg-primary px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white">
                <span>Critère</span><span>Analyse</span><span>Impact</span>
              </div>
              {e.criteres.map((c, i) => (
                <div key={c.id} className={`grid grid-cols-3 gap-2 border-b border-line p-2.5 ${i % 2 === 0 ? "" : "bg-bg"}`}>
                  <Input value={c.critere} onChange={ev => updCritere(i, "critere", ev.target.value)} className="h-8 text-[12px]" />
                  <Input value={c.analyse} onChange={ev => updCritere(i, "analyse", ev.target.value)} className="h-8 text-[12px]" placeholder="Description…" />
                  <Select value={c.impact} onChange={v => updCritere(i, "impact", v)} options={ImpactCritere.options} className="h-8 text-[12px]" />
                </div>
              ))}
              <div className="p-2.5"><button className="btn-ghost text-[12px]" onClick={() => upd("criteres", [...e.criteres, newCritere()])}><Plus size={13} /> Ajouter</button></div>
            </div>

            {/* Argumentation */}
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Argumentation de la valeur</label>
              <AiButton label="Générer avec IA" loading={aiLoading === "arg"} onClick={() => withAi("arg", () => genArgumentaireValeur(e, suggestion))} />
            </div>
            <Textarea rows={5} value={e.argumentaireValeur} onChange={ev => upd("argumentaireValeur", ev.target.value)} placeholder="Compte tenu de la surface habitable, de l'état parfait…" className="mb-4" />

            {/* Valeur vénale */}
            <div className="card mb-5 border-l-4 border-l-primary bg-primary-soft p-5">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-primary">Valeur vénale estimée</div>
              <div className="flex items-center gap-4">
                <div className="flex-1"><Field label="Valeur vénale (€)"><Input type="number" value={String(e.valeurVenale || "")} onChange={ev => upd("valeurVenale", +ev.target.value)} className="text-xl font-bold" /></Field></div>
                <div className="text-right shrink-0">
                  {prixM2Calc > 0 && <div className="text-[14px] font-semibold text-primary">{prixM2Calc.toLocaleString("fr-FR")} €/m²</div>}
                  <div className="text-[11px] italic text-ink-muted">{e.valeurVenale > 0 ? nombreEnLettres(e.valeurVenale) : "—"}</div>
                </div>
              </div>
            </div>

            {/* Coup de cœur */}
            <div className="card mb-5 border-l-4 border-l-amber bg-amber-soft p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide text-amber">Valeur coup de cœur (optionnel)</span>
                {e.valeurCoupDeCœur > 0 && <AiButton label="Générer avec IA" loading={aiLoading === "coeur"} onClick={() => withAi("coeur", () => genArgumentaireCoupDeCœur(e))} />}
              </div>
              <Grid2>
                <Field label="Valeur coup de cœur (€)"><Input type="number" value={String(e.valeurCoupDeCœur || "")} onChange={ev => upd("valeurCoupDeCœur", +ev.target.value)} /></Field>
              </Grid2>
              <Field label="Argumentation coup de cœur"><Textarea rows={3} value={e.argumentaireCoupDeCœur} onChange={ev => upd("argumentaireCoupDeCœur", ev.target.value)} /></Field>
            </div>

            <Field label="Limites & réserves"><Textarea rows={4} value={e.limites} onChange={ev => upd("limites", ev.target.value)} /></Field>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between border-t border-line pt-4">
          <button className="btn-ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}><ChevronLeft size={14} /> Précédent</button>
          {step < STEPS.length
            ? <button className="btn-primary" onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}>Suivant <ChevronRight size={14} /></button>
            : <button className="btn-primary !bg-emerald" onClick={() => onSave({ ...e, statut: "Finalisée" })}>✓ Finaliser l'estimation</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Liste des estimations ────────────────────────────────────────────────────
export function EstimationView() {
  const { data: estimations, isLoading } = useEstimations();
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

  if (editing) return <EstimationEditor initial={editing} onBack={() => setEditing(null)} onSave={handleSave} />;

  return (
    <div className="mx-auto max-w-[900px] px-6 py-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Estimations de valeur vénale</h1>
          <p className="text-[13px] text-ink-muted">{estimations.length} estimation(s)</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing(newEstimation(user?.id ?? undefined))}>
          <Plus size={14} /> Nouvelle estimation
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-ink-muted">Chargement…</div>
      ) : estimations.length === 0 ? (
        <EmptyState Icon={FileText} text="Aucune estimation" sub="Créez votre première estimation de valeur vénale." />
      ) : (
        <div className="flex flex-col gap-3">
          {estimations.map(est => {
            const prixM2 = est.surfaceHabitable > 0 ? Math.round(est.valeurVenale / est.surfaceHabitable) : 0;
            const nbRefs = est.refsAnnonces.length + est.refsDVF.length;
            return (
              <div key={est.id} className="card p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-heading text-[15px] font-semibold text-ink">{est.residence || est.adresse || "Sans adresse"}</span>
                      <StatusPill label={est.statut} tone={est.statut === "Finalisée" ? "emerald" : "amber"} />
                    </div>
                    <div className="text-[12.5px] text-ink-sub">{est.typeBien} · {est.commune}</div>
                    <div className="text-[12px] text-ink-muted">
                      Demandeur : {est.demandeur || "—"} · {est.surfaceHabitable > 0 ? `${est.surfaceHabitable} m²` : ""}
                      {nbRefs > 0 && <span className="ml-2 text-primary">· {nbRefs} réf. de marché</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {est.valeurVenale > 0 && <>
                      <div className="font-heading text-lg font-bold text-primary">{eur(est.valeurVenale)}</div>
                      {prixM2 > 0 && <div className="text-[11.5px] text-ink-muted">{prixM2.toLocaleString("fr-FR")} €/m²</div>}
                    </>}
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-line pt-3">
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
