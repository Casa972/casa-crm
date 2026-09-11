import type { ValeurLocative } from "../schemas/valeurLocative.schema";
import { loyerAnnuel } from "../schemas/valeurLocative.schema";

const eur = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR").replace(/\s/g, "\u00A0")} \u20ac`;
const m2 = (n: number) => n ? `${String(n).replace(".", ",")} m\u00b2` : "";

export function refDossier(e: ValeurLocative): string {
  const d = (e.dateDocument || "").replace(/-/g, "").slice(0, 8);
  const ini = (e.mandantNom || "XX").split(/\s+/).map((p) => p[0]).join("").slice(0, 3).toUpperCase();
  return `CC-EVL-${d || "00000000"}-${ini || "XX"}`;
}

export function objetCadre(e: ValeurLocative): string[] {
  const qui = e.mandantNom ? `\u00e0 la demande de ${e.mandantNom}` : "\u00e0 la demande du mandant";
  const ou = e.commune ? ` sur la commune de ${e.commune}${e.codePostal ? ` (${e.codePostal})` : ""}` : " en Martinique";
  const regime = (e.regimeLocatif || "location").toLowerCase();
  const date = e.dateDocument
    ? new Date(e.dateDocument + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "ce jour";
  return [
    `La pr\u00e9sente estimation de valeur locative est \u00e9tablie ${qui}, propri\u00e9taire du bien d\u00e9sign\u00e9 ci-apr\u00e8s, en vue d'une ${regime}${ou}.`,
    `Elle a pour objet de d\u00e9terminer le loyer mensuel hors charges (HC) susceptible d'\u00eatre obtenu dans les conditions de march\u00e9 constat\u00e9es \u00e0 la date du pr\u00e9sent document, compte tenu des caract\u00e9ristiques intrins\u00e8ques du bien, de son \u00e9tat, de son environnement et des r\u00e9f\u00e9rences locatives comparables.`,
    `Le pr\u00e9sent document constitue une estimation professionnelle. Il ne vaut ni engagement de location, ni garantie de loyer, ni expertise judiciaire. Il est \u00e9tabli sur la base des informations transmises par le mandant et de l'analyse du march\u00e9 locatif martiniquais au ${date}.`,
  ];
}

export function methodologie(e: ValeurLocative): string[] {
  const commune = e.commune || "la commune";
  return [
    `L'estimation s'appuie sur une approche par comparaison, m\u00e9thode de r\u00e9f\u00e9rence pour la d\u00e9termination d'une valeur locative de march\u00e9 d'un logement d'habitation. Elle consiste \u00e0 rapprocher le bien de r\u00e9f\u00e9rences locatives actuelles, puis \u00e0 appliquer des ajustements tenant compte des \u00e9carts de surface, de standing, d'\u00e9tat, de prestations et de localisation.`,
    `Les sources utilis\u00e9es sont, par ordre de priorit\u00e9 : les r\u00e9f\u00e9rences locatives recens\u00e9es sur ${commune} ; les r\u00e9f\u00e9rences de communes voisines comparables ; les indicateurs de loyer au m\u00e8tre carr\u00e9 en Martinique ; l'exp\u00e9rience de commercialisation de l'agence.`,
    `Le loyer est exprim\u00e9 hors charges (HC). Les charges locatives r\u00e9cup\u00e9rables, la taxe d'enl\u00e8vement des ordures m\u00e9nag\u00e8res et les fluides restent \u00e0 pr\u00e9ciser dans le bail. Le r\u00e9gime retenu est : ${e.regimeLocatif || "location d'habitation"}.`,
  ];
}

export function conditionsLocation(e: ValeurLocative): { cadre: string; charges: [string, string][]; solvabilite: string; delai: string } {
  const nue = /nue/i.test(e.regimeLocatif || "");
  const saison = /saisonn/i.test(e.regimeLocatif || "");
  const mobilite = /mobilit/i.test(e.regimeLocatif || "");
  const cadre = saison
    ? "Location saisonni\u00e8re meubl\u00e9e de tourisme. Le loyer indiqu\u00e9 est un \u00e9quivalent mensuel hors charges, \u00e0 adapter selon le taux d'occupation et la saisonnalit\u00e9. Contrat \u00e9crit, \u00e9tat des lieux, r\u00e8glement de copropri\u00e9t\u00e9 le cas \u00e9ch\u00e9ant."
    : mobilite
      ? "Bail mobilit\u00e9 (logement meubl\u00e9, dur\u00e9e de 1 \u00e0 10 mois non renouvelable, loi ELAN). D\u00e9p\u00f4t de garantie interdit. \u00c9tat des lieux d'entr\u00e9e et de sortie."
      : nue
        ? "Location nue \u00e0 usage d'habitation principale, bail \u00e9crit conforme \u00e0 la loi du 6 juillet 1989, dur\u00e9e de 3 ans (bailleur personne physique), tacitement reconductible. D\u00e9p\u00f4t de garantie : un mois de loyer hors charges. \u00c9tat des lieux d'entr\u00e9e et de sortie contradictoires. Clause de r\u00e9vision annuelle selon l'IRL (INSEE)."
        : "Location meubl\u00e9e \u00e0 usage d'habitation, bail d'un an renouvelable, loi du 6 juillet 1989 et d\u00e9cret n\u00b0 2015-981. D\u00e9p\u00f4t de garantie : deux mois de loyer hors charges. Inventaire et \u00e9tat des lieux contradictoires. R\u00e9vision IRL.";
  const loyer = e.loyerMensuelHc > 0 ? `Locataire (${eur(e.loyerMensuelHc)} / mois recommand\u00e9)` : "Locataire";
  return {
    cadre,
    charges: [
      ["Loyer hors charges", loyer],
      ["Eau, \u00e9lectricit\u00e9, internet", "Locataire"],
      ["Entretien courant du jardin et des abords", "Locataire (\u00e0 stipuler au bail)"],
      ["Taxe d'enl\u00e8vement des ordures m\u00e9nag\u00e8res", "Locataire (r\u00e9cup\u00e9rable) ou forfait charges"],
      ["Taxe fonci\u00e8re", "Bailleur"],
      ["Gros entretien, toiture, structure", "Bailleur"],
      ["Assurance PNO (propri\u00e9taire non occupant)", "Bailleur \u2014 fortement recommand\u00e9e"],
      ["Assurance habitation locataire", "Locataire \u2014 attestation annuelle"],
    ],
    solvabilite:
      "Il est recommand\u00e9 d'exiger des ressources stables d'au moins trois fois le loyer charges comprises, un dossier complet (pi\u00e8ce d'identit\u00e9, contrat de travail, trois derniers bulletins, dernier avis d'imposition) et, selon le profil, une garantie Visale, un garant solide ou une assurance loyers impay\u00e9s.",
    delai:
      "D\u00e9lai de commercialisation estim\u00e9, prix align\u00e9 et dossier complet : 4 \u00e0 8 semaines de diffusion professionnelle. Un rafra\u00eechissement visible raccourcit g\u00e9n\u00e9ralement ce d\u00e9lai.",
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
    ["Loyer mensuel HC recommand\u00e9", eur(f.centrale)],
    ["Revenu brut annuel", eur(annuel)],
    ...(f.ratio ? [["Ratio locatif", `${String(f.ratio).replace(".", ",")} \u20ac / m\u00b2 / mois`] as [string, string]] : []),
    ["D\u00e9p\u00f4t de garantie (1 mois HC, location nue)", eur(f.centrale)],
    ["Vacance estim\u00e9e ann\u00e9e 1 (hypoth\u00e8se 1 mois)", `\u2212 ${eur(f.centrale)} de loyer potentiel`],
  ];
}

export function conclusion(e: ValeurLocative): string[] {
  const f = fourchette(e);
  const ou = [e.adresse, e.codePostal, e.commune].filter(Boolean).join(", ") || "Martinique";
  const cad = [e.sectionCadastrale && `section ${e.sectionCadastrale}`, e.parcelle && `parcelle ${e.parcelle}`].filter(Boolean).join(", ");
  const surf = e.surfaceShon ? `, d'une surface de ${m2(e.surfaceShon)}` : "";
  const titre = e.titreBien || e.natureBien || "Le bien";
  const l1 = `${titre} sis${/villa|maison/i.test(titre) ? "e" : ""} ${ou}${cad ? ` (${cad})` : ""}${surf}.`;
  if (!f) return [l1, "La valeur locative sera arr\u00eat\u00e9e d\u00e8s que le loyer retenu aura \u00e9t\u00e9 saisi."];
  return [
    l1,
    `La valeur locative de march\u00e9 retenue est de ${eur(f.centrale)} par mois hors charges, soit ${eur(loyerAnnuel(f.centrale))} de revenus bruts annuels, dans une fourchette de commercialisation de ${eur(f.basse)} \u00e0 ${eur(f.haute)}.`,
  ];
}

export function noteSurfacesDefaut(): string {
  return "Les surfaces mentionn\u00e9es sont celles transmises et reprises du dossier. Elles n'ont pas fait l'objet d'un mesurage contradictoire aux fins du pr\u00e9sent document.";
}
