import type { ValeurLocative } from "../schemas/valeurLocative.schema";
import { loyerAnnuel } from "../schemas/valeurLocative.schema";

const eur = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR").replace(/\s/g, " ")} €`;
const m2 = (n: number) => n ? `${String(n).replace(".", ",")} m²` : "";

export function refDossier(e: ValeurLocative): string {
  const d = (e.dateDocument || "").replace(/-/g, "").slice(0, 8);
  const ini = (e.mandantNom || "XX").split(/\s+/).map((p) => p[0]).join("").slice(0, 3).toUpperCase();
  return `CC-EVL-${d || "00000000"}-${ini || "XX"}`;
}

export function objetCadre(e: ValeurLocative): string[] {
  const qui = e.mandantNom ? `à la demande de ${e.mandantNom}` : "à la demande du mandant";
  const ou = e.commune ? ` sur la commune de ${e.commune}${e.codePostal ? ` (${e.codePostal})` : ""}` : " en Martinique";
  const regime = (e.regimeLocatif || "location").toLowerCase();
  const date = e.dateDocument
    ? new Date(e.dateDocument + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "ce jour";
  return [
    `La présente estimation de valeur locative est établie ${qui}, propriétaire du bien désigné ci-après, en vue d'une ${regime}${ou}.`,
    `Elle a pour objet de déterminer le loyer mensuel hors charges (HC) susceptible d'être obtenu dans les conditions de marché constatées à la date du présent document, compte tenu des caractéristiques intrinsèques du bien, de son état, de son environnement et des références locatives comparables.`,
    `Le présent document constitue une estimation professionnelle. Il ne vaut ni engagement de location, ni garantie de loyer, ni expertise judiciaire. Il est établi sur la base des informations transmises par le mandant et de l'analyse du marché locatif martiniquais au ${date}.`,
  ];
}

export function methodologie(e: ValeurLocative): string[] {
  const commune = e.commune || "la commune";
  return [
    `L'estimation s'appuie sur une approche par comparaison, méthode de référence pour la détermination d'une valeur locative de marché d'un logement d'habitation. Elle consiste à rapprocher le bien de références locatives actuelles, puis à appliquer des ajustements tenant compte des écarts de surface, de standing, d'état, de prestations et de localisation.`,
    `Les sources utilisées sont, par ordre de priorité : les références locatives recensées sur ${commune} ; les références de communes voisines comparables ; les indicateurs de loyer au mètre carré en Martinique ; l'expérience de commercialisation de l'agence.`,
    `Le loyer est exprimé hors charges (HC). Les charges locatives récupérables, la taxe d'enlèvement des ordures ménagères et les fluides restent à préciser dans le bail. Le régime retenu est : ${e.regimeLocatif || "location d'habitation"}.`,
  ];
}

export function conditionsLocation(e: ValeurLocative): { cadre: string; charges: [string, string][]; solvabilite: string; delai: string } {
  const nue = /nue/i.test(e.regimeLocatif || "");
  const saison = /saisonn/i.test(e.regimeLocatif || "");
  const mobilite = /mobilit/i.test(e.regimeLocatif || "");
  const cadre = saison
    ? "Location saisonnière meublée de tourisme. Le loyer indiqué est un équivalent mensuel hors charges, à adapter selon le taux d'occupation et la saisonnalité. Contrat écrit, état des lieux, règlement de copropriété le cas échéant."
    : mobilite
      ? "Bail mobilité (logement meublé, durée de 1 à 10 mois non renouvelable, loi ELAN). Dépôt de garantie interdit. État des lieux d'entrée et de sortie."
      : nue
        ? "Location nue à usage d'habitation principale, bail écrit conforme à la loi du 6 juillet 1989, durée de 3 ans (bailleur personne physique), tacitement reconductible. Dépôt de garantie : un mois de loyer hors charges. État des lieux d'entrée et de sortie contradictoires. Clause de révision annuelle selon l'IRL (INSEE)."
        : "Location meublée à usage d'habitation, bail d'un an renouvelable, loi du 6 juillet 1989 et décret n° 2015-981. Dépôt de garantie : deux mois de loyer hors charges. Inventaire et état des lieux contradictoires. Révision IRL.";
  const loyer = e.loyerMensuelHc > 0 ? `Locataire (${eur(e.loyerMensuelHc)} / mois recommandé)` : "Locataire";
  return {
    cadre,
    charges: [
      ["Loyer hors charges", loyer],
      ["Eau, électricité, internet", "Locataire"],
      ["Entretien courant du jardin et des abords", "Locataire (à stipuler au bail)"],
      ["Taxe d'enlèvement des ordures ménagères", "Locataire (récupérable) ou forfait charges"],
      ["Taxe foncière", "Bailleur"],
      ["Gros entretien, toiture, structure", "Bailleur"],
      ["Assurance PNO (propriétaire non occupant)", "Bailleur — fortement recommandée"],
      ["Assurance habitation locataire", "Locataire — attestation annuelle"],
    ],
    solvabilite:
      "Il est recommandé d'exiger des ressources stables d'au moins trois fois le loyer charges comprises, un dossier complet (pièce d'identité, contrat de travail, trois derniers bulletins, dernier avis d'imposition) et, selon le profil, une garantie Visale, un garant solide ou une assurance loyers impayés.",
    delai:
      "Délai de commercialisation estimé, prix aligné et dossier complet : 4 à 8 semaines de diffusion professionnelle. Un rafraîchissement visible raccourcit généralement ce délai.",
  };
}

export function fourchette(e: ValeurLocative): { basse: number; centrale: number; haute: number; ratio: number } | null {
  if (!e.loyerMensuelHc) return null;
  const centrale = e.loyerMensuelHc;
  const basse = Math.round(centrale * 0.94 / 50) * 50;
  const haute = Math.round(centrale * 1.06 / 50) * 50;
  const ratio = e.surfaceShon > 0 ? Math.round((centrale / e.surfaceShon) * 10) / 10 : 0;
  return { basse, centrale, haute, ratio };
}

export function syntheseFinance(e: ValeurLocative): [string, string][] {
  const f = fourchette(e);
  if (!f) return [];
  const annuel = loyerAnnuel(f.centrale);
  return [
    ["Loyer mensuel HC recommandé", eur(f.centrale)],
    ["Revenu brut annuel", eur(annuel)],
    ...(f.ratio ? [["Ratio locatif", `${String(f.ratio).replace(".", ",")} € / m² / mois`] as [string, string]] : []),
    ["Dépôt de garantie (1 mois HC, location nue)", eur(f.centrale)],
    ["Vacance estimée année 1 (hypothèse 1 mois)", `− ${eur(f.centrale)} de loyer potentiel`],
  ];
}

export function conclusion(e: ValeurLocative): string[] {
  const f = fourchette(e);
  const ou = [e.adresse, e.codePostal, e.commune].filter(Boolean).join(", ") || "Martinique";
  const cad = [e.sectionCadastrale && `section ${e.sectionCadastrale}`, e.parcelle && `parcelle ${e.parcelle}`].filter(Boolean).join(", ");
  const surf = e.surfaceShon ? `, d'une surface de ${m2(e.surfaceShon)}` : "";
  const titre = e.titreBien || e.natureBien || "Le bien";
  const l1 = `${titre} sis${/villa|maison/i.test(titre) ? "e" : ""} ${ou}${cad ? ` (${cad})` : ""}${surf}.`;
  if (!f) return [l1, "La valeur locative sera arrêtée dès que le loyer retenu aura été saisi."];
  return [
    l1,
    `La valeur locative de marché retenue est de ${eur(f.centrale)} par mois hors charges, soit ${eur(loyerAnnuel(f.centrale))} de revenus bruts annuels, dans une fourchette de commercialisation de ${eur(f.basse)} à ${eur(f.haute)}.`,
  ];
}

export function noteSurfacesDefaut(): string {
  return "Les surfaces mentionnées sont celles transmises et reprises du dossier. Elles n'ont pas fait l'objet d'un mesurage contradictoire aux fins du présent document.";
}
