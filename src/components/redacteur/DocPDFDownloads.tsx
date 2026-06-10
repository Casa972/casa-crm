import { PDFDownloadLink } from "@react-pdf/renderer";
import { FileDown } from "lucide-react";
import { MandatVentePDF } from "../../reports/MandatVentePDF";
import { CompromisVentePDF } from "../../reports/CompromisVentePDF";
import type { MandatVenteFull } from "../../schemas/redacteur/mandatVenteFull.schema";
import type { CompromisVente } from "../../schemas/redacteur/compromisVente.schema";

export function MandatPDFDownload({ f }: { f: MandatVenteFull }) {
  const fileName = `Mandat_${f.numero || "MV"}_${f.date || "2026"}.pdf`;
  return (
    <PDFDownloadLink document={<MandatVentePDF f={f} />} fileName={fileName}>
      {({ loading }) => (
        <span className="btn-primary">
          <FileDown size={14} /> {loading ? "Préparation…" : "Télécharger le mandat PDF"}
        </span>
      )}
    </PDFDownloadLink>
  );
}

export function CompromisPDFDownload({ f }: { f: CompromisVente }) {
  const v = f.vendeurs[0];
  const a = f.acquereurs[0];
  const label = v && a ? `${v.nom}_${a.nom}` : "compromis";
  const fileName = `Compromis_${label}_${f.date || "2026"}.pdf`;
  return (
    <PDFDownloadLink document={<CompromisVentePDF f={f} />} fileName={fileName}>
      {({ loading }) => (
        <span className="btn-primary">
          <FileDown size={14} /> {loading ? "Préparation…" : "Télécharger le compromis PDF"}
        </span>
      )}
    </PDFDownloadLink>
  );
}
