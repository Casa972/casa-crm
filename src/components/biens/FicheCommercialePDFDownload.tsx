import { PDFDownloadLink } from "@react-pdf/renderer";
import { FileText } from "lucide-react";
import { FicheCommercialePDF } from "../../reports/FicheCommercialePDF";
import type { Bien } from "../../types/domain";
import type { FicheCommerciale } from "../../schemas/ficheCommerciale.schema";

export default function FicheCommercialePDFDownload({ bien, fiche }: { bien: Bien; fiche: FicheCommerciale }) {
  const fileName = `Fiche_${(bien.ref || bien.commune || "bien").replace(/\s+/g, "_")}.pdf`;
  return (
    <PDFDownloadLink document={<FicheCommercialePDF bien={bien} fiche={fiche} />} fileName={fileName}>
      {({ loading }) => (
        <span className="btn-primary text-[12px]">
          <FileText size={13} /> {loading ? "Préparation…" : "Générer la fiche PDF"}
        </span>
      )}
    </PDFDownloadLink>
  );
}
