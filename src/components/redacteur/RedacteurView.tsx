import { useState, Suspense, lazy, useCallback } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, Lock, FileDown } from "lucide-react";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { mandatVenteFullSchema, calcMandatVente, type MandatVenteFull, type Mandant } from "../../schemas/redacteur/mandatVenteFull.schema";
import { compromisVenteSchema, calcCompromis, type CompromisVente, type PartieCompromis } from "../../schemas/redacteur/compromisVente.schema";
import { COMMUNES_MARTINIQUE } from "../../schemas/enums";
import { eur } from "../../lib/format";

const MandatPDFDownload = lazy(() => import("./DocPDFDownloads").then(m => ({ default: m.MandatPDFDownload })));
const CompromisPDFDownload = lazy(() => import("./DocPDFDownloads").then(m => ({ default: m.CompromisPDFDownload })));

type DocType = "mandat" | "compromis";

const today = () => new Date().toISOString().slice(0, 10);

const newMandant = (): Mandant => ({ civilite: "M.", prenom: "", nom: "", dateNaissance: "", nationalite: "Française", adresse: "", codePostal: "", ville: "", pays: "FRANCE", tel: "", email: "", qualite: "Propriétaire" });
const newPartie = (): PartieCompromis => ({ civilite: "M.", prenom: "", nom: "", nationalite: "française", dateNaissance: "", lieuNaissance: "", adresse: "", codePostal: "", ville: "", etatCivil: "célibataire", email: "", tel: "" });

function defaultMandat(): MandatVenteFull {
  return {
    numero: `MV-${new Date().getFullYear()}-`,
    date: today(), lieu: "Fort-de-France",
    mandants: [newMandant()],
    residence: "", adresseBien: "", commune: "", codePostal: "", typeBien: "Appartement",
    surfaceTotale: 0, surfaceCarrez: 0, nbPieces: "", refCadastrale: "",
    descriptionBien: "", lots: "", infosCopro: "", nomsLots: "", syndic: "",
    chargesAnnuelles: 0, occupation: "Libre",
    prixFAI: 0, honorairesPct: 6, chargeHonoraires: "vendeur", tvaApplicable: true,
    typeMandat: "Semi-exclusif", dureeAns: 1, dateDebut: today(),
    avecApportDirect: true, avecSousMandat: false, avecInterAgence: true,
    redacteur: "M. Luc CLEMENTE",
  };
}

function defaultCompromis(): CompromisVente {
  return {
    date: today(), lieu: "Fort-de-France",
    vendeurs: [newPartie()], acquereurs: [newPartie()],
    typeBien: "Appartement", residence: "", adresseBien: "", quartier: "",
    commune: "", codePostal: "", numLot: "", surfaceCarrez: 0, surfaceTotale: 0,
    descriptionSurfaces: "", tantiemes: "", occupation: "résidence principale",
    nomCopro: "", numImmatCopro: "", nomSyndic: "", adresseSyndic: "",
    nbLotsCopro: 0, anneeConstruction: "", assureurCopro: "",
    diagnostiqueur: "", dateDDT: "", surfaceCarrezDDT: 0,
    classeDPE: "", anomaliesElec: "", etatTermites: "Absence", infoTermites: "",
    prixFAI: 0, honorairesTTC: 0, chargeHonoraires: "vendeur", sequestrePct: 5,
    typeFinancement: "Prêt bancaire", apportPersonnel: 0, montantPret: 0,
    tauxMaxPret: 4.5, dureePretMois: 300, banqueSollicitee: "", fraisNotaireEstimes: 0,
    dateReiterationMax: "", notaire: "", adresseNotaire: "",
    delaiPretJours: 60, delaiDepotDossierJours: 15,
    sommesDuesVendeur: 0, detailSommesDues: "", remboursementFondsTravaux: 0,
    travauxVotesRestants: 0, detailTravauxVotes: "",
    taxeFonciere: 0, anneeRef: String(new Date().getFullYear() - 1),
    redacteur: "M. Luc CLEMENTE", mandatRef: "",
  };
}

// ─── Formulaire Mandat ────────────────────────────────────────────────────────
const MANDAT_STEPS = ["Parties", "Bien", "Prix & Mandat", "Options"];

