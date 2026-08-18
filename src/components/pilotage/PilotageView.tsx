import { useState } from "react";
import {
  Plus, Edit2, Check, Trash2, ChevronDown, ChevronUp,
  AlertTriangle, TrendingUp, FileText,
  Briefcase, CheckCircle2, CalendarClock, Bell,
} from "lucide-react";
import { EmptyState, Modal } from "../ui/Modal";
import { FinanceNav } from "../shared/FinanceNav";
import { CompromisForm } from "./forms";
import { eur, fdate, daysDiff } from "../../lib/format";
import { useFinancials } from "../../hooks/useFinancials";
import {
  useAgencyData, useSaveCompromis, useEncaisserCommission, useDeleteCompromis,
} from "../../hooks/queries/useAgencyData";
import { useUiStore } from "../../store/ui.store";
import { commissionMontant } from "../../schemas/compromis.schema";
import type { Compromis } from "../../types/domain";

const STATUT_ORDER = ["Offre acceptée", "Compromis", "Acte prévu", "Acte signé"];

// Left-border color per statut (CSS color value)
const STATUT_BORDER: Record<string, string> = {
  "Offre acceptée": "#9A6D22",
  "Compromis":      "#1A3A52",
  "Acte prévu":     "#5B4E8C",
  "Acte signé":     "#2D7A5F",
  "Annulé":         "#A03A30",
};

// Badge style per statut
const STATUT_BADGE: Record<string, string> = {
  "Offre acceptée": "bg-amber-soft text-amber",
  "Compromis":      "bg-primary-soft text-primary",
  "Acte prévu":     "bg-violet-soft text-violet",
  "Acte signé":     "bg-emerald-soft text-emerald",
  "Annulé":         "bg-danger-soft text-danger",
};

