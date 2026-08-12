import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { ValeurVenalePDF } from "../../reports/ValeurVenalePDF";
import type { Estimation } from "../../schemas/estimation.schema";

export default function ValeurVenalePDFDownload({ estimation }: { estimation: Estimation }) {
  const fileName = `CasaCaraibes_Estimation_${estimation.commune || "Martinique"}_${new Date().toISOString().slice(0, 10)}.pdf`;
  return (
    <PDFDownloadLink document={<ValeurVenalePDF e={estimation} />} fileName={fileName}>
      {({ loading }) => (
        <span className="btn-ghost text-[12px]">
          <Download size={13} /> {loading ? "Préparation…" : "Télécharger PDF"}
        </span>
      )}
    </PDFDownloadLink>
  );
}