function MandatForm({ f, setF }: { f: MandatVenteFull; setF: (v: MandatVenteFull) => void }) {
  const [step, setStep] = useState(0);
  const { data } = useAgencyData();
  const upd = useCallback(<K extends keyof MandatVenteFull>(k: K, v: MandatVenteFull[K]) =>
    setF({ ...f, [k]: v }), [f, setF]);
  const updMandant = (i: number, k: keyof Mandant, v: string) =>
    setF({ ...f, mandants: f.mandants.map((m, j) => j === i ? { ...m, [k]: v } : m) });

  const c = calcMandatVente(f);
  const parsedOk = mandatVenteFullSchema.safeParse(f).success;

  // Pré-remplir depuis mandat CRM
  const prefillFromMandat = (mandatId: string) => {
    const mandat = data.mandats.find(m => m.id === mandatId);
    const bien = mandat ? data.biens.find(b => b.id === mandat.bienId || b.ref === mandat.bienId) : null;
    if (mandat) {
      setF({
        ...f,
        mandants: [{ ...newMandant(), nom: mandat.mandant.toUpperCase(), tel: mandat.tel || "", email: mandat.email || "" }],
        honorairesPct: mandat.honoraires || 6,
        dateDebut: mandat.dateDebut || today(),
        prixFAI: bien?.prix || 0,
        adresseBien: bien?.adresse || "",
        commune: bien?.commune || "",
        typeBien: bien?.type || "Appartement",
        surfaceTotale: bien?.surface || 0,
        descriptionBien: bien?.desc || "",
      });
    }
  };

  return (
    <div>
      {/* Step nav */}
      <div className="mb-5 flex gap-1">
        {MANDAT_STEPS.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`flex-1 rounded py-2 text-[12px] font-medium transition-colors ${step === i ? "bg-primary text-white" : "bg-line text-ink-sub hover:bg-line2"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Étape 0 — Parties */}
      {step === 0 && (
        <div>
          {data.mandats.length > 0 && (
            <div className="card mb-4 border-l-4 border-l-primary bg-primary-soft p-3.5">
              <div className="mb-1.5 text-[12px] font-semibold text-primary">🔗 Pré-remplir depuis un mandat CRM</div>
              <select className="w-full rounded border border-line2 bg-white px-3 py-2 text-[13px]"
                onChange={e => prefillFromMandat(e.target.value)} defaultValue="">
                <option value="">— Sélectionner un mandat —</option>
                {data.mandats.map(m => <option key={m.id} value={m.id}>{m.ref} — {m.mandant}</option>)}
              </select>
            </div>
          )}
          {f.mandants.map((m, i) => (
            <div key={i} className={`card p-4 mb-3 ${i > 0 ? "border-l-4 border-l-primary/30" : ""}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wide text-ink-muted">Mandant {f.mandants.length > 1 ? i + 1 : ""}</span>
                {i > 0 && <button onClick={() => setF({ ...f, mandants: f.mandants.filter((_, j) => j !== i) })} className="text-danger hover:bg-danger-soft rounded p-1"><Trash2 size={13} /></button>}
              </div>
              <Grid2>
                <Field label="Civilité"><Select value={m.civilite} onChange={v => updMandant(i, "civilite", v)} options={["M.", "Mme", "M. et Mme"]} /></Field>
                <Field label="Prénom"><Input value={m.prenom} onChange={e => updMandant(i, "prenom", e.target.value)} /></Field>
                <Field label="Nom"><Input value={m.nom} onChange={e => updMandant(i, "nom", e.target.value)} /></Field>
                <Field label="Date de naissance"><Input type="date" value={m.dateNaissance} onChange={e => updMandant(i, "dateNaissance", e.target.value)} /></Field>
                <Field label="Nationalité"><Input value={m.nationalite} onChange={e => updMandant(i, "nationalite", e.target.value)} /></Field>
                <Field label="Qualité"><Input value={m.qualite} onChange={e => updMandant(i, "qualite", e.target.value)} /></Field>
              </Grid2>
              <Field label="Adresse"><Input value={m.adresse} onChange={e => updMandant(i, "adresse", e.target.value)} /></Field>
              <Grid2>
                <Field label="Code postal"><Input value={m.codePostal} onChange={e => updMandant(i, "codePostal", e.target.value)} /></Field>
                <Field label="Ville"><Input value={m.ville} onChange={e => updMandant(i, "ville", e.target.value)} /></Field>
                <Field label="Téléphone"><Input value={m.tel} onChange={e => updMandant(i, "tel", e.target.value)} /></Field>
                <Field label="Email"><Input type="email" value={m.email} onChange={e => updMandant(i, "email", e.target.value)} /></Field>
              </Grid2>
            </div>
          ))}
          <button className="btn-ghost text-[12px]" onClick={() => setF({ ...f, mandants: [...f.mandants, newMandant()] })}>
            <Plus size={13} /> Ajouter un co-mandant
          </button>
          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Infos du mandat</div>
            <Grid2>
              <Field label="N° du mandat"><Input value={f.numero} onChange={e => upd("numero", e.target.value)} placeholder="MV-2026-001" /></Field>
              <Field label="Date du mandat"><Input type="date" value={f.date} onChange={e => upd("date", e.target.value)} /></Field>
              <Field label="Lieu"><Input value={f.lieu} onChange={e => upd("lieu", e.target.value)} /></Field>
              <Field label="Rédacteur"><Input value={f.redacteur} onChange={e => upd("redacteur", e.target.value)} /></Field>
            </Grid2>
          </div>
        </div>
      )}

      {/* Étape 1 — Bien */}
      {step === 1 && (
        <div>
          <Grid2>
            <Field label="Type de bien"><Input value={f.typeBien} onChange={e => upd("typeBien", e.target.value)} placeholder="Appartement, Maison…" /></Field>
            <Field label="Résidence / Lotissement"><Input value={f.residence} onChange={e => upd("residence", e.target.value)} placeholder="Résidence ALTICA" /></Field>
            <Field label="Adresse du bien"><Input value={f.adresseBien} onChange={e => upd("adresseBien", e.target.value)} /></Field>
            <Field label="Commune"><Select value={f.commune} onChange={v => upd("commune", v)} options={[...COMMUNES_MARTINIQUE]} /></Field>
            <Field label="Code postal"><Input value={f.codePostal} onChange={e => upd("codePostal", e.target.value)} /></Field>
            <Field label="Réf. cadastrale"><Input value={f.refCadastrale} onChange={e => upd("refCadastrale", e.target.value)} placeholder="Section C, N° 1952" /></Field>
            <Field label="Surface totale (m²)"><Input type="number" value={String(f.surfaceTotale || "")} onChange={e => upd("surfaceTotale", +e.target.value)} /></Field>
            <Field label="Surface Carrez (m²)"><Input type="number" value={String(f.surfaceCarrez || "")} onChange={e => upd("surfaceCarrez", +e.target.value)} /></Field>
            <Field label="Nombre de pièces"><Input value={f.nbPieces} onChange={e => upd("nbPieces", e.target.value)} placeholder="3 pièces (T3)" /></Field>
            <Field label="Occupation"><Select value={f.occupation} onChange={v => upd("occupation", v as MandatVenteFull["occupation"])} options={["Libre", "Occupé"]} /></Field>
          </Grid2>
          <Field label="Description du bien">
            <Textarea rows={4} value={f.descriptionBien} onChange={e => upd("descriptionBien", e.target.value)} placeholder="" />
          </Field>
          <Field label="Désignation des lots (copropriété)">
            <Textarea rows={3} value={f.lots} onChange={e => upd("lots", e.target.value)} placeholder="Lot 43 : appartement T3 au 1er étage…" />
          </Field>
          <Grid2>
            <Field label="Syndic"><Input value={f.syndic} onChange={e => upd("syndic", e.target.value)} /></Field>
            <Field label="Charges annuelles (€)"><Input type="number" value={String(f.chargesAnnuelles || "")} onChange={e => upd("chargesAnnuelles", +e.target.value)} /></Field>
            <Field label="N° des lots"><Input value={f.nomsLots} onChange={e => upd("nomsLots", e.target.value)} placeholder="Lot 36, 43, 92" /></Field>
          </Grid2>
        </div>
      )}

      {/* Étape 2 — Prix & Mandat */}
      {step === 2 && (
        <div>
          <Grid2>
            <Field label="Prix FAI (€)"><Input type="number" value={String(f.prixFAI || "")} onChange={e => upd("prixFAI", +e.target.value)} /></Field>
            <Field label="Honoraires (%)"><Input type="number" value={String(f.honorairesPct)} onChange={e => upd("honorairesPct", +e.target.value)} /></Field>
            <Field label="Charge honoraires"><Select value={f.chargeHonoraires} onChange={v => upd("chargeHonoraires", v as MandatVenteFull["chargeHonoraires"])} options={["vendeur", "acquéreur"]} /></Field>
            <Field label="TVA DOM 8,5%"><Select value={f.tvaApplicable ? "oui" : "non"} onChange={v => upd("tvaApplicable", v === "oui")} options={["oui", "non"]} /></Field>
          </Grid2>
          {f.prixFAI > 0 && (
            <div className="card border-l-4 border-l-primary bg-primary-soft p-4 my-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><div className="text-[10px] text-primary font-bold uppercase mb-1">Prix FAI</div><div className="font-heading text-base font-bold text-primary">{eur(f.prixFAI)}</div></div>
                <div><div className="text-[10px] text-primary font-bold uppercase mb-1">Honoraires TTC</div><div className="font-heading text-base font-bold text-primary">{eur(c.honorairesTTC)}</div></div>
                <div><div className="text-[10px] text-primary font-bold uppercase mb-1">Net vendeur</div><div className="font-heading text-base font-bold text-primary">{eur(c.prixNetVendeur)}</div></div>
              </div>
              {f.avecApportDirect && c.honoReduit > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-primary/20 text-center text-[12px] text-primary">
                  Clause apport direct : honoraires réduits à <b>{eur(c.honoReduit)}</b> ({c.pctReduit}%)
                </div>
              )}
            </div>
          )}
          <Grid2>
            <Field label="Type de mandat"><Select value={f.typeMandat} onChange={v => upd("typeMandat", v as MandatVenteFull["typeMandat"])} options={["Exclusif", "Semi-exclusif", "Simple"]} /></Field>
            <Field label="Durée (ans)"><Input type="number" value={String(f.dureeAns)} onChange={e => upd("dureeAns", +e.target.value)} /></Field>
            <Field label="Date de prise d'effet"><Input type="date" value={f.dateDebut} onChange={e => upd("dateDebut", e.target.value)} /></Field>
          </Grid2>
        </div>
      )}

      {/* Étape 3 — Options */}
      {step === 3 && (
        <div className="space-y-3">
          {[
            ["avecApportDirect", "Clause apport direct (honoraires /2 si acquéreur présenté par le vendeur)"],
            ["avecSousMandat", "Autoriser le sous-mandat"],
            ["avecInterAgence", "Autoriser l'inter-agence"],
          ].map(([k, lbl]) => (
            <label key={k} className="card flex cursor-pointer items-center gap-3 p-3.5">
              <input type="checkbox" checked={Boolean(f[k as keyof MandatVenteFull])} onChange={e => upd(k as keyof MandatVenteFull, e.target.checked as never)} className="size-4 accent-primary" />
              <span className="text-[13.5px] text-ink">{lbl}</span>
            </label>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <button className="btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft size={14} /> Précédent</button>
        <div className="flex items-center gap-3">
          {step < MANDAT_STEPS.length - 1
            ? <button className="btn-primary" onClick={() => setStep(s => s + 1)}>Suivant <ChevronRight size={14} /></button>
            : parsedOk
              ? <Suspense fallback={<button className="btn-primary opacity-60"><FileDown size={14} /> Préparation…</button>}><MandatPDFDownload f={f} /></Suspense>
              : <button className="btn-ghost opacity-60 cursor-not-allowed"><Lock size={14} /> Compléter les champs requis</button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Formulaire Compromis ─────────────────────────────────────────────────────
const COMPROMIS_STEPS = ["Parties", "Bien", "Prix & Finances", "Délais & Notaire", "Copropriété"];

function PartieForm({ p, onChange, label }: { p: PartieCompromis; onChange: (k: keyof PartieCompromis, v: string) => void; label: string }) {
  return (
    <div className="card p-4 mb-3">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</div>
      <Grid2>
        <Field label="Civilité"><Select value={p.civilite} onChange={v => onChange("civilite", v)} options={["M.", "Mme", "M. et Mme"]} /></Field>
        <Field label="Prénom"><Input value={p.prenom} onChange={e => onChange("prenom", e.target.value)} /></Field>
        <Field label="Nom"><Input value={p.nom} onChange={e => onChange("nom", e.target.value)} /></Field>
        <Field label="Nationalité"><Input value={p.nationalite} onChange={e => onChange("nationalite", e.target.value)} /></Field>
        <Field label="Date de naissance"><Input type="date" value={p.dateNaissance} onChange={e => onChange("dateNaissance", e.target.value)} /></Field>
        <Field label="Lieu de naissance"><Input value={p.lieuNaissance} onChange={e => onChange("lieuNaissance", e.target.value)} /></Field>
        <Field label="État civil"><Select value={p.etatCivil} onChange={v => onChange("etatCivil", v)} options={["célibataire", "marié(e)", "divorcé(e)", "veuf/veuve", "pacsé(e)"]} /></Field>
      </Grid2>
      <Field label="Adresse"><Input value={p.adresse} onChange={e => onChange("adresse", e.target.value)} /></Field>
      <Grid2>
        <Field label="Code postal"><Input value={p.codePostal} onChange={e => onChange("codePostal", e.target.value)} /></Field>
        <Field label="Ville"><Input value={p.ville} onChange={e => onChange("ville", e.target.value)} /></Field>
        <Field label="Téléphone"><Input value={p.tel} onChange={e => onChange("tel", e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={p.email} onChange={e => onChange("email", e.target.value)} /></Field>
      </Grid2>
    </div>
  );
}

function CompromisForm({ f, setF }: { f: CompromisVente; setF: (v: CompromisVente) => void }) {
  const [step, setStep] = useState(0);
  const { data } = useAgencyData();
  const upd = useCallback(<K extends keyof CompromisVente>(k: K, v: CompromisVente[K]) =>
    setF({ ...f, [k]: v }), [f, setF]);
  const updV = (i: number, k: keyof PartieCompromis, v: string) =>
    setF({ ...f, vendeurs: f.vendeurs.map((p, j) => j === i ? { ...p, [k]: v } : p) });
  const updA = (i: number, k: keyof PartieCompromis, v: string) =>
    setF({ ...f, acquereurs: f.acquereurs.map((p, j) => j === i ? { ...p, [k]: v } : p) });

  const c = calcCompromis(f);
  const parsedOk = compromisVenteSchema.safeParse(f).success;

  // Pré-remplir depuis compromis CRM
  const prefillFromCompromis = (compId: string) => {
    const comp = data.compromis.find(c => c.id === compId);
    if (!comp) return;
    setF({
      ...f,
      prixFAI: comp.prixVente || 0,
      honorairesTTC: comp.honoraires && comp.prixVente ? Math.round(comp.prixVente * comp.honoraires / 100) : 0,
      mandatRef: comp.ref || "",
      notaire: comp.notaire || "",
      vendeurs: [{ ...newPartie(), nom: comp.vendeur?.toUpperCase() || "" }],
      acquereurs: [{ ...newPartie(), nom: comp.acheteur?.toUpperCase() || "" }],
    });
  };

  return (
    <div>
      <div className="mb-5 flex gap-1">
        {COMPROMIS_STEPS.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`flex-1 rounded py-1.5 text-[11px] font-medium transition-colors ${step === i ? "bg-primary text-white" : "bg-line text-ink-sub hover:bg-line2"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Étape 0 — Parties */}
      {step === 0 && (
        <div>
          {data.compromis.length > 0 && (
            <div className="card mb-4 border-l-4 border-l-primary bg-primary-soft p-3.5">
              <div className="mb-1.5 text-[12px] font-semibold text-primary">🔗 Pré-remplir depuis un dossier CRM</div>
              <select className="w-full rounded border border-line2 bg-white px-3 py-2 text-[13px]"
                onChange={e => prefillFromCompromis(e.target.value)} defaultValue="">
                <option value="">— Sélectionner un dossier —</option>
                {data.compromis.map(c => <option key={c.id} value={c.id}>{c.ref || c.id} — {c.acheteur} / {c.vendeur}</option>)}
              </select>
            </div>
          )}
          <Grid2>
            <Field label="Date du compromis"><Input type="date" value={f.date} onChange={e => upd("date", e.target.value)} /></Field>
            <Field label="Lieu"><Input value={f.lieu} onChange={e => upd("lieu", e.target.value)} /></Field>
            <Field label="Rédacteur"><Input value={f.redacteur} onChange={e => upd("redacteur", e.target.value)} /></Field>
            <Field label="N° mandat de vente"><Input value={f.mandatRef} onChange={e => upd("mandatRef", e.target.value)} placeholder="MV-2026-XXX" /></Field>
          </Grid2>
          {f.vendeurs.map((v, i) => <PartieForm key={i} p={v} label={`Vendeur ${f.vendeurs.length > 1 ? i + 1 : ""}`} onChange={(k, val) => updV(i, k, val)} />)}
          <button className="btn-ghost text-[12px] mb-3" onClick={() => setF({ ...f, vendeurs: [...f.vendeurs, newPartie()] })}><Plus size={13} /> Co-vendeur</button>
          {f.acquereurs.map((a, i) => <PartieForm key={i} p={a} label={`Acquéreur ${f.acquereurs.length > 1 ? i + 1 : ""}`} onChange={(k, val) => updA(i, k, val)} />)}
          <button className="btn-ghost text-[12px]" onClick={() => setF({ ...f, acquereurs: [...f.acquereurs, newPartie()] })}><Plus size={13} /> Co-acquéreur</button>
        </div>
      )}

      {/* Étape 1 — Bien */}
      {step === 1 && (
        <div>
          <Grid2>
            <Field label="Type de bien"><Input value={f.typeBien} onChange={e => upd("typeBien", e.target.value)} /></Field>
            <Field label="Résidence"><Input value={f.residence} onChange={e => upd("residence", e.target.value)} /></Field>
            <Field label="Adresse"><Input value={f.adresseBien} onChange={e => upd("adresseBien", e.target.value)} /></Field>
            <Field label="Quartier"><Input value={f.quartier} onChange={e => upd("quartier", e.target.value)} /></Field>
            <Field label="Commune"><Select value={f.commune} onChange={v => upd("commune", v)} options={[...COMMUNES_MARTINIQUE]} /></Field>
            <Field label="Code postal"><Input value={f.codePostal} onChange={e => upd("codePostal", e.target.value)} /></Field>
            <Field label="N° de lot"><Input value={f.numLot} onChange={e => upd("numLot", e.target.value)} /></Field>
            <Field label="Tantièmes"><Input value={f.tantiemes} onChange={e => upd("tantiemes", e.target.value)} placeholder="413/10 000 èmes" /></Field>
            <Field label="Surface Carrez (m²)"><Input type="number" value={String(f.surfaceCarrez || "")} onChange={e => upd("surfaceCarrez", +e.target.value)} /></Field>
            <Field label="Surface totale (m²)"><Input type="number" value={String(f.surfaceTotale || "")} onChange={e => upd("surfaceTotale", +e.target.value)} /></Field>
            <Field label="Occupation"><Select value={f.occupation} onChange={v => upd("occupation", v as CompromisVente["occupation"])} options={["résidence principale", "résidence secondaire", "bien locatif", "bien libre"]} /></Field>
          </Grid2>
          <Field label="Composition détaillée (pièce par pièce)">
            <Textarea rows={4} value={f.descriptionSurfaces} onChange={e => upd("descriptionSurfaces", e.target.value)} placeholder="" />
          </Field>
          <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-2">Copropriété</div>
          <Grid2>
            <Field label="Nom copropriété"><Input value={f.nomCopro} onChange={e => upd("nomCopro", e.target.value)} /></Field>
            <Field label="N° immatriculation"><Input value={f.numImmatCopro} onChange={e => upd("numImmatCopro", e.target.value)} /></Field>
            <Field label="Syndic"><Input value={f.nomSyndic} onChange={e => upd("nomSyndic", e.target.value)} /></Field>
            <Field label="Nb lots"><Input type="number" value={String(f.nbLotsCopro || "")} onChange={e => upd("nbLotsCopro", +e.target.value)} /></Field>
            <Field label="Année construction"><Input value={f.anneeConstruction} onChange={e => upd("anneeConstruction", e.target.value)} /></Field>
          </Grid2>
          <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-2">DDT</div>
          <Grid2>
            <Field label="Diagnostiqueur"><Input value={f.diagnostiqueur} onChange={e => upd("diagnostiqueur", e.target.value)} /></Field>
            <Field label="Date DDT"><Input type="date" value={f.dateDDT} onChange={e => upd("dateDDT", e.target.value)} /></Field>
            <Field label="Surface Carrez DDT"><Input type="number" value={String(f.surfaceCarrezDDT || "")} onChange={e => upd("surfaceCarrezDDT", +e.target.value)} /></Field>
            <Field label="Classe DPE"><Input value={f.classeDPE} onChange={e => upd("classeDPE", e.target.value)} placeholder="C" /></Field>
            <Field label="État termites"><Select value={f.etatTermites} onChange={v => upd("etatTermites", v as CompromisVente["etatTermites"])} options={["Absence", "Présence"]} /></Field>
          </Grid2>
          {f.etatTermites === "Présence" && <Field label="Détail termites"><Textarea rows={2} value={f.infoTermites} onChange={e => upd("infoTermites", e.target.value)} /></Field>}
          <Field label="Anomalies électriques (si présentes)"><Textarea rows={2} value={f.anomaliesElec} onChange={e => upd("anomaliesElec", e.target.value)} /></Field>
        </div>
      )}

      {/* Étape 2 — Prix & Finances */}
      {step === 2 && (
        <div>
          <Grid2>
            <Field label="Prix de vente FAI (€)"><Input type="number" value={String(f.prixFAI || "")} onChange={e => upd("prixFAI", +e.target.value)} /></Field>
            <Field label="Honoraires TTC (€)"><Input type="number" value={String(f.honorairesTTC || "")} onChange={e => upd("honorairesTTC", +e.target.value)} /></Field>
            <Field label="Charge honoraires"><Select value={f.chargeHonoraires} onChange={v => upd("chargeHonoraires", v as CompromisVente["chargeHonoraires"])} options={["vendeur", "acquéreur"]} /></Field>
            <Field label="Séquestre (%)"><Input type="number" value={String(f.sequestrePct)} onChange={e => upd("sequestrePct", +e.target.value)} /></Field>
          </Grid2>
          {f.prixFAI > 0 && (
            <div className="card border-l-4 border-l-primary bg-primary-soft p-4 my-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><div className="text-[10px] text-primary font-bold uppercase mb-1">Net vendeur</div><div className="font-heading text-base font-bold text-primary">{eur(c.prixNetVendeur)}</div></div>
                <div><div className="text-[10px] text-primary font-bold uppercase mb-1">Séquestre</div><div className="font-heading text-base font-bold text-primary">{eur(c.sequestre)}</div></div>
                <div><div className="text-[10px] text-danger font-bold uppercase mb-1">Clause pénale</div><div className="font-heading text-base font-bold text-danger">{eur(c.clausePenale)}</div></div>
              </div>
            </div>
          )}
          <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-2">Financement acquéreur</div>
          <Grid2>
            <Field label="Type financement"><Select value={f.typeFinancement} onChange={v => upd("typeFinancement", v as CompromisVente["typeFinancement"])} options={["Prêt bancaire", "Fonds propres", "Mixte"]} /></Field>
            <Field label="Apport personnel (€)"><Input type="number" value={String(f.apportPersonnel || "")} onChange={e => upd("apportPersonnel", +e.target.value)} /></Field>
            <Field label="Montant du prêt (€)"><Input type="number" value={String(f.montantPret || "")} onChange={e => upd("montantPret", +e.target.value)} /></Field>
            <Field label="Taux max (%)"><Input type="number" value={String(f.tauxMaxPret)} onChange={e => upd("tauxMaxPret", +e.target.value)} /></Field>
            <Field label="Durée max (mois)"><Input type="number" value={String(f.dureePretMois)} onChange={e => upd("dureePretMois", +e.target.value)} /></Field>
            <Field label="Banque sollicitée"><Input value={f.banqueSollicitee} onChange={e => upd("banqueSollicitee", e.target.value)} /></Field>
            <Field label="Frais de notaire estimés (€)"><Input type="number" value={String(f.fraisNotaireEstimes || "")} onChange={e => upd("fraisNotaireEstimes", +e.target.value)} /></Field>
          </Grid2>
        </div>
      )}

      {/* Étape 3 — Délais & Notaire */}
      {step === 3 && (
        <div>
          <Grid2>
            <Field label="Date réitération acte au plus tard"><Input type="date" value={f.dateReiterationMax} onChange={e => upd("dateReiterationMax", e.target.value)} /></Field>
            <Field label="Délai obtention prêt (jours)"><Input type="number" value={String(f.delaiPretJours)} onChange={e => upd("delaiPretJours", +e.target.value)} /></Field>
            <Field label="Délai dépôt dossier (jours)"><Input type="number" value={String(f.delaiDepotDossierJours)} onChange={e => upd("delaiDepotDossierJours", +e.target.value)} /></Field>
          </Grid2>
          <Field label="Notaire instrumentaire"><Input value={f.notaire} onChange={e => upd("notaire", e.target.value)} placeholder="Maître …, SELAS …" /></Field>
          <Field label="Adresse du notaire"><Input value={f.adresseNotaire} onChange={e => upd("adresseNotaire", e.target.value)} /></Field>
          <div className="mt-4 text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-2">Fiscalité</div>
          <Grid2>
            <Field label="Taxe foncière (€)"><Input type="number" value={String(f.taxeFonciere || "")} onChange={e => upd("taxeFonciere", +e.target.value)} /></Field>
            <Field label="Année de référence"><Input value={f.anneeRef} onChange={e => upd("anneeRef", e.target.value)} /></Field>
          </Grid2>
        </div>
      )}

      {/* Étape 4 — Copropriété financière */}
      {step === 4 && (
        <div>
          <Grid2>
            <Field label="Sommes dues au syndicat (€)"><Input type="number" value={String(f.sommesDuesVendeur || "")} onChange={e => upd("sommesDuesVendeur", +e.target.value)} /></Field>
            <Field label="Remboursement fonds travaux (€)"><Input type="number" value={String(f.remboursementFondsTravaux || "")} onChange={e => upd("remboursementFondsTravaux", +e.target.value)} /></Field>
            <Field label="Travaux votés restants (€)"><Input type="number" value={String(f.travauxVotesRestants || "")} onChange={e => upd("travauxVotesRestants", +e.target.value)} /></Field>
          </Grid2>
          <Field label="Détail des sommes dues"><Textarea rows={2} value={f.detailSommesDues} onChange={e => upd("detailSommesDues", e.target.value)} /></Field>
          <Field label="Détail travaux votés"><Textarea rows={3} value={f.detailTravauxVotes} onChange={e => upd("detailTravauxVotes", e.target.value)} /></Field>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <button className="btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft size={14} /> Précédent</button>
        <div className="flex items-center gap-3">
          {step < COMPROMIS_STEPS.length - 1
            ? <button className="btn-primary" onClick={() => setStep(s => s + 1)}>Suivant <ChevronRight size={14} /></button>
            : parsedOk
              ? <Suspense fallback={<button className="btn-primary opacity-60"><FileDown size={14} /> Préparation…</button>}><CompromisPDFDownload f={f} /></Suspense>
              : <button className="btn-ghost opacity-60 cursor-not-allowed"><Lock size={14} /> Compléter les champs requis</button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Vue principale ───────────────────────────────────────────────────────────
export function RedacteurView() {
  const [docType, setDocType] = useState<DocType>("mandat");
  const [mandat, setMandat] = useState<MandatVenteFull>(defaultMandat);
  const [compromis, setCompromis] = useState<CompromisVente>(defaultCompromis);

  return (
    <div className="flex h-full">
      {/* Sidebar docs */}
      <aside className="w-52 shrink-0 border-r border-line bg-surface p-3">
        <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Documents</div>
        {([
          { id: "mandat" as DocType, label: "Mandat de vente", icon: "📋", sub: "10 articles · Hoguet/ALUR" },
          { id: "compromis" as DocType, label: "Compromis de vente", icon: "✍️", sub: "17 articles · Loi ALUR" },
        ]).map(d => (
          <button key={d.id} onClick={() => setDocType(d.id)}
            className={`flex w-full flex-col items-start gap-0.5 rounded px-3 py-2.5 text-left mb-1 ${docType === d.id ? "bg-primary-soft" : "hover:bg-line/50"}`}>
            <span className={`text-[13px] font-medium ${docType === d.id ? "font-semibold text-primary" : "text-ink-sub"}`}>{d.icon} {d.label}</span>
            <span className="text-[10px] text-ink-muted">{d.sub}</span>
          </button>
        ))}
        <div className="mt-4 border-t border-line pt-3">
          <button className="btn-ghost w-full justify-center text-[12px]"
            onClick={() => { if (docType === "mandat") setMandat(defaultMandat()); else setCompromis(defaultCompromis()); }}>
            Nouveau document
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="mb-5 font-heading text-lg font-semibold text-ink">
          {docType === "mandat" ? "📋 Mandat de vente" : "✍️ Compromis de vente"}
        </h2>
        {docType === "mandat"
          ? <MandatForm f={mandat} setF={setMandat} />
          : <CompromisForm f={compromis} setF={setCompromis} />
        }
      </div>
    </div>
  );
}
