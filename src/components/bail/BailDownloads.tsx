import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, FileText, Loader2 } from "lucide-react";
import { BailPDF } from "../../reports/BailPDF";
import { generateBailDOCX } from "../../reports/BailDOCX";
import type { Bail } from "../../schemas/bail.schema";
import { erreursBail } from "../../schemas/bail.schema";
import { toast } from "../../store/toast.store";

function baseName(doc: Bail) {
  const who = (doc.preneurs[0]?.nom || doc.commune || "Martinique").replace(/\s+/g, "_");
  return `Casa Caraibes - Bail ${who}`;
}

function guard(doc: Bail) {
  const err = erreursBail(doc);
  if (err.length) {
    toast.error("Compl\u00e9tez : " + err.join(", "));
    return false;
  }
  return true;
}

export function BailDOCXDownload({ doc }: { doc: Bail }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (loading || !guard(doc)) return;
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
      toast.error("Erreur lors de la g\u00e9n\u00e9ration du fichier Word.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <button type="button" className="btn-ghost text-[12px]" onClick={() => void handle()} disabled={loading}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
      {loading ? "Pr\u00e9paration\u2026" : "T\u00e9l\u00e9charger Word"}
    </button>
  );
}

export default function BailDownloads({ doc }: { doc: Bail }) {
  const [loading, setLoading] = useState(false);
  const handlePdf = async () => {
    if (loading || !guard(doc)) return;
    setLoading(true);
    try {
      const blob = await pdf(<BailPDF e={doc} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName(doc)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 200);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la g\u00e9n\u00e9ration du PDF.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <button type="button" className="btn-ghost text-[12px]" onClick={() => void handlePdf()} disabled={loading}>
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        {loading ? "PDF\u2026" : "T\u00e9l\u00e9charger PDF"}
      </button>
      <BailDOCXDownload doc={doc} />
    </>
  );
}
