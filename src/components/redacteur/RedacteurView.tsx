import { useState, useCallback, useEffect } from "react";
import { useUiStore, type ViewId } from "../../store/ui.store";
import { Plus, Trash2, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { agentFormal } from "../../config/agents";
import { mandatVenteFullSchema, calcMandatVente, isTerrain, isFonds, needsDPE, type MandatVenteFull, type Mandant, type LotCopro } from "../../schemas/redacteur/mandatVenteFull.schema";
import { compromisVenteSchema, calcCompromis, type CompromisVente, type PartieCompromis } from "../../schemas/redacteur/compromisVente.schema";
import { offreAchatSchema, type OffreAchat, type PartieOffre } from "../../schemas/redacteur/offreAchat.schema";
import { COMMUNES_MARTINIQUE } from "../../schemas/enums";
import { commissionMontant } from "../../schemas/compromis.schema";
import { eur } from "../../lib/format";

import { MandatPDFDownload, MandatDOCXDownload, CompromisPDFDownload, CompromisDOCXDownload, OffrePDFDownload, OffreDOCXDownload } from "./DocPDFDownloads";
import { downloadFicheApportAffaires } from "../../reports/FicheApportAffairesPDF";
import { downloadFicheApportPromo } from "../../reports/FicheApportPromo";

type DocType = "mandat" | "compromis" | "offre" | "expertise";

const today = () => new Date().toISOString().slice(0, 10);

const newMandant = (): Mandant => ({ civilite: "M.", prenom: "", nom: "", dateNaissance: "", nationalite: "Française", adresse: "", codePostal: "", ville: "", pays: "FRANCE", tel: "", email: "", qualite: "Propriétaire" });
const newPartie = (): PartieCompromis => ({ civilite: "M.", prenom: "", nom: "", nationalite: "française", dateNaissance: "", lieuNaissance: "", adresse: "", codePostal: "", ville: "", etatCivil: "célibataire", email: "", tel: "" });

function defaultMandat(): MandatVenteFull {
  return {
    numero: `MV-${new Date().getFullYear()}-`,
    date: today(), lieu: "",
    mandants: [newMandant()],
    residence: "", adresseBien: "", commune: "", codePostal: "", typeBien: "Appartement",
    surfaceTotale: 0, surfaceCarrez: 0, surfaceHabitable: 0, surfaceTerrain: 0,
    surfacePiscine: 0, surfaceFonciere: 0, nbPieces: "", refCadastrale: "",
    descriptionBien: "", lots: "", tantiemes: "", lotsDetail: [], infosCopro: "", nomsLots: "", syndic: "",
    chargesAnnuelles: 0, enCopropriete: false, occupation: "Libre",
    bailType: "Loi 89 (résidentiel)", loyerMensuel: 0, datFinBail: "", nomLocataire: "",
    chiffreAffaires: 0, servitudes: "",
    classeDPE: "", classeGES: "", dateDDT: "", diagnostiqueur: "",
    etatTermites: "Non réalisé", anomaliesElec: "", ernmt: "", risquesNaturels: true,
    prixFAI: 0, honorairesPct: 6, chargeHonoraires: "vendeur", tvaApplicable: true,
    typeMandat: "Simple", dureeAns: 1, dateDebut: today(),
    avecApportDirect: true, avecSousMandat: false, avecInterAgence: true,
    avecPanneau: true, bienIndivision: false,
    redacteur: "",
    observations: "",
  };
}

function defaultCompromis(): CompromisVente {
  return {
    date: today(), lieu: "",
    vendeurs: [newPartie()], acquereurs: [newPartie()],
    typeBien: "Appartement", residence: "", adresseBien: "", quartier: "",
    commune: "", codePostal: "", numLot: "", surfaceCarrez: 0, surfaceTotale: 0,
    descriptionSurfaces: "", tantiemes: "", occupation: "résidence principale",
    nomCopro: "", numImmatCopro: "", nomSyndic: "", adresseSyndic: "",
    nbLotsCopro: 0, anneeConstruction: "",
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
    redacteur: "", mandatRef: "",
    observations: "",
  };
}

const newAcquereur = (): PartieOffre => ({ civilite: "M.", prenom: "", nom: "", nationalite: "française", dateNaissance: "", lieuNaissance: "", adresse: "", codePostal: "", ville: "", etatCivil: "célibataire", email: "", tel: "" });

function defaultOffre(): OffreAchat {
  return {
    numero: `OA-${new Date().getFullYear()}-`,
    date: today(), lieu: "", redacteur: "",
    acquereurs: [newAcquereur()],
    typeBien: "Appartement", adresseBien: "", commune: "", codePostal: "",
    descriptionBien: "", mandatRef: "", nomVendeur: "",
    prixOffert: 0,
    typeFinancement: "Prêt bancaire", montantPret: 0, apportPersonnel: 0,
    banqueSollicitee: "", tauxMax: 4.5, dureePretMois: 300,
    conditionPret: true, conditionVenteBien: false, descriptionBienVente: "",
    autresConditions: "",
    validiteJours: 5, dateEntreeJouissance: "", sequestre: 0, notaire: "",
    observations: "",
  };
}

// ─── Éditeur de lots de copropriété ──────────────────────────────────────────
const LOT_TYPES = ["Appartement", "Cave", "Parking", "Box", "Local", "Terrasse", "Jardin", "Autre"];
const newLot = (): LotCopro => ({ designation: "Appartement", numero: "", tantiemes: "" });

function LotsEditor({ lots, onChange }: { lots: LotCopro[]; onChange: (lots: LotCopro[]) => void }) {
  const updLot = (i: number, k: keyof LotCopro, v: string) =>
    onChange(lots.map((l, j) => j === i ? { ...l, [k]: v } : l));
  return (
    <div>
      {lots.length === 0 && (
        <p className="mb-2 text-[11.5px] text-ink-muted italic">Aucun lot — cliquer pour ajouter</p>
      )}
      {lots.map((l, i) => (
        <div key={i} className="card mb-2 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Lot {i + 1}</span>
            <button onClick={() => onChange(lots.filter((_, j) => j !== i))} className="text-danger hover:bg-danger-soft rounded p-1"><Trash2 size={12} /></button>
          </div>
          <Grid2>
            <Field label="Désignation">
              <Select value={l.designation} onChange={v => updLot(i, "designation", v)} options={LOT_TYPES} />
            </Field>
            <Field label="N° de lot">
              <Input value={l.numero} onChange={e => updLot(i, "numero", e.target.value)} placeholder="Lot 36" />
            </Field>
            <Field label="Tantièmes">
              <Input value={l.tantiemes} onChange={e => updLot(i, "tantiemes", e.target.value)} placeholder="413/10 000" />
            </Field>
          </Grid2>
        </div>
      ))}
      <button className="btn-ghost text-[12px] mt-1" onClick={() => onChange([...lots, newLot()])}>
        <Plus size={13} /> Ajouter un lot
      </button>
    </div>
  );
}

// ─── Formulaire Mandat ────────────────────────────────────────────────────────
const MANDAT_STEPS = ["Parties", "Bien", "Diagnostics", "Prix & Mandat", "Options"];

const TYPE_BIEN_OPTIONS = ["Appartement", "Villa", "Maison", "Terrain", "Local commercial", "Fonds de commerce"];
const DPE_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "Non réalisé", "Non soumis"];
const BAIL_OPTIONS = ["Loi 89 (résidentiel)", "Bail commercial", "Bail saisonnier", "Bail rural", "Autre"];

