import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { CompteRenduPDF } from "../../reports/CompteRenduPDF";
import type { CompteRendu } from "../../schemas/compteRendu.schema";

export default function CompteRenduPDFDownload({ cr }: { cr: CompteRendu }) {
  const fileName = `CRV_${cr.visiteurNom.replace(/\s+/g, "_")}_${cr.date || "sans-date"}.pdf`;
  return (
    <PDFDownloadLink document={<CompteRenduPDF cr={cr} />} fileName={fileName}>
      {({ loading }) => (
        <span className="btn-ghost text-[12px]">
          <Download size={13} /> {loading ? "Préparation…" : "Télécharger PDF"}
        </span>
      )}
    </PDFDownloadLink>
  );
}
