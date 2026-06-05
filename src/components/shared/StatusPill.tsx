import { cn } from "../../lib/cn";

type Tone = "emerald" | "amber" | "danger" | "primary" | "violet" | "neutral";

const TONE: Record<Tone, string> = {
  emerald: "bg-emerald-soft text-emerald",
  amber: "bg-amber-soft text-amber",
  danger: "bg-danger-soft text-danger",
  primary: "bg-primary-soft text-primary",
  violet: "bg-violet-soft text-violet",
  neutral: "bg-line/60 text-ink-sub",
};

/** Mapping statut métier → tonalité visuelle. */
const STATUS_TONE: Record<string, Tone> = {
  Disponible: "emerald", Actif: "emerald", Encaissé: "emerald", "Encaissée": "emerald",
  Loué: "primary", Visite: "primary", "Acte signé": "emerald",
  "Sous compromis": "amber", Compromis: "amber", Offre: "amber", "En attente": "amber",
  "À encaisser": "amber", "Acte prévu": "violet", Acte: "violet",
  Prospect: "neutral", Vendu: "neutral", Retiré: "neutral", Suspendu: "neutral",
  Perdu: "danger", Expiré: "danger", Résilié: "danger", Annulé: "danger", Annulée: "danger",
};

export function StatusPill({ label, tone }: { label: string; tone?: Tone }) {
  const t = tone ?? STATUS_TONE[label] ?? "neutral";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", TONE[t])}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function KpiCard({
  label, value, note, tone = "primary",
}: { label: string; value: string; note?: string; tone?: Tone }) {
  const accent: Record<Tone, string> = {
    emerald: "border-l-emerald bg-emerald-soft text-emerald",
    amber: "border-l-amber bg-amber-soft text-amber",
    danger: "border-l-danger bg-danger-soft text-danger",
    primary: "border-l-primary bg-primary-soft text-primary",
    violet: "border-l-violet bg-violet-soft text-violet",
    neutral: "border-l-line2 bg-bg text-ink",
  };
  return (
    <div className={cn("card border-l-4 p-4", accent[tone])}>
      <div className="text-[10.5px] font-bold uppercase tracking-wide">{label}</div>
      <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums">{value}</div>
      {note && <div className="mt-1 text-[11.5px] opacity-85">{note}</div>}
    </div>
  );
}
