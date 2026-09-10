import { useCallback, useEffect, useState, Suspense, lazy } from "react";
import { Plus, Edit2, Trash2, Download, ChevronLeft, ChevronRight, KeyRound } from "lucide-react";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { EmptyState } from "../ui/Modal";
import { StatusPill } from "../shared/StatusPill";
import { useSessionStore } from "../../store/session.store";
import { COMMUNES_MARTINIQUE } from "../../schemas/enums";
import { eur } from "../../lib/format";
import type { Bail, PartieBail } from "../../schemas/bail.schema";
import {
  TYPES_BAIL, loyerCc, depotDefaut, dureeDefaut, usageDefaut, titreBail,
} from "../../schemas/bail.schema";

const BailDownloads = lazy(() => import("./BailDownloads"));
const KEY = "casa.bail.v1";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().slice(0, 10);

function loadAll(): Bail[] {
  try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as Bail[]) : []; }
  catch { return []; }
}
function persist(list: Bail[]) { localStorage.setItem(KEY, JSON.stringify(list)); }

function newPartie(qualite = ""): PartieBail {
  return { id: uid(), civilite: "M.", prenom: "", nom: "", dateNaissance: "", lieuNaissance: "", nationalite: "Française", adresse: "", codePostal: "", ville: "", tel: "", email: "", qualite };
}

function addMonths(iso: string, months: number): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function nouveauDoc(agentId?: string): Bail {
  const typeBail = "Bail d'habitation meublé";
  const dateDebut = today();
  const dureeMois = dureeDefaut(typeBail);
  return {
    id: uid(), statut: "Brouillon", agentId, typeBail,
    numero: `BL-${new Date().getFullYear()}-`,
    dateDocument: today(), lieuSignature: "Fort-de-France",
    bailleurs: [newPartie("Propriétaire")],
    preneurs: [newPartie("Locataire")],
    typeBien: "Appartement", adresseBien: "", commune: "Fort-de-France", codePostal: "97200",
    sectionCadastrale: "", parcelle: "", surfaceHabitable: 0, nbPieces: "", etage: "",
    descriptionBien: "", usage: usageDefaut(typeBail), regimeFoncier: "",
    annexes: "", copropriete: "",
    dateDebut, dureeMois, dateFin: addMonths(dateDebut, dureeMois), motifMobilite: "",
    loyerHc: 0, charges: 0, typeCharges: "Provision sur charges", jourPaiement: 5, modePaiement: "Virement bancaire",
    iban: "", titulaireCompte: "",
    depotGarantie: 0, revisionIrl: true, trimestreIrl: "T1",
    honorairesAgence: 0, chargeHonoraires: "Partagé par moitié",
    agenceNom: "Casa Caraïbes SARL",
    agenceMention: "CPI 97212024000000007 — RCS Fort-de-France 928 647 981",
    dpeClasse: "", gesClasse: "", dateDpe: "", termites: "", ernmt: "",
    animauxAutorises: true, sousLocationAutorisee: false,
    clausesSpecifiques: "", inventaireMeubles: "", observations: "",
  };
}

const STEPS = [
  { id: 1, label: "Type & parties" },
  { id: 2, label: "Bien" },
  { id: 3, label: "Loyer" },
  { id: 4, label: "Clauses" },
];

function PartieFields({ p, onChange, onRemove }: { p: PartieBail; onChange: (patch: Partial<PartieBail>) => void; onRemove?: () => void }) {
  return (
    <div className="card mb-3 p-3">
      <div className="mb-2 flex justify-end">{onRemove && <button className="btn-ghost px-1 text-danger" onClick={onRemove}>×</button>}</div>
      <Grid2>
        <Field label="Civilité"><Select value={p.civilite} onChange={(v) => onChange({ civilite: v })} options={["M.", "Mme", "M. et Mme"]} /></Field>
        <Field label="Prénom"><Input value={p.prenom} onChange={(e) => onChange({ prenom: e.target.value })} /></Field>
        <Field label="Nom"><Input value={p.nom} onChange={(e) => onChange({ nom: e.target.value })} /></Field>
        <Field label="Né(e) le"><Input type="date" value={p.dateNaissance} onChange={(e) => onChange({ dateNaissance: e.target.value })} /></Field>
        <Field label="Lieu de naissance"><Input value={p.lieuNaissance} onChange={(e) => onChange({ lieuNaissance: e.target.value })} /></Field>
        <Field label="Nationalité"><Input value={p.nationalite} onChange={(e) => onChange({ nationalite: e.target.value })} /></Field>
      </Grid2>
      <Field label="Adresse"><Input value={p.adresse} onChange={(e) => onChange({ adresse: e.target.value })} /></Field>
      <Grid2>
        <Field label="CP"><Input value={p.codePostal} onChange={(e) => onChange({ codePostal: e.target.value })} /></Field>
        <Field label="Ville"><Input value={p.ville} onChange={(e) => onChange({ ville: e.target.value })} /></Field>
        <Field label="Tél."><Input value={p.tel} onChange={(e) => onChange({ tel: e.target.value })} /></Field>
        <Field label="Email"><Input value={p.email} onChange={(e) => onChange({ email: e.target.value })} /></Field>
      </Grid2>
    </div>
  );
}

