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
import { useTaches } from "../../hooks/queries/useTaches";
import type { Client } from "../../types/domain";

const RELANCE_SEUIL: Record<string, number> = { Prospect: 14, Visite: 7, Offre: 3, Compromis: 2, Acte: 1 };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const todayStr = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// ── Alertes du jour ──────────────────────────────────────────────────────────
function AlertesSection({ agentId, isDir }: { agentId?: string; isDir: boolean }) {
  const { data } = useAgencyData();
  const { data: taches } = useTaches();
  const today = new Date().toISOString().slice(0, 10);

  const alertes: string[] = [];

  // Tâches en retard
  const tachesRetard = taches.filter((t) => {
    if (t.done || !t.dateEcheance) return false;
    if (!isDir && t.agentId && t.agentId !== agentId) return false;
    return t.dateEcheance < today;
  });
  for (const t of tachesRetard) {
    alertes.push(`Tâche en retard : "${t.texte}" (échéance ${fdate(t.dateEcheance ?? "")})`);
  }

  // Mandats expirant dans <= 7 jours
  const mandatsExp = data.mandats.filter((m) => {
    if (m.statut !== "Actif" || !m.dateFin) return false;
    if (!isDir && m.agentId && m.agentId !== agentId) return false;
    const d = daysDiff(m.dateFin);
    return d !== null && d >= 0 && d <= 7;
  });
  for (const m of mandatsExp) {
    const d = daysDiff(m.dateFin)!;
    alertes.push(`Mandat ${m.ref} expire dans ${d}j — ${m.mandant}`);
  }

  // Compromis : SRU expirant dans <= 3 jours
  const compActifs = data.compromis.filter((c) => {
    if (!isDir && c.agentId && c.agentId !== agentId) return false;
    return !["Acte signé", "Annulé"].includes(c.statut);
  });
  for (const c of compActifs) {
    if (c.sruExpire) {
      const d = daysDiff(c.sruExpire);
      if (d !== null && d >= 0 && d <= 3) {
        alertes.push(`SRU compromis ${c.ref} expire dans ${d}j — ${c.acheteur}`);
      }
    }
    if (c.condSuspExpire) {
      const d = daysDiff(c.condSuspExpire);
      if (d !== null && d >= 0 && d <= 7) {
        alertes.push(`Conditions suspensives compromis ${c.ref} expirent dans ${d}j`);
      }
    }
  }

  // Mandats actifs depuis 90+ jours sans vente → baisse de prix
  const mandatsBaissePrix = data.mandats.filter((m) => {
    if (m.statut !== "Actif" || !m.dateDebut) return false;
    if (!isDir && m.agentId && m.agentId !== agentId) return false;
    const d = daysDiff(m.dateDebut);
    return d !== null && d <= -90;
  });
  for (const m of mandatsBaissePrix) {
    const jours = Math.abs(daysDiff(m.dateDebut)!);
    alertes.push(`Baisse de prix recommandée — ${m.mandant} (en diffusion depuis ${jours} jours)`);
  }

  if (alertes.length === 0) return null;

  return (
    <div className="mb-6 card border-l-4 border-l-danger p-4">
      <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-danger flex items-center gap-1.5">
        ⚡ Alertes du jour
      </div>
      <div>
        {alertes.map((msg, i) => (
          <div key={i} className="flex items-start gap-2 py-1.5 border-b border-line last:border-0">
            <span className="text-danger font-bold text-[11px] mt-0.5 shrink-0">!</span>
            <span className="text-[13px] text-ink">{msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Modal "Relancer maintenant" ──────────────────────────────────────────────
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
          <div className="text-[11.5px] text-ink-muted">{client.tel || "—"} · {client.statut}</div>
        </div>
      </div>
      <Grid2>
        <Field label="Type d'activité">
          <Select value={type} onChange={setType}
            options={["Relance", "Appel", "Email", "Visite", "RDV", "Note"]} />
        </Field>
        <Field label="Prochaine relance">
          <Input type="date" value={prochaine} onChange={(e) => setProchaine(e.target.value)} />
        </Field>
      </Grid2>
      <Field label="Note (optionnel)">
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={`Ex: Rappelé ${client.prenom}, intéressé par CC-012...`} />
      </Field>
      <FormActions
        onSave={handleSave} onClose={onClose} label="Confirmer la relance"
        disabled={saveActivite.isPending || saveClient.isPending}
      />
    </>
  );
}

// ── Vue directeur ────────────────────────────────────────────────────────────
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold capitalize text-ink">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </h1>
            <p className="text-[13px] text-ink-muted">Vue directeur · Casa Caraïbes</p>
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

      <AlertesSection isDir={true} />

      {/* KPIs directeur */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <button onClick={() => setView("finance")}
          className="card border-l-4 border-l-emerald bg-emerald-soft p-4 text-left hover:shadow-card-hover transition-shadow">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-emerald flex items-center gap-1">
            <Landmark size={11} /> CA {yearNow}
          </div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-emerald">{eur(caYTD)}</div>
        </button>

        <button onClick={() => setView("pilotage")}
          className="card border-l-4 border-l-amber bg-amber-soft p-4 text-left hover:shadow-card-hover transition-shadow">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-amber flex items-center gap-1">
            <Target size={11} /> En cours
          </div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-amber">
            {eur(fin.globalAEncaisser)}
          </div>
          <div className="text-[11px] text-amber">{fin.compromisAEncaisser.length} dossiers</div>
        </button>

        <button onClick={() => setView("clients")}
          className={`card border-l-4 p-4 text-left hover:shadow-card-hover transition-shadow ${relances.length > 0 ? "border-l-danger bg-danger-soft" : "border-l-emerald bg-emerald-soft"}`}>
          <div className={`text-[10.5px] font-bold uppercase tracking-wide flex items-center gap-1 ${relances.length > 0 ? "text-danger" : "text-emerald"}`}>
            <Bell size={11} /> Relances retard
          </div>
          <div className={`mt-1.5 font-heading text-2xl font-semibold tabular-nums ${relances.length > 0 ? "text-danger" : "text-emerald"}`}>
            {relances.length}
          </div>
        </button>

        <button onClick={() => setView("registre")}
          className={`card border-l-4 p-4 text-left hover:shadow-card-hover transition-shadow ${mandatsExp.length > 0 ? "border-l-violet bg-violet-soft" : "border-l-line"}`}>
          <div className={`text-[10.5px] font-bold uppercase tracking-wide flex items-center gap-1 ${mandatsExp.length > 0 ? "text-violet" : "text-ink-muted"}`}>
            <AlertTriangle size={11} /> Mandats exp. &lt;30j
          </div>
          <div className={`mt-1.5 font-heading text-2xl font-semibold tabular-nums ${mandatsExp.length > 0 ? "text-violet" : "text-ink"}`}>
            {mandatsExp.length}
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Performance agents */}
        <div className="card p-4">
          <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
            <Users size={13} /> Performance agents
          </div>
          <div className="flex flex-col gap-2">
            {fin.agentPerformance.map((a) => {
              const pct = fin.globalEncaisse > 0 ? Math.round((a.caVentes / fin.globalEncaisse) * 100) : 0;
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold"
                    style={{ background: a.color }}>{a.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[12px] mb-0.5">
                      <span className="font-medium text-ink">{a.name}</span>
                      <span className="font-semibold text-ink">{eur(a.caVentes)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-line overflow-hidden">
                      <div className="h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${pct}%`, background: a.color }} />
                    </div>
                    <div className="flex gap-3 mt-0.5 text-[10.5px] text-ink-muted">
                      <span>{a.clients} clients</span>
                      <span>{a.compromis} compromis</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setView("reporting")}
            className="mt-3 text-[12px] text-primary hover:underline">Reporting complet →</button>
        </div>

        {/* Alertes délais */}
        <div className="card p-4">
          <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
            <AlertTriangle size={13} /> Alertes délais critiques
          </div>
          {fin.alertesDelais.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-[13px] text-emerald">
              <CheckCircle size={14} /> Aucun délai critique
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {fin.alertesDelais.slice(0, 4).map((c) => {
                const sru = daysDiff(c.sruExpire), cond = daysDiff(c.condSuspExpire);
                return (
                  <button key={c.id} onClick={() => setView("pilotage")}
                    className="flex items-center gap-2.5 rounded-lg border border-danger/20 bg-danger-soft p-2.5 text-left hover:shadow-sm">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded bg-danger/20">
                      <AlertTriangle size={13} className="text-danger" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-ink">{c.ref} — {c.acheteur}</div>
                      <div className="flex gap-2 mt-0.5">
                        {sru !== null && sru <= 3 && (
                          <span className="text-[11px] font-bold text-danger">SRU : {sru <= 0 ? "EXPIRÉ" : `${sru}j`}</span>
                        )}
                        {cond !== null && cond <= 7 && (
                          <span className="text-[11px] font-bold text-amber">Cond : {cond <= 0 ? "EXPIRÉE" : `${cond}j`}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {mandatsExp.length > 0 && (
            <div className="mt-3 border-t border-line pt-3">
              <div className="text-[11.5px] font-semibold text-violet mb-1.5">Mandats à renouveler :</div>
              {mandatsExp.slice(0, 2).map((m) => (
                <div key={m.id} className="flex justify-between text-[12px] py-0.5">
                  <span className="text-ink">{m.ref} — {m.mandant}</span>
                  <span className="font-semibold text-violet">{daysDiff(m.dateFin)}j</span>
                </div>
              ))}
              {mandatsExp.length > 2 && (
                <button onClick={() => setView("registre")} className="mt-1 text-[11.5px] text-primary hover:underline">
                  +{mandatsExp.length - 2} autres →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Relances à traiter */}
        <div className="card p-4 md:col-span-2">
          <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
            <Clock size={13} /> Clients à relancer
          </div>
          {aTraiter.length === 0 ? (
            <EmptyState Icon={CheckCircle} text="Tout est à jour !" sub="Aucune relance en attente." />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {aTraiter.map((c) => {
                const j = daysDiff(c.relanceDate);
                const urgent = j !== null && j <= 0;
                return (
                  <div key={c.id} className="card flex items-center gap-3 p-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded font-bold ${urgent ? "bg-danger-soft text-danger" : "bg-amber-soft text-amber"}`}>
                      {c.prenom?.[0] ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-ink">{c.prenom} {c.nom}</div>
                      <div className="text-[11px] text-ink-muted">{c.tel ? <a href={`tel:${c.tel}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{c.tel}</a> : "—"} · {c.statut}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setRelanceModal(c)}
                        className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-medium text-white hover:bg-primary/90">
                        <Zap size={10} /> Relancer
                      </button>
                      <button onClick={() => { setFocusClientId(c.id); setView("clients"); }}
                        className="rounded border border-line px-2 py-1 text-[11px] font-medium text-ink-sub hover:bg-bg">
                        Fiche
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actes à venir */}
        {fin.actesAvenir.length > 0 && (
          <div className="card p-4 md:col-span-2">
            <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
              <TrendingUp size={13} /> Actes à venir
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-line text-[10.5px] text-ink-muted uppercase tracking-wide">
                    <th className="pb-2 text-left font-semibold">Dossier</th>
                    <th className="pb-2 text-left font-semibold">Acheteur</th>
                    <th className="pb-2 text-left font-semibold">Acte prévu</th>
                    <th className="pb-2 text-right font-semibold">Commission</th>
                    <th className="pb-2 text-right font-semibold">J restants</th>
                  </tr>
                </thead>
                <tbody>
                  {fin.actesAvenir.slice(0, 5).map((a) => (
                    <tr key={a.id} className="border-b border-line/50 last:border-0">
                      <td className="py-2 font-semibold text-ink">{a.ref}</td>
                      <td className="py-2 text-ink-sub">{a.acheteur}</td>
                      <td className="py-2 text-ink-sub">{fdate(a.dateActePrev) || "—"}</td>
                      <td className="py-2 text-right font-semibold text-primary">{eur(a.comm)}</td>
                      <td className={`py-2 text-right font-bold ${a.diff !== null && a.diff <= 0 ? "text-danger" : a.diff !== null && a.diff <= 14 ? "text-amber" : "text-ink"}`}>
                        {a.diff !== null ? (a.diff <= 0 ? "Retard" : `${a.diff}j`) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setView("pilotage")}
              className="mt-3 text-[12px] text-primary hover:underline">Voir tous les dossiers →</button>
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

// ── Vue agent ────────────────────────────────────────────────────────────────
function TodayAgent() {
  const { data } = useAgencyData();
  const fin = useFinancials(data);
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

  // Alertes SRU/conditions de l'agent
  const mesAlertes = fin.alertesDelais.filter((c) => !user || c.agentId === user.id || !c.agentId);

  return (
    <div className="mx-auto max-w-[860px] px-6 py-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold capitalize text-ink">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </h1>
        <p className="text-[13px] text-ink-muted">Ce qui nécessite votre attention aujourd'hui.</p>
      </div>

      <AlertesSection agentId={user?.id} isDir={false} />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <button onClick={() => setView("clients")}
          className="card border-l-4 border-l-primary bg-primary-soft p-4 text-left hover:shadow-card-hover transition-shadow">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-primary">Clients actifs</div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-primary">{clientsActifs}</div>
        </button>

        <button onClick={() => setView("biens")}
          className="card border-l-4 border-l-violet bg-violet-soft p-4 text-left hover:shadow-card-hover transition-shadow">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-violet">Biens disponibles</div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-violet">{biensDispo}</div>
        </button>

        <button onClick={() => setView("clients")}
          className={`card border-l-4 p-4 text-left hover:shadow-card-hover transition-shadow ${relances.length > 0 ? "border-l-danger bg-danger-soft" : "border-l-emerald bg-emerald-soft"}`}>
          <div className={`text-[10.5px] font-bold uppercase tracking-wide ${relances.length > 0 ? "text-danger" : "text-emerald"}`}>
            Relances en retard
          </div>
          <div className={`mt-1.5 font-heading text-2xl font-semibold tabular-nums ${relances.length > 0 ? "text-danger" : "text-emerald"}`}>
            {relances.length}
          </div>
        </button>
      </div>

      {/* Alertes SRU agent */}
      {mesAlertes.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-danger">
            <AlertTriangle size={14} /> Vos dossiers — délais critiques
          </h2>
          <div className="flex flex-col gap-2">
            {mesAlertes.map((c) => {
              const sru = daysDiff(c.sruExpire), cond = daysDiff(c.condSuspExpire);
              return (
                <div key={c.id} className="card border-l-4 border-l-danger bg-danger-soft px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-bold text-danger">{c.ref} — {c.acheteur}</div>
                    <div className="flex gap-2 mt-0.5">
                      {sru !== null && sru <= 3 && <span className="text-[11px] font-bold text-danger">SRU : {sru <= 0 ? "EXPIRÉ" : `${sru}j`}</span>}
                      {cond !== null && cond <= 7 && <span className="text-[11px] font-bold text-amber">Cond. susp. : {cond <= 0 ? "EXPIRÉE" : `${cond}j`}</span>}
                    </div>
                  </div>
                  <button onClick={() => setView("mes_dossiers")}
                    className="shrink-0 rounded border border-danger/30 px-2.5 py-1 text-[11.5px] font-medium text-danger hover:bg-danger/10">
                    Voir dossier
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* À relancer */}
      {aTraiter.length > 0 ? (
        <>
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-ink-sub">
            <Clock size={14} /> À relancer
          </h2>
          <div className="flex flex-col gap-2">
            {aTraiter.map((c) => {
              const j = daysDiff(c.relanceDate);
              const urgent = j !== null && j <= 0;
              return (
                <div key={c.id} className="card flex items-center gap-3.5 p-3">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded font-bold ${urgent ? "bg-danger-soft text-danger" : "bg-amber-soft text-amber"}`}>
                    {c.prenom?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-ink">{c.prenom} {c.nom}</div>
                    <div className="text-xs text-ink-muted">{c.tel || "—"} · {c.statut}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => setRelanceModal(c)}
                      className="flex items-center gap-1 rounded bg-primary px-2.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-primary/90">
                      <Zap size={11} /> Relancer
                    </button>
                    <button onClick={() => { setFocusClientId(c.id); setView("clients"); }}
                      className="rounded border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-ink-sub hover:bg-bg">
                      Fiche
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState Icon={CheckCircle} text="Tout est à jour !" sub="Aucune relance en attente." />
      )}

      {relanceModal && (
        <Modal title="Relance rapide" onClose={() => setRelanceModal(null)}>
          <RelanceRapideModal client={relanceModal} onClose={() => setRelanceModal(null)} />
        </Modal>
      )}
    </div>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────
export function TodayView() {
  const isDir = useSessionStore((s) => s.isDirecteur());
  return isDir ? <TodayDirecteur /> : <TodayAgent />;
}
