import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { fetchDvfComparables } from "../../services/dvf.service";
import type { RefMarche } from "../../schemas/estimation.schema";
import { uid } from "../../hooks/queries/useEstimations";

export function DvfImportButton({
  commune, typeBien, onImport,
}: {
  commune: string;
  typeBien?: string;
  onImport: (refs: RefMarche[]) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!commune) {
      alert("Indiquez d'abord la commune (étape Identification).");
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchDvfComparables(commune, typeBien);
      if (!rows.length) {
        alert(`Aucune vente DVF récente trouvée pour ${commune}.`);
        return;
      }
      onImport(rows.map((r) => ({
        id: uid(),
        type: r.type,
        surface: r.surface,
        prix: r.prix,
        prixM2: r.prixM2,
        observations: r.date,
        source: "DVF" as const,
        reference: r.reference,
        localisation: r.localisation,
        differences: "",
      })));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Import DVF impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className="btn-ghost text-[12px]" onClick={handle} disabled={loading}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      {loading ? "Import DVF…" : "Importer DVF (3 ans)"}
    </button>
  );
}