function Editor({ initial, onSave, onBack }: { initial: Bail; onSave: (d: Bail) => void; onBack: () => void }) {
  const [e, setE] = useState<Bail>(initial);
  const [step, setStep] = useState(1);
  const upd = useCallback(<K extends keyof Bail>(k: K, v: Bail[K]) => setE((p) => ({ ...p, [k]: v })), []);

  const setType = (typeBail: string) => {
    setE((p) => {
      const dureeMois = dureeDefaut(typeBail);
      return {
        ...p,
        typeBail,
        dureeMois,
        dateFin: addMonths(p.dateDebut, dureeMois),
        usage: usageDefaut(typeBail),
        depotGarantie: depotDefaut(typeBail, p.loyerHc),
        revisionIrl: typeBail !== "Location saisonnière" && typeBail !== "Bail mobilité",
      };
    });
  };

  useEffect(() => { const t = setTimeout(() => onSave(e), 1500); return () => clearTimeout(t); }, [e, onSave]);

  const setBailleur = (i: number, patch: Partial<PartieBail>) => upd("bailleurs", e.bailleurs.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const setPreneur = (i: number, patch: Partial<PartieBail>) => upd("preneurs", e.preneurs.map((x, idx) => idx === i ? { ...x, ...patch } : x));

  const meuble = e.typeBail !== "Bail d'habitation nu";
  const mobilite = e.typeBail === "Bail mobilité";

  return (
    <div className="mx-auto max-w-[860px] px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button className="btn-ghost text-[13px]" onClick={onBack}><ChevronLeft size={14} /> Retour</button>
        <div className="flex gap-2">
          <Suspense fallback={null}><BailDownloads doc={e} /></Suspense>
          <button className="btn-ghost text-[13px]" onClick={() => { upd("statut", "Brouillon"); onSave({ ...e, statut: "Brouillon" }); }}>Enregistrer</button>
          <button className="btn-primary text-[13px]" onClick={() => { const n = { ...e, statut: "Finalisé" as const }; setE(n); onSave(n); onBack(); }}>Finaliser</button>
        </div>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {STEPS.map((st) => (
          <button key={st.id} className={`rounded-full px-3 py-1 text-[12px] ${step === st.id ? "bg-primary text-white" : "bg-surface border border-line text-ink-sub"}`} onClick={() => setStep(st.id)}>{st.id}. {st.label}</button>
        ))}
      </div>

      {step === 1 && (<>
        <Grid2>
          <Field label="Type de bail"><Select value={e.typeBail} onChange={setType} options={TYPES_BAIL} /></Field>
          <Field label="N° de bail"><Input value={e.numero} onChange={(ev) => upd("numero", ev.target.value)} /></Field>
          <Field label="Date du contrat"><Input type="date" value={e.dateDocument} onChange={(ev) => upd("dateDocument", ev.target.value)} /></Field>
          <Field label="Lieu de signature"><Input value={e.lieuSignature} onChange={(ev) => upd("lieuSignature", ev.target.value)} /></Field>
        </Grid2>
        <h3 className="mb-2 mt-4 text-[13px] font-semibold text-ink">Bailleur(s)</h3>
        {e.bailleurs.map((p, i) => (
          <PartieFields key={p.id} p={p} onChange={(patch) => setBailleur(i, patch)} onRemove={e.bailleurs.length > 1 ? () => upd("bailleurs", e.bailleurs.filter((_, idx) => idx !== i)) : undefined} />
        ))}
        <button className="btn-ghost mb-4 text-[12px]" onClick={() => upd("bailleurs", [...e.bailleurs, newPartie("Propriétaire")])}><Plus size={12} /> Co-bailleur</button>
        <h3 className="mb-2 text-[13px] font-semibold text-ink">Preneur(s)</h3>
        {e.preneurs.map((p, i) => (
          <PartieFields key={p.id} p={p} onChange={(patch) => setPreneur(i, patch)} onRemove={e.preneurs.length > 1 ? () => upd("preneurs", e.preneurs.filter((_, idx) => idx !== i)) : undefined} />
        ))}
        <button className="btn-ghost text-[12px]" onClick={() => upd("preneurs", [...e.preneurs, newPartie("Locataire")])}><Plus size={12} /> Co-preneur</button>
        <h3 className="mb-2 mt-4 text-[13px] font-semibold text-ink">Caution solidaire (optionnel)</h3>
        {e.garant ? (
          <PartieFields p={e.garant} onChange={(patch) => upd("garant", { ...e.garant!, ...patch })} onRemove={() => setE((p) => { const n = { ...p }; delete n.garant; return n; })} />
        ) : (
          <button className="btn-ghost text-[12px]" onClick={() => upd("garant", newPartie("Caution"))}><Plus size={12} /> Ajouter une caution</button>
        )}
      </>)}

      {step === 2 && (<>
        <Grid2>
          <Field label="Type de bien"><Select value={e.typeBien} onChange={(v) => upd("typeBien", v)} options={["Appartement", "Villa", "Maison", "Studio", "T1", "T2", "T3", "T4"]} /></Field>
          <Field label="Adresse"><Input value={e.adresseBien} onChange={(ev) => upd("adresseBien", ev.target.value)} /></Field>
          <Field label="Commune"><Select value={e.commune} onChange={(v) => upd("commune", v)} options={COMMUNES_MARTINIQUE} /></Field>
          <Field label="Code postal"><Input value={e.codePostal} onChange={(ev) => upd("codePostal", ev.target.value)} /></Field>
          <Field label="Section cadastrale"><Input value={e.sectionCadastrale} onChange={(ev) => upd("sectionCadastrale", ev.target.value)} /></Field>
          <Field label="Parcelle"><Input value={e.parcelle} onChange={(ev) => upd("parcelle", ev.target.value)} /></Field>
          <Field label="Surface habitable (m²)"><Input type="number" step="0.01" value={e.surfaceHabitable || ""} onChange={(ev) => upd("surfaceHabitable", Number(ev.target.value))} /></Field>
          <Field label="Pièces"><Input value={e.nbPieces} onChange={(ev) => upd("nbPieces", ev.target.value)} placeholder="T3 — 2 chambres" /></Field>
          <Field label="Étage / accès"><Input value={e.etage} onChange={(ev) => upd("etage", ev.target.value)} /></Field>
        </Grid2>
        <Field label="Usage"><Input value={e.usage} onChange={(ev) => upd("usage", ev.target.value)} /></Field>
        <Field label="Annexes (parking, cave…)"><Input value={e.annexes} onChange={(ev) => upd("annexes", ev.target.value)} /></Field>
        <Field label="Copropriété / lots"><Input value={e.copropriete} onChange={(ev) => upd("copropriete", ev.target.value)} /></Field>
        <Field label="Description"><Textarea rows={4} value={e.descriptionBien} onChange={(ev) => upd("descriptionBien", ev.target.value)} /></Field>
        <Grid2>
          <Field label="Prise d'effet"><Input type="date" value={e.dateDebut} onChange={(ev) => { const dateDebut = ev.target.value; setE((p) => ({ ...p, dateDebut, dateFin: addMonths(dateDebut, p.dureeMois) })); }} /></Field>
          <Field label={mobilite ? "Durée (1 à 10 mois)" : "Durée (mois)"}><Input type="number" value={e.dureeMois || ""} onChange={(ev) => { const dureeMois = Number(ev.target.value); setE((p) => ({ ...p, dureeMois, dateFin: addMonths(p.dateDebut, dureeMois) })); }} /></Field>
          <Field label="Date de fin"><Input type="date" value={e.dateFin} onChange={(ev) => upd("dateFin", ev.target.value)} /></Field>
        </Grid2>
        {mobilite && <Field label="Motif du bail mobilité"><Input value={e.motifMobilite} onChange={(ev) => upd("motifMobilite", ev.target.value)} placeholder="Études, formation, mission professionnelle…" /></Field>}
      </>)}

      {step === 3 && (<>
        <Grid2>
          <Field label="Loyer mensuel HC (€)"><Input type="number" value={e.loyerHc || ""} onChange={(ev) => { const loyerHc = Number(ev.target.value); setE((p) => ({ ...p, loyerHc, depotGarantie: depotDefaut(p.typeBail, loyerHc) })); }} /></Field>
          <Field label="Charges (€)"><Input type="number" value={e.charges || ""} onChange={(ev) => upd("charges", Number(ev.target.value))} /></Field>
          <Field label="Nature des charges"><Select value={e.typeCharges || "Provision sur charges"} onChange={(v) => upd("typeCharges", v)} options={["Provision sur charges", "Forfait de charges", "Charges comprises"]} /></Field>
          <Field label="Loyer CC"><Input readOnly value={e.loyerHc ? eur(loyerCc(e)) : "—"} /></Field>
          <Field label="Dépôt de garantie (€)"><Input type="number" value={e.depotGarantie || ""} onChange={(ev) => upd("depotGarantie", Number(ev.target.value))} /></Field>
          <Field label="Jour de paiement"><Input type="number" value={e.jourPaiement || ""} onChange={(ev) => upd("jourPaiement", Number(ev.target.value))} /></Field>
          <Field label="Mode de paiement"><Select value={e.modePaiement} onChange={(v) => upd("modePaiement", v)} options={["Virement bancaire", "Prélèvement", "Chèque", "Espèces"]} /></Field>
          <Field label="Titulaire du compte"><Input value={e.titulaireCompte} onChange={(ev) => upd("titulaireCompte", ev.target.value)} /></Field>
          <Field label="IBAN"><Input value={e.iban} onChange={(ev) => upd("iban", ev.target.value)} /></Field>
        </Grid2>
        {e.typeBail !== "Location saisonnière" && e.typeBail !== "Bail mobilité" && (
          <Grid2>
            <Field label="Révision IRL"><Select value={e.revisionIrl ? "Oui" : "Non"} onChange={(v) => upd("revisionIrl", v === "Oui")} options={["Oui", "Non"]} /></Field>
            <Field label="Trimestre IRL de référence"><Select value={e.trimestreIrl} onChange={(v) => upd("trimestreIrl", v)} options={["T1", "T2", "T3", "T4"]} /></Field>
          </Grid2>
        )}
        {mobilite && <p className="text-[12.5px] text-ink-muted">Bail mobilité : pas de dépôt de garantie (art. 25-17 loi 1989).</p>}
        <Grid2>
          <Field label="Honoraires agence TTC (€)"><Input type="number" value={e.honorairesAgence || ""} onChange={(ev) => upd("honorairesAgence", Number(ev.target.value))} /></Field>
          <Field label="Charge des honoraires"><Select value={e.chargeHonoraires} onChange={(v) => upd("chargeHonoraires", v)} options={["Partagé par moitié", "Bailleur", "Preneur"]} /></Field>
        </Grid2>
      </>)}

      {step === 4 && (<>
        <h3 className="mb-2 text-[13px] font-semibold text-ink">Diagnostics</h3>
        <Grid2>
          <Field label="DPE (énergie)"><Select value={e.dpeClasse || ""} onChange={(v) => upd("dpeClasse", v)} options={["", "A", "B", "C", "D", "E", "F", "G", "Vierge"]} /></Field>
          <Field label="GES"><Select value={e.gesClasse || ""} onChange={(v) => upd("gesClasse", v)} options={["", "A", "B", "C", "D", "E", "F", "G"]} /></Field>
          <Field label="Date du DPE"><Input type="date" value={e.dateDpe} onChange={(ev) => upd("dateDpe", ev.target.value)} /></Field>
          <Field label="Termites"><Input value={e.termites} onChange={(ev) => upd("termites", ev.target.value)} placeholder="Présence / absence — date" /></Field>
        </Grid2>
        <Field label="ERNMT / risques et pollutions"><Input value={e.ernmt} onChange={(ev) => upd("ernmt", ev.target.value)} /></Field>
        <Grid2>
          <Field label="Animaux"><Select value={e.animauxAutorises ? "Autorisés" : "Interdits"} onChange={(v) => upd("animauxAutorises", v === "Autorisés")} options={["Autorisés", "Interdits"]} /></Field>
          <Field label="Sous-location"><Select value={e.sousLocationAutorisee ? "Autorisée" : "Interdite"} onChange={(v) => upd("sousLocationAutorisee", v === "Autorisée")} options={["Interdite", "Autorisée"]} /></Field>
        </Grid2>
        {meuble && <Field label="Inventaire du mobilier"><Textarea rows={5} value={e.inventaireMeubles} onChange={(ev) => upd("inventaireMeubles", ev.target.value)} placeholder="Liste des meubles remis avec le logement…" /></Field>}
        <Field label="Clauses particulières"><Textarea rows={5} value={e.clausesSpecifiques} onChange={(ev) => upd("clausesSpecifiques", ev.target.value)} /></Field>
        <Field label="Observations"><Textarea rows={3} value={e.observations} onChange={(ev) => upd("observations", ev.target.value)} /></Field>
      </>)}

      <div className="mt-6 flex justify-between">
        <button className="btn-ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}><ChevronLeft size={14} /> Précédent</button>
        <button className="btn-primary" disabled={step === 4} onClick={() => setStep((s) => s + 1)}>Suivant <ChevronRight size={14} /></button>
      </div>
    </div>
  );
}

export function BailView() {
  const user = useSessionStore((s) => s.user);
  const [list, setList] = useState<Bail[]>(() => loadAll());
  const [editing, setEditing] = useState<Bail | null>(null);
  const handleSave = useCallback((d: Bail) => {
    setList((prev) => { const next = prev.some((x) => x.id === d.id) ? prev.map((x) => x.id === d.id ? d : x) : [d, ...prev]; persist(next); return next; });
  }, []);
  const handleDelete = (id: string) => {
    if (!confirm("Supprimer ce bail ?")) return;
    setList((prev) => { const next = prev.filter((x) => x.id !== id); persist(next); return next; });
  };
  if (editing) return <Editor initial={editing} onSave={handleSave} onBack={() => setEditing(null)} />;
  return (
    <div className="mx-auto max-w-[900px] px-6 py-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Rédaction de baux</h1>
          <p className="text-[13px] text-ink-muted">{list.length} contrat(s) — nu, meublé, mobilité, saisonnier — PDF et Word</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing(nouveauDoc(user?.id))}><Plus size={14} /> Nouveau bail</button>
      </div>
      {list.length === 0 ? (
        <EmptyState Icon={KeyRound} text="Aucun bail" sub="Rédigez un bail d'habitation nu, meublé, mobilité ou saisonnier." />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((b) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-heading text-[15px] font-semibold text-ink">{titreBail(b.typeBail)}</span>
                    <StatusPill label={b.statut} tone={b.statut === "Finalisé" ? "emerald" : "amber"} />
                  </div>
                  <div className="text-[12.5px] text-ink-sub">{b.adresseBien || b.commune} · {b.preneurs[0] ? `${b.preneurs[0].prenom} ${b.preneurs[0].nom}` : "Preneur à renseigner"}</div>
                  <div className="text-[12px] text-ink-muted">{b.numero} · {b.dateDebut} → {b.dateFin}</div>
                </div>
                <div className="shrink-0 text-right">
                  {b.loyerHc > 0 && <div className="font-heading text-lg font-bold text-primary">{eur(b.loyerHc)} HC</div>}
                </div>
              </div>
              <div className="mt-3 flex gap-2 border-t border-line pt-3">
                <button className="btn-ghost text-[12px]" onClick={() => setEditing(b)}><Edit2 size={13} /> Modifier</button>
                <Suspense fallback={<button className="btn-ghost text-[12px] opacity-60"><Download size={13} /> PDF…</button>}><BailDownloads doc={b} /></Suspense>
                <button className="btn-ghost text-[12px] text-danger hover:bg-danger-soft" onClick={() => handleDelete(b.id)}><Trash2 size={13} /> Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