function MandatForm({ f, setF }: { f: MandatVenteFull; setF: (v: MandatVenteFull) => void }) {
  const [step, setStep] = useState(0);
  const { data } = useAgencyData();
  const upd = useCallback(<K extends keyof MandatVenteFull>(k: K, v: MandatVenteFull[K]) =>
    setF({ ...f, [k]: v }), [f, setF]);
  const updMandant = (i: number, k: keyof Mandant, v: string) =>
    setF({ ...f, mandants: f.mandants.map((m, j) => j === i ? { ...m, [k]: v } : m) });

  const c = calcMandatVente(f);
  const parsedOk = mandatVenteFullSchema.safeParse(f).success;
  const t = f.typeBien;

  // Pré-remplir depuis mandat CRM
  const prefillFromMandat = (mandatId: string) => {
    const mandat = data.mandats.find(m => m.id === mandatId);
    const bien = mandat ? data.biens.find(b => b.id === mandat.bienId || b.ref === mandat.bienId) : null;
    if (mandat) {
      setF({
        ...f,
        mandants: [{ ...newMandant(), nom: mandat.mandant.toUpperCase(), tel: mandat.tel || "", email: mandat.email || "" }],
        honorairesPct: mandat.honoraires || 6,
        typeMandat: mandat.type === "Exclusif" ? "Exclusif" : mandat.type === "Simple" ? "Simple" : "Semi-exclusif",
        dateDebut: mandat.dateDebut || today(),
        numero: mandat.ref ? `MV-${mandat.ref}` : f.numero,
        prixFAI: bien?.prix || 0,
        adresseBien: bien?.adresse || "",
        commune: bien?.commune || "",
        lieu: bien?.commune || "",
        typeBien: bien?.type || "Appartement",
        surfaceTotale: bien?.surface || 0,
        surfaceCarrez: bien?.surface || 0,
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
            className={`flex-1 rounded py-2 text-[11px] font-medium transition-colors ${step === i ? "bg-primary text-white" : "bg-line text-ink-sub hover:bg-line2"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Étape 0 — Parties */}
      {step === 0 && (
        <div>
          {data.mandats.length > 0 && (
            <div className="card mb-4 border-l-4 border-l-primary bg-primary-soft p-3.5">
              <div className="mb-1.5 text-[12px] font-semibold text-primary">Pré-remplir depuis un mandat CRM</div>
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
          {/* Champs toujours affichés */}
          <Grid2>
            <Field label="Type de bien">
              <Select value={f.typeBien} onChange={v => upd("typeBien", v)} options={TYPE_BIEN_OPTIONS} />
            </Field>
            <Field label="Résidence / Lotissement"><Input value={f.residence} onChange={e => upd("residence", e.target.value)} placeholder="Résidence ALTICA" /></Field>
            <Field label="Adresse du bien"><Input value={f.adresseBien} onChange={e => upd("adresseBien", e.target.value)} /></Field>
            <Field label="Commune"><Select value={f.commune} onChange={v => upd("commune", v)} options={[...COMMUNES_MARTINIQUE]} /></Field>
            <Field label="Code postal"><Input value={f.codePostal} onChange={e => upd("codePostal", e.target.value)} /></Field>
            <Field label="Réf. cadastrale"><Input value={f.refCadastrale} onChange={e => upd("refCadastrale", e.target.value)} placeholder="Section C, N° 1952" /></Field>
            <Field label="Occupation"><Select value={f.occupation} onChange={v => upd("occupation", v as MandatVenteFull["occupation"])} options={["Libre", "Occupé"]} /></Field>
          </Grid2>

          {/* Appartement */}
          {t === "Appartement" && (
            <div>
              <div className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Surfaces & Composition</div>
              <Grid2>
                <Field label="Surface loi Carrez (m²)*"><Input type="number" value={String(f.surfaceCarrez || "")} onChange={e => upd("surfaceCarrez", +e.target.value)} /></Field>
                <Field label="Surface totale (m²)"><Input type="number" value={String(f.surfaceTotale || "")} onChange={e => upd("surfaceTotale", +e.target.value)} /></Field>
                <Field label="Nombre de pièces"><Input value={f.nbPieces} onChange={e => upd("nbPieces", e.target.value)} placeholder="3 pièces (T3)" /></Field>
              </Grid2>
              <div className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Lots de copropriété</div>
              <LotsEditor
                lots={f.lotsDetail}
                onChange={lots => upd("lotsDetail", lots)}
              />
              <Grid2>
                <Field label="Syndic"><Input value={f.syndic} onChange={e => upd("syndic", e.target.value)} /></Field>
                <Field label="Charges annuelles (€)"><Input type="number" value={String(f.chargesAnnuelles || "")} onChange={e => upd("chargesAnnuelles", +e.target.value)} /></Field>
              </Grid2>
            </div>
          )}

          {/* Villa ou Maison */}
          {(t === "Villa" || t === "Maison") && (
            <div>
              <div className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Surfaces</div>
              <Grid2>
                <Field label="Surface habitable (m²)"><Input type="number" value={String(f.surfaceHabitable || "")} onChange={e => upd("surfaceHabitable", +e.target.value)} /></Field>
                <Field label="Surface terrain (m²)"><Input type="number" value={String(f.surfaceTerrain || "")} onChange={e => upd("surfaceTerrain", +e.target.value)} /></Field>
                <Field label="Nombre de pièces"><Input value={f.nbPieces} onChange={e => upd("nbPieces", e.target.value)} placeholder="4 pièces (T4)" /></Field>
                {t === "Villa" && (
                  <Field label="Surface piscine (m²)"><Input type="number" value={String(f.surfacePiscine || "")} onChange={e => upd("surfacePiscine", +e.target.value)} /></Field>
                )}
              </Grid2>
            </div>
          )}

          {/* Terrain */}
          {isTerrain(t) && (
            <div>
              <div className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Surface</div>
              <Grid2>
                <Field label="Surface foncière (m²)"><Input type="number" value={String(f.surfaceFonciere || "")} onChange={e => upd("surfaceFonciere", +e.target.value)} /></Field>
              </Grid2>
            </div>
          )}

          {/* Local commercial */}
          {t === "Local commercial" && (
            <div>
              <div className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Surfaces</div>
              <Grid2>
                <Field label="Surface totale (m²)"><Input type="number" value={String(f.surfaceTotale || "")} onChange={e => upd("surfaceTotale", +e.target.value)} /></Field>
                <Field label="Surface Carrez (m²) (optionnel)"><Input type="number" value={String(f.surfaceCarrez || "")} onChange={e => upd("surfaceCarrez", +e.target.value)} /></Field>
              </Grid2>
              <div className="mt-3">
                <label className="flex items-center gap-2 cursor-pointer text-[13px] text-ink">
                  <input type="checkbox" checked={f.enCopropriete} onChange={e => upd("enCopropriete", e.target.checked)} className="size-4 accent-primary" />
                  En copropriété ?
                </label>
              </div>
              {f.enCopropriete && (
                <Grid2>
                  <Field label="Syndic"><Input value={f.syndic} onChange={e => upd("syndic", e.target.value)} /></Field>
                  <Field label="Charges annuelles (€)"><Input type="number" value={String(f.chargesAnnuelles || "")} onChange={e => upd("chargesAnnuelles", +e.target.value)} /></Field>
                </Grid2>
              )}
            </div>
          )}

          {/* Fonds de commerce */}
          {isFonds(t) && (
            <div>
              <div className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Fonds de commerce</div>
              <Field label="Description du fonds">
                <Textarea rows={3} value={f.descriptionBien} onChange={e => upd("descriptionBien", e.target.value)} placeholder="Activité, emplacement, équipements…" />
              </Field>
              <Grid2>
                <Field label="Chiffre d'affaires annuel HT (€)"><Input type="number" value={String(f.chiffreAffaires || "")} onChange={e => upd("chiffreAffaires", +e.target.value)} /></Field>
              </Grid2>
            </div>
          )}

          {/* Section Occupation — si Occupé */}
          {f.occupation === "Occupé" && (
            <div className="mt-4 card border-l-4 border-l-amber bg-amber-soft p-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-amber">Occupation — Détails du bail</div>
              <Grid2>
                <Field label="Type de bail">
                  <Select value={f.bailType} onChange={v => upd("bailType", v as MandatVenteFull["bailType"])} options={BAIL_OPTIONS} />
                </Field>
                <Field label="Nom du locataire"><Input value={f.nomLocataire} onChange={e => upd("nomLocataire", e.target.value)} /></Field>
                <Field label="Loyer mensuel (€)"><Input type="number" value={String(f.loyerMensuel || "")} onChange={e => upd("loyerMensuel", +e.target.value)} /></Field>
                <Field label="Date de fin de bail"><Input type="date" value={f.datFinBail} onChange={e => upd("datFinBail", e.target.value)} /></Field>
              </Grid2>
            </div>
          )}

          {/* Description & servitudes — toujours (sauf Fonds qui a déjà sa description) */}
          {!isFonds(t) && (
            <div className="mt-3">
              <Field label="Description du bien">
                <Textarea rows={4} value={f.descriptionBien} onChange={e => upd("descriptionBien", e.target.value)} placeholder="Composition détaillée, vue, équipements…" />
              </Field>
            </div>
          )}
          <div className="mt-2">
            <Field label="Servitudes connues (optionnel)">
              <Textarea rows={2} value={f.servitudes} onChange={e => upd("servitudes", e.target.value)} placeholder="Ex : servitude de passage, de vue…" />
            </Field>
          </div>
        </div>
      )}

      {/* Étape 2 — Diagnostics */}
      {step === 2 && (
        <div>
          {/* Encart d'info Martinique */}
          <div className="card border-l-4 border-l-blue-500 bg-blue-50 p-4 mb-4">
            <div className="text-[12px] font-semibold text-blue-700 mb-1">Diagnostics obligatoires en Martinique</div>
            <p className="text-[11.5px] text-blue-800 leading-relaxed">
              En Martinique, les diagnostics obligatoires pour la vente sont : <strong>DPE</strong>, <strong>Termites</strong> (obligatoire sur l'ensemble du territoire), <strong>ERNMT</strong>, <strong>État de l'installation électrique</strong> (si &gt;15 ans), <strong>CREP</strong> (si avant 1949). Frais à la charge du vendeur.
            </p>
          </div>

          {/* DPE — si le type de bien le nécessite */}
          {needsDPE(t) && (
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">DPE — Diagnostic de Performance Énergétique</div>
              <Grid2>
                <Field label="Classe DPE">
                  <Select value={f.classeDPE || "Non réalisé"} onChange={v => upd("classeDPE", v)} options={DPE_OPTIONS} />
                </Field>
                <Field label="Classe GES">
                  <Select value={f.classeGES || "Non réalisé"} onChange={v => upd("classeGES", v)} options={DPE_OPTIONS} />
                </Field>
                <Field label="Date du DDT"><Input type="date" value={f.dateDDT} onChange={e => upd("dateDDT", e.target.value)} /></Field>
                <Field label="Diagnostiqueur"><Input value={f.diagnostiqueur} onChange={e => upd("diagnostiqueur", e.target.value)} /></Field>
              </Grid2>
            </div>
          )}

          {/* Termites — toujours en Martinique */}
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Termites (obligatoire — Martinique)</div>
            <Grid2>
              <Field label="État parasitaire termites">
                <Select value={f.etatTermites} onChange={v => upd("etatTermites", v as MandatVenteFull["etatTermites"])} options={["Absence", "Présence", "Non réalisé"]} />
              </Field>
            </Grid2>
          </div>

          {/* ERNMT */}
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">ERNMT — Risques naturels (Martinique)</div>
            <Field label="Informations ERNMT">
              <Textarea rows={2} value={f.ernmt} onChange={e => upd("ernmt", e.target.value)} placeholder="Zone sismique 4 — Martinique — État des risques et pollutions à joindre au dossier" />
            </Field>
          </div>

          {/* Anomalies électriques */}
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Installation électrique</div>
            <Field label="Anomalies électriques constatées">
              <Textarea rows={2} value={f.anomaliesElec} onChange={e => upd("anomaliesElec", e.target.value)} placeholder="Si aucune anomalie constatée, laisser vide" />
            </Field>
          </div>
        </div>
      )}

      {/* Étape 3 — Prix & Mandat */}
      {step === 3 && (
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

      {/* Étape 4 — Options */}
      {step === 4 && (
        <div className="space-y-3">
          {([
            ["avecApportDirect", "Clause apport direct (honoraires /2 si acquéreur présenté par le vendeur)"],
            ["avecSousMandat", "Autoriser le sous-mandat"],
            ["avecInterAgence", "Autoriser l'inter-agence"],
            ["avecPanneau", "Autoriser la pose d'un panneau de vente sur le bien"],
            ["bienIndivision", "Bien en indivision"],
          ] as [keyof MandatVenteFull, string][]).map(([k, lbl]) => (
            <label key={k} className="card flex cursor-pointer items-center gap-3 p-3.5">
              <input type="checkbox" checked={Boolean(f[k])} onChange={e => upd(k, e.target.checked as never)} className="size-4 accent-primary" />
              <span className="text-[13.5px] text-ink">{lbl}</span>
            </label>
          ))}
          <div className="mt-2 border-t border-line pt-4">
            <Field label="Observations et précisions complémentaires (optionnel)">
              <Textarea
                rows={4}
                value={f.observations}
                onChange={e => upd("observations", e.target.value)}
                placeholder="Précisions particulières, clauses spécifiques, remarques… Ce champ n'apparaît dans le document que s'il est renseigné."
              />
            </Field>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <button className="btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft size={14} /> Précédent</button>
        <div className="flex items-center gap-3">
          {step < MANDAT_STEPS.length - 1
            ? <button className="btn-primary" onClick={() => setStep(s => s + 1)}>Suivant <ChevronRight size={14} /></button>
            : parsedOk
              ? <><MandatPDFDownload f={f} /><MandatDOCXDownload f={f} /></>
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
    const bien = data.biens.find(b => b.ref === comp.bienRef || b.id === comp.bienRef);
    setF({
      ...f,
      prixFAI: comp.prixVente || 0,
      honorairesTTC: commissionMontant(comp),
      mandatRef: comp.ref || "",
      notaire: comp.notaire || "",
      lieu: bien?.commune || "",
      vendeurs: [{ ...newPartie(), nom: comp.vendeur?.toUpperCase() || "" }],
      acquereurs: [{ ...newPartie(), nom: comp.acheteur?.toUpperCase() || "" }],
      adresseBien: bien?.adresse || "",
      commune: bien?.commune || "",
      typeBien: bien?.type || f.typeBien,
      surfaceCarrez: bien?.surface || 0,
      surfaceTotale: bien?.surface || 0,
      descriptionSurfaces: bien?.desc || "",
      typeFinancement: (["Prêt bancaire", "Fonds propres", "Mixte"] as const).includes(comp.financement as CompromisVente["typeFinancement"])
        ? comp.financement as CompromisVente["typeFinancement"]
        : "Prêt bancaire",
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
              <div className="mb-1.5 text-[12px] font-semibold text-primary">Pré-remplir depuis un dossier CRM</div>
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
            <Field label="Adresse syndic"><Input value={f.adresseSyndic} onChange={e => upd("adresseSyndic", e.target.value)} /></Field>
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
          <div className="mt-2 border-t border-line pt-4">
            <Field label="Observations et précisions complémentaires (optionnel)">
              <Textarea
                rows={4}
                value={f.observations}
                onChange={e => upd("observations", e.target.value)}
                placeholder="Précisions particulières, clauses spécifiques, remarques… Ce champ n'apparaît dans le document que s'il est renseigné."
              />
            </Field>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <button className="btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft size={14} /> Précédent</button>
        <div className="flex items-center gap-3">
          {step < COMPROMIS_STEPS.length - 1
            ? <button className="btn-primary" onClick={() => setStep(s => s + 1)}>Suivant <ChevronRight size={14} /></button>
            : parsedOk
              ? <><CompromisPDFDownload f={f} /><CompromisDOCXDownload f={f} /></>
              : <button className="btn-ghost opacity-60 cursor-not-allowed"><Lock size={14} /> Compléter les champs requis</button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Formulaire Offre d'achat ─────────────────────────────────────────────────
const OFFRE_STEPS = ["Acquéreurs", "Bien", "Offre & Conditions"];

function OffreForm({ f, setF }: { f: OffreAchat; setF: (v: OffreAchat) => void }) {
  const [step, setStep] = useState(0);
  const { data } = useAgencyData();
  const upd = useCallback(<K extends keyof OffreAchat>(k: K, v: OffreAchat[K]) =>
    setF({ ...f, [k]: v }), [f, setF]);
  const updAcq = (i: number, k: keyof PartieOffre, v: string) =>
    setF({ ...f, acquereurs: f.acquereurs.map((a, j) => j === i ? { ...a, [k]: v } : a) });

  const parsedOk = offreAchatSchema.safeParse(f).success;

  // Pré-remplir depuis un mandat CRM
  const prefillFromMandat = (mandatId: string) => {
    const mandat = data.mandats.find(m => m.id === mandatId);
    const bien = mandat ? data.biens.find(b => b.id === mandat.bienId || b.ref === mandat.bienId) : null;
    if (mandat) {
      setF({
        ...f,
        mandatRef: mandat.ref,
        nomVendeur: mandat.mandant,
        adresseBien: bien?.adresse || "",
        commune: bien?.commune || "",
        lieu: bien?.commune || "",
        typeBien: bien?.type || "Appartement",
        prixOffert: bien?.prix || 0,
        descriptionBien: bien?.desc || "",
        notaire: "",
      });
    }
  };

  return (
    <div>
      {/* Step nav */}
      <div className="mb-5 flex gap-1 overflow-x-auto">
        {OFFRE_STEPS.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`flex-1 min-w-[80px] rounded py-2 text-[11px] font-medium transition-colors ${step === i ? "bg-primary text-white" : "bg-line text-ink-sub hover:bg-line2"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Étape 0 — Acquéreurs */}
      {step === 0 && (
        <div>
          <Grid2>
            <Field label="N° de l'offre"><Input value={f.numero} onChange={e => upd("numero", e.target.value)} placeholder="OA-2026-001" /></Field>
            <Field label="Date"><Input type="date" value={f.date} onChange={e => upd("date", e.target.value)} /></Field>
            <Field label="Lieu"><Input value={f.lieu} onChange={e => upd("lieu", e.target.value)} /></Field>
            <Field label="Rédacteur"><Input value={f.redacteur} onChange={e => upd("redacteur", e.target.value)} /></Field>
          </Grid2>
          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Acquéreur(s)</div>
            {f.acquereurs.map((a, i) => (
              <div key={i} className={`card p-4 mb-3 ${i > 0 ? "border-l-4 border-l-primary/30" : ""}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wide text-ink-muted">Acquéreur {f.acquereurs.length > 1 ? i + 1 : ""}</span>
                  {i > 0 && <button onClick={() => setF({ ...f, acquereurs: f.acquereurs.filter((_, j) => j !== i) })} className="text-danger hover:bg-danger-soft rounded p-1"><Trash2 size={13} /></button>}
                </div>
                <Grid2>
                  <Field label="Civilité"><Select value={a.civilite} onChange={v => updAcq(i, "civilite", v)} options={["M.", "Mme", "M. et Mme"]} /></Field>
                  <Field label="Prénom"><Input value={a.prenom} onChange={e => updAcq(i, "prenom", e.target.value)} /></Field>
                  <Field label="Nom"><Input value={a.nom} onChange={e => updAcq(i, "nom", e.target.value)} /></Field>
                  <Field label="Date de naissance"><Input type="date" value={a.dateNaissance} onChange={e => updAcq(i, "dateNaissance", e.target.value)} /></Field>
                  <Field label="Lieu de naissance"><Input value={a.lieuNaissance} onChange={e => updAcq(i, "lieuNaissance", e.target.value)} /></Field>
                  <Field label="Nationalité"><Input value={a.nationalite} onChange={e => updAcq(i, "nationalite", e.target.value)} /></Field>
                  <Field label="État civil"><Select value={a.etatCivil} onChange={v => updAcq(i, "etatCivil", v)} options={["célibataire", "marié(e)", "pacsé(e)", "divorcé(e)", "veuf/veuve"]} /></Field>
                </Grid2>
                <Field label="Adresse"><Input value={a.adresse} onChange={e => updAcq(i, "adresse", e.target.value)} /></Field>
                <Grid2>
                  <Field label="Code postal"><Input value={a.codePostal} onChange={e => updAcq(i, "codePostal", e.target.value)} /></Field>
                  <Field label="Ville"><Input value={a.ville} onChange={e => updAcq(i, "ville", e.target.value)} /></Field>
                  <Field label="Téléphone"><Input value={a.tel} onChange={e => updAcq(i, "tel", e.target.value)} /></Field>
                  <Field label="Email"><Input type="email" value={a.email} onChange={e => updAcq(i, "email", e.target.value)} /></Field>
                </Grid2>
              </div>
            ))}
            <button className="btn-ghost text-[12px]" onClick={() => setF({ ...f, acquereurs: [...f.acquereurs, newAcquereur()] })}>
              <Plus size={13} /> Ajouter un co-acquéreur
            </button>
          </div>
        </div>
      )}

      {/* Étape 1 — Bien */}
      {step === 1 && (
        <div>
          {data.mandats.length > 0 && (
            <div className="card mb-4 border-l-4 border-l-primary bg-primary-soft p-3.5">
              <div className="mb-1.5 text-[12px] font-semibold text-primary">Pré-remplir depuis un mandat CRM</div>
              <select className="w-full rounded border border-line2 bg-white px-3 py-2 text-[13px]"
                onChange={e => prefillFromMandat(e.target.value)} defaultValue="">
                <option value="">— Sélectionner un mandat —</option>
                {data.mandats.map(m => <option key={m.id} value={m.id}>{m.ref} — {m.mandant}</option>)}
              </select>
            </div>
          )}
          <Grid2>
            <Field label="Type de bien"><Select value={f.typeBien} onChange={v => upd("typeBien", v)} options={["Appartement", "Villa", "Maison", "Terrain", "Local commercial", "Fonds de commerce"]} /></Field>
            <Field label="Réf. mandat"><Input value={f.mandatRef} onChange={e => upd("mandatRef", e.target.value)} placeholder="MV-2026-001" /></Field>
            <Field label="Nom du vendeur"><Input value={f.nomVendeur} onChange={e => upd("nomVendeur", e.target.value)} /></Field>
          </Grid2>
          <Field label="Adresse du bien"><Input value={f.adresseBien} onChange={e => upd("adresseBien", e.target.value)} /></Field>
          <Grid2>
            <Field label="Commune"><Select value={f.commune} onChange={v => upd("commune", v)} options={[...COMMUNES_MARTINIQUE]} /></Field>
            <Field label="Code postal"><Input value={f.codePostal} onChange={e => upd("codePostal", e.target.value)} /></Field>
          </Grid2>
          <Field label="Description du bien">
            <Textarea rows={3} value={f.descriptionBien} onChange={e => upd("descriptionBien", e.target.value)} placeholder="Surface, pièces, étage, parking…" />
          </Field>
        </div>
      )}

      {/* Étape 2 — Offre & Conditions */}
      {step === 2 && (
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Prix offert</div>
          <Grid2>
            <Field label="Prix offert (€)"><Input type="number" value={String(f.prixOffert || "")} onChange={e => upd("prixOffert", +e.target.value)} /></Field>
            <Field label="Validité (jours ouvrés)"><Input type="number" value={String(f.validiteJours)} onChange={e => upd("validiteJours", +e.target.value)} /></Field>
            <Field label="Séquestre (€)"><Input type="number" value={String(f.sequestre || "")} onChange={e => upd("sequestre", +e.target.value)} /></Field>
            <Field label="Date d'entrée en jouissance"><Input type="date" value={f.dateEntreeJouissance} onChange={e => upd("dateEntreeJouissance", e.target.value)} /></Field>
          </Grid2>
          <Field label="Notaire désigné"><Input value={f.notaire} onChange={e => upd("notaire", e.target.value)} /></Field>

          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Financement</div>
            <Grid2>
              <Field label="Type"><Select value={f.typeFinancement} onChange={v => upd("typeFinancement", v as OffreAchat["typeFinancement"])} options={["Prêt bancaire", "Comptant"]} /></Field>
            </Grid2>
            {f.typeFinancement === "Prêt bancaire" && (
              <Grid2>
                <Field label="Montant du prêt (€)"><Input type="number" value={String(f.montantPret || "")} onChange={e => upd("montantPret", +e.target.value)} /></Field>
                <Field label="Apport personnel (€)"><Input type="number" value={String(f.apportPersonnel || "")} onChange={e => upd("apportPersonnel", +e.target.value)} /></Field>
                <Field label="Banque sollicitée"><Input value={f.banqueSollicitee} onChange={e => upd("banqueSollicitee", e.target.value)} /></Field>
                <Field label="Taux max (%)"><Input type="number" step="0.1" value={String(f.tauxMax)} onChange={e => upd("tauxMax", +e.target.value)} /></Field>
                <Field label="Durée max (mois)"><Input type="number" value={String(f.dureePretMois)} onChange={e => upd("dureePretMois", +e.target.value)} /></Field>
              </Grid2>
            )}
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Conditions suspensives</div>
            <div className="flex flex-col gap-2 mb-3">
              <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer">
                <input type="checkbox" checked={f.conditionPret} onChange={e => upd("conditionPret", e.target.checked)} className="rounded" />
                Obtention d'un prêt bancaire
              </label>
              <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer">
                <input type="checkbox" checked={f.conditionVenteBien} onChange={e => upd("conditionVenteBien", e.target.checked)} className="rounded" />
                Vente préalable d'un bien
              </label>
            </div>
            {f.conditionVenteBien && (
              <Field label="Description du bien à vendre">
                <Input value={f.descriptionBienVente} onChange={e => upd("descriptionBienVente", e.target.value)} placeholder="Appartement 3 pièces à Fort-de-France…" />
              </Field>
            )}
            <Field label="Autres conditions">
              <Textarea rows={2} value={f.autresConditions} onChange={e => upd("autresConditions", e.target.value)} placeholder="Conditions particulières éventuelles…" />
            </Field>
          </div>
          <div className="mt-2 border-t border-line pt-4">
            <Field label="Observations et précisions complémentaires (optionnel)">
              <Textarea
                rows={4}
                value={f.observations}
                onChange={e => upd("observations", e.target.value)}
                placeholder="Précisions particulières, remarques… Ce champ n'apparaît dans le document que s'il est renseigné."
              />
            </Field>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <button className="btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft size={14} /> Précédent</button>
        <div className="flex items-center gap-3">
          {step < OFFRE_STEPS.length - 1
            ? <button className="btn-primary" onClick={() => setStep(s => s + 1)}>Suivant <ChevronRight size={14} /></button>
            : parsedOk
              ? <><OffrePDFDownload f={f} /><OffreDOCXDownload f={f} /></>
              : <button className="btn-ghost opacity-60 cursor-not-allowed"><Lock size={14} /> Compléter les champs requis</button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Vue principale ───────────────────────────────────────────────────────────
const DOC_LIST: { id: DocType; label: string; icon: string; sub: string; navigateTo?: ViewId }[] = [
  { id: "mandat",    label: "Mandat de vente",              icon: "", sub: "10 articles · Hoguet/ALUR" },
  { id: "compromis", label: "Compromis de vente",           icon: "", sub: "17 articles · Loi ALUR" },
  { id: "offre",     label: "Offre d'achat",                icon: "", sub: "Offre ferme · conditions suspensives" },
  { id: "expertise", label: "Rapport d'expertise immob.",   icon: "", sub: "Valeur vénale · INIGEP®", navigateTo: "estimation" },
];

export function RedacteurView() {
  const user = useSessionStore((s) => s.user);
  const agentFormalName = agentFormal(user?.id ?? "dir");

  const [docType, setDocType] = useState<DocType>("mandat");
  const [mandat, setMandat] = useState<MandatVenteFull>(() => ({ ...defaultMandat(), redacteur: agentFormal(user?.id ?? "dir") }));
  const [compromis, setCompromis] = useState<CompromisVente>(() => ({ ...defaultCompromis(), redacteur: agentFormal(user?.id ?? "dir") }));
  const [offre, setOffre] = useState<OffreAchat>(() => ({ ...defaultOffre(), redacteur: agentFormal(user?.id ?? "dir") }));

  const { prefillRedacteur, setPrefillRedacteur, setView } = useUiStore();
  const { data } = useAgencyData();

  // Appliquer un prefill depuis BiensView ou PilotageView
  useEffect(() => {
    if (!prefillRedacteur) return;
    const { docType: dt, sourceId } = prefillRedacteur;
    setDocType(dt);

    if (dt === "mandat") {
      const m = data.mandats.find(x => x.id === sourceId);
      const b = m ? data.biens.find(x => x.id === m.bienId || x.ref === m.bienId) : null;
      if (m) {
        setMandat(prev => ({
          ...prev,
          mandants: [{ ...newMandant(), nom: m.mandant.toUpperCase(), tel: m.tel || "", email: m.email || "" }],
          honorairesPct: m.honoraires || 6,
          typeMandat: (m.type === "Exclusif" || m.type === "Simple") ? m.type : "Simple",
          dateDebut: m.dateDebut || today(),
          prixFAI: b?.prix || 0,
          adresseBien: b?.adresse || "",
          commune: b?.commune || "",
          typeBien: b?.type || "Appartement",
          surfaceTotale: b?.surface || 0,
          descriptionBien: b?.desc || "",
        }));
      }
    } else if (dt === "compromis") {
      const comp = data.compromis.find(x => x.id === sourceId);
      if (comp) {
        const bien = data.biens.find(b => b.ref === comp.bienRef || b.id === comp.bienRef);
        setCompromis(prev => ({
          ...prev,
          prixFAI: comp.prixVente || 0,
          honorairesTTC: commissionMontant(comp),
          mandatRef: comp.ref || "",
          notaire: comp.notaire || "",
          lieu: bien?.commune || "",
          typeFinancement: (["Prêt bancaire", "Fonds propres", "Mixte"] as const).includes(comp.financement as CompromisVente["typeFinancement"])
            ? comp.financement as CompromisVente["typeFinancement"]
            : "Prêt bancaire",
          vendeurs: [{ ...newPartie(), nom: comp.vendeur?.toUpperCase() || "" }],
          acquereurs: [{ ...newPartie(), nom: comp.acheteur?.toUpperCase() || "" }],
          adresseBien: bien?.adresse || "",
          commune: bien?.commune || "",
          typeBien: bien?.type || prev.typeBien,
          surfaceCarrez: bien?.surface || 0,
          surfaceTotale: bien?.surface || 0,
          descriptionSurfaces: bien?.desc || "",
        }));
      }
    }

    setPrefillRedacteur(null);
  }, [prefillRedacteur]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetDoc = () => {
    if (docType === "mandat") setMandat({ ...defaultMandat(), redacteur: agentFormalName });
    else if (docType === "compromis") setCompromis({ ...defaultCompromis(), redacteur: agentFormalName });
    else if (docType === "offre") setOffre({ ...defaultOffre(), redacteur: agentFormalName });
  };

  const docTitle = docType === "mandat"    ? "Mandat de vente"
    : docType === "compromis" ? "Compromis de vente"
    : docType === "offre"     ? "Offre d'achat"
    : "Rapport d'expertise immobilière";

  return (
    <div className="flex h-full">
      {/* Sidebar docs */}
      <aside className="w-52 shrink-0 border-r border-line bg-surface p-3 overflow-y-auto">
        <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Documents</div>
        {DOC_LIST.map(d => (
          <button key={d.id}
            onClick={() => d.navigateTo ? setView(d.navigateTo) : setDocType(d.id)}
            className={`flex w-full flex-col items-start gap-0.5 rounded px-3 py-2.5 text-left mb-1 ${docType === d.id ? "bg-primary-soft" : "hover:bg-line/50"}`}>
            <span className={`text-[13px] font-medium ${docType === d.id ? "font-semibold text-primary" : "text-ink-sub"}`}>{d.icon} {d.label}</span>
            <span className="text-[10px] text-ink-muted">{d.sub}</span>
          </button>
        ))}

        <div className="mt-3 border-t border-line pt-3">
          <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Modèles PDF</div>
          <button
            onClick={() => downloadFicheApportPromo()}
            className="flex w-full flex-col items-start gap-0.5 rounded px-3 py-2.5 text-left mb-1 hover:bg-line/50"
          >
            <span className="text-[13px] font-medium text-ink-sub">Flyer apport</span>
            <span className="text-[10px] text-ink-muted">Fiche commerciale · PDF</span>
          </button>
          <button
            onClick={() => downloadFicheApportAffaires()}
            className="flex w-full flex-col items-start gap-0.5 rounded px-3 py-2.5 text-left mb-1 hover:bg-line/50"
          >
            <span className="text-[13px] font-medium text-ink-sub">Fiche déclaration</span>
            <span className="text-[10px] text-ink-muted">Contrat à signer · PDF</span>
          </button>
        </div>

        <div className="mt-3 border-t border-line pt-3">
          <button className="btn-ghost w-full justify-center text-[12px]" onClick={resetDoc}>
            Nouveau document
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="mb-5 font-heading text-lg font-semibold text-ink">{docTitle}</h2>
        {docType === "mandat"    && <MandatForm    f={mandat}    setF={setMandat} />}
        {docType === "compromis" && <CompromisForm f={compromis} setF={setCompromis} />}
        {docType === "offre"     && <OffreForm     f={offre}     setF={setOffre} />}
      </div>
    </div>
  );
}
