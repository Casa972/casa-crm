import { supabase } from "./supabase.client";
import type { DocumentRow } from "../types/database";

const BUCKET = "documents";

// ── Upload + sauvegarde métadonnées ───────────────────────────────────────────

export async function uploadDocument(params: {
  agentId: string;
  typeDoc: "mandat" | "compromis" | "offre";
  nom: string;
  numero?: string;
  parties?: string;
  bien?: string;
  blob: Blob;
}): Promise<void> {
  const timestamp = Date.now();
  const safeName  = params.nom.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path      = `${params.agentId}/${timestamp}_${safeName}`;

  // 1. Upload fichier dans Storage
  const isDocx = params.nom.endsWith(".docx");
  const contentType = isDocx
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : "application/pdf";

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, params.blob, { contentType, upsert: false });

  if (uploadErr) throw uploadErr;

  // 2. Sauvegarder les métadonnées en base
  const { error: dbErr } = await supabase.from("documents").insert({
    agent_id:     params.agentId,
    type_doc:     params.typeDoc,
    nom:          params.nom,
    numero:       params.numero ?? null,
    parties:      params.parties ?? null,
    bien:         params.bien ?? null,
    storage_path: path,
    taille:       params.blob.size,
  });

  if (dbErr) throw dbErr;
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

// ── Téléchargement (URL signée 1h) ────────────────────────────────────────────

export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) throw error ?? new Error("URL signée vide");
  return data.signedUrl;
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

export async function deleteDocument(id: string, storagePath: string): Promise<void> {
  // Supprimer le fichier Storage (erreur non bloquante si déjà absent)
  await supabase.storage.from(BUCKET).remove([storagePath]);
  // Supprimer les métadonnées
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}
