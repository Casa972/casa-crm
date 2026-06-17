import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { FileDown, Loader2, FileText } from "lucide-react";
import { MandatVentePDF } from "../../reports/MandatVentePDF";
import { CompromisVentePDF } from "../../reports/CompromisVentePDF";
import { OffreAchatPDF } from "../../reports/OffreAchatPDF";
import { generateMandatDOCX } from "../../reports/MandatVenteDOCX";
import { generateCompromisDOCX } from "../../reports/CompromisVenteDOCX";
import { generateOffreDOCX } from "../../reports/OffreAchatDOCX";
import type { MandatVenteFull } from "../../schemas/redacteur/mandatVenteFull.schema";
import type { CompromisVente } from "../../schemas/redacteur/compromisVente.schema";
import type { OffreAchat } from "../../schemas/redacteur/offreAchat.schema";
import { useSessionStore } from "../../store/session.store";
import { uploadDocument } from "../../services/documents.service";
import { useQueryClient } from "@tanstack/react-query";

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href    = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 200);
}

// ── Mandat ────────────────────────────────────────────────────────────────────

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
      triggerDownload(blob, fileName);
      const parties = f.mandants.map(m => [m.civilite, m.prenom, m.nom].filter(Boolean).join(" ")).join(", ");
      const bien = [f.adresseBien, f.commune].filter(Boolean).join(" — ");
      uploadDocument({ agentId, typeDoc: "mandat", nom: fileName, numero: f.numero, parties, bien, blob })
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
      {loading ? <><Loader2 size={14} className="animate-spin" /> Génération…</> : <><FileDown size={14} /> PDF</>}
    </button>
  );
}

export function MandatDOCXDownload({ f }: { f: MandatVenteFull }) {
  const [loading, setLoading] = useState(false);
  const agentId = useSessionStore(s => s.user?.id ?? "");
  const qc = useQueryClient();

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob     = await generateMandatDOCX(f);
      const fileName = `Mandat_${f.numero || "MV"}_${f.date || "2026"}.docx`;
      triggerDownload(blob, fileName);
      const parties = f.mandants.map(m => [m.civilite, m.prenom, m.nom].filter(Boolean).join(" ")).join(", ");
      const bien = [f.adresseBien, f.commune].filter(Boolean).join(" — ");
      uploadDocument({ agentId, typeDoc: "mandat", nom: fileName, numero: f.numero, parties, bien, blob })
        .then(() => qc.invalidateQueries({ queryKey: ["documents"] }))
        .catch(e => console.warn("Bibliothèque : sauvegarde échouée", e));
    } catch (e) {
      console.error("Erreur génération DOCX mandat:", e);
      alert("Erreur lors de la génération du fichier Word. Vérifiez la console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn-secondary" onClick={handleDownload} disabled={loading}>
      {loading ? <><Loader2 size={14} className="animate-spin" /> Génération…</> : <><FileText size={14} /> Word (.docx)</>}
    </button>
  );
}

// ── Compromis ─────────────────────────────────────────────────────────────────

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
      triggerDownload(blob, fileName);
      const parties = [
        v ? [v.civilite, v.prenom, v.nom].filter(Boolean).join(" ") : null,
        a ? [a.civilite, a.prenom, a.nom].filter(Boolean).join(" ") : null,
      ].filter(Boolean).join(" → ");
      const bien = [f.adresseBien, f.commune].filter(Boolean).join(" — ");
      uploadDocument({ agentId, typeDoc: "compromis", nom: fileName, numero: f.mandatRef || undefined, parties, bien, blob })
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
      {loading ? <><Loader2 size={14} className="animate-spin" /> Génération…</> : <><FileDown size={14} /> PDF</>}
    </button>
  );
}

