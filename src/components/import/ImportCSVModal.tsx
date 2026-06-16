import { useState, useRef } from "react";
import { Upload, AlertCircle, Check } from "lucide-react";
import { Modal, FormActions } from "../ui/Modal";
import { useSaveClient } from "../../hooks/queries/useAgencyData";
import { useSaveBien } from "../../hooks/queries/useAgencyData";
import { useSessionStore } from "../../store/session.store";
import type { Client, Bien } from "../../types/domain";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

type ImportType = "clients" | "biens";

interface ParsedRow { [key: string]: string }

interface ValidationError { row: number; message: string }

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = (lines[0] ?? "").split(/[,;]/).map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(/[,;]/).map((v) => v.trim().replace(/^["']|["']$/g, ""));
    const row: ParsedRow = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  }).filter((r) => Object.values(r).some((v) => v));
}

function rowToClient(row: ParsedRow, agentId?: string): { client?: Client; error?: string } {
  const prenom = row["prenom"] || row["prénom"] || row["firstname"] || "";
  const nom = row["nom"] || row["lastname"] || "";
  if (!prenom) return { error: "Colonne 'prenom' manquante ou vide" };
  return {
    client: {
      id: uid(),
      prenom,
      nom: nom || "",
      email: row["email"] || "",
      tel: row["tel"] || row["telephone"] || row["téléphone"] || "",
      type: (row["type"] || "Acheteur") as any,
      statut: (row["statut"] || "Prospect") as any,
      budgetMax: Number(row["budget_max"] || row["budget"] || 0),
      commune: row["commune"] || "",
      typeBien: row["type_bien"] || "",
      chambresMin: Number(row["chambres_min"] || 0),
      notes: row["notes"] || "",
      bienId: "",
      dernierContact: "",
      relanceDate: "",
      financement: "",
      agentId,
    },
  };
}

function rowToBien(row: ParsedRow): { bien?: Bien; error?: string } {
  const ref = row["ref"] || row["reference"] || row["réf"] || "";
  const commune = row["commune"] || "";
  const type = row["type"] || "";
  if (!ref) return { error: "Colonne 'ref' manquante ou vide" };
  if (!commune) return { error: "Colonne 'commune' manquante ou vide" };
  return {
    bien: {
      id: uid(),
      ref,
      type: (type || "Appartement") as any,
      adresse: row["adresse"] || "",
      commune,
      surface: Number(row["surface"] || 0),
      chambres: Number(row["chambres"] || 0),
      prix: Number(row["prix"] || 0),
      cat: (row["cat"] || row["categorie"] || "vente") as any,
      statut: (row["statut"] || "Disponible") as any,
      desc: row["desc"] || row["description"] || "",
      mandatId: "",
    },
  };
}

export function ImportCSVModal({ type, onClose }: { type: ImportType; onClose: () => void }) {
  const saveClient = useSaveClient();
  const saveBien = useSaveBien();
  const user = useSessionStore((s) => s.user);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [imported, setImported] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setErrors([]);
      setImported(null);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const validate = (): ValidationError[] => {
    const errs: ValidationError[] = [];
    rows.forEach((row, i) => {
      const result = type === "clients" ? rowToClient(row, user?.id) : rowToBien(row);
      if (result.error) errs.push({ row: i + 1, message: result.error });
    });
    return errs;
  };

  const handleImport = async () => {
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }

    let count = 0;
    for (const row of rows) {
      if (type === "clients") {
        const { client } = rowToClient(row, user?.id);
        if (client) { await saveClient.mutateAsync(client); count++; }
      } else {
        const { bien } = rowToBien(row);
        if (bien) { await saveBien.mutateAsync(bien); count++; }
      }
    }
    setImported(count);
  };

  const columnsHint = type === "clients"
    ? "prenom, nom, tel, email, type, statut, budget_max, commune, type_bien, chambres_min, notes"
    : "ref, type, adresse, commune, surface, chambres, prix, cat, statut, desc";

  return (
    <Modal title={`Importer des ${type} via CSV`} wide onClose={onClose}>
      {imported !== null ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-soft">
            <Check size={28} className="text-emerald" />
          </div>
          <p className="font-heading text-xl font-semibold text-ink">{imported} ligne(s) importée(s)</p>
          <p className="mt-1 text-[13px] text-ink-muted">Les données sont maintenant disponibles dans la vue.</p>
          <button className="btn-primary mt-5" onClick={onClose}>Fermer</button>
        </div>
      ) : (
        <>
          {/* Hint colonnes */}
          <div className="mb-3 rounded bg-primary-soft p-2.5 text-[12px] text-primary">
            <span className="font-bold">Colonnes attendues :</span> {columnsHint}
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`mb-4 flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${dragging ? "border-primary bg-primary-soft" : "border-line hover:border-primary/50 hover:bg-bg"}`}
          >
            <Upload size={24} className="text-ink-muted" />
            <p className="text-[13px] font-medium text-ink-sub">Glissez un CSV ici ou cliquez pour parcourir</p>
            <p className="text-[11.5px] text-ink-muted">Séparateur virgule ou point-virgule, encodage UTF-8</p>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* Aperçu */}
          {rows.length > 0 && (
            <div className="mb-4">
              <div className="mb-1.5 text-[12px] font-bold text-ink-sub">{rows.length} ligne(s) détectée(s) — Aperçu :</div>
              <div className="overflow-x-auto rounded border border-line">
                <table className="w-full text-[11.5px]">
                  <thead>
                    <tr className="bg-bg border-b border-line">
                      {Object.keys(rows[0] ?? {}).map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left font-bold text-ink-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-b border-line/50 last:border-0">
                        {Object.values(r).map((v, j) => (
                          <td key={j} className="px-2 py-1.5 text-ink truncate max-w-[120px]">{v || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 5 && (
                  <div className="px-2 py-1.5 text-[11px] text-ink-muted bg-bg">…et {rows.length - 5} ligne(s) de plus</div>
                )}
              </div>
            </div>
          )}

          {/* Erreurs */}
          {errors.length > 0 && (
            <div className="mb-4 rounded border border-danger/30 bg-danger-soft p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-danger">
                <AlertCircle size={13} /> {errors.length} erreur(s) de validation
              </div>
              {errors.slice(0, 5).map((e) => (
                <div key={e.row} className="text-[11.5px] text-danger">Ligne {e.row} : {e.message}</div>
              ))}
            </div>
          )}

          <FormActions
            onSave={handleImport}
            onClose={onClose}
            label={rows.length > 0 ? `Importer ${rows.length} ligne(s)` : "Importer"}
            disabled={rows.length === 0 || saveClient.isPending || saveBien.isPending}
          />
        </>
      )}
    </Modal>
  );
}
