import { useState } from "react";
import { CheckCircle, AlertTriangle, Clock, TrendingUp, Bell, Users, Landmark, Target, Zap, Sparkles } from "lucide-react";
import { NouveauDossierWizard } from "../biens/NouveauDossierWizard";
import { EmptyState } from "../ui/Modal";
import { Modal, FormActions } from "../ui/Modal";
import { Field, Grid2, Input, Select, Textarea } from "../ui/Field";
import { eur, daysDiff, fdate } from "../../lib/format";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSaveClient } from "../../hooks/queries/useAgencyData";
import { useFinancials } from "../../hooks/useFinancials";
import { useSessionStore } from "../../store/session.store";
import { useUiStore } from "../../store/ui.store";
import { useSaveActivite } from "../../hooks/queries/useActivites";
import type { Client } from "../../types/domain";

const RELANCE_SEUIL: Record<string, number> = { Prospect: 14, Visite: 7, Offre: 3, Compromis: 2, Acte: 1 };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const todayStr = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function RelanceRapideModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const saveActivite = useSaveActivite(client.id);
  const saveClient = useSaveClient();
  const user = useSessionStore((s) => s.user);
  const [note, setNote] = useState("");
  const [type, setType] = useState("Appel");
  const [prochaine, setProchaine] = useState(inDays(7));

  const handleSave = () => {
    saveActivite.mutate({
      id: uid(), clientId: client.id, typeActivite: type as any,
      note: note || `Relance ${client.prenom} ${client.nom}`, date: todayStr(), agentId: user?.id,
    });
    saveClient.mutate({ ...client, relanceDate: prochaine, dernierContact: todayStr() });
    onClose();
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-3 rounded-lg bg-primary-soft p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded bg-primary font-bold text-white">
          {client.prenom?.[0] ?? "?"}
        </div>
        <div>
          <div className="text-[13.5px] font-semibold text-ink">{client.prenom} {client.nom}</div>
          <div className="text-[11.5px] text-ink-muted">{client.tel || "\u2014"} \u00b7 {client.statut}</div>
        </div>
      </div>
      <Grid2>
        <Field label="Type d'activit\u00e9">
          <Select value={type} onChange={setType}
            options={["Relance", "Appel", "Email", "Visite", "RDV", "Note"]} />
        </Field>
        <Field label="Prochaine relance">
          <Input type="date" value={prochaine} onChange={(e) => setProchaine(e.target.value)} />
        </Field>
      </Grid2>
      <Field label="Note (optionnel)">
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={`Ex: Rappelen ${client.prenom}, int\u00e9ress\u00e9 par CC-012...`} />
      </Field>
      <FormActions
        onSave={handleSave} onClose={onClose} label="Confirmer la relance"
        disabled={saveActivite.isPending || saveClient.isPending}
      />
    </>
  );
}