// ── Pipeline funnel ────────────────────────────────────────────────────────
function PipelineFunnel({ fin }: { fin: ReturnType<typeof useFinancials> }) {
  const stages = [
    { label: "Mandats actifs",  count: fin.mandatsEnCours.length, color: "#1A3A52", bg: "#EBF1F6" },
    { label: "Compromis",       count: fin.funnel.compromis,      color: "#5B4E8C", bg: "#F0EEFB" },
    { label: "Actes signés",    count: fin.funnel.actes,          color: "#2D7A5F", bg: "#EAF5F0" },
  ];
  const max = Math.max(...stages.map(s => s.count), 1);
  const rates = [fin.funnel.txMC, fin.funnel.txCA];

  return (
    <div className="card p-4">
      <div className="mb-4 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Entonnoir de conversion</div>
      <div className="flex flex-col items-center gap-0">
        {stages.map((s, i) => {
          const pct = max > 0 ? Math.max((s.count / max) * 100, s.count > 0 ? 30 : 10) : 10;
          return (
            <div key={i} className="w-full flex flex-col items-center">
              <div
                className="flex items-center justify-between rounded px-3 py-2.5 transition-all duration-700"
                style={{ width: `${pct}%`, background: s.bg, border: `1.5px solid ${s.color}33` }}
              >
                <span className="text-[12px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                <span className="font-heading text-[18px] font-bold" style={{ color: s.color }}>{s.count}</span>
              </div>
              {i < stages.length - 1 && (
                <div className="my-1 flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted">
                  <div className="h-3 w-px bg-line" />
                  <span className="rounded-full bg-line px-2 py-0.5 text-ink-sub">→ {rates[i]}%</span>
                  <div className="h-3 w-px bg-line" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────
export function PilotageView() {
  const { data } = useAgencyData();
  const fin = useFinancials(data);
  const saveCompromis = useSaveCompromis();
  const encaisser = useEncaisserCommission();
  const delCompromis = useDeleteCompromis();
  const { setView, setPrefillRedacteur } = useUiStore();

  const [modal, setModal] = useState<{ item?: Compromis } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>("tous");

  const filtered = data.compromis
    .filter(c => filterStatut === "tous" || c.statut === filterStatut)
    .sort((a, b) => (b.dateCompromis || "").localeCompare(a.dateCompromis || ""));

  const varMois = fin.revMoisPrev > 0
    ? Math.round(((fin.revMois - fin.revMoisPrev) / fin.revMoisPrev) * 100)
    : null;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-5">
      <FinanceNav active="pilotage" />

      {/* ── KPIs ── */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Commissions en cours */}
        <div className="card border-l-4 border-l-primary p-4">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            <Briefcase size={11} />
            Commissions en cours
          </div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-primary">
            {eur(fin.totalCompromisAEncaisser)}
          </div>
          <div className="mt-1 text-[11.5px] text-ink-muted">
            {fin.compromisAEncaisser.length} dossiers actifs
          </div>
        </div>

        {/* Actes encaissés */}
        <div className="card border-l-4 border-l-emerald p-4">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            <CheckCircle2 size={11} />
            Actes encaissés
          </div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-emerald">
            {eur(fin.totalActesEncaisses)}
          </div>
          <div className="mt-1 text-[11.5px] text-ink-muted">
            {fin.actesEncaisses.length} actes signés
          </div>
        </div>

        {/* Ce mois-ci */}
        <div className={`card border-l-4 p-4 ${varMois !== null && varMois >= 0 ? "border-l-emerald" : "border-l-amber"}`}>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            <CalendarClock size={11} />
            Ce mois-ci
          </div>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-ink">
            {eur(fin.revMois)}
          </div>
          {varMois !== null && (
            <div className={`mt-1 text-[11.5px] font-semibold ${varMois >= 0 ? "text-emerald" : "text-amber"}`}>
              {varMois >= 0 ? "+" : ""}{varMois}% vs mois préc.
            </div>
          )}
        </div>

        {/* Alertes délais */}
        <div className={`card border-l-4 p-4 ${fin.alertesDelais.length > 0 ? "border-l-danger" : "border-l-line"}`}>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            <Bell size={11} />
            Alertes délais
          </div>
          <div className={`mt-1.5 font-heading text-2xl font-semibold tabular-nums ${fin.alertesDelais.length > 0 ? "text-danger" : "text-ink"}`}>
            {fin.alertesDelais.length}
          </div>
          <div className={`mt-1 text-[11.5px] ${fin.alertesDelais.length > 0 ? "text-danger" : "text-ink-muted"}`}>
            {fin.alertesDelais.length > 0 ? "Action requise" : "RAS"}
          </div>
        </div>
      </div>

      {/* ── Alertes délais ── */}
      {fin.alertesDelais.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[12px] font-bold text-danger">
            <AlertTriangle size={14} /> Délais critiques — action requise
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {fin.alertesDelais.map(c => {
              const sru = daysDiff(c.sruExpire), cond = daysDiff(c.condSuspExpire);
              return (
                <div
                  key={c.id}
                  className="card border-l-4 border-l-danger bg-danger-soft px-4 py-3"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[13px] font-bold text-danger">{c.ref}</span>
                    <div className="flex gap-1.5">
                      {sru !== null && sru <= 3 && (
                        <span className="rounded bg-danger px-2 py-0.5 text-[11px] font-bold text-white">
                          SRU : {sru <= 0 ? "EXPIRÉ" : `${sru}j`}
                        </span>
                      )}
                      {cond !== null && cond <= 7 && (
                        <span className="rounded bg-amber px-2 py-0.5 text-[11px] font-bold text-white">
                          Cond. susp. : {cond <= 0 ? "EXPIRÉE" : `${cond}j`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[12px] text-danger/80">{c.acheteur}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Funnel + Volume ── */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <PipelineFunnel fin={fin} />

        {/* Volume d'affaires */}
        <div className="card p-4">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Volume d'affaires</div>
          <div className="mb-3 space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-ink-sub">Encaissé</span>
              <span className="font-heading font-bold text-emerald">{eur(fin.globalEncaisse)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-ink-sub">En cours</span>
              <span className="font-heading font-bold text-amber">{eur(fin.globalAEncaisser)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-line overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald transition-[width] duration-700"
                style={{ width: `${fin.pctRealise}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-ink-muted">
              <span>{fin.pctRealise}% réalisé</span>
              <span>Total : {eur(fin.totalPotentiel)}</span>
            </div>
          </div>
          <button
            onClick={() => setView("reporting")}
            className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline"
          >
            <TrendingUp size={12} /> Voir le reporting complet →
          </button>
        </div>
      </div>

      {/* ── Liste des dossiers ── */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-ink">Dossiers</span>
          <select
            className="rounded border border-line2 bg-surface px-2 py-1 text-[12px]"
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
          >
            <option value="tous">Tous statuts</option>
            {STATUT_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="Annulé">Annulé</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setModal({})}>
          <Plus size={14} /> Nouveau dossier
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <EmptyState Icon={Plus} text="Aucun dossier" sub="Ajoutez un compromis pour suivre vos ventes." />
        ) : (
          filtered.map(c => {
            const montant = commissionMontant(c);
            const sru = daysDiff(c.sruExpire), cond = daysDiff(c.condSuspExpire);
            const alert = (sru !== null && sru <= 3) || (cond !== null && cond <= 7);
            const open = detail === c.id;
            const borderColor = STATUT_BORDER[c.statut] ?? "#9B9B97";
            const badgeClass = STATUT_BADGE[c.statut] ?? "bg-line text-ink-sub";

            return (
              <div
                key={c.id}
                className="card cursor-pointer overflow-hidden transition-shadow hover:shadow-card-hover"
                style={{ borderLeft: `4px solid ${borderColor}` }}
                onClick={() => setDetail(open ? null : c.id)}
              >
                {/* ── Collapsed: rich summary ── */}
                <div className="p-4">
                  {/* Row 1: ref + badges + commission */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[13px] font-bold text-ink">{c.ref}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
                          {c.statut}
                        </span>
                        {alert && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-danger px-2 py-0.5 text-[11px] font-bold text-white">
                            <AlertTriangle size={9} /> Délai
                          </span>
                        )}
                        {c.commissionStatut === "Encaissée" && (
                          <span className="rounded-full bg-emerald-soft px-2 py-0.5 text-[11px] font-semibold text-emerald">
                            Encaissée
                          </span>
                        )}
                      </div>

                      {/* Row 2: parties + bien */}
                      <div className="mb-2 text-[12.5px] text-ink-sub">
                        <span className="font-medium text-ink">{c.acheteur}</span>
                        {c.vendeur ? (
                          <>
                            <span className="mx-1.5 text-ink-muted">→</span>
                            <span className="font-medium text-ink">{c.vendeur}</span>
                          </>
                        ) : null}
                        {c.bienRef ? (
                          <>
                            <span className="mx-1.5 text-ink-muted">•</span>
                            <span className="text-ink-muted">{c.bienRef}</span>
                          </>
                        ) : null}
                      </div>

                      {/* Row 3: key dates as pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {c.dateCompromis && (
                          <span className="rounded bg-bg px-2 py-0.5 text-[11px] text-ink-sub border border-line">
                            Compromis : {fdate(c.dateCompromis)}
                          </span>
                        )}
                        {c.dateActePrev && (
                          <span className="rounded bg-bg px-2 py-0.5 text-[11px] text-ink-sub border border-line">
                            Acte prévu : {fdate(c.dateActePrev)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Commission + prix */}
                    <div className="shrink-0 text-right ml-2">
                      <div className="font-heading text-[18px] font-bold text-ink">{eur(montant)}</div>
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-muted">commission</div>
                      <div className="mt-0.5 text-[11.5px] text-ink-muted">{eur(c.prixVente)}</div>
                    </div>

                    {/* Expand chevron */}
                    <div className="shrink-0 text-ink-muted self-center">
                      {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                </div>

                {/* ── Expanded section ── */}
                {open && (
                  <div
                    className="border-t border-line bg-bg px-4 pb-4 pt-3"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] sm:grid-cols-3">
                      <div className="text-ink-sub">
                        <span className="font-semibold text-ink">Offre :</span> {fdate(c.dateOffre) || "—"}
                      </div>
                      <div className="text-ink-sub">
                        <span className="font-semibold text-ink">Compromis :</span> {fdate(c.dateCompromis) || "—"}
                      </div>
                      <div className="text-ink-sub">
                        <span className="font-semibold text-ink">Acte prévu :</span> {fdate(c.dateActePrev) || "—"}
                      </div>
                      <div className="text-ink-sub">
                        <span className="font-semibold text-ink">Notaire :</span> {c.notaire || "—"}
                      </div>
                      <div className="text-ink-sub">
                        <span className="font-semibold text-ink">Financement :</span> {c.financement || "—"}
                      </div>
                      {c.sruExpire && (
                        <div className={sru !== null && sru <= 3 ? "font-semibold text-danger" : "text-ink-sub"}>
                          <span className="font-semibold text-ink">SRU :</span>{" "}
                          {fdate(c.sruExpire)}
                          {sru !== null && sru <= 3 && ` (${sru <= 0 ? "expiré" : sru + "j"})`}
                        </div>
                      )}
                      {c.condSuspExpire && (
                        <div className={cond !== null && cond <= 7 ? "font-semibold text-amber" : "text-ink-sub"}>
                          <span className="font-semibold text-ink">Cond. susp. :</span>{" "}
                          {fdate(c.condSuspExpire)}
                          {cond !== null && cond <= 7 && ` (${cond <= 0 ? "expirée" : cond + "j"})`}
                        </div>
                      )}
                    </div>

                    {c.notes && (
                      <p className="mb-3 rounded border border-line bg-surface px-3 py-2 text-[12.5px] italic text-ink-sub">
                        "{c.notes}"
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {c.commissionStatut !== "Encaissée" && c.statut === "Acte signé" && (
                        <button
                          className="btn-primary !bg-emerald text-[12px]"
                          onClick={() => encaisser.mutate(c)}
                        >
                          <Check size={13} /> Marquer encaissée
                        </button>
                      )}
                      <button
                        className="btn-ghost text-[12px] text-primary"
                        onClick={() => {
                          setPrefillRedacteur({ docType: "compromis", sourceId: c.id });
                          setView("redacteur");
                        }}
                      >
                        <FileText size={13} /> Générer le document
                      </button>
                      <button className="btn-ghost text-[12px]" onClick={() => setModal({ item: c })}>
                        <Edit2 size={13} /> Modifier
                      </button>
                      {data.revenus.some(r => r.sourceId === c.id) && (
                        <button
                          className="btn-ghost text-[12px] text-primary"
                          onClick={() => setView("revenus")}
                        >
                          Voir dans les revenus
                        </button>
                      )}
                      <button
                        className="btn-ghost text-[12px] text-danger hover:bg-danger-soft"
                        onClick={() => {
                          if (confirm("Supprimer ce dossier ?")) delCompromis.mutate(c.id);
                        }}
                      >
                        <Trash2 size={13} /> Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {modal && (
        <Modal title={modal.item ? "Modifier le dossier" : "Nouveau dossier"} wide onClose={() => setModal(null)}>
          <CompromisForm
            initial={modal.item}
            biens={data.biens}
            mandats={data.mandats}
            clients={data.clients}
            onClose={() => setModal(null)}
            onSave={c => { saveCompromis.mutate(c); setModal(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
