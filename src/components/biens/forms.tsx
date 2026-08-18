import { useState } from "react";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { FormActions } from "../ui/Modal";
import { bienFormSchema } from "../../schemas/bien.schema";
import { mandatFormSchema } from "../../schemas/mandat.schema";
import { PhotosUpload } from "./PhotosUpload";
import {
  TypeBien, CategorieBien, StatutVente, StatutLocation, TypeMandat, StatutMandat,
  COMMUNES_MARTINIQUE,
} from "../../schemas/enums";
import { baremeHonoraires } from "../../lib/format";
import type { Bien, Mandat } from "../../types/domain";
import type { Client } from "../../types/domain";

type Errors = Record<string, string>;

function zodErrors(issues: { path: (string | number)[]; message: string }[]): Errors {
  const e: Errors = {};
  for (const i of issues) { const k = String(i.path[0]); if (!e[k]) e[k] = i.message; }
  return e;
}

type BienFields = "ref" | "type" | "adresse" | "commune" | "surface" | "chambres" | "prix" | "cat" | "statut" | "desc";

export function BienForm({ initial, onSave, onClose }: {
  initial?: Bien; onSave: (b: Bien) => void; onClose: () => void;
}) {
  const [f, setF] = useState<Record<BienFields, string>>(() => ({
    ref: initial?.ref ?? "", type: initial?.type ?? "Appartement",
    adresse: initial?.adresse ?? "", commune: initial?.commune ?? "",
    surface: String(initial?.surface ?? ""), chambres: String(initial?.chambres ?? ""),
    prix: String(initial?.prix ?? ""), cat: initial?.cat ?? "vente",
    statut: initial?.statut ?? "Disponible", desc: initial?.desc ?? "",
  }));
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [errors, setErrors] = useState<Errors>({});
  const s = (k: BienFields) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const parsed = bienFormSchema.safeParse(f);
    if (!parsed.success) { setErrors(zodErrors(parsed.error.issues)); return; }
    onSave({ ...parsed.data, id: initial?.id ?? "", mandatId: initial?.mandatId ?? "", photos: photos.length > 0 ? photos : undefined });
  };

  const statuts = f.cat === "location" ? StatutLocation.options : StatutVente.options;

  return (
    <>
      <Grid2>
        <Field label="Référence" error={errors.ref}><Input value={f.ref} onChange={(e) => s("ref")(e.target.value)} placeholder="CC-0XX" /></Field>
        <Field label="Type de bien"><Select value={f.type} onChange={s("type")} options={TypeBien.options} /></Field>
        <Field label="Adresse"><Input value={f.adresse} onChange={(e) => s("adresse")(e.target.value)} /></Field>
        <Field label="Commune" error={errors.commune}><Select value={f.commune} onChange={s("commune")} options={COMMUNES_MARTINIQUE} /></Field>
        <Field label="Surface (m²)"><Input type="number" value={f.surface} onChange={(e) => s("surface")(e.target.value)} /></Field>
        <Field label="Chambres"><Input type="number" value={f.chambres} onChange={(e) => s("chambres")(e.target.value)} /></Field>
        <Field label="Catégorie"><Select value={f.cat} onChange={s("cat")} options={CategorieBien.options} /></Field>
        <Field label="Statut"><Select value={f.statut} onChange={s("statut")} options={statuts} /></Field>
        <Field label="Prix (€)" error={errors.prix}><Input type="number" value={f.prix} onChange={(e) => s("prix")(e.target.value)} /></Field>
      </Grid2>
      <Field label="Description"><Textarea rows={3} value={f.desc} onChange={(e) => s("desc")(e.target.value)} placeholder="" /></Field>
      <Field label="Photos">
        <PhotosUpload
          bienRef={f.ref || "nouveau"}
          photos={photos}
          onChange={setPhotos}
        />
      </Field>
      <FormActions onSave={submit} onClose={onClose} />
    </>
  );
}

type MandatFields = "ref" | "bienId" | "clientId" | "type" | "mandant" | "tel" | "email" | "dateDebut" | "dateFin" | "honoraires" | "statut" | "notes";

