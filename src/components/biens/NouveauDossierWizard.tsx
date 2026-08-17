import { useState } from "react";
import { CheckCircle, ChevronRight, ChevronLeft, User, Home, FileText, Calendar } from "lucide-react";

import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { useSaveBien, useSaveMandat, useSaveClient, useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { useUiStore } from "../../store/ui.store";
import {
  TypeBien, CategorieBien, TypeMandat, COMMUNES_MARTINIQUE,
} from "../../schemas/enums";
import type { Client, Bien, Mandat } from "../../types/domain";

const today = () => new Date().toISOString().slice(0, 10);
const inMonths = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
};

const STEPS = [
  { label: "Propriétaire", Icon: User },
  { label: "Bien", Icon: Home },
  { label: "Mandat", Icon: FileText },
];

interface Props { onClose: () => void; }

export function NouveauDossierWizard({ onClose }: Props) {
  const { data } = useAgencyData();
  const saveClient = useSaveClient();
  const saveBien = useSaveBien();
  const saveMandat = useSaveMandat();
  const user = useSessionStore((s) => s.user);
  const setView = useUiStore((s) => s.setView);

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  // Step 1 — Propriétaire
  const [useExistingClient, setUseExistingClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [client, setClient] = useState({ prenom: "", nom: "", tel: "", email: "", notes: "" });

  // Step 2 — Bien
  const [bien, setBien] = useState({
    ref: "", type: "Appartement", adresse: "", commune: "",
    surface: "", chambres: "", prix: "", cat: "vente", desc: "",
  });

  // Step 3 — Mandat
  const [mandat, setMandat] = useState({
    ref: "", type: "Exclusif", dateDebut: today(), dateFin: inMonths(3),
    honoraires: "5", notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate1 = () => {
    const e: Record<string, string> = {};
    if (useExistingClient) {
      if (!selectedClientId) e.client = "Sélectionnez un propriétaire";
    } else {
      if (!client.prenom.trim()) e.prenom = "Requis";
      if (!client.nom.trim()) e.nom = "Requis";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validate2 = () => {
    const e: Record<string, string> = {};
    if (!bien.ref.trim()) e.ref = "Requis";
    if (!bien.commune.trim()) e.commune = "Requis";
    if (!bien.prix.trim() || isNaN(Number(bien.prix))) e.prix = "Prix invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validate3 = () => {
    const e: Record<string, string> = {};
    if (!mandat.ref.trim()) e.ref = "Requis";
    if (!mandat.dateFin.trim()) e.dateFin = "Requis";
    if (!mandat.honoraires.trim() || isNaN(Number(mandat.honoraires))) e.honoraires = "Invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    setErrors({});
    if (step === 0 && !validate1()) return;
    if (step === 1 && !validate2()) return;
    setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    if (!validate3() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Résoudre le propriétaire
      let savedClient: Client;
      if (useExistingClient) {
        savedClient = data.clients.find((c) => c.id === selectedClientId)!;
      } else {
        savedClient = await saveClient.mutateAsync({
          id: "", prenom: client.prenom, nom: client.nom,
          tel: client.tel, email: client.email, type: "Vendeur",
          statut: "Prospect", budgetMax: 0, commune: "", typeBien: "",
          chambresMin: 0, notes: client.notes, bienId: "",
          dernierContact: today(), relanceDate: "",
          agentId: user?.id,
        } as Client);
      }

      // Créer le bien
      const savedBien = await saveBien.mutateAsync({
        id: "", ref: bien.ref, type: bien.type as any, adresse: bien.adresse,
        commune: bien.commune, surface: Number(bien.surface) || 0,
        chambres: Number(bien.chambres) || 0, prix: Number(bien.prix) || 0,
        cat: bien.cat as any, statut: "Disponible", desc: bien.desc, mandatId: "",
      } as Bien);

      // Créer le mandat lié
      await saveMandat.mutateAsync({
        id: "", ref: mandat.ref, type: mandat.type as any,
        bienId: savedBien.ref, clientId: savedClient.id,
        mandant: `${savedClient.prenom} ${savedClient.nom}`.trim(),
        tel: savedClient.tel, email: savedClient.email,
        dateDebut: mandat.dateDebut, dateFin: mandat.dateFin,
        honoraires: Number(mandat.honoraires), statut: "Actif",
        notes: mandat.notes,
      } as Mandat);

      setDone(true);
    } catch (err) {
      setSubmitError("Erreur lors de la création. Vérifiez votre connexion et réessayez.");
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-soft">
          <CheckCircle size={32} className="text-emerald" />
        </div>
        <div className="mb-1 text-lg font-bold text-ink">Dossier créé !</div>
        <div className="mb-6 text-sm text-ink-sub">
          Propriétaire, bien et mandat enregistrés avec succès.
        </div>
        <div className="flex justify-center gap-3">
          <button
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary/90"
            onClick={() => { setView("agenda"); onClose(); }}
          >
            <Calendar size={14} /> Planifier un RDV
          </button>
          <button
            className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink-sub hover:bg-bg"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex flex-1 items-center">
            <div className={`flex items-center gap-1.5 ${i <= step ? "text-primary" : "text-ink-muted"}`}>
              <div className={`flex size-7 items-center justify-center rounded-full text-[12px] font-bold ${i < step ? "bg-primary text-white" : i === step ? "bg-primary-soft text-primary border-2 border-primary" : "bg-line text-ink-muted"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className="hidden text-[12px] font-medium sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 h-px flex-1 ${i < step ? "bg-primary" : "bg-line"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Propriétaire */}
      {step === 0 && (
        <div className="space-y-3">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => { setUseExistingClient(false); setErrors({}); }}
              className={`flex-1 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${!useExistingClient ? "border-primary bg-primary-soft text-primary" : "border-line text-ink-sub hover:bg-bg"}`}
            >
              Nouveau propriétaire
            </button>
            <button
              onClick={() => { setUseExistingClient(true); setErrors({}); }}
              className={`flex-1 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${useExistingClient ? "border-primary bg-primary-soft text-primary" : "border-line text-ink-sub hover:bg-bg"}`}
            >
              Client existant
            </button>
          </div>

          {useExistingClient ? (
            <Field label="Sélectionner le propriétaire" error={errors.client}>
              <select
                className="w-full rounded border border-line2 bg-white px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">— Choisir —</option>
                {data.clients.filter((c) => c.type === "Vendeur").map((c) => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom}{c.tel ? ` · ${c.tel}` : ""}</option>
                ))}
                {data.clients.filter((c) => c.type !== "Vendeur").length > 0 && (
                  <option disabled>── Autres clients ──</option>
                )}
                {data.clients.filter((c) => c.type !== "Vendeur").map((c) => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom} ({c.type})</option>
                ))}
              </select>
            </Field>
          ) : (
            <>
              <Grid2>
                <Field label="Prénom *" error={errors.prenom}>
                  <Input value={client.prenom} onChange={(e) => setClient((p) => ({ ...p, prenom: e.target.value }))} placeholder="Jean" />
                </Field>
                <Field label="Nom *" error={errors.nom}>
                  <Input value={client.nom} onChange={(e) => setClient((p) => ({ ...p, nom: e.target.value }))} placeholder="Dupont" />
                </Field>
                <Field label="Téléphone">
                  <Input value={client.tel} onChange={(e) => setClient((p) => ({ ...p, tel: e.target.value }))} placeholder="0696 00 00 00" />
                </Field>
                <Field label="Email">
                  <Input type="email" value={client.email} onChange={(e) => setClient((p) => ({ ...p, email: e.target.value }))} />
                </Field>
              </Grid2>
              <Field label="Notes">
                <Textarea rows={2} value={client.notes} onChange={(e) => setClient((p) => ({ ...p, notes: e.target.value }))} placeholder="Motivations, contraintes, timing…" />
              </Field>
            </>
          )}
        </div>
      )}

      {/* Step 2 — Bien */}
      {step === 1 && (
        <div className="space-y-3">
          <Grid2>
            <Field label="Référence *" error={errors.ref}>
              <Input value={bien.ref} onChange={(e) => setBien((p) => ({ ...p, ref: e.target.value }))} placeholder="CC-001" />
            </Field>
            <Field label="Type de bien">
              <Select value={bien.type} onChange={(v) => setBien((p) => ({ ...p, type: v }))} options={TypeBien.options} />
            </Field>
            <Field label="Commune *" error={errors.commune}>
              <Select value={bien.commune} onChange={(v) => setBien((p) => ({ ...p, commune: v }))} options={[...COMMUNES_MARTINIQUE]} />
            </Field>
            <Field label="Catégorie">
              <Select value={bien.cat} onChange={(v) => setBien((p) => ({ ...p, cat: v }))} options={CategorieBien.options} />
            </Field>
            <Field label="Surface (m²)">
              <Input type="number" value={bien.surface} onChange={(e) => setBien((p) => ({ ...p, surface: e.target.value }))} />
            </Field>
            <Field label="Chambres">
              <Input type="number" value={bien.chambres} onChange={(e) => setBien((p) => ({ ...p, chambres: e.target.value }))} />
            </Field>
            <Field label="Prix (€) *" error={errors.prix}>
              <Input type="number" value={bien.prix} onChange={(e) => setBien((p) => ({ ...p, prix: e.target.value }))} />
            </Field>
          </Grid2>
          <Field label="Adresse">
            <Input value={bien.adresse} onChange={(e) => setBien((p) => ({ ...p, adresse: e.target.value }))} placeholder="12 rue des Flamboyants" />
          </Field>
          <Field label="Description">
            <Textarea rows={2} value={bien.desc} onChange={(e) => setBien((p) => ({ ...p, desc: e.target.value }))} />
          </Field>
        </div>
      )}

      {/* Step 3 — Mandat */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="rounded-lg bg-bg border border-line px-3 py-2 text-[12px] text-ink-sub">
            Propriétaire : <strong className="text-ink">
              {useExistingClient
                ? data.clients.find((c) => c.id === selectedClientId)?.prenom + " " + data.clients.find((c) => c.id === selectedClientId)?.nom
                : `${client.prenom} ${client.nom}`}
            </strong> · Bien : <strong className="text-ink">{bien.ref} — {bien.commune}</strong>
          </div>
          <Grid2>
            <Field label="Référence mandat *" error={errors.ref}>
              <Input value={mandat.ref} onChange={(e) => setMandat((p) => ({ ...p, ref: e.target.value }))} placeholder="M-2026-001" />
            </Field>
            <Field label="Type de mandat">
              <Select value={mandat.type} onChange={(v) => setMandat((p) => ({ ...p, type: v }))} options={TypeMandat.options} />
            </Field>
            <Field label="Date début">
              <Input type="date" value={mandat.dateDebut} onChange={(e) => setMandat((p) => ({ ...p, dateDebut: e.target.value }))} />
            </Field>
            <Field label="Date fin *" error={errors.dateFin}>
              <Input type="date" value={mandat.dateFin} onChange={(e) => setMandat((p) => ({ ...p, dateFin: e.target.value }))} />
            </Field>
            <Field label="Honoraires (%)" error={errors.honoraires}>
              <Input type="number" value={mandat.honoraires} onChange={(e) => setMandat((p) => ({ ...p, honoraires: e.target.value }))} />
            </Field>
          </Grid2>
          <Field label="Notes">
            <Textarea rows={2} value={mandat.notes} onChange={(e) => setMandat((p) => ({ ...p, notes: e.target.value }))} />
          </Field>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        <button
          onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
          className="flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink-sub hover:bg-bg"
        >
          <ChevronLeft size={14} /> {step === 0 ? "Annuler" : "Retour"}
        </button>
        {step < 2 ? (
          <button
            onClick={next}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-primary/90"
          >
            Suivant <ChevronRight size={14} />
          </button>
        ) : (
          <div className="flex flex-col items-end gap-1">
            {submitError && (
              <div className="text-[12px] text-danger">{submitError}</div>
            )}
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              <CheckCircle size={14} /> {submitting ? "Création…" : "Créer le dossier"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
