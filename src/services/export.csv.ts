import type { AgencyData } from "../types/domain";
import type { Financials } from "../hooks/useFinancials";

/** Export du grand livre comptable filtrable (séparateur ; pour Excel FR). */
export function exportGrandLivreCSV(data: AgencyData, fin: Financials): void {
  const sep = ";";
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows: string[] = [];
  rows.push(["Référence", "Type", "Tiers", "Bien", "Statut", "Montant"].map(q).join(sep));

  for (const r of data.revenus.filter((x) => x.statut === "Encaissé")) {
    rows.push([r.id, r.type, "—", r.desc || "—", "ENCAISSÉ", r.montant].map(q).join(sep));
  }
  for (const c of fin.compromisAEncaisser) {
    rows.push([c.ref, `Compromis (${c.statut})`, c.acheteur, `${c.bienRef} ${c.bienDesc}`, "À ENCAISSER", fin.commMontant(c)].map(q).join(sep));
  }

  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CasaCaraibes_GrandLivre_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
