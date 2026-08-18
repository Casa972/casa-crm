import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Note {
  id: string;
  titre: string;
  contenu: string;
  couleur: "jaune" | "bleu" | "vert" | "rose" | "violet";
  createdAt: string;
  updatedAt: string;
}

interface NotesState {
  notesByUser: Record<string, Note[]>;
  addNote: (userId: string, note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  updateNote: (userId: string, id: string, patch: Partial<Pick<Note, "titre" | "contenu" | "couleur">>) => void;
  deleteNote: (userId: string, id: string) => void;
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const now = () => new Date().toISOString();

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notesByUser: {},

      addNote: (userId, note) =>
        set((s) => ({
          notesByUser: {
            ...s.notesByUser,
            [userId]: [
              ...(s.notesByUser[userId] ?? []),
              { ...note, id: uid(), createdAt: now(), updatedAt: now() },
            ],
          },
        })),

      updateNote: (userId, id, patch) =>
        set((s) => ({
          notesByUser: {
            ...s.notesByUser,
            [userId]: (s.notesByUser[userId] ?? []).map((n) =>
              n.id === id ? { ...n, ...patch, updatedAt: now() } : n
            ),
          },
        })),

      deleteNote: (userId, id) =>
        set((s) => ({
          notesByUser: {
            ...s.notesByUser,
            [userId]: (s.notesByUser[userId] ?? []).filter((n) => n.id !== id),
          },
        })),
    }),
    { name: "casa-notes" }
  )
);
