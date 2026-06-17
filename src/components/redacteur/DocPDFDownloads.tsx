import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { FileDown, Loader2 } from "lucide-react";
import { MandatVentePDF } from "../../reports/MandatVentePDF";
import { CompromisVentePDF } from "../../reports/CompromisVentePDF";
import type { MandatVenteFull } from "../../schemas/redacteur/mandatVenteFull.schema";
import type { CompromisVente } from "../../schemas/redacteur/compromisVente.schema";
import { useSessionStore } from "../../store/session.store";
import { uploadDocument } from "../../services/documents.service";
import { useQueryClient } from "@tanstack/react-query";

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href    = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function MandatPDFDownload({ f }: { f: MandatVenteFull }) {
  const [loading, setLoading] = useState(false);
  const agentId = useSessionStore(s => s.user?.id ?? "");
  const qc = useQueryClient();

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob     = await pdf(<MandatVentePDF f={f} />).toBlob();
      const fileName = `Mandat_${f.numero || "MV"}_${f.date || "2026"}.pdf`;

      // 1. Téléchargement local
      triggerDownload(blob, fileName);

      // 2. Sauvegarde dans la bibliothèque (non-bloquante)
      const parties = f.mandants
        .map(m => [m.civilite, m.prenom, m.nom].filter(Boolean).join(" "))
        .join(", ");
      const bien = [f.adresseBien, f.commune].filter(Boolean).join(" — ");

      uploadDocument({
        agentId,
        typeDoc:  "mandat",
        nom:      fileName,
        numero:   f.numero,
        parties,
        bien,
        blob,
      })
        .then(() => qc.invalidateQueries({ queryKey: ["documents"] }))
        .catch(e => console.warn("Bibliothèque : sauvegarde échouée", e));

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
  const agentId = useSessionStore(s => s.user?.id ?? "");
  const qc = useQueryClient();
  const v = f.vendeurs[0];
  const a = f.acquereurs[0];

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob     = await pdf(<CompromisVentePDF f={f} />).toBlob();
      const fileName = `Compromis_${v?.nom || "vendeur"}_${a?.nom || "acquereur"}_${f.date || "2026"}.pdf`;

      // 1. Téléchargement local
      triggerDownload(blob, fileName);

      // 2. Sauvegarde dans la bibliothèque (non-bloquante)
      const parties = [
        v ? [v.civilite, v.prenom, v.nom].filter(Boolean).join(" ") : null,
        a ? [a.civilite, a.prenom, a.nom].filter(Boolean).join(" ") : null,
      ].filter(Boolean).join(" → ");
      const bien = [f.adresseBien, f.commune].filter(Boolean).join(" — ");

      uploadDocument({
        agentId,
        typeDoc:  "compromis",
        nom:      fileName,
        numero:   f.mandatRef || undefined,
        parties,
        bien,
        blob,
      })
        .then(() => qc.invalidateQueries({ queryKey: ["documents"] }))
        .catch(e => console.warn("Bibliothèque : sauvegarde échouée", e));

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
