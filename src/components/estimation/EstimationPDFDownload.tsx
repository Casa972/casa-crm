import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { EstimationPDF } from "../../reports/EstimationPDF";
import type { Estimation } from "../../schemas/estimation.schema";

export default function EstimationPDFDownload({ estimation }: { estimation: Estimation }) {
  const base = `CasaCaraibes_${estimation.commune || "Martinique"}_${new Date().toISOString().slice(0, 10)}`;

  return (
    <PDFDownloadLink
      document={<EstimationPDF e={estimation} />}
      fileName={`${base}_RapportExpertise.pdf`}
    >
      {({ loading }) => (
        <span className="btn-ghost text-[12px]">
          <Download size={13} /> {loading ? "Préparation…" : "Rapport d'expertise"}
        </span>
      )}
    </PDFDownloadLink>
  );
}
