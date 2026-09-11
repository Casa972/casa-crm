import { useState } from "react";
import { FileText, Trash2, Library, AlertCircle, Loader2, Pencil, Check, X, ScrollText, Home, FileSearch, Award, ClipboardList } from "lucide-react";
import { useDocuments, useDeleteDocument, useUpdateDocument } from "../../hooks/queries/useDocuments";
import { useUiStore, type ViewId } from "../../store/ui.store";
import { useSessionStore } from "../../store/session.store";
import type { DocumentRow } from "../../types/database";

type Filter = "tous" | "mandat" | "compromis" | "offre";

const TYPE_LABEL: Record<string, string> = {
  mandat:    "Mandat de vente",
  compromis: "Compromis de vente",
  offre:     "Offre d'achat",
};

const TYPE_COLOR: Record<string, string> = {
  mandat:    "bg-primary-soft text-primary",
  compromis: "bg-emerald-soft text-emerald",
  offre:     "bg-amber-soft text-amber",
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtTaille(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1_048_576).toFixed(1)} Mo`;
}

function DocumentCard({ doc }: { doc: DocumentRow }) {
  const [editing, setEditing]   = useState(false);
  const [nom, setNom]           = useState(doc.nom);
  const [numero, setNumero]     = useState(doc.numero ?? "");
  const [parties, setParties]   = useState(doc.parties ?? "");
  const [bien, setBien]         = useState(doc.bien ?? "");

  const deleteMut = useDeleteDocument();
  const updateMut = useUpdateDocument();

  const handleDelete = () => {
    if (!confirm(`Supprimer "${doc.nom}" définitivement ?`)) return;
    deleteMut.mutate({ id: doc.id });
  };

  const handleSave = () => {
    updateMut.mutate({
      id: doc.id,
      patch: {
        nom:     nom.trim() || doc.nom,
        numero:  numero.trim() || null,
        parties: parties.trim() || null,
        bien:    bien.trim() || null,
      },
    }, {
      onSuccess: () => setEditing(false),
      onError: (e) => alert(`Erreur lors de la modification : ${e instanceof Error ? e.message : String(e)}`),
    });
  };

  const handleCancel = () => {
    setNom(doc.nom);
    setNumero(doc.numero ?? "");
    setParties(doc.parties ?? "");
    setBien(doc.bien ?? "");
    setEditing(false);
  };

  return (
    <div className="card p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FileText size={20} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLOR[doc.type_doc] ?? "bg-line text-ink-sub"}`}>
              {TYPE_LABEL[doc.type_doc] ?? doc.type_doc}
            </span>
            {doc.nom.endsWith(".docx") && (
              <span className="text-[10px] font-medium text-ink-muted bg-line rounded px-1.5 py-0.5">DOCX</span>
            )}
          </div>
          {editing ? (
            <div className="flex flex-col gap-2 mt-2">
              <div>
                <label className="text-[11px] text-ink-muted mb-0.5 block">Nom du fichier</label>
                <input className="input text-[12.5px] w-full" value={nom} onChange={e => setNom(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-ink-muted mb-0.5 block">Numéro</label>
                  <input className="input text-[12.5px] w-full" value={numero} onChange={e => setNumero(e.target.value)} placeholder="ex : MV-2026-001" />
                </div>
                <div>
                  <label className="text-[11px] text-ink-muted mb-0.5 block">Bien</label>
                  <input className="input text-[12.5px] w-full" value={bien} onChange={e => setBien(e.target.value)} placeholder="adresse — commune" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-ink-muted mb-0.5 block">Parties</label>
                <input className="input text-[12.5px] w-full" value={parties} onChange={e => setParties(e.target.value)} placeholder="Vendeur → Acquéreur" />
              </div>
            </div>
          ) : (
            <>
              <p className="text-[13.5px] font-semibold text-ink truncate">{doc.nom}</p>
              {doc.numero && (
                <span className="text-[11px] font-mono text-ink-muted bg-line rounded px-1.5 py-0.5 mr-1">{doc.numero}</span>
              )}
              {doc.parties && (
                <p className="text-[12px] text-ink-sub mt-0.5 truncate">{doc.parties}</p>
              )}
              {doc.bien && (
                <p className="text-[11.5px] text-ink-muted mt-0.5 truncate">{doc.bien}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-muted">
                <span>{fmtDate(doc.created_at)}</span>
                {doc.taille && <><span>·</span><span>{fmtTaille(doc.taille)}</span></>}
              </div>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={updateMut.isPending} className="flex items-center gap-1 rounded px-3 py-1.5 text-[12px] font-medium text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-60">
                {updateMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Enregistrer
              </button>
              <button onClick={handleCancel} className="rounded p-1.5 text-ink-muted hover:bg-line transition-colors">
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="rounded p-1.5 text-ink-muted hover:bg-line hover:text-ink transition-colors" title="Modifier">
                <Pencil size={14} />
              </button>
              <button onClick={handleDelete} disabled={deleteMut.isPending} className="rounded p-1.5 text-ink-muted hover:bg-danger-soft hover:text-danger transition-colors disabled:opacity-60" title="Supprimer">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const HUB: { id: ViewId; title: string; sub: string; Icon: typeof FileText; dirOnly?: boolean }[] = [
  { id: "redacteur", title: "Actes", sub: "Mandat, compromis, offre", Icon: FileText },
  { id: "bail", title: "Baux", sub: "Nu, meublé, mobilité, saisonnier", Icon: ScrollText },
  { id: "valeur_locative", title: "Valeur locative", sub: "Estimation de loyer", Icon: Home },
  { id: "valeur_venale", title: "Valeur vénale", sub: "Estimation de vente", Icon: FileSearch },
  { id: "estimation", title: "Expertises", sub: "Rapport d'expertise", Icon: Award, dirOnly: true },
  { id: "compte_rendu", title: "Comptes rendus", sub: "Visites clients", Icon: ClipboardList },
];

export function DocumentsView() {
  const [filter, setFilter] = useState<Filter>("tous");
  const { data: docs = [], isLoading, isError, error } = useDocuments();
  const setView = useUiStore((s) => s.setView);
  const isDir = useSessionStore((s) => s.isDirecteur());

  const filtered = filter === "tous" ? docs : docs.filter(d => d.type_doc === filter);

  const counts = {
    tous:      docs.length,
    mandat:    docs.filter(d => d.type_doc === "mandat").length,
    compromis: docs.filter(d => d.type_doc === "compromis").length,
    offre:     docs.filter(d => d.type_doc === "offre").length,
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <Library size={20} className="text-primary" />
          <div>
            <h2 className="font-heading text-lg font-semibold text-ink">Documents</h2>
            <p className="text-[12px] text-ink-muted">Rédiger un acte, un bail ou une estimation — puis retrouver les fichiers ici</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HUB.filter((h) => isDir || !h.dirOnly).map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setView(h.id)}
              className="flex items-start gap-2.5 rounded-lg border border-line bg-bg px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
            >
              <h.Icon size={16} className="mt-0.5 shrink-0 text-primary" />
              <span>
                <span className="block text-[13px] font-semibold text-ink">{h.title}</span>
                <span className="block text-[11px] text-ink-muted">{h.sub}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["tous", "mandat", "compromis", "offre"] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors ${
                filter === f ? "bg-primary text-white" : "bg-line text-ink-sub hover:bg-line2"
              }`}
            >
              {f === "tous" ? "Tous" : TYPE_LABEL[f]}
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${filter === f ? "bg-white/20 text-white" : "bg-white text-ink-sub"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-ink-sub">
            <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
          </div>
        )}
        {isError && (
          <div className="flex flex-col gap-2 rounded-lg border border-danger/30 bg-danger-soft p-4 text-danger">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="text-[13px] font-medium">Impossible de charger les documents</span>
            </div>
            <p className="text-[12px] pl-6">
              {error instanceof Error ? error.message : "Vérifiez que la table \"documents\" et le bucket Storage \"documents\" existent dans Supabase."}
            </p>
          </div>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-line">
              <Library size={28} className="text-ink-muted" />
            </div>
            <p className="text-[14px] font-medium text-ink-sub">Aucun document</p>
            <p className="mt-1 text-[12.5px] text-ink-muted">
              {filter === "tous"
                ? "Les documents seront sauvegardés automatiquement lors du téléchargement depuis le Rédacteur."
                : `Aucun ${TYPE_LABEL[filter]?.toLowerCase()} enregistré.`}
            </p>
          </div>
        )}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="flex flex-col gap-3 max-w-3xl">
            {filtered.map(doc => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
