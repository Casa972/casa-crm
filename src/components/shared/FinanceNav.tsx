import { useUiStore, type ViewId } from "../../store/ui.store";

const TABS = [
  { id: "pilotage" as ViewId,  label: "Pilotage des ventes",  icon: "🤝" },
  { id: "revenus"  as ViewId,  label: "Journal des flux",     icon: "💰" },
  { id: "reporting" as ViewId, label: "Reporting",            icon: "📊" },
];

export function FinanceNav({ active }: { active: ViewId }) {
  const setView = useUiStore(s => s.setView);
  return (
    <div className="mb-6 flex border-b border-line">
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => setView(t.id)}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
            active === t.id
              ? "border-primary text-primary"
              : "border-transparent text-ink-sub hover:text-ink hover:border-line2"
          }`}
        >
          <span>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
