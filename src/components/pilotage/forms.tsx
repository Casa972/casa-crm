import { useState } from "react";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { FormActions } from "../ui/Modal";
import { compromisFormSchema, commissionMontant } from "../../schemas/compromis.schema";
import { clientFormSchema } from "../../schemas/client.schema";
import { revenuFormSchema } from "../../schemas/client.schema";
import {
  StatutCompromis, StatutCommission, TypeHonoraires,
  TypeClient, EtapePipeline, TypeRevenu, StatutRevenu, COMMUNES_MARTINIQUE,
} from "../../schemas/enums";
import { eur } from "../../lib/format";
import type { Compromis, Client, Revenu } from "../../types/domain";

type Errors = Record<string, string>;
function zodErrors(issues: readonly { path: readonly (string | number)[]; message: string }[]): Errors {
  const e: Errors = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "_");
    if (!(k in e)) e[k] = i.message;
  }
  return e;
}

const today = () => new Date().toISOString().slice(0, 10);

/* ─────────── COMPROMIS ─────────── */
type CF =
  | "ref" | "acheteur" | "vendeur" | "bienRef" | "bienDesc" | "prixVente"
  | "typeHonoraires" | "honoraires" | "statut" | "commissionStatut"
  | "notaire" | "financement" | "dateOffre" | "dateCompromis" | "dateActePrev"
  | "dateActeReel" | "sruExpire" | "condSuspExpire" | "notes";

export function CompromisForm({ initial, onSave, onClose }: {
  initial?: Compromis; onSave: (c: Compromis) => void; onClose: () => void;
}) {
  const [f, setF] = useState<Record<CF, string>>(() => ({
    ref: initial?.ref ?? "", acheteur: initial?.acheteur ?? "", vendeur: initial?.vendeur ?? "",
    bienRef: initial?.bienRef ?? "", bienDesc: initial?.bienDesc ?? "",
    prixVente: String(initial?.prixVente ?? ""), typeHonoraires: initial?.typeHonoraires ?? "pct",
    honoraires: String(initial?.honoraires ?? ""), statut: initial?.statut ?? "Offre acceptée",
    commissionStatut: initial?.commissionStatut ?? "À encaisser", notaire: initial?.notaire ?? "",
    financement: initial?.financement ?? "", dateOffre: initial?.dateOffre ?? today(),
    dateCompromis: initial?.dateCompromis ?? "", dateActePrev: initial?.dateActePrev ?? "",
    dateActeReel: initial?.dateActeReel ?? "", sruExpire: initial?.sruExpire ?? "",
    condSuspExpire: initial?.condSuspExpire ?? "", notes: initial?.notes ?? "",
  }));
  const [errors, setErrors] = useState<Errors>({});
  const s = (k: CF) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const preview = commissionMontant({
    typeHonoraires: f.typeHonoraires as Compromis["typeHonoraires"],
    prixVente: Number(f.prixVente) || 0,
    honoraires: Number(f.honoraires) || 0,
  });

  const submit = () => {
    const parsed = compromisFormSchema.safeParse(f);
    if (!parsed.success) { setErrors(zodErrors(parsed.error.issues)); return; }
    onSave({ ...parsed.data, id: initial?.id ?? "", agentId: initial?.agentId });
  };

  return (
    <>
      <Grid2>
        <Field label="Référence dossier" error={errors.ref}><Input value={f.ref} onChange={(e) => s("ref")(e.target.value)} placeholder="COMP-2026-XXX" /></Field>
        <Field label="Statut dossier"><Select value={f.statut} onChange={s("statut")} options={StatutCompromis.options} /></Field>
        <Field label="Acheteur" error={errors.acheteur}><Input value={f.acheteur} onChange={(e) => s("acheteur")(e.target.value)} /></Field>
        <Field label="Vendeur"><Input value={f.vendeur} onChange={(e) => s("vendeur")(e.target.value)} /></Field>
        <Field label="Réf. bien"><Input value={f.bienRef} onChange={(e) => s("bienRef")(e.target.value)} placeholder="CC-0XX" /></Field>
        <Field label="Désignation bien"><Input value={f.bienDesc} onChange={(e) => s("bienDesc")(e.target.value)} /></Field>
        <Field label="Prix de vente (€)" error={errors.prixVente}><Input type="number" value={f.prixVente} onChange={(e) => s("prixVente")(e.target.value)} /></Field>
        <Field label="Type honoraires"><Select value={f.typeHonoraires} onChange={s("typeHonoraires")} options={TypeHonoraires.options} /></Field>
        <Field label={f.typeHonoraires === "pct" ? "Honoraires (%)" : "Honoraires (€)"} error={errors.honoraires}><Input type="number" value={f.honoraires} onChange={(e) => s("honoraires")(e.target.value)} /></Field>
        <Field label="Statut commission"><Select value={f.commissionStatut} onChange={s("commissionStatut")} options={StatutCommission.options} /></Field>
        <Field label="Notaire"><Input value={f.notaire} onChange={(e) => s("notaire")(e.target.value)} placeholder="Maître ..." /></Field>
        <Field label="Financement"><Input value={f.financement} onChange={(e) => s("financement")(e.target.value)} /></Field>
      </Grid2>
      <div className="mb-2 mt-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Dates clés</div>
      <Grid2>
        <Field label="Date de l'offre"><Input type="date" value={f.dateOffre} onChange={(e) => s("dateOffre")(e.target.value)} /></Field>
        <Field label="Date du compromis"><Input type="date" value={f.dateCompromis} onChange={(e) => s("dateCompromis")(e.target.value)} /></Field>
        <Field label="Date d'acte prévue"><Input type="date" value={f.dateActePrev} onChange={(e) => s("dateActePrev")(e.target.value)} /></Field>
        <Field label="Date d'acte réelle" error={errors.dateActeReel}><Input type="date" value={f.dateActeReel} onChange={(e) => s("dateActeReel")(e.target.value)} /></Field>
        <Field label="Fin délai SRU"><Input type="date" value={f.sruExpire} onChange={(e) => s("sruExpire")(e.target.value)} /></Field>
        <Field label="Fin cond. suspensives"><Input type="date" value={f.condSuspExpire} onChange={(e) => s("condSuspExpire")(e.target.value)} /></Field>
      </Grid2>
      <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={(e) => s("notes")(e.target.value)} /></Field>
      <div className="mb-1 flex items-center justify-between rounded bg-primary-soft px-3.5 py-2.5">
        <span className="text-[12.5px] font-semibold text-primary">Commission estimée</span>
        <span className="font-heading text-base font-bold text-primary">{eur(preview)}</span>
      </div>
      <FormActions onSave={submit} onClose={onClose} />
    </>
  );
}

