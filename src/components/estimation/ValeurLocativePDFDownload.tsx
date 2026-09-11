import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, FileText, Loader2 } from "lucide-react";
import { ValeurLocativePDF } from "../../reports/ValeurLocativePDF";
import { generateValeurLocativeDOCX } from "../../reports/ValeurLocativeDOCX";
import type { ValeurLocative } from "../../schemas/valeurLocative.schema";

function baseName(doc: ValeurLocative) {
  const who = (doc.mandantNom || doc.commune || "Martinique").replace(/\s+/g, "_");
  return `Casa Caraibes - Estimation de valeur locative ${who}`;
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 400);
}

export function ValeurLocativeDOCXDownload({ doc }: { doc: ValeurLocative }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      triggerDownload(await generateValeurLocativeDOCX(doc), `${baseName(doc)}.docx`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du fichier Word.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <button type="button" className="btn-ghost text-[12px]" onClick={handle} disabled={loading}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
      {loading ? "Préparation…" : "Télécharger Word"}
    </button>
  );
}

export default function ValeurLocativePDFDownload({ doc }: { doc: ValeurLocative }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await pdf(<ValeurLocativePDF e={doc} />).toBlob();
      triggerDownload(blob, `${baseName(doc)}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du PDF. Réessayez, ou utilisez le Word.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <button type="button" className="btn-ghost text-[12px]" onClick={handle} disabled={loading}>
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        {loading ? "Préparation…" : "Télécharger PDF"}
      </button>
      <ValeurLocativeDOCXDownload doc={doc} />
    </>
  );
}
