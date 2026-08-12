import { X, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useToastStore, type Toast } from "../../store/toast.store";

const CFG: Record<Toast["type"], { icon: typeof AlertCircle; cls: string }> = {
  error:   { icon: AlertCircle,    cls: "border-danger/20 bg-danger-soft text-danger" },
  success: { icon: CheckCircle2,   cls: "border-emerald/20 bg-emerald-soft text-emerald" },
  info:    { icon: Info,           cls: "border-primary/20 bg-primary-soft text-primary" },
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
      {toasts.map((t) => {
        const { icon: Icon, cls } = CFG[t.type];
        return (
          <div
            key={t.id}
            className={`flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-card-hover animate-fade-in ${cls}`}
          >
            <Icon size={15} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-[13px] leading-relaxed">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
