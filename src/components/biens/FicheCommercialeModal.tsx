import { useState, Suspense, lazy } from "react";
import { X, Plus, Star } from "lucide-react";
import { Field, Grid2, Input, Textarea } from "../ui/Field";
import type { Bien } from "../../types/domain";
import type { FicheCommerciale } from "../../schemas/ficheCommerciale.schema";
import { POINTS_FORTS_SUGERES } from "../../schemas/ficheCommerciale.schema";
import { eur } from "../../lib/format";

const FicheCommercialePDFDownload = lazy(() => import("./FicheCommercialePDFDownload"));

function newFiche(bien: Bien): FicheCommerciale {
  return {
    bienId: bien.id,
    titreFiche: `${bien.type} – ${bien.commune}`,
    descriptionCommerciale: bien.desc || "",
    pointsForts: [],
    photoPrincipale: "",
    photos: [],
    dpe: "", ges: "",
    taxeFonciere: 0, chargesCopro: 0,
    anneeConstruction: "", chauffage: "", exposition: "", vue: "", digicode: "",
    contactNom: "M. Luc CLEMENTE",
    contactTel: "0696 XX XX XX",
    contactEmail: "contact@casacaraibes.com",
  };
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("Lecture impossible"));
    r.readAsDataURL(file);
  });
}

