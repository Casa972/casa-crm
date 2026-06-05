import type { ReactNode } from "react";
import { X, Check, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

export function Modal({
  title, onClose, children, wide,
}: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm max-md:items-end max-md:p-0">
      <div
        className={cn(
          "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-lg bg-surface shadow-card-hover animate-fade-in",
          wide ? "max-w-[640px]" : "max-w-[500px]",
          "max-md:max-w-full max-md:rounded-b-none",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-heading text-[15px] font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-ink-muted hover:bg-line/60 hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function FormActions({ onSave, onClose, label = "Enregistrer", disabled }: {
  onSave: () => void; onClose: () => void; label?: string; disabled?: boolean;
}) {
  return (
    <div className="mt-5 flex gap-2.5 border-t border-line pt-4 max-md:flex-col-reverse">
      <button className="btn-primary justify-center disabled:opacity-50 max-md:w-full" onClick={onSave} disabled={disabled}>
        <Check size={14} /> {label}
      </button>
      <button className="btn-ghost justify-center max-md:w-full" onClick={onClose}>Annuler</button>
    </div>
  );
}

export function EmptyState({ Icon, text, sub }: { Icon: LucideIcon; text: string; sub?: string }) {
  return (
    <div className="px-5 py-12 text-center text-ink-muted">
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-lg bg-primary-soft">
        <Icon size={20} className="text-primary" />
      </div>
      <p className="mb-1 text-sm font-medium text-ink-sub">{text}</p>
      {sub && <p className="text-[13px] text-ink-muted">{sub}</p>}
    </div>
  );
}