export function MandatForm({ initial, biens, clients, onSave, onClose }: {
  initial?: Partial<Mandat>;
  biens: Bien[];
  clients: Client[];
  onSave: (m: Mandat) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState<Record<MandatFields, string>>(() => ({
    ref: initial?.ref ?? "", bienId: initial?.bienId ?? "",
    clientId: initial?.clientId ?? "",
    type: initial?.type ?? "Exclusif",
    mandant: initial?.mandant ?? "", tel: initial?.tel ?? "", email: initial?.email ?? "",
    dateDebut: initial?.dateDebut ?? "", dateFin: initial?.dateFin ?? "",
    honoraires: String(initial?.honoraires ?? ""), statut: initial?.statut ?? "Actif",
    notes: initial?.notes ?? "",
  }));
  const [errors, setErrors] = useState<Errors>({});
  const s = (k: MandatFields) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  // Sélection d'un client vendeur → auto-remplit nom, tel, email
  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setF(p => ({
      ...p,
      clientId,
      mandant: client ? `${client.prenom} ${client.nom}`.trim() : p.mandant,
      tel: client?.tel || p.tel,
      email: client?.email || p.email,
    }));
  };

  const submit = () => {
    const parsed = mandatFormSchema.safeParse(f);
    if (!parsed.success) { setErrors(zodErrors(parsed.error.issues)); return; }
    onSave({ ...parsed.data, id: (initial as Mandat | undefined)?.id ?? "" });
  };

  const vendeurs = clients.filter(c => c.type === "Vendeur");

  return (
    <>
      <Grid2>
        <Field label="Référence" error={errors.ref}><Input value={f.ref} onChange={(e) => s("ref")(e.target.value)} placeholder="M-2026-XXX" /></Field>
        <Field label="Type de mandat"><Select value={f.type} onChange={s("type")} options={TypeMandat.options} /></Field>
      </Grid2>

      {/* Sélecteur client vendeur */}
      <Field label="Vendeur (client CRM)">
        <select
          className="w-full rounded border border-line2 bg-white px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={f.clientId}
          onChange={e => handleClientSelect(e.target.value)}
        >
          <option value="">— Saisie manuelle —</option>
          {vendeurs.map(c => (
            <option key={c.id} value={c.id}>{c.prenom} {c.nom}{c.tel ? ` · ${c.tel}` : ""}</option>
          ))}
          {clients.filter(c => c.type !== "Vendeur").length > 0 && vendeurs.length > 0 && (
            <option disabled>──────────────</option>
          )}
          {clients.filter(c => c.type !== "Vendeur").map(c => (
            <option key={c.id} value={c.id}>{c.prenom} {c.nom} ({c.type})</option>
          ))}
        </select>
      </Field>

      <Grid2>
        <Field label="Mandant" error={errors.mandant}><Input value={f.mandant} onChange={(e) => s("mandant")(e.target.value)} /></Field>
        <Field label="Téléphone"><Input value={f.tel} onChange={(e) => s("tel")(e.target.value)} /></Field>
        <Field label="Email" error={errors.email}><Input type="email" value={f.email} onChange={(e) => s("email")(e.target.value)} /></Field>
        <Field label="Bien lié">
          <select
            className="w-full rounded border border-line2 bg-white px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={f.bienId}
            onChange={e => s("bienId")(e.target.value)}
          >
            <option value="">— Aucun —</option>
            {biens.map(b => (
              <option key={b.id} value={b.ref}>{b.ref} · {b.adresse || b.commune}</option>
            ))}
          </select>
        </Field>
        <Field label="Date début"><Input type="date" value={f.dateDebut} onChange={(e) => s("dateDebut")(e.target.value)} /></Field>
        <Field label="Date fin" error={errors.dateFin}><Input type="date" value={f.dateFin} onChange={(e) => s("dateFin")(e.target.value)} /></Field>
        <Field label="Honoraires (%)" error={errors.honoraires}>
          <div className="flex gap-2">
            <Input type="number" value={f.honoraires} onChange={(e) => s("honoraires")(e.target.value)} />
            {biens.length > 0 && f.bienId && (() => {
              const bien = biens.find(b => b.ref === f.bienId || b.id === f.bienId);
              return bien?.prix ? (
                <button
                  type="button"
                  onClick={() => s("honoraires")(String(baremeHonoraires(bien.prix)))}
                  className="shrink-0 rounded border border-primary bg-primary-soft px-2 text-[11px] font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                  title={`Barème : ${baremeHonoraires(bien.prix)}% pour ${Math.round(bien.prix / 1000)}k€`}
                >
                  Barème
                </button>
              ) : null;
            })()}
          </div>
        </Field>
        <Field label="Statut"><Select value={f.statut} onChange={s("statut")} options={StatutMandat.options} /></Field>
      </Grid2>
      <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={(e) => s("notes")(e.target.value)} /></Field>
      <FormActions onSave={submit} onClose={onClose} />
    </>
  );
}
