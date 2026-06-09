import { useState, Suspense, lazy } from "react";
import { Plus, Edit2, Trash2, Download, ClipboardList, Phone, MapPin, Calendar, ChevronRight } from "lucide-react";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { Modal, EmptyState } from "../ui/Modal";
import { StatusPill } from "../shared/StatusPill";
import { PageHeader } from "../shared/PageHeader";
import {
  useCompteRendus, useSaveCompteRendu, useDeleteCompteRendu, uid,
} from "../../hooks/queries/useCompteRendus";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import type { CompteRendu } from "../../schemas/compteRendu.schema";
import { AvisClient, SuiteDonner, COMMUNES_MARTINIQUE } from "../../schemas/enums";
import { eur, fdate } from "../../lib/format";

const CompteRenduPDFDownload = lazy(() => import("./CompteRenduPDFDownload"));

const today = () => new Date().toISOString().slice(0, 10);

function newCR(agentId?: string): CompteRendu {
  return {
    id: uid(), agentId,
    date: today(), heureDebut: "", heureFin: "", redacteur: "M. Luc CLEMENTE",
    bienRef: "", bienAdresse: "", bienCommune: "", bienType: "", bienSurface: 0, bienPrix: 0,
    proprietaireNom: "", proprietaireTel: "", clientId: "",
    visiteurNom: "", visiteurTel: "", visiteurEmail: "", nbPersonnes: 1,
    pointsPositifs: "", pointsNegatifs: "",
    avisClient: "Intéressé", budgetClient: 0, financement: "", delaiAchat: "",
    suiteDonner: "En réflexion", dateRelance: "",
    observations: "",
    statut: "Brouillon",
  };
}

const AVIS_TONE: Record<string, string> = {
  "Très intéressé": "bg-emerald-soft text-emerald",
  "Intéressé": "bg-emerald-soft text-emerald",
  "Offre possible": "bg-violet-soft text-violet",
  "Mitigé": "bg-amber-soft text-amber",
  "En réflexion": "bg-amber-soft text-amber",
  "Pas intéressé": "bg-danger-soft text-danger",
};

type CRField = keyof CompteRendu;