export function FicheCommercialeModal({ bien, onClose }: { bien: Bien; onClose: () => void }) {
  const [fiche, setFiche] = useState<FicheCommerciale>(() => newFiche(bien));
  const [tab, setTab] = useState<"contenu" | "photos" | "infos" | "contact">("contenu");
  const [ready, setReady] = useState(false);
  const upd = <K extends keyof FicheCommerciale>(k: K, v: FicheCommerciale[K]) =>
    setFiche(p => ({ ...p, [k]: v }));

  const handleMainPhoto = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]; if (!file) return;
    const b64 = await readFileAsBase64(file);
    upd("photoPrincipale", b64);
  };

  const handleAddPhotos = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(ev.target.files ?? []);
    const b64s = await Promise.all(files.map(readFileAsBase64));
    upd("photos", [...fiche.photos, ...b64s].slice(0, 5));
  };

  const togglePoint = (p: string) => {
    if (fiche.pointsForts.includes(p)) {
      upd("pointsForts", fiche.pointsForts.filter(x => x !== p));
    } else {
      upd("pointsForts", [...fiche.pointsForts, p]);
    }
  };

  const TABS = [
    { id: "contenu" as const, label: "Contenu" },
    { id: "photos" as const, label: "Photos" },
    { id: "infos" as const, label: "Infos pratiques" },
    { id: "contact" as const, label: "Contact" },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-[720px] rounded-xl bg-surface shadow-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-heading text-base font-semibold text-ink">Fiche commerciale</h2>
            <p className="text-[12.5px] text-ink-muted">{bien.ref} — {bien.type}, {bien.commune} · {eur(bien.prix)}</p>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-ink-muted hover:bg-line/60"><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line px-5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-[12.5px] font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? "border-primary text-primary font-semibold" : "border-transparent text-ink-sub hover:text-ink"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* CONTENU */}
          {tab === "contenu" && (
            <div>
              <Field label="Titre de la fiche">
                <Input value={fiche.titreFiche} onChange={e => upd("titreFiche", e.target.value)} placeholder="" />
              </Field>
              <Field label="Description commerciale">
                <Textarea rows={6} value={fiche.descriptionCommerciale} onChange={e => upd("descriptionCommerciale", e.target.value)} placeholder="" />
              </Field>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Points forts</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {POINTS_FORTS_SUGERES.map(p => (
                  <button key={p} onClick={() => togglePoint(p)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${fiche.pointsForts.includes(p) ? "border-emerald bg-emerald-soft text-emerald" : "border-line2 text-ink-sub hover:border-primary/40 hover:text-primary"}`}>
                    {fiche.pointsForts.includes(p) && <Star size={10} className="fill-emerald text-emerald" />}
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PHOTOS */}
          {tab === "photos" && (
            <div>
              <div className="mb-4">
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Photo principale (couverture)</div>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line2 bg-bg p-4 hover:border-primary/40 transition-colors">
                  {fiche.photoPrincipale ? (
                    <div className="relative w-full">
                      <img src={fiche.photoPrincipale} className="h-48 w-full rounded-lg object-cover" />
                      <button className="absolute right-2 top-2 rounded bg-danger-soft p-1 text-danger" onClick={e => { e.preventDefault(); upd("photoPrincipale", ""); }}><X size={12} /></button>
                    </div>
                  ) : (
                    <>
                      <Plus size={24} className="mb-2 text-ink-muted" />
                      <span className="text-[12.5px] text-ink-muted">Cliquez pour ajouter la photo principale</span>
                      <span className="text-[11px] text-ink-muted">JPG, PNG — max 5 Mo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleMainPhoto} />
                </label>
              </div>

              <div>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Galerie (jusqu'à 5 photos)</div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {fiche.photos.map((photo, i) => (
                    <div key={i} className="relative">
                      <img src={photo} className="h-28 w-full rounded-lg object-cover" />
                      <button className="absolute right-1.5 top-1.5 rounded bg-danger-soft p-1 text-danger" onClick={() => upd("photos", fiche.photos.filter((_, j) => j !== i))}><X size={11} /></button>
                    </div>
                  ))}
                  {fiche.photos.length < 5 && (
                    <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line2 bg-bg hover:border-primary/40 transition-colors">
                      <Plus size={20} className="text-ink-muted" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* INFOS */}
          {tab === "infos" && (
            <div>
              <Grid2>
                <Field label="Exposition"><Input value={fiche.exposition} onChange={e => upd("exposition", e.target.value)} placeholder="Sud-Est" /></Field>
                <Field label="Vue"><Input value={fiche.vue} onChange={e => upd("vue", e.target.value)} placeholder="Mer, montagne, dégagée…" /></Field>
                <Field label="Année de construction"><Input value={fiche.anneeConstruction} onChange={e => upd("anneeConstruction", e.target.value)} placeholder="2005" /></Field>
                <Field label="Chauffage"><Input value={fiche.chauffage} onChange={e => upd("chauffage", e.target.value)} placeholder="Climatisation, VMC…" /></Field>
                <Field label="Classe DPE"><Input value={fiche.dpe} onChange={e => upd("dpe", e.target.value)} placeholder="C" /></Field>
                <Field label="GES"><Input value={fiche.ges} onChange={e => upd("ges", e.target.value)} placeholder="D" /></Field>
                <Field label="Taxe foncière (€/an)"><Input type="number" value={String(fiche.taxeFonciere || "")} onChange={e => upd("taxeFonciere", +e.target.value)} /></Field>
                <Field label="Charges copro (€/trim.)"><Input type="number" value={String(fiche.chargesCopro || "")} onChange={e => upd("chargesCopro", +e.target.value)} /></Field>
              </Grid2>
            </div>
          )}

          {/* CONTACT */}
          {tab === "contact" && (
            <div>
              <Grid2>
                <Field label="Nom du contact"><Input value={fiche.contactNom} onChange={e => upd("contactNom", e.target.value)} /></Field>
                <Field label="Téléphone"><Input value={fiche.contactTel} onChange={e => upd("contactTel", e.target.value)} /></Field>
                <Field label="Email"><Input type="email" value={fiche.contactEmail} onChange={e => upd("contactEmail", e.target.value)} /></Field>
              </Grid2>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <button className="btn-ghost" onClick={onClose}>Annuler</button>
          <div className="flex items-center gap-3">
            {!ready && (
              <button className="btn-primary" onClick={() => setReady(true)}>
                Générer la fiche PDF
              </button>
            )}
            {ready && (
              <Suspense fallback={<button className="btn-primary opacity-60">Préparation du PDF…</button>}>
                <FicheCommercialePDFDownload bien={bien} fiche={fiche} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
