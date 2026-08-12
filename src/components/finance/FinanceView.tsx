import { useState } from "react";
import {
  Edit2, Check, TrendingUp, Wallet, Clock, Target,
  AlertTriangle, CalendarCheck, ChevronRight,
} from "lucide-react";
import { FinanceNav } from "../shared/FinanceNav";
import { eur, fdate } from "../../lib/format";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useFinancials } from "../../hooks/useFinancials";
import {
  ResponsiveContainer, ComposedChart, Bar, XAxis, CartesianGrid,
  Tooltip, Cell, ReferenceLine,
} from "recharts";
import type { MonthExtStat, ActeAvenir } from "../../hooks/useFinancials";

const YEAR = new Date().getFullYear();
const OBJ_KEY = `casa_obj_ca_${YEAR}`;

const AGENT_NAMES: Record<string, string> = {
  dir: "Luc", noham: "Noham", steeve: "Steeve",
};

const STATUT_COLOR: Record<string, string> = {
  "Offre acceptée": "#9A6D22",
  "Compromis": "#1A3A52",
  "Acte prévu": "#5B4E8C",
};

function loadObjectif(): number {
  try { return parseInt(localStorage.getItem(OBJ_KEY) ?? "0", 10) || 0; } catch { return 0; }
}

// ── Tooltip du graphique ──────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const encaisse = payload.find(p => p.dataKey === "encaisse")?.value ?? 0;
  const prev = payload.find(p => p.dataKey === "previsionnel")?.value ?? 0;
  return (
    <div className="rounded border border-line bg-surface px-3 py-2 text-[12px] shadow-card-hover">
      <p className="mb-1 font-semibold capitalize text-ink">{label}</p>
      {encaisse > 0 && (
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald inline-block" />
          <span className="text-ink-sub">Encaissé</span>
          <span className="ml-auto font-semibold text-ink">{eur(encaisse)}</span>
        </div>
      )}
      {prev > 0 && (
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary/40 inline-block" />
          <span className="text-ink-sub">Prévisionnel</span>
          <span className="ml-auto font-semibold text-ink">{eur(prev)}</span>
        </div>
      )}
    </div>
  );
}

