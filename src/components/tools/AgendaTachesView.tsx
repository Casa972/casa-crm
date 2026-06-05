import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "../ui/Field";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../ui/Modal";
import { Calendar, CheckCircle } from "lucide-react";

/**
 * Agenda & Tâches — état local (non persisté en base pour l'instant).
 * Brancher sur des tables Supabase dédiées si besoin de synchronisation.
 */

interface Tache { id: string; texte: string; done: boolean; }
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export function TachesView() {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [txt, setTxt] = useState("");
  const add = () => { if (txt.trim()) { setTaches((t) => [...t, { id: uid(), texte: txt.trim(), done: false }]); setTxt(""); } };

  return (
    <div className="mx-auto max-w-[600px] px-6 py-6">
      <PageHeader title="Mes tâches" subtitle="Actions à traiter rapidement." />
      <div className="mb-4 flex gap-2">
        <Input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="À faire..." />
        <button className="btn-primary" onClick={add}><Plus size={14} /></button>
      </div>
      {taches.length === 0 ? (
        <EmptyState Icon={CheckCircle} text="Aucune tâche" sub="Ajoutez votre première action." />
      ) : (
        <div className="flex flex-col gap-2">
          {taches.map((t) => (
            <div key={t.id} className="card flex items-center gap-3 p-3">
              <input type="checkbox" checked={t.done} onChange={() => setTaches((all) => all.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))} />
              <span className={`flex-1 text-[13.5px] ${t.done ? "text-ink-muted line-through" : "text-ink"}`}>{t.texte}</span>
              <button className="text-ink-muted hover:text-danger" onClick={() => setTaches((all) => all.filter((x) => x.id !== t.id))}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AgendaView() {
  return (
    <div className="mx-auto max-w-[860px] px-6 py-6">
      <PageHeader title="Agenda" subtitle="Vos rendez-vous à venir." />
      <EmptyState Icon={Calendar} text="Agenda à connecter" sub="Brancher une table Supabase dédiée pour la synchronisation des RDV." />
    </div>
  );
}
