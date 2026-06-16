import { useState, useEffect, useRef } from "react";
import { Search, Users, Building2, FileText, X } from "lucide-react";
import { useAgencyData } from "../../hooks/queries/useAgencyData";
import { useUiStore } from "../../store/ui.store";
import type { Client, Bien, Mandat, Compromis } from "../../types/domain";
import { eur } from "../../lib/format";

interface SearchResult {
  type: "client" | "bien" | "mandat" | "compromis";
  id: string;
  title: string;
  subtitle: string;
  viewId: "clients" | "biens" | "pilotage";
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function match(query: string, ...fields: string[]): boolean {
  const q = normalize(query);
  return fields.some((f) => normalize(f).includes(q));
}

function buildResults(query: string, data: { clients: Client[]; biens: Bien[]; mandats: Mandat[]; compromis: Compromis[] }): SearchResult[] {
  if (!query.trim()) return [];
  const results: SearchResult[] = [];

  for (const c of data.clients) {
    if (match(query, c.prenom, c.nom, c.tel ?? "", c.email ?? "")) {
      results.push({
        type: "client", id: c.id,
        title: `${c.prenom} ${c.nom}`,
        subtitle: `${c.type} · ${c.statut} · ${c.tel || "—"}`,
        viewId: "clients",
      });
    }
  }

  for (const b of data.biens) {
    if (match(query, b.ref, b.commune, b.adresse ?? "", b.type)) {
      results.push({
        type: "bien", id: b.id,
        title: `${b.ref} — ${b.type}`,
        subtitle: `${b.commune} · ${eur(b.prix)} · ${b.statut}`,
        viewId: "biens",
      });
    }
  }

  for (const m of data.mandats) {
    if (match(query, m.ref, m.mandant, m.tel ?? "")) {
      results.push({
        type: "mandat", id: m.id,
        title: `Mandat ${m.ref} — ${m.mandant}`,
        subtitle: `${m.type} · ${m.statut}`,
        viewId: "biens",
      });
    }
  }

  for (const c of data.compromis) {
    if (match(query, c.ref, c.acheteur, c.bienRef ?? "")) {
      results.push({
        type: "compromis", id: c.id,
        title: `Compromis ${c.ref}`,
        subtitle: `${c.acheteur} · ${c.statut}`,
        viewId: "pilotage",
      });
    }
  }

  return results.slice(0, 20);
}

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  client: "Clients",
  bien: "Biens",
  mandat: "Mandats",
  compromis: "Compromis",
};

const TYPE_ICON: Record<SearchResult["type"], React.ReactNode> = {
  client: <Users size={13} />,
  bien: <Building2 size={13} />,
  mandat: <FileText size={13} />,
  compromis: <FileText size={13} />,
};

export function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const { data } = useAgencyData();
  const setView = useUiStore((s) => s.setView);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const results = buildResults(query, data);

  // Group by type
  const grouped: Record<string, SearchResult[]> = {};
  for (const r of results) {
    if (!grouped[r.type]) grouped[r.type] = [] as SearchResult[];
    grouped[r.type]!.push(r);
  }

  const handleSelect = (r: SearchResult) => {
    setView(r.viewId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/50 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[580px] overflow-hidden rounded-xl bg-surface shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search size={16} className="shrink-0 text-ink-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher clients, biens, mandats, compromis…"
            className="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-muted"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-ink-muted hover:text-ink">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[11px] text-ink-muted sm:block">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query.trim() ? (
            <div className="py-10 text-center text-[13px] text-ink-muted">
              Tapez pour rechercher dans toutes les données…
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-ink-muted">
              Aucun résultat pour « {query} »
            </div>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <div className="flex items-center gap-1.5 border-b border-line bg-bg px-4 py-1.5">
                  <span className="text-ink-muted">{TYPE_ICON[type as SearchResult["type"]]}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                    {TYPE_LABELS[type as SearchResult["type"]]} ({items.length})
                  </span>
                </div>
                {items.map((r) => (
                  <button
                    key={r.id}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-bg/70 transition-colors"
                    onClick={() => handleSelect(r)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-ink truncate">{r.title}</div>
                      <div className="text-[12px] text-ink-muted truncate">{r.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
