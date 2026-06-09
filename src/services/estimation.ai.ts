import type { Estimation, RefMarche } from "../schemas/estimation.schema";

/** Appelle Claude pour générer un texte de section d'estimation. */
async function callClaude(prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `Tu es un expert immobilier martiniquais travaillant pour l'agence Casa Caraïbes.
Tu rédiges des estimations de valeur vénale professionnelles, précises et convaincantes.
Ton style est formel, fluide et juridiquement correct. Tu connais parfaitement le marché martiniquais.
Réponds UNIQUEMENT avec le texte demandé, sans titre ni introduction.`,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  const block = (data.content as Array<{ type: string; text?: string }>)
    .find((b) => b.type === "text");
  return block?.text?.trim() ?? "";
}

function statsRefs(refs: RefMarche[]) {
  const valid = refs.filter((r) => r.prixM2 > 0);
  if (valid.length === 0) return null;
  const vals = valid.map((r) => r.prixM2).sort((a, b) => a - b);
  const moy = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  return { moy, min: vals[0] ?? 0, max: vals[vals.length - 1] ?? 0, n: valid.length };
}

/** Génère la section "Objet de la mission" */
export async function genObjetMission(e: Estimation): Promise<string> {
  return callClaude(`Rédige la section "Objet de la mission" pour une estimation de valeur vénale avec ces données :
- Type de bien : ${e.typeBien}
- Résidence : ${e.residence || "non précisée"}
- Adresse : ${e.adresse}, ${e.commune} (Martinique)
- Demandeur : ${e.demandeur}
- Contexte : projet de vente
Longueur : 2 paragraphes. Style juridique professionnel.`);
}

/** Génère la section "Environnement et situation" */
export async function genEnvironnement(e: Estimation): Promise<string> {
  return callClaude(`Rédige la section "Environnement et situation" pour une estimation immobilière :
- Commune : ${e.commune} (Martinique)
- Type de bien : ${e.typeBien}
- Résidence : ${e.residence || "non précisée"}
- Étage : ${e.etage || "non précisé"}
- Prestations : ${[e.cave && "cave", e.piscine && "piscine", e.venduMeuble && "vendu meublé", e.surfaceTerrasse > 0 && `terrasse ${e.surfaceTerrasse}m²`].filter(Boolean).join(", ") || "standard"}
Décris le cadre de vie, les atouts de la commune, la demande immobilière locale, les services de proximité.
Longueur : 2-3 paragraphes fluides et précis.`);
}

/** Génère l'argumentation de la valeur */
export async function genArgumentaireValeur(e: Estimation, suggestion: { prixRetenu: number; prixM2Moyen: number; prixMin: number; prixMax: number } | null): Promise<string> {
  const allRefs = [...e.refsAnnonces, ...e.refsDVF];
  const stats = statsRefs(allRefs);
  const locatif = e.avecLocatif ? e.saisons.reduce((s, x) => s + x.tarifNuit * x.nbNuits, 0) : 0;

  return callClaude(`Rédige l'argumentation de la valeur vénale pour cette estimation :
- Type : ${e.typeBien}
- Adresse : ${e.adresse || e.residence}, ${e.commune}
- Surface habitable : ${e.surfaceHabitable} m²
- Terrasse : ${e.surfaceTerrasse > 0 ? e.surfaceTerrasse + " m²" : "aucune"}
- État général : ${e.etatGeneral}
- Vendu meublé : ${e.venduMeuble ? "oui" : "non"}
- Cave : ${e.cave ? "oui" : "non"} | Parking : ${e.parking || "non"}
${stats ? `- Références de marché : ${stats.n} réf., moyenne ${stats.moy.toLocaleString("fr-FR")} €/m², fourchette ${stats.min.toLocaleString("fr-FR")}–${stats.max.toLocaleString("fr-FR")} €/m²` : ""}
${locatif > 0 ? `- Potentiel locatif saisonnier : ~${Math.round(locatif).toLocaleString("fr-FR")} €/an brut` : ""}
${suggestion ? `- Valeur retenue : ${suggestion.prixRetenu.toLocaleString("fr-FR")} € (${suggestion.prixM2Moyen.toLocaleString("fr-FR")} €/m²)` : `- Valeur estimée : ${e.valeurVenale.toLocaleString("fr-FR")} €`}
Longueur : 1 paragraphe dense et professionnel justifiant la valeur retenue.`);
}

/** Génère l'argumentation coup de cœur */
export async function genArgumentaireCoupDeCœur(e: Estimation): Promise<string> {
  return callClaude(`Rédige l'argumentation "Valeur coup de cœur" pour ce bien :
- Type : ${e.typeBien} à ${e.commune}
- État : ${e.etatGeneral}
- Prestations distinctives : ${[
    e.surfaceTerrasse > 0 && `grande terrasse ${e.surfaceTerrasse}m²`,
    e.venduMeuble && "vendu meublé clé-en-main",
    e.piscine && "piscine",
    e.cave && "cave privative",
    e.avecLocatif && `potentiel locatif ${e.saisons.reduce((s, x) => s + x.tarifNuit * x.nbNuits, 0).toLocaleString("fr-FR")} €/an`,
  ].filter(Boolean).join(", ") || "emplacement privilégié"}
- Valeur coup de cœur : ${e.valeurCoupDeCœur.toLocaleString("fr-FR")} €
Mets en valeur la rareté, la combinaison unique de prestations et la rentabilité potentielle.
Longueur : 2-3 phrases percutantes.`);
}

/** Génère les critères de la grille d'analyse */
export async function genCriteres(e: Estimation): Promise<Array<{ critere: string; analyse: string; impact: string }>> {
  const prompt = `Rédige la grille d'analyse pour cette estimation. Réponds UNIQUEMENT en JSON valide, tableau d'objets avec les clés "critere", "analyse", "impact".
Impact possible : "Positif fort", "Positif", "Neutre", "Négatif", "Négatif fort".

Données du bien :
- Type : ${e.typeBien}
- Surface habitable : ${e.surfaceHabitable} m²
- Terrasse : ${e.surfaceTerrasse > 0 ? e.surfaceTerrasse + " m²" : "non"}
- Étage : ${e.etage || "non précisé"}
- État général : ${e.etatGeneral}
- Vendu meublé : ${e.venduMeuble ? "oui" : "non"}
- Cave : ${e.cave ? "oui" : "non"}
- Piscine : ${e.piscine ? "oui" : "non"}
- Parking : ${e.parking || "non"}
- Charges copro : ${e.chargesCopro > 0 ? e.chargesCopro + " €/trim." : "non précisé"}
- Commune : ${e.commune}
- Potentiel locatif : ${e.avecLocatif ? "oui" : "non"}

Génère exactement 8 critères pertinents pour ce bien.`;

  try {
    const raw = await callClaude(prompt);
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