export function CompromisDOCXDownload({ f }: { f: CompromisVente }) {
  const [loading, setLoading] = useState(false);
  const agentId = useSessionStore(s => s.user?.id ?? "");
  const qc = useQueryClient();

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const v        = f.vendeurs[0];
      const a        = f.acquereurs[0];
      const blob     = await generateCompromisDOCX(f);
      const fileName = `Compromis_${v?.nom || "vendeur"}_${a?.nom || "acquereur"}_${f.date || "2026"}.docx`;
      triggerDownload(blob, fileName);
      const parties = [
        v ? [v.civilite, v.prenom, v.nom].filter(Boolean).join(" ") : null,
        a ? [a.civilite, a.prenom, a.nom].filter(Boolean).join(" ") : null,
      ].filter(Boolean).join(" → ");
      const bien = [f.adresseBien, f.commune].filter(Boolean).join(" — ");
      uploadDocument({ agentId, typeDoc: "compromis", nom: fileName, numero: f.mandatRef || undefined, parties, bien, blob })
        .then(() => qc.invalidateQueries({ queryKey: ["documents"] }))
        .catch(e => console.warn("Bibliothèque : sauvegarde échouée", e));
    } catch (e) {
      console.error("Erreur génération DOCX compromis:", e);
      alert("Erreur lors de la génération du fichier Word. Vérifiez la console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn-secondary" onClick={handleDownload} disabled={loading}>
      {loading ? <><Loader2 size={14} className="animate-spin" /> Génération…</> : <><FileText size={14} /> Word (.docx)</>}
    </button>
  );
}

// ── Offre d'achat ─────────────────────────────────────────────────────────────

export function OffrePDFDownload({ f }: { f: OffreAchat }) {
  const [loading, setLoading] = useState(false);
  const agentId = useSessionStore(s => s.user?.id ?? "");
  const qc = useQueryClient();

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob     = await pdf(<OffreAchatPDF f={f} />).toBlob();
      const acq      = f.acquereurs[0];
      const fileName = `OffreAchat_${acq?.nom || "acquereur"}_${f.date || "2026"}.pdf`;
      triggerDownload(blob, fileName);
      uploadDocument({
        agentId, typeDoc: "offre", nom: fileName, numero: f.numero,
        parties: f.acquereurs.map(a => [a.civilite, a.prenom, a.nom].filter(Boolean).join(" ")).join(", "),
        bien: [f.adresseBien, f.commune].filter(Boolean).join(" — "),
        blob,
      })
        .then(() => qc.invalidateQueries({ queryKey: ["documents"] }))
        .catch(e => console.warn("Bibliothèque : sauvegarde échouée", e));
    } catch (e) {
      console.error("Erreur génération PDF offre:", e);
      alert("Erreur lors de la génération du PDF. Vérifiez la console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn-primary" onClick={handleDownload} disabled={loading}>
      {loading ? <><Loader2 size={14} className="animate-spin" /> Génération…</> : <><FileDown size={14} /> PDF</>}
    </button>
  );
}

export function OffreDOCXDownload({ f }: { f: OffreAchat }) {
  const [loading, setLoading] = useState(false);
  const agentId = useSessionStore(s => s.user?.id ?? "");
  const qc = useQueryClient();

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const acq      = f.acquereurs[0];
      const blob     = await generateOffreDOCX(f);
      const fileName = `OffreAchat_${acq?.nom || "acquereur"}_${f.date || "2026"}.docx`;
      triggerDownload(blob, fileName);
      uploadDocument({
        agentId, typeDoc: "offre", nom: fileName, numero: f.numero,
        parties: f.acquereurs.map(a => [a.civilite, a.prenom, a.nom].filter(Boolean).join(" ")).join(", "),
        bien: [f.adresseBien, f.commune].filter(Boolean).join(" — "),
        blob,
      })
        .then(() => qc.invalidateQueries({ queryKey: ["documents"] }))
        .catch(e => console.warn("Bibliothèque : sauvegarde échouée", e));
    } catch (e) {
      console.error("Erreur génération DOCX offre:", e);
      alert("Erreur lors de la génération du fichier Word. Vérifiez la console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn-secondary" onClick={handleDownload} disabled={loading}>
      {loading ? <><Loader2 size={14} className="animate-spin" /> Génération…</> : <><FileText size={14} /> Word (.docx)</>}
    </button>
  );
}