function TodayDirecteur() {
  const { data } = useAgencyData();
  const fin = useFinancials(data);
  const setView = useUiStore((s) => s.setView);
  const setFocusClientId = useUiStore((s) => s.setFocusClientId);
  const [relanceModal, setRelanceModal] = useState<Client | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const relances = data.clients.filter((c) => c.relanceDate && (daysDiff(c.relanceDate) ?? 99) <= 0);
  const negliges = data.clients.filter((c) => {
    if (["Acte", "Perdu"].includes(c.statut)) return false;
    const seuil = RELANCE_SEUIL[c.statut] ?? 14;
    const j = c.dernierContact ? -(daysDiff(c.dernierContact) ?? 99) : 99;
    return j > seuil && !relances.some((r) => r.id === c.id);
  });
  const aTraiter = [...relances, ...negliges].slice(0, 4);
  const mandatsExp = data.mandats.filter((m) => {
    const d = daysDiff(m.dateFin); return m.statut === "Actif" && d !== null && d >= 0 && d <= 30;
  });
  const yearNow = new Date().getFullYear();
  const caYTD = fin.revAnneeCourante;

  return (
    <div className="mx-auto max-w-[940px] px-6 py-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold capitalize text-ink">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </h1>
            <p className="text-[13px] text-ink-muted">Vue directeur \u00b7 Casa Cara\u00efbes</p>
          </div>
          <button
            onClick={() => setWizardOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <Sparkles size={14} /> Nouveau dossier
          </button>
        </div>
      </div>
      {wizardOpen && (
        <Modal title="Nouveau dossier vendeur" wide onClose={() => setWizardOpen(false)}>
          <NouveauDossierWizard onClose={() => setWizardOpen(false)} />
        </Modal>
      )}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <button onClick={() => setView("finance")} className="card border-l-4 border-l-emerald bg-emerald-soft p-4 text-left hover:shadow-card-hover transition-shadow">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-emerald flex items-center gap-1"><Landmark size={11} /> CA {yearNow}</div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-emerald">{eur(caYTD)}</div>
        </button>
        <button onClick={() => setView("pilotage")} className="card border-l-4 border-l-amber bg-amber-soft p-4 text-left hover:shadow-card-hover transition-shadow">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-amber flex items-center gap-1"><Target size={11} /> En cours</div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-amber">{eur(fin.globalAEncaisser)}</div>
          <div className="text-[11px] text-amber">{fin.compromisAEncaisser.length} dossiers</div>
        </button>
        <button onClick={() => setView("clients")} className={`card border-l-4 p-4 text-left hover:shadow-card-hover transition-shadow ${relances.length > 0 ? "border-l-danger bg-danger-soft" : "border-l-emerald bg-emerald-soft"}`}>
          <div className={`text-[10.5px] font-bold uppercase tracking-wide flex items-center gap-1 ${relances.length > 0 ? "text-danger" : "text-emerald"}`}><Bell size={11} /> Relances retard</div>
          <div className={`mt-1.5 font-heading text-2xl font-semibold tabular-nums ${relances.length > 0 ? "text-danger" : "text-emerald"}`}>{relances.length}</div>
        </button>
        <button onClick={() => setView("registre")} className={`card border-l-4 p-4 text-left hover:shadow-card-hover transition-shadow ${mandatsExp.length > 0 ? "border-l-violet bg-violet-soft" : "border-l-line"}`}>
          <div className={`text-[10.5px] font-bold uppercase tracking-wide flex items-center gap-1 ${mandatsExp.length > 0 ? "text-violet" : "text-ink-muted"}`}><AlertTriangle size={11} /> Mandats exp. &lt;30j</div>
          <div className={`mt-1.5 font-heading text-2xl font-semibold tabular-nums ${mandatsExp.length > 0 ? "text-violet" : "text-ink"}`}>{mandatsExp.length}</div>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-4">
          <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted flex items-center gap-1.5"><Users size={13} /> Performance agents</div>
          <div className="flex flex-col gap-2">
            {fin.agentPerformance.map((a) => {
              const pct = fin.globalEncaisse > 0 ? Math.round((a.caVentes / fin.globalEncaisse) * 100) : 0;
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold" style={{ background: a.color }}>{a.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[12px] mb-0.5">
                      <span className="font-medium text-ink">{a.name}</span>
                      <span className="font-semibold text-ink">{eur(a.caVentes)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-line overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: a.color }} />
                    </div>
                    <div className="flex gap-3 mt-0.5 text-[10.5px] text-ink-muted"><span>{a.clients} clients</span><span>{a.compromis} compromis</span></div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setView("reporting")} className="mt-3 text-[12px] text-primary hover:underline">Reporting complet \u2192</button>
        </div>
        <div className="card p-4 md:col-span-2">
          <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted flex items-center gap-1.5"><Clock size={13} /> Clients \u00e0 relancer</div>
          {aTraiter.length === 0 ? (
            <EmptyState Icon={CheckCircle} text="Tout est \u00e0 jour !" sub="Aucune relance en attente." />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {aTraiter.map((c) => {
                const j = daysDiff(c.relanceDate);
                const urgent = j !== null && j <= 0;
                return (
                  <div key={c.id} className="card flex items-center gap-3 p-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded font-bold ${urgent ? "bg-danger-soft text-danger" : "bg-amber-soft text-amber"}`}>{c.prenom?.[0] ?? "?"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-ink">{c.prenom} {c.nom}</div>
                      <div className="text-[11px] text-ink-muted">{c.statut}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setRelanceModal(c)} className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-medium text-white"><Zap size={10} /> Relancer</button>
                      <button onClick={() => { setFocusClientId(c.id); setView("clients"); }} className="rounded border border-line px-2 py-1 text-[11px] font-medium text-ink-sub">Fiche</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {fin.actesAvenir.length > 0 && (
          <div className="card p-4 md:col-span-2">
            <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted flex items-center gap-1.5"><TrendingUp size={13} /> Actes \u00e0 venir</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-line text-[10.5px] text-ink-muted uppercase tracking-wide">
                    <th className="pb-2 text-left font-semibold">Dossier</th>
                    <th className="pb-2 text-left font-semibold">Acheteur</th>
                    <th className="pb-2 text-left font-semibold">Acte pr\u00e9vu</th>
                    <th className="pb-2 text-right font-semibold">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {fin.actesAvenir.slice(0, 5).map((a) => (
                    <tr key={a.id} className="border-b border-line/50 last:border-0">
                      <td className="py-2 font-semibold text-ink">{a.ref}</td>
                      <td className="py-2 text-ink-sub">{a.acheteur}</td>
                      <td className="py-2 text-ink-sub">{fdate(a.dateActePrev) || "\u2014"}</td>
                      <td className="py-2 text-right font-semibold text-primary">{eur(a.comm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {relanceModal && (
        <Modal title="Relance rapide" onClose={() => setRelanceModal(null)}>
          <RelanceRapideModal client={relanceModal} onClose={() => setRelanceModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function TodayAgent() {
  const { data } = useAgencyData();
  const user = useSessionStore((s) => s.user);
  const setView = useUiStore((s) => s.setView);
  const setFocusClientId = useUiStore((s) => s.setFocusClientId);
  const [relanceModal, setRelanceModal] = useState<Client | null>(null);
  const mesClients = data.clients.filter((c) => !user || c.agentId === user.id || !c.agentId);
  const relances = mesClients.filter((c) => c.relanceDate && (daysDiff(c.relanceDate) ?? 99) <= 0);
  const negliges = mesClients.filter((c) => {
    if (["Acte", "Perdu"].includes(c.statut)) return false;
    const seuil = RELANCE_SEUIL[c.statut] ?? 14;
    const j = c.dernierContact ? -(daysDiff(c.dernierContact) ?? 99) : 99;
    return j > seuil && !relances.some((r) => r.id === c.id);
  });
  const aTraiter = [...relances, ...negliges].slice(0, 6);
  const biensDispo = data.biens.filter((b) => b.statut === "Disponible").length;
  const clientsActifs = mesClients.filter((c) => !["Acte", "Perdu"].includes(c.statut)).length;

  return (
    <div className="mx-auto max-w-[860px] px-6 py-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold capitalize text-ink">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </h1>
        <p className="text-[13px] text-ink-muted">Votre journ\u00e9e.</p>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <button onClick={() => setView("clients")} className="card border-l-4 border-l-primary bg-primary-soft p-4 text-left">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-primary">Clients actifs</div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-primary">{clientsActifs}</div>
        </button>
        <button onClick={() => setView("biens")} className="card border-l-4 border-l-violet bg-violet-soft p-4 text-left">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-violet">Biens disponibles</div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-violet">{biensDispo}</div>
        </button>
        <button onClick={() => setView("clients")} className={`card border-l-4 p-4 text-left ${relances.length > 0 ? "border-l-danger bg-danger-soft" : "border-l-emerald bg-emerald-soft"}`}>
          <div className={`text-[10.5px] font-bold uppercase tracking-wide ${relances.length > 0 ? "text-danger" : "text-emerald"}`}>Relances</div>
          <div className={`mt-1.5 font-heading text-2xl font-semibold tabular-nums ${relances.length > 0 ? "text-danger" : "text-emerald"}`}>{relances.length}</div>
        </button>
      </div>
      {aTraiter.length > 0 ? (
        <>
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-ink-sub"><Clock size={14} /> \u00c0 relancer</h2>
          <div className="flex flex-col gap-2">
            {aTraiter.map((c) => (
              <div key={c.id} className="card flex items-center gap-3.5 p-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded font-bold bg-amber-soft text-amber">{c.prenom?.[0] ?? "?"}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-ink">{c.prenom} {c.nom}</div>
                  <div className="text-xs text-ink-muted">{c.statut}</div>
                </div>
                <button onClick={() => setRelanceModal(c)} className="flex items-center gap-1 rounded bg-primary px-2.5 py-1.5 text-[11.5px] font-semibold text-white"><Zap size={11} /> Relancer</button>
                <button onClick={() => { setFocusClientId(c.id); setView("clients"); }} className="rounded border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-ink-sub">Fiche</button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState Icon={CheckCircle} text="Tout est \u00e0 jour !" sub="Aucune relance en attente." />
      )}
      {relanceModal && (
        <Modal title="Relance rapide" onClose={() => setRelanceModal(null)}>
          <RelanceRapideModal client={relanceModal} onClose={() => setRelanceModal(null)} />
        </Modal>
      )}
    </div>
  );
}

export function TodayView() {
  const isDir = useSessionStore((s) => s.isDirecteur());
  return isDir ? <TodayDirecteur /> : <TodayAgent />;
}
