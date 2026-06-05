import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: {
  title: string; subtitle?: string; actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-[13px] text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function ProgressBar({ pct, label, left, right }: {
  pct: number; label: string; left?: string; right?: string;
}) {
  return (
    <div className="card p-4">
      <div className="mb-1.5 flex justify-between text-[12.5px] font-semibold text-ink-sub">
        <span>{label}</span><span className="text-emerald">{pct}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald to-emerald/70 transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      {(left || right) && (
        <div className="mt-1 flex justify-between text-[11px] text-ink-muted">
          <span>{left}</span><span>{right}</span>
        </div>
      )}
    </div>
  );
}
