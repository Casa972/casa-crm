import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, FileText, Loader2 } from "lucide-react";
import { ValeurLocativePDF } from "../../reports/ValeurLocativePDF";
import { generateValeurLocativeDOCX } from "../../reports/ValeurLocativeDOCX";
import type { ValeurLocative } from "../../schemas/valeurLocative.schema";

function baseName(doc: ValeurLocative) {
  const who = (doc.mandantNom || doc.commune || "Martinique").replace(/\s+/g, "_");
  return `Casa Caraibes - Estimation de valeur locative ${who}`;
}

export function ValeurLocativeDOCXDownload({ doc }: { doc: ValeurLocative }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await generateValeurLocativeDOCX(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName(doc)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 200);
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
  return (
    <>
      <PDFDownloadLink document={<ValeurLocativePDF e={doc} />} fileName={`${baseName(doc)}.pdf`}>
        {({ loading }) => (
          <span className="btn-ghost text-[12px]">
            <Download size={13} /> {loading ? "Préparation…" : "Télécharger PDF"}
          </span>
        )}
      </PDFDownloadLink>
      <ValeurLocativeDOCXDownload doc={doc} />
    </>
  );
}
