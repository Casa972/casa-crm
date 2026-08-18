import { useState, useRef, useEffect } from "react";
import { Bell, AlertCircle, Clock, FileText, Calendar } from "lucide-react";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useUiStore } from "../../store/ui.store";
import { daysDiff } from "../../lib/format";

const TONE_CLASS: Record<string, string> = {
  danger: "text-danger",
  amber: "text-amber",
  primary: "text-primary",
};

interface Alerte {
  id: string;
  icon: React.ReactNode;
  text: string;
  viewId: "clients" | "biens" | "pilotage";
  tone: string;
  count: number;
}

function useAlertes(): Alerte[] {
  const { data } = useAgencyData();
  const alertes: Alerte[] = [];

  // Clients à relancer
  const relances = data.clients.filter(
    (c) => c.relanceDate && (daysDiff(c.relanceDate) ?? 99) <= 0 && !["Acte", "Perdu"].includes(c.statut)
  );
  if (relances.length > 0) {
    alertes.push({
      id: "relances",
      icon: <Clock size={13} />,
      text: `${relances.length} client(s) à relancer`,
      viewId: "clients",
      tone: "danger",
      count: relances.length,
    });
  }

  // Mandats expirant dans 30j
  const mandatsExp = data.mandats.filter((m) => {
    const d = daysDiff(m.dateFin);
    return d !== null && d >= 0 && d <= 30 && m.statut === "Actif";
  });
  if (mandatsExp.length > 0) {
    alertes.push({
      id: "mandats-exp",
      icon: <FileText size={13} />,
      text: `${mandatsExp.length} mandat(s) expirant sous 30j`,
      viewId: "biens",
      tone: "amber",
      count: mandatsExp.length,
    });
  }

  // SRU ≤ 3j
  const sruUrgents = data.compromis.filter((c) => {
    const d = daysDiff(c.sruExpire);
    return d !== null && d >= 0 && d <= 3;
  });
  if (sruUrgents.length > 0) {
    alertes.push({
      id: "sru",
      icon: <AlertCircle size={13} />,
      text: `${sruUrgents.length} délai(s) SRU ≤ 3j`,
      viewId: "pilotage",
      tone: "danger",
      count: sruUrgents.length,
    });
  }

  // Conditions suspensives ≤ 7j
  const condSuspUrgents = data.compromis.filter((c) => {
    const d = daysDiff(c.condSuspExpire);
    return d !== null && d >= 0 && d <= 7;
  });
  if (condSuspUrgents.length > 0) {
    alertes.push({
      id: "cond-susp",
      icon: <Calendar size={13} />,
      text: `${condSuspUrgents.length} cond. suspensive(s) ≤ 7j`,
      viewId: "pilotage",
      tone: "amber",
      count: condSuspUrgents.length,
    });
  }

  return alertes;
}

export function NotificationsBell() {
  const alertes = useAlertes();
  const setView = useUiStore((s) => s.setView);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = alertes.reduce((s, a) => s + a.count, 0);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-9 items-center justify-center rounded border border-line bg-surface hover:bg-bg transition-colors"
        aria-label="Notifications"
      >
        <Bell size={16} className={count > 0 ? "text-amber" : "text-ink-muted"} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-[280px] overflow-hidden rounded-lg border border-line bg-surface shadow-card-hover animate-fade-in">
          <div className="border-b border-line px-3 py-2.5">
            <span className="text-[12px] font-bold uppercase tracking-wide text-ink-muted">
              Alertes ({count})
            </span>
          </div>
          {count === 0 ? (
            <div className="py-6 text-center text-[13px] text-ink-muted">Aucune alerte active</div>
          ) : (
            <div>
              {alertes.map((a) => (
                <button
                  key={a.id}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-bg transition-colors border-b border-line/50 last:border-0"
                  onClick={() => { setView(a.viewId); setOpen(false); }}
                >
                  <span className={`${TONE_CLASS[a.tone] ?? "text-ink-muted"} shrink-0`}>{a.icon}</span>
                  <span className={`text-[12.5px] font-medium ${TONE_CLASS[a.tone] ?? "text-ink-muted"}`}>{a.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
