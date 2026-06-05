import { PDFDownloadLink } from "@react-pdf/renderer";
import { BarChart2 } from "lucide-react";
import { RapportFinancier } from "../../reports/RapportFinancier";
import type { AgencyData } from "../../types/domain";
import type { Financials } from "../../hooks/useFinancials";

const fileName = `CasaCaraibes_Rapport_${new Date().toISOString().slice(0, 10)}.pdf`;

export default function PdfDownloadButton({ data, fin }: { data: AgencyData; fin: Financials }) {
  return (
    <PDFDownloadLink document={<RapportFinancier data={data} fin={fin} />} fileName={fileName}>
      {({ loading }) => (
        <span className="btn-primary">
          <BarChart2 size={14} /> {loading ? "Préparation…" : "Rapport PDF"}
        </span>
      )}
    </PDFDownloadLink>
  );
}
