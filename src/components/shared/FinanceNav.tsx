import { useUiStore, type ViewId } from "../../store/ui.store";

const TABS = [
  { id: "compromis" as ViewId, label: "Affaires", icon: "📝" },
  { id: "finance"  as ViewId,  label: "Encaissé", icon: "🏦" },
  { id: "pilotage" as ViewId,  label: "En cours", icon: "🤝" },
  { id: "revenus"  as ViewId,  label: "Autres recettes", icon: "💰" },
  { id: "remuneration" as ViewId, label: "Commissions", icon: "👤" },
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