// ── Ligne horizon trésorerie ──────────────────────────────────────────────────
function HorizonRow({ label, amount, color, bg, icon: Icon }: {
  label: string; amount: number; color: string; bg: string; icon: typeof Clock;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-lg p-3 ${bg}`}>
      <div className={`flex size-8 shrink-0 items-center justify-center rounded ${color === "danger" ? "bg-danger-soft" : color === "amber" ? "bg-amber-soft" : "bg-primary-soft"}`}>
        <Icon size={14} className={color === "danger" ? "text-danger" : color === "amber" ? "text-amber" : "text-primary"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</div>
        <div className={`font-heading text-[17px] font-bold leading-tight ${color === "danger" ? "text-danger" : color === "amber" ? "text-amber" : "text-primary"}`}>
          {eur(amount)}
        </div>
      </div>
    </div>
  );
}

// ── Badge horizon ─────────────────────────────────────────────────────────────
function HorizonBadge({ diff }: { diff: number | null }) {
  if (diff === null) return <span className="text-[11px] text-ink-muted">Sans date</span>;
  if (diff <= 0) return <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger">En retard</span>;
  if (diff <= 30) return <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-bold text-amber">{diff}j</span>;
  if (diff <= 90) return <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">{diff}j</span>;
  return <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-medium text-ink-sub">{diff}j</span>;
}

// ── Tableau synthèse mensuelle ─────────────────────────────────────────────────
function SyntheseMensuelle({ data }: { data: ReturnType<typeof useFinancials>["monthly"] }) {
  const yearNow = new Date().getFullYear();
  const ytd = data.filter(m => m.month.startsWith(String(yearNow)));
  let cumul = 0;
  const rows = ytd.map(m => {
    cumul += m.encaisse;
    const label = new Date(m.month + "-15").toLocaleDateString("fr-FR", { month: "long" });
    return { label, encaisse: m.encaisse, cumul };
  }).filter(r => r.encaisse > 0 || r.cumul > 0);

  if (rows.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-5 py-3.5">
        <div className="text-[13.5px] font-semibold text-ink">Synthèse mensuelle {yearNow}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-line bg-bg">
              <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wide text-ink-muted text-[10.5px]">Mois</th>
              <th className="px-4 py-2.5 text-right font-bold uppercase tracking-wide text-ink-muted text-[10.5px]">Encaissé</th>
              <th className="px-4 py-2.5 text-right font-bold uppercase tracking-wide text-ink-muted text-[10.5px]">Cumul YTD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/50">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-bg/50 transition-colors">
                <td className="px-4 py-2.5 capitalize text-ink font-medium">{r.label}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-emerald">{eur(r.encaisse)}</td>
                <td className="px-4 py-2.5 text-right text-ink-sub">{eur(r.cumul)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line bg-bg">
              <td className="px-4 py-3 font-bold text-ink">Total {yearNow}</td>
              <td className="px-4 py-3 text-right font-heading font-bold text-emerald">
                {eur(rows.reduce((s, r) => s + r.encaisse, 0))}
              </td>
              <td className="px-4 py-3 text-right text-ink-muted">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function FinanceView() {
  const { data } = useAgencyData();
  const fin = useFinancials(data);

  const [obj, setObj] = useState(loadObjectif);
  const [editObj, setEditObj] = useState(false);
  const [objDraft, setObjDraft] = useState("");

  const pctObj = obj > 0 ? Math.min(Math.round((fin.revAnneeCourante / obj) * 100), 100) : 0;
  const ecartObj = obj > 0 ? Math.max(obj - fin.revAnneeCourante, 0) : 0;
  const objOk = obj > 0 && fin.revAnneeCourante >= obj;

  const saveObj = () => {
    const v = parseInt(objDraft.replace(/\s/g, "").replace(",", "."), 10);
    if (!isNaN(v) && v >= 0) {
      setObj(v);
      localStorage.setItem(OBJ_KEY, String(v));
    }
    setEditObj(false);
  };

  // Total prévisionnel pipeline
  const totalPipeline =
    fin.pipelineHorizon.retard +
    fin.pipelineHorizon.j30 +
    fin.pipelineHorizon.j60 +
    fin.pipelineHorizon.j90 +
    fin.pipelineHorizon.j90plus +
    fin.pipelineHorizon.sans;

  // Chart data: value = encaisse OR previsionnel
  const chartData = fin.monthlyExt.map((m: MonthExtStat) => ({
    ...m,
    encaisse: m.isFuture ? 0 : m.encaisse,
    previsionnel: m.isFuture ? m.previsionnel : 0,
  }));

  const varMois = fin.revMoisPrev > 0
    ? Math.round(((fin.revMois - fin.revMoisPrev) / fin.revMoisPrev) * 100)
    : null;

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-5">
      <FinanceNav active="finance" />

      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-[18px] font-semibold text-ink">Tableau financier {YEAR}</h1>
          <p className="text-[12px] text-ink-muted">Position de trésorerie et prévisionnel</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-ink-muted">Objectif {YEAR} :</span>
          {editObj ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                className="w-32 rounded border border-primary px-2.5 py-1.5 text-right text-[13px] font-bold text-primary outline-none"
                value={objDraft}
                onChange={e => setObjDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveObj(); if (e.key === "Escape") setEditObj(false); }}
                placeholder="ex : 120000"
              />
              <button
                onClick={saveObj}
                className="flex size-7 items-center justify-center rounded bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setObjDraft(obj ? String(obj) : ""); setEditObj(true); }}
              className="flex items-center gap-1.5 rounded border border-line px-3 py-1.5 text-[13px] font-bold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              {obj > 0 ? eur(obj) : "Définir un objectif"}
              <Edit2 size={11} className="opacity-50" />
            </button>
          )}
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* CA YTD */}
        <div className="card border-l-4 border-l-emerald p-4">
          <div className="mb-0.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-emerald">
            <TrendingUp size={11} /> CA encaissé {YEAR}
          </div>
          <div className="font-heading text-[22px] font-bold text-emerald">{eur(fin.revAnneeCourante)}</div>
          {varMois !== null && (
            <div className={`mt-1 text-[11.5px] font-semibold ${varMois >= 0 ? "text-emerald" : "text-danger"}`}>
              {varMois >= 0 ? "+" : ""}{varMois}% ce mois vs précédent
            </div>
          )}
        </div>

        {/* Objectif */}
        <div className={`card border-l-4 p-4 ${obj === 0 ? "border-l-line" : objOk ? "border-l-emerald" : pctObj >= 75 ? "border-l-amber" : "border-l-danger"}`}>
          <div className={`mb-0.5 text-[10.5px] font-bold uppercase tracking-wide ${obj === 0 ? "text-ink-muted" : objOk ? "text-emerald" : pctObj >= 75 ? "text-amber" : "text-danger"}`}>
            {objOk ? "Objectif atteint ✓" : "Objectif annuel"}
          </div>
          {obj > 0 ? (
            <>
              <div className={`font-heading text-[22px] font-bold ${objOk ? "text-emerald" : pctObj >= 75 ? "text-amber" : "text-danger"}`}>
                {pctObj}%
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ${objOk ? "bg-emerald" : pctObj >= 75 ? "bg-amber" : "bg-danger"}`}
                  style={{ width: `${pctObj}%` }}
                />
              </div>
              {!objOk && (
                <div className="mt-1 text-[11px] text-ink-muted">Reste {eur(ecartObj)}</div>
              )}
            </>
          ) : (
            <button
              onClick={() => { setObjDraft(""); setEditObj(true); }}
              className="mt-1 text-[12px] text-primary underline-offset-2 hover:underline"
            >
              Définir un objectif →
            </button>
          )}
        </div>

        {/* Pipeline */}
        <div className="card border-l-4 border-l-amber p-4">
          <div className="mb-0.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-amber">
            <Wallet size={11} /> Pipeline actif
          </div>
          <div className="font-heading text-[22px] font-bold text-amber">{eur(totalPipeline)}</div>
          <div className="mt-1 text-[11.5px] text-ink-muted">
            {fin.actesAvenir.length} dossier{fin.actesAvenir.length > 1 ? "s" : ""} en cours
          </div>
        </div>

        {/* Ticket moyen */}
        <div className="card border-l-4 border-l-violet p-4">
          <div className="mb-0.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-violet">
            <Target size={11} /> Ticket moyen
          </div>
          <div className="font-heading text-[22px] font-bold text-violet">{eur(fin.ticketMoyen)}</div>
          <div className="mt-1 text-[11.5px] text-ink-muted">
            Sur {data.revenus.filter(r => r.statut === "Encaissé").length} transaction{data.revenus.filter(r => r.statut === "Encaissé").length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* ── Graphique + Horizon ── */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_280px]">
        {/* Chart trésorerie prévisionnelle */}
        <div className="card p-5">
          <div className="mb-1 text-[13.5px] font-semibold text-ink">Trésorerie prévisionnelle</div>
          <div className="mb-3 flex items-center gap-4 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1.5"><span className="size-2.5 inline-block rounded-sm bg-emerald" /> Encaissé</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 inline-block rounded-sm bg-primary/30" /> Prévisionnel</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData} barSize={22} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke="#EBEAE7" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9B9B97" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#EBEAE7", opacity: 0.4 }} />
              {/* Ligne de séparation "Aujourd'hui" */}
              <ReferenceLine
                x={fin.monthlyExt.find((m: MonthExtStat) => m.isCurrent)?.label}
                stroke="#1A3A52"
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
              <Bar dataKey="encaisse" radius={[3, 3, 0, 0]}>
                {chartData.map((m, i) => (
                  <Cell
                    key={i}
                    fill={m.isCurrent ? "#1A3A52" : "#2D7A5F"}
                    fillOpacity={1}
                  />
                ))}
              </Bar>
              <Bar dataKey="previsionnel" radius={[3, 3, 0, 0]} fill="#1A3A52" fillOpacity={0.25} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-1 text-center text-[10.5px] text-ink-muted">
            ← 6 mois réels · mois courant · 5 mois prévisionnel →
          </div>
        </div>

        {/* Horizon de trésorerie */}
        <div className="card p-5">
          <div className="mb-4 text-[13.5px] font-semibold text-ink">Horizon de cash</div>
          <div className="flex flex-col gap-2.5">
            {fin.pipelineHorizon.retard > 0 && (
              <HorizonRow
                label="En retard"
                amount={fin.pipelineHorizon.retard}
                color="danger"
                bg="bg-danger-soft/40"
                icon={AlertTriangle}
              />
            )}
            <HorizonRow
              label="Sous 30 jours"
              amount={fin.pipelineHorizon.j30}
              color="amber"
              bg="bg-amber-soft/40"
              icon={Clock}
            />
            <HorizonRow
              label="31 – 60 jours"
              amount={fin.pipelineHorizon.j60}
              color="primary"
              bg="bg-primary-soft/40"
              icon={CalendarCheck}
            />
            <HorizonRow
              label="61 – 90 jours"
              amount={fin.pipelineHorizon.j90}
              color="primary"
              bg="bg-bg"
              icon={CalendarCheck}
            />
            {fin.pipelineHorizon.j90plus > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-bg p-3">
                <span className="text-[11.5px] text-ink-muted">+ de 90 jours</span>
                <span className="font-heading text-[15px] font-bold text-ink-sub">{eur(fin.pipelineHorizon.j90plus)}</span>
              </div>
            )}
            <div className="mt-1 border-t border-line pt-3 flex items-center justify-between">
              <span className="text-[12px] font-bold text-ink">Total pipeline</span>
              <span className="font-heading text-[16px] font-bold text-amber">{eur(totalPipeline)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Actes à venir ── */}
      {fin.actesAvenir.length > 0 && (
        <div className="card mb-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <div className="text-[13.5px] font-semibold text-ink">
              Dossiers en cours — {fin.actesAvenir.length} acte{fin.actesAvenir.length > 1 ? "s" : ""} à venir
            </div>
            <span className="text-[12px] font-semibold text-amber">{eur(totalPipeline)}</span>
          </div>
          <div className="divide-y divide-line/60">
            {fin.actesAvenir.map((a: ActeAvenir) => (
              <div
                key={a.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-bg/50 transition-colors"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: STATUT_COLOR[a.statut] ?? "#9B9B97",
                }}
              >
                {/* Dossier */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink truncate">{a.acheteur}</span>
                    <span className="rounded bg-line px-1.5 py-0.5 text-[10.5px] text-ink-muted font-medium">{a.ref}</span>
                  </div>
                  <div className="text-[11.5px] text-ink-muted">{a.statut}</div>
                </div>

                {/* Agent */}
                {a.agentId && (
                  <div className="hidden shrink-0 text-[12px] text-ink-sub sm:block">
                    {AGENT_NAMES[a.agentId] ?? a.agentId}
                  </div>
                )}

                {/* Date acte prévu */}
                <div className="shrink-0 text-right">
                  <div className="text-[12px] text-ink-sub">{a.dateActePrev ? fdate(a.dateActePrev) : "—"}</div>
                </div>

                {/* Horizon */}
                <div className="shrink-0">
                  <HorizonBadge diff={a.diff} />
                </div>

                {/* Commission */}
                <div className="shrink-0 font-heading text-[15px] font-bold text-amber">
                  {eur(a.comm)}
                </div>

                <ChevronRight size={14} className="shrink-0 text-ink-muted/40" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Synthèse mensuelle ── */}
      <SyntheseMensuelle data={fin.monthly} />
    </div>
  );
}
