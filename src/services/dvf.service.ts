/** Comparables DVF (mutations DGFiP) via fichiers geo-dvf Etalab. */

export type DvfComparable = {
  date: string;
  type: string;
  surface: number;
  prix: number;
  prixM2: number;
  localisation: string;
  reference: string;
};

const INSEE: Record<string, string> = {
  "Fort-de-France": "97209",
  "Le Lamentin": "97213",
  "Le Robert": "97222",
  "Sainte-Marie": "97228",
  "Le François": "97210",
  "Le Marin": "97217",
  "Sainte-Anne": "97226",
  "Les Trois-Îles": "97231",
  "Le Diamant": "97206",
  "Le Vauclin": "97232",
  "La Trinité": "97230",
  "Case-Pilote": "97205",
  "Le Carbet": "97204",
  "Saint-Pierre": "97225",
  "Schoelcher": "97229",
  "Schœlcher": "97229",
  "Sainte-Luce": "97227",
  "Rivière-Pilote": "97220",
  "Rivière-Salée": "97221",
  "Ducos": "97207",
  "Saint-Esprit": "97223",
  "Gros-Morne": "97212",
  "Saint-Joseph": "97224",
  "Le François": "97210",
};

export function codeInseeCommune(commune: string): string | null {
  if (!commune) return null;
  if (INSEE[commune]) return INSEE[commune];
  const hit = Object.keys(INSEE).find((k) => k.toLowerCase() === commune.toLowerCase());
  return hit ? INSEE[hit] : null;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const cols: string[] = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cols.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });
    return row;
  });
}

function yearUrls(code: string): string[] {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2].map(
    (yr) => `https://files.data.gouv.fr/geo-dvf/latest/csv/${yr}/communes/972/${code}.csv`,
  );
}

export async function fetchDvfComparables(commune: string, typeBien?: string): Promise<DvfComparable[]> {
  const code = codeInseeCommune(commune);
  if (!code) throw new Error(`Code INSEE inconnu pour « ${commune} »`);

  const wantMaison = /maison|villa|terrain/i.test(typeBien || "");
  const wantAppart = /appart/i.test(typeBien || "");

  const rows: Record<string, string>[] = [];
  await Promise.all(yearUrls(code).map(async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      rows.push(...parseCsv(await res.text()));
    } catch { /* millésime absent */ }
  }));

  const out: DvfComparable[] = [];
  for (const r of rows) {
    if ((r.nature_mutation || "") !== "Vente") continue;
    const type = r.type_local || "";
    if (type !== "Maison" && type !== "Appartement") continue;
    if (wantMaison && type !== "Maison") continue;
    if (wantAppart && type !== "Appartement") continue;
    const surface = Number(r.surface_reelle_bati) || 0;
    const prix = Number(String(r.valeur_fonciere || "").replace(/\s/g, "").replace(",", ".")) || 0;
    if (surface < 15 || prix < 20000) continue;
    const prixM2 = Math.round(prix / surface);
    if (prixM2 < 400 || prixM2 > 20000) continue;
    const voie = [r.adresse_numero, r.adresse_nom_voie].filter(Boolean).join(" ");
    out.push({
      date: (r.date_mutation || "").slice(0, 10),
      type,
      surface,
      prix,
      prixM2,
      localisation: [voie, r.nom_commune || commune].filter(Boolean).join(", "),
      reference: `DVF ${ (r.date_mutation || "").slice(0, 4)}`,
    });
  }

  const seen = new Set<string>();
  const uniq = out.filter((c) => {
    const k = `${c.date}|${c.prix}|${c.surface}|${c.localisation}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  uniq.sort((a, b) => b.date.localeCompare(a.date));
  return uniq.slice(0, 25);
}

export function proposerPrix(opts: {
  surface: number;
  refs: { prixM2: number; surface: number }[];
  etat?: string;
}): { min: number; retenu: number; max: number; m2: number; nb: number } | null {
  const vals = opts.refs.map((r) => r.prixM2).filter((n) => n > 0).sort((a, b) => a - b);
  if (!vals.length || !opts.surface) return null;
  const mid = vals[Math.floor(vals.length / 2)];
  const COEF: Record<string, number> = {
    "Parfait état": 1.08, "Très bon état": 1.04, "Bon état": 1,
    "État moyen": 0.93, "Travaux à prévoir": 0.85,
  };
  const coef = COEF[opts.etat || ""] ?? 1;
  const m2 = Math.round(mid * coef);
  const round = (n: number) => Math.round(n / 1000) * 1000;
  return {
    min: round(vals[0] * coef * opts.surface),
    retenu: round(m2 * opts.surface),
    max: round(vals[vals.length - 1] * coef * opts.surface),
    m2,
    nb: vals.length,
  };
}
