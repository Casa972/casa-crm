import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { ValeurVenalePDF } from "../../reports/ValeurVenalePDF";
import type { Estimation } from "../../schemas/estimation.schema";

export default function ValeurVenalePDFDownload({ estimation }: { estimation: Estimation }) {
  const [loading, setLoading] = useState(false);
  const fileName = `CasaCaraibes_Estimation_${estimation.commune || "Martinique"}_${new Date().toISOString().slice(0, 10)}.pdf`;

  const handle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await pdf(<ValeurVenalePDF e={estimation} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 400);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className="btn-ghost text-[12px]" onClick={handle} disabled={loading}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      {loading ? "Préparation…" : "Télécharger PDF"}
    </button>
  );
}
