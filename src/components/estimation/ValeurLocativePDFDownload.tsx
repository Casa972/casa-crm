import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { ValeurLocativePDF } from "../../reports/ValeurLocativePDF";
import type { ValeurLocative } from "../../schemas/valeurLocative.schema";

export default function ValeurLocativePDFDownload({ doc }: { doc: ValeurLocative }) {
  const who = (doc.mandantNom || doc.commune || "Martinique").replace(/\s+/g, "_");
  const fileName = `Casa Caraibes - Estimation de valeur locative ${who}.pdf`;
  return (
    <PDFDownloadLink document={<ValeurLocativePDF e={doc} />} fileName={fileName}>
      {({ loading }) => (
        <span className="btn-ghost text-[12px]">
          <Download size={13} /> {loading ? "Préparation…" : "Télécharger PDF"}
        </span>
      )}
    </PDFDownloadLink>
  );
}
