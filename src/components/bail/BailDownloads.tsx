import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, FileText, Loader2 } from "lucide-react";
import { BailPDF } from "../../reports/BailPDF";
import { generateBailDOCX } from "../../reports/BailDOCX";
import type { Bail } from "../../schemas/bail.schema";

function baseName(doc: Bail) {
  const who = (doc.preneurs[0]?.nom || doc.commune || "Martinique").replace(/\s+/g, "_");
  return `Casa Caraibes - Bail ${who}`;
}

export function BailDOCXDownload({ doc }: { doc: Bail }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await generateBailDOCX(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName(doc)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 200);
    } catch (err) {
      console.error(err);
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

export default function BailDownloads({ doc }: { doc: Bail }) {
  return (
    <>
      <PDFDownloadLink document={<BailPDF e={doc} />} fileName={`${baseName(doc)}.pdf`}>
        {({ loading }) => (
          <span className="btn-ghost text-[12px]">
            <Download size={13} /> {loading ? "Préparation…" : "Télécharger PDF"}
          </span>
        )}
      </PDFDownloadLink>
      <BailDOCXDownload doc={doc} />
    </>
  );
}
