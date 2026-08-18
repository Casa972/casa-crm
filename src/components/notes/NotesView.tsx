import { useState } from "react";
import { Plus, Trash2, X, Check, StickyNote } from "lucide-react";
import { PageHeader } from "../shared/PageHeader";
import { useSessionStore } from "../../store/session.store";
import { useNotesStore, type Note } from "../../store/notes.store";

const COULEURS: { id: Note["couleur"]; bg: string; border: string; dot: string }[] = [
  { id: "jaune",  bg: "bg-yellow-50",  border: "border-yellow-300",  dot: "bg-yellow-400"  },
  { id: "bleu",   bg: "bg-sky-50",     border: "border-sky-300",     dot: "bg-sky-400"     },
  { id: "vert",   bg: "bg-emerald-50", border: "border-emerald-300", dot: "bg-emerald-500" },
  { id: "rose",   bg: "bg-pink-50",    border: "border-pink-300",    dot: "bg-pink-400"    },
  { id: "violet", bg: "bg-violet-50",  border: "border-violet-300",  dot: "bg-violet-400"  },
];

const couleurStyle = (c: Note["couleur"]) =>
  (COULEURS.find((x) => x.id === c) ?? COULEURS[0])!;

function NoteCard({
  note,
  onEdit,
  onDelete,
}: {
  note: Note;
  onEdit: (n: Note) => void;
  onDelete: (id: string) => void;
}) {
  const s = couleurStyle(note.couleur);
  return (
    <div
      className={`group relative flex flex-col rounded-xl border ${s.border} ${s.bg} p-4 shadow-sm cursor-pointer transition-shadow hover:shadow-md`}
      onClick={() => onEdit(note)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
        className="absolute right-2 top-2 hidden rounded p-1 text-ink-muted hover:text-danger group-hover:flex"
      >
        <Trash2 size={13} />
      </button>

      <div className={`mb-1 inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5`}>
        <span className={`size-2 rounded-full ${s.dot}`} />
        <span className="text-[10px] font-bold uppercase tracking-wide text-ink-muted capitalize">{note.couleur}</span>
      </div>

      {note.titre && (
        <div className="text-[14px] font-semibold text-ink mb-1 line-clamp-1">{note.titre}</div>
      )}
      <div className="text-[12.5px] text-ink-sub whitespace-pre-wrap line-clamp-6 flex-1">
        {note.contenu || <span className="italic text-ink-muted">Note vide</span>}
      </div>

      <div className="mt-3 text-[10px] text-ink-muted">
        {new Date(note.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
      </div>
    </div>
  );
}

function NoteModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Note;
  onSave: (data: Pick<Note, "titre" | "contenu" | "couleur">) => void;
  onClose: () => void;
}) {
  const [titre, setTitre]   = useState(initial?.titre   ?? "");
  const [contenu, setContenu] = useState(initial?.contenu ?? "");
  const [couleur, setCouleur] = useState<Note["couleur"]>(initial?.couleur ?? "jaune");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={`w-full max-w-lg rounded-2xl border-2 ${couleurStyle(couleur).border} ${couleurStyle(couleur).bg} p-5 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
            <StickyNote size={13} /> {initial ? "Modifier la note" : "Nouvelle note"}
          </span>
          <button onClick={onClose} className="rounded p-1 text-ink-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>

        {/* Couleur */}
        <div className="mb-3 flex items-center gap-2">
          {COULEURS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCouleur(c.id)}
              className={`size-6 rounded-full ${c.dot} ring-offset-2 transition-all ${couleur === c.id ? "ring-2 ring-ink scale-110" : "opacity-60 hover:opacity-100"}`}
            />
          ))}
        </div>

        {/* Titre */}
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Titre (optionnel)"
          className="mb-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[14px] font-semibold text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        {/* Contenu */}
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder="Votre note... URL, contacts, procédures, rappels..."
          rows={7}
          className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost text-[13px]">Annuler</button>
          <button
            onClick={() => { onSave({ titre, contenu, couleur }); onClose(); }}
            className="btn-primary flex items-center gap-1.5 text-[13px]"
          >
            <Check size={14} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotesView() {
  const user = useSessionStore((s) => s.user);
  const { notesByUser, addNote, updateNote, deleteNote } = useNotesStore();
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; note: Note } | null>(null);

  if (!user) return null;

  const notes = notesByUser[user.id] ?? [];

  const handleSave = (data: Pick<Note, "titre" | "contenu" | "couleur">) => {
    if (modal?.mode === "edit") {
      updateNote(user.id, modal.note.id, data);
    } else {
      addNote(user.id, data);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <PageHeader
          title="Notes"
          subtitle={`${notes.length} note${notes.length !== 1 ? "s" : ""} · visibles uniquement par vous`}
        />
        <button
          onClick={() => setModal({ mode: "create" })}
          className="btn-primary flex items-center gap-1.5 text-[13px]"
        >
          <Plus size={14} /> Nouvelle note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <StickyNote size={40} className="mb-4 text-ink-muted opacity-40" />
          <div className="text-[15px] font-semibold text-ink-muted">Aucune note pour l'instant</div>
          <div className="mt-1 text-[13px] text-ink-muted">Sites importants, contacts, procédures — notez tout ici.</div>
          <button
            onClick={() => setModal({ mode: "create" })}
            className="btn-primary mt-5 flex items-center gap-1.5 text-[13px]"
          >
            <Plus size={14} /> Créer ma première note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...notes].reverse().map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={(n) => setModal({ mode: "edit", note: n })}
              onDelete={(id) => { if (confirm("Supprimer cette note ?")) deleteNote(user.id, id); }}
            />
          ))}
        </div>
      )}

      {modal && (
        <NoteModal
          initial={modal.mode === "edit" ? modal.note : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