/* ─── Formulaire ─────────────────────────────────────────────────────────── */
function CRForm({ initial, onSave }: {
  initial: CompteRendu;
  onSave: (cr: CompteRendu) => void;
}) {
  const [cr, setCr] = useState<CompteRendu>(initial);
  const { data } = useAgencyData();
  const upd = (k: CRField, v: unknown) => setCr(p => ({ ...p, [k]: v }));
  const [tab, setTab] = useState<"visite" | "bien" | "avis" | "notes">("visite");

  const TABS = [
    { id: "visite" as const, label: "Visite & Visiteur" },
    { id: "bien" as const, label: "Bien visité" },
    { id: "avis" as const, label: "Avis & Suite" },
    { id: "notes" as const, label: "Observations" },
  ];

  // Pré-remplir depuis un client existant
  const linkClient = (clientId: string) => {
    const client = data.clients.find(c => c.id === clientId);
    if (client) {
      upd("clientId", clientId);
      upd("visiteurNom", `${client.prenom} ${client.nom}`.trim());
      if (client.tel) upd("visiteurTel", client.tel);
      if (client.email) upd("visiteurEmail", client.email);
      if (client.budgetMax) upd("budgetClient", client.budgetMax);
    }
  };

  // Pré-remplir depuis un bien existant
  const linkBien = (bienId: string) => {
    const bien = data.biens.find(b => b.id === bienId || b.ref === bienId);
    if (bien) {
      upd("bienRef", bien.ref);
      upd("bienAdresse", bien.adresse);
      upd("bienCommune", bien.commune);
      upd("bienType", bien.type);
      upd("bienSurface", bien.surface);
      upd("bienPrix", bien.prix);
      // Chercher le mandant lié
      const mandat = data.mandats.find(m => m.bienId === bien.id || m.bienId === bien.ref);
      if (mandat) {
        upd("proprietaireNom", mandat.mandant);
        upd("proprietaireTel", mandat.tel);
      }
    }
  };

  return (
    <>
      {/* Tabs internes */}
      <div className="mb-4 flex gap-1 border-b border-line pb-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-[12.5px] font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? "border-primary text-primary font-semibold" : "border-transparent text-ink-sub hover:text-ink"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Onglet 1 — Visite & Visiteur */}
      {tab === "visite" && (
        <div>
          <Grid2>
            <Field label="Date de visite"><Input type="date" value={cr.date} onChange={e => upd("date", e.target.value)} /></Field>
            <Field label="Rédacteur"><Input value={cr.redacteur} onChange={e => upd("redacteur", e.target.value)} /></Field>
            <Field label="Heure début"><Input type="time" value={cr.heureDebut} onChange={e => upd("heureDebut", e.target.value)} /></Field>
            <Field label="Heure fin"><Input type="time" value={cr.heureFin} onChange={e => upd("heureFin", e.target.value)} /></Field>
          </Grid2>

          {data.clients.length > 0 && (
            <Field label="Lier à un client existant (pré-remplit les champs)">
              <select className="w-full rounded border border-line2 bg-surface px-3 py-2 text-[13.5px]"
                value={cr.clientId} onChange={e => linkClient(e.target.value)}>
                <option value="">— Sélectionner un client —</option>
                {data.clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom} {c.tel ? `· ${c.tel}` : ""}</option>)}
              </select>
            </Field>
          )}

          <Grid2>
            <Field label="Nom du visiteur *"><Input value={cr.visiteurNom} onChange={e => upd("visiteurNom", e.target.value)} placeholder="M. et Mme DUPONT" /></Field>
            <Field label="Téléphone"><Input value={cr.visiteurTel} onChange={e => upd("visiteurTel", e.target.value)} placeholder="0696 XX XX XX" /></Field>
            <Field label="Email"><Input type="email" value={cr.visiteurEmail} onChange={e => upd("visiteurEmail", e.target.value)} /></Field>
            <Field label="Nombre de personnes"><Input type="number" value={String(cr.nbPersonnes)} onChange={e => upd("nbPersonnes", +e.target.value)} /></Field>
          </Grid2>
        </div>
      )}

      {/* Onglet 2 — Bien */}
      {tab === "bien" && (
        <div>
          {data.biens.length > 0 && (
            <Field label="Lier à un bien existant (pré-remplit les champs)">
              <select className="w-full rounded border border-line2 bg-surface px-3 py-2 text-[13.5px]"
                value={cr.bienRef} onChange={e => linkBien(e.target.value)}>
                <option value="">— Sélectionner un bien —</option>
                {data.biens.map(b => <option key={b.id} value={b.id}>{b.ref} — {b.type}, {b.commune} ({b.surface}m²)</option>)}
              </select>
            </Field>
          )}
          <Grid2>
            <Field label="Référence bien"><Input value={cr.bienRef} onChange={e => upd("bienRef", e.target.value)} placeholder="CC-0XX" /></Field>
            <Field label="Type de bien"><Input value={cr.bienType} onChange={e => upd("bienType", e.target.value)} placeholder="Appartement T3" /></Field>
            <Field label="Adresse"><Input value={cr.bienAdresse} onChange={e => upd("bienAdresse", e.target.value)} /></Field>
            <Field label="Commune"><Select value={cr.bienCommune} onChange={v => upd("bienCommune", v)} options={[...COMMUNES_MARTINIQUE]} /></Field>
            <Field label="Surface (m²)"><Input type="number" value={String(cr.bienSurface || "")} onChange={e => upd("bienSurface", +e.target.value)} /></Field>
            <Field label="Prix affiché (€)"><Input type="number" value={String(cr.bienPrix || "")} onChange={e => upd("bienPrix", +e.target.value)} /></Field>
            <Field label="Propriétaire / Mandant"><Input value={cr.proprietaireNom} onChange={e => upd("proprietaireNom", e.target.value)} /></Field>
            <Field label="Tél. propriétaire"><Input value={cr.proprietaireTel} onChange={e => upd("proprietaireTel", e.target.value)} /></Field>
          </Grid2>
        </div>
      )}

      {/* Onglet 3 — Avis & Suite */}
      {tab === "avis" && (
        <div>
          <Grid2>
            <Field label="Avis du visiteur"><Select value={cr.avisClient} onChange={v => upd("avisClient", v)} options={AvisClient.options} /></Field>
            <Field label="Budget déclaré (€)"><Input type="number" value={String(cr.budgetClient || "")} onChange={e => upd("budgetClient", +e.target.value)} /></Field>
            <Field label="Financement"><Input value={cr.financement} onChange={e => upd("financement", e.target.value)} placeholder="Prêt en cours, fonds propres…" /></Field>
            <Field label="Délai d'achat"><Input value={cr.delaiAchat} onChange={e => upd("delaiAchat", e.target.value)} placeholder="3 mois, immédiat…" /></Field>
          </Grid2>
          <Field label="Points positifs exprimés par le visiteur">
            <Textarea rows={3} value={cr.pointsPositifs} onChange={e => upd("pointsPositifs", e.target.value)} placeholder="Vue, exposition, luminosité, prestations…" />
          </Field>
          <Field label="Points négatifs / réserves">
            <Textarea rows={3} value={cr.pointsNegatifs} onChange={e => upd("pointsNegatifs", e.target.value)} placeholder="Prix trop élevé, travaux, charge…" />
          </Field>
          <Grid2>
            <Field label="Suite à donner"><Select value={cr.suiteDonner} onChange={v => upd("suiteDonner", v)} options={SuiteDonner.options} /></Field>
            <Field label="Date de relance"><Input type="date" value={cr.dateRelance} onChange={e => upd("dateRelance", e.target.value)} /></Field>
          </Grid2>
        </div>
      )}

      {/* Onglet 4 — Observations */}
      {tab === "notes" && (
        <div>
          <Field label="Observations et notes complémentaires">
            <Textarea rows={10} value={cr.observations} onChange={e => upd("observations", e.target.value)} placeholder="Contexte particulier, remarques de visite, informations transmises au propriétaire, points juridiques à vérifier…" />
          </Field>
        </div>
      )}

      {/* Navigation onglets + actions */}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <div className="flex gap-1.5">
          {TABS.map((t, i) => i > 0 && tab === TABS[i - 1]?.id ? (
            <button key={t.id} className="btn-ghost text-[12px]" onClick={() => setTab(t.id)}>
              {t.label} <ChevronRight size={13} />
            </button>
          ) : null)}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-[12px]" onClick={() => onSave({ ...cr, statut: "Brouillon" })}>Sauvegarder</button>
          <button className="btn-primary text-[12px]" onClick={() => { if (!cr.visiteurNom.trim()) { alert("Nom du visiteur requis."); return; } onSave({ ...cr, statut: "Finalisé" }); }}>
            ✓ Finaliser
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Vue principale ─────────────────────────────────────────────────────── */
export function CompteRenduView() {
  const { data: crs, isLoading } = useCompteRendus();
  const save = useSaveCompteRendu();
  const del = useDeleteCompteRendu();
  const user = useSessionStore(s => s.user);
  const [modal, setModal] = useState<{ item?: CompteRendu } | null>(null);

  const handleSave = (cr: CompteRendu) => {
    save.mutate(cr, {
      onSuccess: (saved) => { if (saved.statut === "Finalisé") setModal(null); else setModal({ item: saved }); },
      onError: err => alert("Erreur : " + String(err)),
    });
  };

  // Grouper par date
  const byDate = new Map<string, CompteRendu[]>();
  for (const cr of crs) {
    const k = cr.date || "sans-date";
    const arr = byDate.get(k) ?? [];
    arr.push(cr);
    byDate.set(k, arr);
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 py-5">
      <PageHeader
        title="Comptes rendus de visite"
        subtitle={`${crs.length} compte(s) rendu(s)`}
        actions={
          <button className="btn-primary" onClick={() => setModal({ item: newCR(user?.id) })}>
            <Plus size={14} /> Nouveau compte rendu
          </button>
        }
      />

      {isLoading ? (
        <div className="py-12 text-center text-ink-muted">Chargement…</div>
      ) : crs.length === 0 ? (
        <EmptyState Icon={ClipboardList} text="Aucun compte rendu" sub="Enregistrez votre premier compte rendu de visite." />
      ) : (
        <div className="flex flex-col gap-6">
          {[...byDate.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => (
            <div key={date}>
              <div className="mb-2 flex items-center gap-2 border-b border-line pb-1.5">
                <Calendar size={13} className="text-ink-muted" />
                <span className="text-[12px] font-bold uppercase tracking-wide text-ink-sub">
                  {date === "sans-date" ? "Sans date" : fdate(date)}
                </span>
                <span className="text-[11px] text-ink-muted">· {items.length} visite(s)</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {items.map(cr => (
                  <div key={cr.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                        <ClipboardList size={17} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[14px] text-ink">{cr.visiteurNom || "—"}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${AVIS_TONE[cr.avisClient] ?? "bg-line text-ink-sub"}`}>
                            {cr.avisClient}
                          </span>
                          <StatusPill label={cr.statut} tone={cr.statut === "Finalisé" ? "emerald" : "amber"} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-muted">
                          {cr.bienRef && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {cr.bienRef}{cr.bienType ? ` — ${cr.bienType}` : ""}{cr.bienCommune ? `, ${cr.bienCommune}` : ""}
                            </span>
                          )}
                          {cr.visiteurTel && <span className="flex items-center gap-1"><Phone size={11} /> {cr.visiteurTel}</span>}
                          {cr.bienPrix > 0 && <span>{eur(cr.bienPrix)}</span>}
                          {cr.suiteDonner && (
                            <span className="font-medium text-primary">→ {cr.suiteDonner}</span>
                          )}
                        </div>
                        {cr.pointsPositifs && (
                          <div className="mt-1.5 text-[12px] text-emerald line-clamp-1">✓ {cr.pointsPositifs}</div>
                        )}
                        {cr.pointsNegatifs && (
                          <div className="mt-0.5 text-[12px] text-amber line-clamp-1">⚠ {cr.pointsNegatifs}</div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {cr.heureDebut && <div className="text-[12px] font-semibold text-ink">{cr.heureDebut}</div>}
                        {cr.dateRelance && (
                          <div className="mt-1 text-[11px] text-ink-muted">Relance : {fdate(cr.dateRelance)}</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 border-t border-line pt-3">
                      <button className="btn-ghost text-[12px]" onClick={() => setModal({ item: cr })}>
                        <Edit2 size={13} /> Modifier
                      </button>
                      {cr.statut === "Finalisé" && (
                        <Suspense fallback={<button className="btn-ghost text-[12px] opacity-60"><Download size={13} /> PDF…</button>}>
                          <CompteRenduPDFDownload cr={cr} />
                        </Suspense>
                      )}
                      <button
                        className="btn-ghost text-[12px] text-danger hover:bg-danger-soft"
                        onClick={() => { if (confirm("Supprimer ce compte rendu ?")) del.mutate(cr.id); }}
                      >
                        <Trash2 size={13} /> Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.item?.id && crs.some(c => c.id === modal.item?.id) ? "Modifier le compte rendu" : "Nouveau compte rendu de visite"}
          wide
          onClose={() => setModal(null)}
        >
          <CRForm
            initial={modal.item ?? newCR(user?.id)}
            onSave={handleSave}
          />
        </Modal>
      )}
    </div>
  );
}
