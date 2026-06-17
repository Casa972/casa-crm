import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { FileDown, Loader2 } from "lucide-react";
import { MandatVentePDF } from "../../reports/MandatVentePDF";
import { CompromisVentePDF } from "../../reports/CompromisVentePDF";
import type { MandatVenteFull } from "../../schemas/redacteur/mandatVenteFull.schema";
import type { CompromisVente } from "../../schemas/redacteur/compromisVente.schema";

export function MandatPDFDownload({ f }: { f: MandatVenteFull }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await pdf(<MandatVentePDF f={f} />).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `Mandat_${f.numero || "MV"}_${f.date || "2026"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Erreur génération PDF mandat:", e);
      alert("Erreur lors de la génération du PDF. Vérifiez la console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn-primary" onClick={handleDownload} disabled={loading}>
      {loading
        ? <><Loader2 size={14} className="animate-spin" /> Génération…</>
        : <><FileDown size={14} /> Télécharger le mandat PDF</>
      }
    </button>
  );
}

export function CompromisPDFDownload({ f }: { f: CompromisVente }) {
  const [loading, setLoading] = useState(false);
  const v = f.vendeurs[0];
  const a = f.acquereurs[0];

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await pdf(<CompromisVentePDF f={f} />).toBlob();
      const url  = URL.createObjectURL(blob);
      const el   = document.createElement("a");
      el.href    = url;
      el.download = `Compromis_${v?.nom || "vendeur"}_${a?.nom || "acquereur"}_${f.date || "2026"}.pdf`;
      el.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Erreur génération PDF compromis:", e);
      alert("Erreur lors de la génération du PDF. Vérifiez la console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn-primary" onClick={handleDownload} disabled={loading}>
      {loading
        ? <><Loader2 size={14} className="animate-spin" /> Génération…</>
        : <><FileDown size={14} /> Télécharger le compromis PDF</>
      }
    </button>
  );
}
