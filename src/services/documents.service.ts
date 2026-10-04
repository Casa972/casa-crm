import { supabase } from "./supabase.client";
import type { DocumentRow } from "../types/database";

// ── Sauvegarde métadonnées (sans upload Storage) ──────────────────────────────

export async function uploadDocument(params: {
  agentId: string;
  typeDoc: "mandat" | "compromis" | "offre";
  nom: string;
  numero?: string;
  parties?: string;
  bien?: string;
  blob: Blob;
}): Promise<void> {
  const id = crypto.randomUUID();
  try {
    const bytes = new Uint8Array(await params.blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i] ?? 0);
    localStorage.setItem(`casa-doc-file:${id}`, btoa(binary));
  } catch { /* quota navigateur : la fiche reste, le fichier se retélécharge depuis Vente */ }
  const { error } = await supabase.from("documents").insert({
    id,
    agent_id:     params.agentId,
    type_doc:     params.typeDoc,
    nom:          params.nom,
    numero:       params.numero ?? null,
    parties:      params.parties ?? null,
    bien:         params.bien ?? null,
    storage_path: `local:${id}`,
    taille:       params.blob.size,
  });

  if (error) throw error;
}

// ── Liste des documents ───────────────────────────────────────────────────────

export async function listDocuments(): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentRow[];
}

// ── Mise à jour des métadonnées ───────────────────────────────────────────────

export async function updateDocument(id: string, patch: {
  nom?: string;
  numero?: string | null;
  parties?: string | null;
  bien?: string | null;
}): Promise<void> {
  const { error } = await supabase.from("documents").update(patch).eq("id", id);
  if (error) throw error;
}

// ── Suppression ───────────────────────────────────────────────────────────────

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}
