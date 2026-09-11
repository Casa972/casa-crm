/** Textes de fond — réutilisés par les formulaires et les PDF. */

export const LIMITES_VENALE =
  "Le présent avis de valeur est établi à titre indicatif, à la date mentionnée, sur la base des informations communiquées par le demandeur et des références de marché disponibles. Il ne constitue ni une expertise judiciaire, ni une certification INIGEP, ni un engagement de prix de vente. Casa Caraïbes SARL décline toute responsabilité quant à l'utilisation de ce document à des fins autres que celles pour lesquelles il a été établi (aide à la décision de mise en vente). Toute évolution du marché, des diagnostics ou de l'état du bien peut modifier la valeur retenue.";

export function descriptionLocativeAuto(p: {
  natureBien?: string;
  commune?: string;
  surfaceShon?: number;
  superficieTerrain?: number;
  regimeLocatif?: string;
}): string {
  const nature = p.natureBien?.trim() || "bien à usage d'habitation";
  const ville = p.commune?.trim() || "Martinique";
  const shon = p.surfaceShon ? ` d'une surface de plancher d'environ ${String(p.surfaceShon).replace(".", ",")} m²` : "";
  const terrain = p.superficieTerrain ? `, implanté sur un terrain d'environ ${p.superficieTerrain} m²` : "";
  const regime = p.regimeLocatif ? ` Il est envisagé en ${p.regimeLocatif.toLowerCase()}.` : "";
  return `Le bien objet de la présente estimation est un ${nature} situé à ${ville}${shon}${terrain}.${regime} La description détaillée des pièces, des extérieurs et des équipements figure aux tableaux ci-après.`;
}

export function localisationLocativeAuto(commune?: string): string {
  const ville = commune?.trim() || "la commune concernée";
  return `Le bien se situe à ${ville}, en Martinique. L'appréciation de la valeur locative tient compte de l'accessibilité, des services de proximité (commerces, écoles, santé), de la desserte et de l'attractivité résidentielle du secteur. Le marché locatif martiniquais reste contrasté selon le littoral, les hauteurs et le bassin de Fort-de-France : les références retenues privilégient la commune puis, à défaut, les communes limitrophes comparables.` ;
}

export function analyseLocativeAuto(p: {
  regime?: string;
  commune?: string;
  loyer?: number;
}): string {
  const ville = p.commune?.trim() || "la commune";
  const regime = (p.regime || "Location longue durée meublée").toLowerCase();
  return `L'estimation porte sur une ${regime} à ${ville}. Elle s'appuie sur les mises en location comparables observées par l'agence, la rareté relative de l'offre dans le secteur et le niveau de prestations du bien.\n\nLe loyer proposé s'entend hors charges, hors frais d'agence, et correspond à une valeur de marché à la date du document. Il pourra être ajusté selon l'état réel à la remise des clés, le niveau d'ameublement et les diagnostics en vigueur.` ;
}

export function commentaireMarcheVenaleAuto(p: {
  commune?: string;
  nbRefs?: number;
  moyM2?: number;
}): string {
  const ville = p.commune?.trim() || "le secteur";
  const refs = p.nbRefs && p.nbRefs > 0
    ? `L'étude comparative retient ${p.nbRefs} référence${p.nbRefs > 1 ? "s" : ""} (annonces et/ou mutations DVF) dans ${ville} ou un secteur comparable.`
    : `En l'absence de références saisies, l'appréciation s'appuie sur la connaissance du marché local de l'agence à ${ville}.`;
  const moy = p.moyM2 && p.moyM2 > 0
    ? ` Le prix moyen observé s'établit à environ ${p.moyM2.toLocaleString("fr-FR")} €/m².`
    : "";
  return `${refs}${moy} Le marché résidentiel martiniquais demeure porté par une offre contrainte et une demande résidentielle et d'investissement encore active. La valeur retenue tient compte de l'état du bien, de sa situation et des écarts constatés par rapport aux comparables.` ;
}

export function argumentaireVenaleAuto(p: {
  typeBien?: string;
  commune?: string;
  surface?: number;
  etat?: string;
  valeur?: number;
  prixM2?: number;
}): string {
  const type = p.typeBien || "bien";
  const ville = p.commune || "Martinique";
  const surf = p.surface ? ` de ${p.surface} m² habitables` : "";
  const etat = p.etat ? `, présenté en ${p.etat.toLowerCase()}` : "";
  const m2 = p.prixM2 ? ` soit environ ${p.prixM2.toLocaleString("fr-FR")} €/m²` : "";
  const val = p.valeur ? ` La valeur vénale retenue s'établit à ${p.valeur.toLocaleString("fr-FR")} €${m2}.` : "";
  return `Au regard de la nature du bien (${type}${surf} à ${ville})${etat}, des références de marché examinées et des ajustements liés à l'état et aux prestations, l'agence estime que le prix de vente le plus probable se situe dans la fourchette indiquée ci-dessous.${val} Cette valeur constitue un avis destiné à éclairer une mise en vente, et non un prix affiché imposé.` ;
}