/* ─────────── CLIENT ─────────── */
type ClF = "prenom" | "nom" | "email" | "tel" | "type" | "statut" | "budgetMax" | "commune" | "typeBien" | "chambresMin" | "notes" | "bienId" | "dernierContact" | "relanceDate" | "financement";

export function ClientForm({ initial, onSave, onClose }: {
  initial?: Client; onSave: (c: Client) => void; onClose: () => void;
}) {
  const [f, setF] = useState<Record<ClF, string>>(() => ({
    prenom: initial?.prenom ?? "", nom: initial?.nom ?? "", email: initial?.email ?? "",
    tel: initial?.tel ?? "", type: initial?.type ?? "Acheteur", statut: initial?.statut ?? "Prospect",
    budgetMax: String(initial?.budgetMax ?? ""), commune: initial?.commune ?? "",
    typeBien: initial?.typeBien ?? "", chambresMin: String(initial?.chambresMin ?? ""),
    notes: initial?.notes ?? "", bienId: initial?.bienId ?? "",
    dernierContact: initial?.dernierContact ?? today(), relanceDate: initial?.relanceDate ?? "",
    financement: initial?.financement ?? "",
  }));
  const [errors, setErrors] = useState<Errors>({});
  const s = (k: ClF) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const parsed = clientFormSchema.safeParse(f);
    if (!parsed.success) { setErrors(zodErrors(parsed.error.issues)); return; }
    onSave({ ...parsed.data, id: initial?.id ?? "", agentId: initial?.agentId });
  };

  return (
    <>
      <Grid2>
        <Field label="Prénom" error={errors.prenom}><Input value={f.prenom} onChange={(e) => s("prenom")(e.target.value)} /></Field>
        <Field label="Nom"><Input value={f.nom} onChange={(e) => s("nom")(e.target.value)} /></Field>
        <Field label="Téléphone"><Input value={f.tel} onChange={(e) => s("tel")(e.target.value)} /></Field>
        <Field label="Email" error={errors.email}><Input type="email" value={f.email} onChange={(e) => s("email")(e.target.value)} /></Field>
        <Field label="Profil"><Select value={f.type} onChange={s("type")} options={TypeClient.options} /></Field>
        <Field label="Étape"><Select value={f.statut} onChange={s("statut")} options={EtapePipeline.options} /></Field>
        <Field label="Budget max (€)"><Input type="number" value={f.budgetMax} onChange={(e) => s("budgetMax")(e.target.value)} /></Field>
        <Field label="Commune"><Select value={f.commune} onChange={s("commune")} options={COMMUNES_MARTINIQUE} placeholder="— Indifférent —" /></Field>
        <Field label="Dernier contact"><Input type="date" value={f.dernierContact} onChange={(e) => s("dernierContact")(e.target.value)} /></Field>
        <Field label="Relance prévue"><Input type="date" value={f.relanceDate} onChange={(e) => s("relanceDate")(e.target.value)} /></Field>
      </Grid2>
      <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={(e) => s("notes")(e.target.value)} /></Field>
      <FormActions onSave={submit} onClose={onClose} />
    </>
  );
}

/* ─────────── REVENU ─────────── */
type RF = "date" | "type" | "montant" | "desc" | "statut";

export function RevenuForm({ initial, onSave, onClose }: {
  initial?: Revenu; onSave: (r: Revenu) => void; onClose: () => void;
}) {
  const [f, setF] = useState<Record<RF, string>>(() => ({
    date: initial?.date ?? today(), type: initial?.type ?? "Commission vente",
    montant: String(initial?.montant ?? ""), desc: initial?.desc ?? "",
    statut: initial?.statut ?? "Encaissé",
  }));
  const [errors, setErrors] = useState<Errors>({});
  const s = (k: RF) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const parsed = revenuFormSchema.safeParse(f);
    if (!parsed.success) { setErrors(zodErrors(parsed.error.issues)); return; }
    onSave({ ...parsed.data, id: initial?.id ?? "", source: initial?.source, sourceId: initial?.sourceId });
  };

  return (
    <>
      <Grid2>
        <Field label="Date"><Input type="date" value={f.date} onChange={(e) => s("date")(e.target.value)} /></Field>
        <Field label="Montant (€)" error={errors.montant}><Input type="number" value={f.montant} onChange={(e) => s("montant")(e.target.value)} /></Field>
        <Field label="Type"><Select value={f.type} onChange={s("type")} options={TypeRevenu.options} /></Field>
        <Field label="Statut"><Select value={f.statut} onChange={s("statut")} options={StatutRevenu.options} /></Field>
      </Grid2>
      <Field label="Description"><Textarea rows={2} value={f.desc} onChange={(e) => s("desc")(e.target.value)} /></Field>
      <FormActions onSave={submit} onClose={onClose} />
    </>
  );
}
