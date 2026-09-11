import { useCallback, useEffect, useRef, useState, Suspense, lazy } from "react";
import { Plus, Edit2, Trash2, Download, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { EmptyState } from "../ui/Modal";
import { StatusPill } from "../shared/StatusPill";
import { useSessionStore } from "../../store/session.store";
import { COMMUNES_MARTINIQUE } from "../../schemas/enums";
import { eur } from "../../lib/format";
import type { LigneEquipement, LigneSurface, ValeurLocative } from "../../schemas/valeurLocative.schema";
import {
  loyerAnnuel, REGIMES_LOCATIFS, analyseMarcheDefaut, estAnalyseParDefaut,
  estMeuble, libelleLoyer, REFERENCES_AGENCE_DEFAUT, DISCLAIMER_DEFAUT,
} from "../../schemas/valeurLocative.schema";
import {
  useValeursLocatives, useSaveValeurLocative, useDeleteValeurLocative,
  useMigrateLocalValeursLocatives, uid,
} from "../../hooks/queries/useValeursLocatives";

const ValeurLocativePDFDownload = lazy(() => import("./ValeurLocativePDFDownload"));
const today = () => new Date().toISOString().slice(0, 10);

function ligneS(nom = "", surface = 0, detail = ""): LigneSurface { return { id: uid(), nom, surface, detail }; }
function ligneE(label = "", valeur = ""): LigneEquipement { return { id: uid(), label, valeur }; }

function nouveauDoc(agentId?: string): ValeurLocative {
  return {
    id: uid(), statut: "Brouillon", agentId,
    titreBien: "", regimeLocatif: "Location longue durée meublée", mentionCouverture: "",
    adresse: "", commune: "Saint-Esprit", codePostal: "97270", sectionCadastrale: "", parcelle: "",
    mandantNom: "", mandantVille: "", agenceNom: "Casa Caraïbes SARL", agenceMention: "Agence Immobilière — Martinique",
    dateDocument: today(), lieuSignature: "FORT-DE-FRANCE", dateSignature: today(),
    referencesAgence: REFERENCES_AGENCE_DEFAUT,
    superficieTerrain: 0, zonagePlu: "", natureBien: "", surfaceShon: 0, empriseSol: 0, descriptionBien: "",
    pieces: [ligneS("Séjour"), ligneS("Cuisine"), ligneS("Chambre 1"), ligneS("Salle de bain")],
    exterieurs: [ligneS("Terrasse"), ligneS("Piscine et plage")],
    noteSurfaces: "",
    equipements: [ligneE("Construction"), ligneE("Façades"), ligneE("Toiture"), ligneE("Menuiseries"), ligneE("Ameublement"), ligneE("Piscine"), ligneE("Vue"), ligneE("Terrain"), ligneE("Stationnement")],
    localisation: "", atouts: ["", "", ""],
    analyseMarche: analyseMarcheDefaut("Location longue durée meublée"),
    loyerMensuelHc: 0, syntheseLoyer: "", vigilance: "", mentionPrevisionnelle: "",
    disclaimer: DISCLAIMER_DEFAUT,
  };
}

const STEPS = [{ id: 1, label: "Couverture" }, { id: 2, label: "Bien" }, { id: 3, label: "Marché & loyer" }];

function Editor({ initial, onSave, onBack }: { initial: ValeurLocative; onSave: (d: ValeurLocative) => void; onBack: () => void }) {
  const [e, setE] = useState<ValeurLocative>(initial);
  const [step, setStep] = useState(1);
  const upd = useCallback(<K extends keyof ValeurLocative>(k: K, v: ValeurLocative[K]) => { setE((p) => ({ ...p, [k]: v })); }, []);
  const setRegime = (regime: string) => {
    setE((p) => {
      let eqs = p.equipements;
      const hasAmeublement = eqs.some((x) => /ameublement/i.test(x.label));
      if (!estMeuble(regime)) {
        eqs = eqs.filter((x) => !/ameublement/i.test(x.label) || x.valeur.trim());
        if (!eqs.some((x) => /non meubl/i.test(x.label) || x.label === "Occupation")) {
          eqs = [...eqs, ligneE("Occupation", "Logement proposé non meublé (location nue)")];
        }
      } else if (!hasAmeublement) {
        eqs = [...eqs.filter((x) => x.label !== "Occupation" && !/non meubl/i.test(x.label)), ligneE("Ameublement", "")];
      }
      return { ...p, regimeLocatif: regime, analyseMarche: estAnalyseParDefaut(p.analyseMarche) ? analyseMarcheDefaut(regime) : p.analyseMarche, equipements: eqs };
    });
  };
  useEffect(() => { const t = setTimeout(() => onSave(e), 1500); return () => clearTimeout(t); }, [e, onSave]);
  const setPiece = (i: number, patch: Partial<LigneSurface>) => upd("pieces", e.pieces.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const setExt = (i: number, patch: Partial<LigneSurface>) => upd("exterieurs", e.exterieurs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const setEq = (i: number, patch: Partial<LigneEquipement>) => upd("equipements", e.equipements.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  return (
    <div className="mx-auto max-w-[860px] px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button className="btn-ghost text-[13px]" onClick={onBack}><ChevronLeft size={14} /> Retour</button>
        <div className="flex gap-2">
          {e.loyerMensuelHc > 0 && <Suspense fallback={null}><ValeurLocativePDFDownload doc={e} /></Suspense>}
          <button className="btn-ghost text-[13px]" onClick={() => { upd("statut", "Brouillon"); onSave({ ...e, statut: "Brouillon" }); }}>Enregistrer</button>
          <button className="btn-primary text-[13px]" onClick={() => { const n = { ...e, statut: "Finalisée" as const }; setE(n); onSave(n); onBack(); }}>Finaliser</button>
        </div>
      </div>
      <div className="mb-5 flex gap-2">
        {STEPS.map((st) => (
          <button key={st.id} className={`rounded-full px-3 py-1 text-[12px] ${step === st.id ? "bg-primary text-white" : "bg-surface border border-line text-ink-sub"}`} onClick={() => setStep(st.id)}>{st.id}. {st.label}</button>
        ))}
      </div>
      {step === 1 && (<>
        <Grid2>
          <Field label="Titre du bien (couverture)"><Input value={e.titreBien} onChange={(ev) => upd("titreBien", ev.target.value)} placeholder="Bungalow neuf avec piscine privative" /></Field>
          <Field label="Régime locatif"><Select value={e.regimeLocatif} onChange={setRegime} options={REGIMES_LOCATIFS} /></Field>
        </Grid2>
        <Field label="Mention sous l'adresse"><Input value={e.mentionCouverture} onChange={(ev) => upd("mentionCouverture", ev.target.value)} /></Field>
        <Grid2>
          <Field label="Adresse / quartier"><Input value={e.adresse} onChange={(ev) => upd("adresse", ev.target.value)} /></Field>
          <Field label="Commune"><Select value={e.commune} onChange={(v) => upd("commune", v)} options={COMMUNES_MARTINIQUE} /></Field>
          <Field label="Code postal"><Input value={e.codePostal} onChange={(ev) => upd("codePostal", ev.target.value)} /></Field>
          <Field label="Section cadastrale"><Input value={e.sectionCadastrale} onChange={(ev) => upd("sectionCadastrale", ev.target.value)} /></Field>
          <Field label="Parcelle"><Input value={e.parcelle} onChange={(ev) => upd("parcelle", ev.target.value)} /></Field>
        </Grid2>
        <Grid2>
          <Field label="Mandant"><Input value={e.mandantNom} onChange={(ev) => upd("mandantNom", ev.target.value)} /></Field>
          <Field label="Ville du mandant"><Input value={e.mandantVille} onChange={(ev) => upd("mandantVille", ev.target.value)} /></Field>
        </Grid2>
        <Grid2>
          <Field label="Date du document"><Input type="date" value={e.dateDocument} onChange={(ev) => upd("dateDocument", ev.target.value)} /></Field>
          <Field label="Date de signature"><Input type="date" value={e.dateSignature} onChange={(ev) => upd("dateSignature", ev.target.value)} /></Field>
          <Field label="Lieu de signature"><Input value={e.lieuSignature} onChange={(ev) => upd("lieuSignature", ev.target.value)} /></Field>
        </Grid2>
        <Field label="Références de l'agence (§1)"><Textarea rows={6} value={e.referencesAgence} onChange={(ev) => upd("referencesAgence", ev.target.value)} /></Field>
      </>)}
      {step === 2 && (<>
        <Grid2>
          <Field label="Superficie terrain (m²)"><Input type="number" value={e.superficieTerrain || ""} onChange={(ev) => upd("superficieTerrain", Number(ev.target.value))} /></Field>
          <Field label="Zonage PLU"><Input value={e.zonagePlu} onChange={(ev) => upd("zonagePlu", ev.target.value)} /></Field>
          <Field label="Surface SHON (m²)"><Input type="number" step="0.01" value={e.surfaceShon || ""} onChange={(ev) => upd("surfaceShon", Number(ev.target.value))} /></Field>
          <Field label="Emprise au sol (m²)"><Input type="number" step="0.01" value={e.empriseSol || ""} onChange={(ev) => upd("empriseSol", Number(ev.target.value))} /></Field>
        </Grid2>
        <Field label="Nature du bien"><Input value={e.natureBien} onChange={(ev) => upd("natureBien", ev.target.value)} /></Field>
        <Field label="Description (§3)"><Textarea rows={7} value={e.descriptionBien} onChange={(ev) => upd("descriptionBien", ev.target.value)} /></Field>
        <h3 className="mb-2 mt-4 text-[13px] font-semibold text-ink">Composition des pièces</h3>
        {e.pieces.map((p, i) => (
          <div key={p.id} className="mb-2 grid grid-cols-[1fr_90px_1fr_28px] gap-2">
            <Input value={p.nom} placeholder="Pièce" onChange={(ev) => setPiece(i, { nom: ev.target.value })} />
            <Input type="number" step="0.01" value={p.surface || ""} placeholder="m²" onChange={(ev) => setPiece(i, { surface: Number(ev.target.value) })} />
            <Input value={p.detail} placeholder="Détail" onChange={(ev) => setPiece(i, { detail: ev.target.value })} />
            <button className="btn-ghost px-1 text-danger" onClick={() => upd("pieces", e.pieces.filter((_, idx) => idx !== i))}>×</button>
          </div>
        ))}
        <button className="btn-ghost mb-4 text-[12px]" onClick={() => upd("pieces", [...e.pieces, ligneS()])}><Plus size={12} /> Pièce</button>
        <h3 className="mb-2 text-[13px] font-semibold text-ink">Extérieurs</h3>
        {e.exterieurs.map((p, i) => (
          <div key={p.id} className="mb-2 grid grid-cols-[1fr_90px_1fr_28px] gap-2">
            <Input value={p.nom} placeholder="Extérieur" onChange={(ev) => setExt(i, { nom: ev.target.value })} />
            <Input type="number" step="0.01" value={p.surface || ""} placeholder="m²" onChange={(ev) => setExt(i, { surface: Number(ev.target.value) })} />
            <Input value={p.detail} placeholder="Détail" onChange={(ev) => setExt(i, { detail: ev.target.value })} />
            <button className="btn-ghost px-1 text-danger" onClick={() => upd("exterieurs", e.exterieurs.filter((_, idx) => idx !== i))}>×</button>
          </div>
        ))}
        <button className="btn-ghost mb-4 text-[12px]" onClick={() => upd("exterieurs", [...e.exterieurs, ligneS()])}><Plus size={12} /> Extérieur</button>
        <Field label="Note sous les surfaces"><Textarea rows={2} value={e.noteSurfaces} onChange={(ev) => upd("noteSurfaces", ev.target.value)} /></Field>
        <h3 className="mb-2 text-[13px] font-semibold text-ink">Équipements</h3>
        {e.equipements.map((eq, i) => (
          <div key={eq.id} className="mb-2 grid grid-cols-[180px_1fr_28px] gap-2">
            <Input value={eq.label} onChange={(ev) => setEq(i, { label: ev.target.value })} />
            <Input value={eq.valeur} onChange={(ev) => setEq(i, { valeur: ev.target.value })} />
            <button className="btn-ghost px-1 text-danger" onClick={() => upd("equipements", e.equipements.filter((_, idx) => idx !== i))}>×</button>
          </div>
        ))}
        <button className="btn-ghost mb-4 text-[12px]" onClick={() => upd("equipements", [...e.equipements, ligneE()])}><Plus size={12} /> Ligne</button>
        <Field label="Localisation (§4)"><Textarea rows={6} value={e.localisation} onChange={(ev) => upd("localisation", ev.target.value)} /></Field>
        <h3 className="mb-2 text-[13px] font-semibold text-ink">Atouts</h3>
        {e.atouts.map((a, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <Input value={a} onChange={(ev) => upd("atouts", e.atouts.map((x, idx) => (idx === i ? ev.target.value : x)))} />
            <button className="btn-ghost px-1 text-danger" onClick={() => upd("atouts", e.atouts.filter((_, idx) => idx !== i))}>×</button>
          </div>
        ))}
        <button className="btn-ghost text-[12px]" onClick={() => upd("atouts", [...e.atouts, ""])}><Plus size={12} /> Atout</button>
      </>)}
      {step === 3 && (<>
        <Field label="Analyse de marché (§5)"><Textarea rows={8} value={e.analyseMarche} onChange={(ev) => upd("analyseMarche", ev.target.value)} /></Field>
        <Grid2>
          <Field label={libelleLoyer(e.regimeLocatif)}><Input type="number" value={e.loyerMensuelHc || ""} onChange={(ev) => upd("loyerMensuelHc", Number(ev.target.value))} /></Field>
          <Field label="Revenus bruts annuels"><Input readOnly value={e.loyerMensuelHc ? eur(loyerAnnuel(e.loyerMensuelHc)) : "—"} /></Field>
        </Grid2>
        <Field label="Ligne sous le montant"><Input value={e.syntheseLoyer} onChange={(ev) => upd("syntheseLoyer", ev.target.value)} /></Field>
        <Field label="Points de vigilance et décote"><Textarea rows={6} value={e.vigilance} onChange={(ev) => upd("vigilance", ev.target.value)} /></Field>
        <Field label="Mention prévisionnelle"><Textarea rows={3} value={e.mentionPrevisionnelle} onChange={(ev) => upd("mentionPrevisionnelle", ev.target.value)} /></Field>
        <Field label="Clause signatures"><Textarea rows={4} value={e.disclaimer} onChange={(ev) => upd("disclaimer", ev.target.value)} /></Field>
      </>)}
      <div className="mt-6 flex justify-between">
        <button className="btn-ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}><ChevronLeft size={14} /> Précédent</button>
        <button className="btn-primary" disabled={step === 3} onClick={() => setStep((s) => s + 1)}>Suivant <ChevronRight size={14} /></button>
      </div>
    </div>
  );
}

export function ValeurLocativeView() {
  const user = useSessionStore((s) => s.user);
  const { data: list, isLoading, error } = useValeursLocatives();
  const saveMut = useSaveValeurLocative();
  const delMut = useDeleteValeurLocative();
  const migrate = useMigrateLocalValeursLocatives();
  const migrated = useRef(false);
  const [editing, setEditing] = useState<ValeurLocative | null>(null);

  useEffect(() => {
    if (!user || migrated.current) return;
    migrated.current = true;
    migrate.mutate(undefined, { onError: () => { migrated.current = false; } });
  }, [user, migrate]);

  const handleSave = useCallback((d: ValeurLocative) => {
    saveMut.mutate(d, { onError: (err) => alert("Sauvegarde impossible : " + String(err)) });
  }, [saveMut]);

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer cette estimation locative ?")) return;
    delMut.mutate(id, { onError: (err) => alert("Suppression impossible : " + String(err)) });
  };

  if (editing) return <Editor initial={editing} onBack={() => setEditing(null)} onSave={handleSave} />;
  return (
    <div className="mx-auto max-w-[900px] px-6 py-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Estimations de valeur locative</h1>
          <p className="text-[13px] text-ink-muted">{list.length} document(s) — PDF et Word au format Casa Caraïbes</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing(nouveauDoc(user?.id))}><Plus size={14} /> Nouvelle estimation locative</button>
      </div>
      {error ? (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-[13px] text-danger">
          Impossible de charger les valeurs locatives. Vérifiez la table <code>valeurs_locatives</code> (migration 011).
        </div>
      ) : null}
      {isLoading ? (
        <div className="py-12 text-center text-ink-muted">Chargement…</div>
      ) : list.length === 0 ? (
        <EmptyState Icon={Home} text="Aucune estimation locative" sub="Créez un document comme l'estimation CAROLE." />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((est) => (
            <div key={est.id} className="card p-4">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-heading text-[15px] font-semibold text-ink">{est.titreBien || est.adresse || "Sans titre"}</span>
                    <StatusPill label={est.statut} tone={est.statut === "Finalisée" ? "emerald" : "amber"} />
                  </div>
                  <div className="text-[12.5px] text-ink-sub">{est.regimeLocatif} · {est.commune}</div>
                  <div className="text-[12px] text-ink-muted">Mandant : {est.mandantNom || "—"}{est.surfaceShon > 0 && ` · ${est.surfaceShon} m² SHON`}{est.dateDocument && ` · ${est.dateDocument}`}</div>
                </div>
                <div className="shrink-0 text-right">
                  {est.loyerMensuelHc > 0 && (<><div className="font-heading text-lg font-bold text-primary">{eur(est.loyerMensuelHc)} / mois HC</div><div className="text-[11.5px] text-ink-muted">{eur(loyerAnnuel(est.loyerMensuelHc))} / an</div></>)}
                </div>
              </div>
              <div className="mt-3 flex gap-2 border-t border-line pt-3">
                <button className="btn-ghost text-[12px]" onClick={() => setEditing(est)}><Edit2 size={13} /> Modifier</button>
                {est.loyerMensuelHc > 0 && <Suspense fallback={<button className="btn-ghost text-[12px] opacity-60"><Download size={13} /> PDF…</button>}><ValeurLocativePDFDownload doc={est} /></Suspense>}
                <button className="btn-ghost text-[12px] text-danger hover:bg-danger-soft" onClick={() => handleDelete(est.id)}><Trash2 size={13} /> Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
