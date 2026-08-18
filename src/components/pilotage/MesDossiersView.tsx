import { Briefcase, FileText, Key, AlertTriangle, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import { useUiStore } from "../../store/ui.store";
import { daysDiff, fdate, eur } from "../../lib/format";
import { commissionMontant } from "../../schemas/compromis.schema";
import { StatusPill } from "../shared/StatusPill";
import { EmptyState } from "../ui/Modal";

function SruBadge({ date }: { date: string }) {
  if (!date) return null;
  const d = daysDiff(date);
  if (d === null) return null;
  if (d < 0) return <span className="rounded-full bg-emerald-soft px-2 py-0.5 text-[10px] font-bold text-emerald">SRU levé</span>;
  if (d <= 3) return <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-bold text-danger">SRU : {d}j</span>;
  return <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-bold text-amber">SRU : {d}j</span>;
}

function CondBadge({ date }: { date: string }) {
  if (!date) return null;
  const d = daysDiff(date);
  if (d === null) return null;
  if (d < 0) return <span className="rounded-full bg-emerald-soft px-2 py-0.5 text-[10px] font-bold text-emerald">Cond. levées</span>;
  if (d <= 7) return <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-bold text-danger">Cond. : {d}j</span>;
  return <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">Cond. : {d}j</span>;
}

export function MesDossiersView() {
  const { data } = useAgencyData();
  const user = useSessionStore((s) => s.user);
  const setView = useUiStore((s) => s.setView);
  if (!user) return null;

  const mesCompromis = data.compromis
    .filter((c) => c.agentId === user.id || !c.agentId)
    .filter((c) => c.statut !== "Acte signé" && c.statut !== "Annulé")
    .sort((a, b) => (a.dateActePrev || "").localeCompare(b.dateActePrev || ""));

  const mesMandats = data.mandats
    .filter((m) => (m.agentId === user.id || !m.agentId) && m.statut === "Actif")
    .sort((a, b) => a.dateFin.localeCompare(b.dateFin));

  const mandatsUrgents = mesMandats.filter((m) => {
    const d = daysDiff(m.dateFin);
    return d !== null && d >= 0 && d <= 30;
  });

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Briefcase size={20} className="text-primary" />
        <h1 className="font-heading text-2xl font-semibold text-ink">Mes dossiers</h1>
      </div>

      {/* ── Compromis en cours ── */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-ink-muted">
            <FileText size={13} /> Compromis en cours ({mesCompromis.length})
          </h2>
          <button
            onClick={() => setView("redacteur")}
            className="text-[12px] font-medium text-primary hover:underline"
          >
            Nouveau dossier →
          </button>
        </div>

        {mesCompromis.length === 0 ? (
          <div className="card p-6">
            <EmptyState Icon={FileText} text="Aucun compromis actif" sub="Créez un compromis depuis le Rédacteur." />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mesCompromis.map((c) => {
              const commission = commissionMontant(c);
              const joursActe = c.dateActePrev ? daysDiff(c.dateActePrev) : null;
              const urgent = joursActe !== null && joursActe >= 0 && joursActe <= 14;
              return (
                <div key={c.id} className={`card p-4 ${urgent ? "border-l-4 border-l-danger" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-ink">{c.ref}</span>
                        <StatusPill label={c.statut} />
                        <SruBadge date={c.sruExpire} />
                        <CondBadge date={c.condSuspExpire} />
                        {urgent && (
                          <span className="flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-bold text-danger">
                            <AlertTriangle size={10} /> Acte dans {joursActe}j
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] text-ink">
                        <span className="font-medium">{c.acheteur}</span>
                        {c.bienDesc && <span className="text-ink-muted"> · {c.bienDesc}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-ink-muted">
                        {c.prixVente > 0 && <span>Prix : <strong className="text-ink">{eur(c.prixVente)}</strong></span>}
                        {commission > 0 && <span>Commission : <strong className="text-primary">{eur(commission)}</strong></span>}
                        {c.notaire && <span>Notaire : {c.notaire}</span>}
                        {c.dateActePrev && (
                          <span className={joursActe !== null && joursActe >= 0 && joursActe <= 14 ? "font-semibold text-danger" : ""}>
                            Acte prévu : {fdate(c.dateActePrev)}
                          </span>
                        )}
                      </div>
                      {c.notes && (
                        <div className="mt-2 rounded bg-bg px-2.5 py-1.5 text-[11.5px] text-ink-muted italic border border-line">
                          {c.notes}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setView("redacteur")}
                      className="shrink-0 flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink-sub transition-colors hover:bg-bg hover:text-ink"
                    >
                      <ExternalLink size={12} /> Ouvrir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Mandats actifs ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-ink-muted">
            <Key size={13} /> Mes mandats actifs ({mesMandats.length})
          </h2>
          {mandatsUrgents.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-[11px] font-bold text-danger">
              <AlertTriangle size={11} /> {mandatsUrgents.length} expirent bientôt
            </span>
          )}
        </div>

        {mesMandats.length === 0 ? (
          <div className="card p-6">
            <EmptyState Icon={Key} text="Aucun mandat actif" sub="Vos mandats en cours apparaîtront ici." />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {mesMandats.map((m) => {
              const d = daysDiff(m.dateFin);
              const expireUrgent = d !== null && d >= 0 && d <= 30;
              const expire14 = d !== null && d >= 0 && d <= 14;
              return (
                <div key={m.id} className={`card flex items-center gap-4 p-3.5 ${expire14 ? "border-l-4 border-l-danger" : expireUrgent ? "border-l-4 border-l-amber" : ""}`}>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Key size={15} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{m.ref}</span>
                      <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] font-medium text-ink-muted border border-line">{m.type}</span>
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-ink-sub">{m.mandant}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    {d === null ? (
                      <span className="text-[12px] text-ink-muted">—</span>
                    ) : d < 0 ? (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald">
                        <CheckCircle size={11} /> Expiré
                      </div>
                    ) : expire14 ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-danger">
                          <AlertTriangle size={11} /> {d}j restants
                        </div>
                        <div className="text-[10px] text-ink-muted">{fdate(m.dateFin)}</div>
                      </div>
                    ) : expireUrgent ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber">
                          <Clock size={11} /> {d}j restants
                        </div>
                        <div className="text-[10px] text-ink-muted">{fdate(m.dateFin)}</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="text-[12px] font-semibold text-ink">{d}j</div>
                        <div className="text-[10px] text-ink-muted">{fdate(m.dateFin)}</div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setView("registre")}
                    className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-medium text-ink-sub transition-colors hover:bg-bg hover:text-ink"
                  >
                    Registre
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
