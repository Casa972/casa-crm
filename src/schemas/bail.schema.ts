import { z } from "zod";

export const TYPES_BAIL = [
  "Bail d'habitation nu",
  "Bail d'habitation meublé",
  "Bail mobilité",
  "Location saisonnière",
] as const;
export type TypeBail = (typeof TYPES_BAIL)[number];

export const partieBailSchema = z.object({
  id: z.string(),
  civilite: z.string().default("M."),
  prenom: z.string().default(""),
  nom: z.string().default(""),
  dateNaissance: z.string().default(""),
  lieuNaissance: z.string().default(""),
  nationalite: z.string().default("Française"),
  adresse: z.string().default(""),
  codePostal: z.string().default(""),
  ville: z.string().default(""),
  tel: z.string().default(""),
  email: z.string().default(""),
  qualite: z.string().default(""),
});
export type PartieBail = z.infer<typeof partieBailSchema>;

export const bailSchema = z.object({
  id: z.string(),
  statut: z.enum(["Brouillon", "Finalisé"]).default("Brouillon"),
  agentId: z.string().optional(),
  typeBail: z.string().default("Bail d'habitation meublé"),
  numero: z.string().default(""),
  dateDocument: z.string().default(""),
  lieuSignature: z.string().default("Fort-de-France"),
  bailleurs: z.array(partieBailSchema).default([]),
  preneurs: z.array(partieBailSchema).default([]),
  garant: partieBailSchema.optional(),
  typeBien: z.string().default("Appartement"),
  adresseBien: z.string().default(""),
  commune: z.string().default(""),
  codePostal: z.string().default("97200"),
  sectionCadastrale: z.string().default(""),
  parcelle: z.string().default(""),
  surfaceHabitable: z.coerce.number().default(0),
  nbPieces: z.string().default(""),
  etage: z.string().default(""),
  descriptionBien: z.string().default(""),
  usage: z.string().default("Résidence principale du preneur"),
  regimeFoncier: z.string().default(""),
  annexes: z.string().default(""),
  copropriete: z.string().default(""),
  dateDebut: z.string().default(""),
  dateFin: z.string().default(""),
  dureeMois: z.coerce.number().default(12),
  motifMobilite: z.string().default(""),
  loyerHc: z.coerce.number().default(0),
  charges: z.coerce.number().default(0),
  typeCharges: z.string().default("Provision sur charges"),
  jourPaiement: z.coerce.number().default(5),
  modePaiement: z.string().default("Virement bancaire"),
  iban: z.string().default(""),
  titulaireCompte: z.string().default(""),
  depotGarantie: z.coerce.number().default(0),
  revisionIrl: z.boolean().default(true),
  trimestreIrl: z.string().default("T1"),
  honorairesAgence: z.coerce.number().default(0),
  chargeHonoraires: z.string().default("Partagé par moitié"),
  agenceNom: z.string().default("Casa Caraïbes SARL"),
  agenceMention: z.string().default("CPI 97212024000000007 — RCS Fort-de-France 928 647 981"),
  dpeClasse: z.string().default(""),
  gesClasse: z.string().default(""),
  dateDpe: z.string().default(""),
  termites: z.string().default(""),
  ernmt: z.string().default(""),
  animauxAutorises: z.boolean().default(true),
  sousLocationAutorisee: z.boolean().default(false),
  clausesSpecifiques: z.string().default(""),
  inventaireMeubles: z.string().default(""),
  observations: z.string().default(""),
});
export type Bail = z.infer<typeof bailSchema>;

export function loyerCc(b: Pick<Bail, "loyerHc" | "charges">): number {
  return Math.round((b.loyerHc || 0) + (b.charges || 0));
}

export function depotDefaut(typeBail: string, loyerHc: number): number {
  const l = Math.round(loyerHc || 0);
  if (typeBail === "Bail d'habitation nu") return l;
  if (typeBail === "Bail d'habitation meublé") return l * 2;
  if (typeBail === "Bail mobilité") return 0;
  return l;
}

export function dureeDefaut(typeBail: string): number {
  if (typeBail === "Bail d'habitation nu") return 36;
  if (typeBail === "Bail d'habitation meublé") return 12;
  if (typeBail === "Bail mobilité") return 6;
  return 1;
}

export function usageDefaut(typeBail: string): string {
  if (typeBail === "Location saisonnière") return "Location saisonnière / meublé de tourisme — occupation temporaire";
  if (typeBail === "Bail mobilité") return "Résidence temporaire du preneur (bail mobilité)";
  return "Résidence principale du preneur";
}

export function titreBail(typeBail: string): string {
  switch (typeBail) {
    case "Bail d'habitation nu": return "BAIL D'HABITATION NON MEUBLÉ";
    case "Bail mobilité": return "BAIL MOBILITÉ";
    case "Location saisonnière": return "CONTRAT DE LOCATION SAISONNIÈRE";
    default: return "BAIL D'HABITATION MEUBLÉ";
  }
}

export function sousTitreLegal(typeBail: string): string {
  switch (typeBail) {
    case "Bail d'habitation nu":
      return "Régi par la loi n° 89-462 du 6 juillet 1989 (titre Ier) — logement nu";
    case "Bail mobilité":
      return "Régi par les articles 25-12 et suivants de la loi n° 89-462 du 6 juillet 1989 (bail mobilité — loi ELAN)";
    case "Location saisonnière":
      return "Location meublée de tourisme — occupation temporaire, hors bail d'habitation de longue durée";
    default:
      return "Régi par la loi n° 89-462 du 6 juillet 1989 (titre Ier bis) et le décret n° 2015-981 du 31 juillet 2015";
  }
}

function nomPartie(p?: PartieBail): string {
  if (!p) return "—";
  return [p.civilite, p.prenom, p.nom].filter(Boolean).join(" ") || "—";
}

function identite(p: PartieBail): string {
  const bits = [nomPartie(p)];
  if (p.dateNaissance) bits.push(`né(e) le ${p.dateNaissance}${p.lieuNaissance ? ` à ${p.lieuNaissance}` : ""}`);
  if (p.nationalite) bits.push(`de nationalité ${p.nationalite}`);
  const adr = [p.adresse, p.codePostal, p.ville].filter(Boolean).join(" ");
  if (adr) bits.push(`demeurant ${adr}`);
  if (p.tel) bits.push(`tél. ${p.tel}`);
  if (p.email) bits.push(`email ${p.email}`);
  return bits.join(", ");
}

export function articlesBail(b: Bail): { titre: string; corps: string }[] {
  const cc = loyerCc(b);
  const debut = b.dateDebut || "……………………";
  const fin = b.dateFin || "……………………";
  const t = b.typeBail;
  const designation = [b.typeBien, b.adresseBien, `${b.codePostal} ${b.commune}`].filter(Boolean).join(", ") || "—";
  const arts: { titre: string; corps: string }[] = [
    {
      titre: "Article 1 — Objet et désignation",
      corps:
        `Le bailleur donne à bail au preneur, qui accepte, le bien ci-après désigné : ${designation}. ` +
        `${b.surfaceHabitable ? `Surface habitable : ${String(b.surfaceHabitable).replace(".", ",")} m². ` : ""}` +
        `${b.nbPieces ? `Composition : ${b.nbPieces}. ` : ""}` +
        `${b.etage ? `Situation : ${b.etage}. ` : ""}` +
        `${b.sectionCadastrale || b.parcelle ? `Cadastre : ${[b.sectionCadastrale && `section ${b.sectionCadastrale}`, b.parcelle && `parcelle ${b.parcelle}`].filter(Boolean).join(", ")}. ` : ""}` +
        `${b.annexes ? `Annexes : ${b.annexes}. ` : ""}` +
        `${b.copropriete ? `Copropriété : ${b.copropriete}. ` : ""}` +
        `${b.descriptionBien ? b.descriptionBien + " " : ""}` +
        `Usage convenu : ${b.usage || usageDefaut(t)}. Toute autre destination est interdite sans accord écrit du bailleur.`,
    },
    {
      titre: "Article 2 — Durée",
      corps:
        t === "Bail mobilité"
          ? `Le présent bail mobilité est consenti pour une durée de ${b.dureeMois || "…"} mois, à compter du ${debut} jusqu'au ${fin}. Conformément à l'article 25-13 de la loi du 6 juillet 1989, cette durée est comprise entre 1 et 10 mois et n'est pas renouvelable. Motif du recours au bail mobilité : ${b.motifMobilite || "à préciser"}.`
          : t === "Location saisonnière"
            ? `Le présent contrat est consenti pour la période du ${debut} au ${fin} (${b.dureeMois || "…"} mois), à titre de location saisonnière. Il ne constitue pas un bail d'habitation soumis au titre Ier de la loi du 6 juillet 1989.`
            : t === "Bail d'habitation nu"
              ? `Le présent bail est consenti pour une durée de ${b.dureeMois || 36} mois à compter du ${debut} (soit jusqu'au ${fin}). Pour un bailleur personne physique, la durée minimale légale est de trois ans. Sauf congé valablement délivré, le bail est reconduit tacitement pour une durée de trois ans.`
              : `Le présent bail meublé est consenti pour une durée de ${b.dureeMois || 12} mois à compter du ${debut} (soit jusqu'au ${fin}). Sauf congé valablement délivré, il est reconduit tacitement pour une durée d'un an.`,
    },
    {
      titre: "Article 3 — Loyer et charges",
      corps:
        t === "Location saisonnière"
          ? `Le loyer de la période est fixé à ${b.loyerHc || 0} € hors charges, plus ${b.charges || 0} € de charges, soit ${cc} € charges comprises. Modalités de paiement : ${b.modePaiement}${b.iban ? ` — IBAN ${b.iban}` : ""}${b.titulaireCompte ? ` (${b.titulaireCompte})` : ""}.`
          : `Le loyer mensuel est fixé à ${b.loyerHc || 0} € hors charges, plus ${b.typeCharges || "une provision sur charges"} de ${b.charges || 0} €, soit ${cc} € charges comprises, payable d'avance le ${b.jourPaiement} de chaque mois par ${b.modePaiement}` +
            `${b.iban ? ` sur le compte ${b.titulaireCompte || "du bailleur"} — IBAN ${b.iban}` : ""}. ` +
            (b.revisionIrl
              ? `Le loyer sera révisé chaque année à la date anniversaire selon l'indice de référence des loyers (IRL) publié par l'INSEE, trimestre de référence : ${b.trimestreIrl}.`
              : "Les parties conviennent de ne pas réviser le loyer pendant la durée initiale."),
    },
    {
      titre: "Article 4 — Dépôt de garantie",
      corps:
        t === "Bail mobilité"
          ? "Aucun dépôt de garantie n'est exigé, conformément à l'article 25-17 de la loi du 6 juillet 1989 applicable au bail mobilité."
          : t === "Bail d'habitation nu"
            ? `Un dépôt de garantie de ${b.depotGarantie || 0} € (maximum un mois de loyer hors charges) est versé à la signature. Il sera restitué dans le délai légal après restitution des clés, déduction faite le cas échéant des sommes restant dues au bailleur.`
            : t === "Bail d'habitation meublé"
              ? `Un dépôt de garantie de ${b.depotGarantie || 0} € (maximum deux mois de loyer hors charges) est versé à la signature. Il sera restitué dans le délai légal après restitution des clés, déduction faite le cas échéant des sommes restant dues au bailleur.`
              : `Un acompte / caution de ${b.depotGarantie || 0} € est versé à la réservation. Le solde est exigible selon les modalités convenues entre les parties.`,
    },
    {
      titre: "Article 5 — Obligations des parties",
      corps:
        "Le bailleur s'oblige à délivrer le logement décent au sens du décret n° 2002-120, en bon état d'usage et de réparation, et à en assurer la jouissance paisible. Le preneur s'oblige à payer le loyer et les charges aux termes convenus, à user paisiblement des lieux suivant la destination prévue, à répondre des dégradations survenues pendant la location, à laisser exécuter dans les lieux les travaux rendus nécessaires, à souscrire une assurance habitation couvrant les risques locatifs et à justifier de son attestation chaque année, et à restituer le bien en bon état en fin de bail, usure normale exceptée.",
    },
  ];

  if (t === "Bail d'habitation meublé" || t === "Bail mobilité" || t === "Location saisonnière") {
    arts.push({
      titre: "Article 6 — Caractère meublé et inventaire",
      corps:
        t === "Bail d'habitation meublé"
          ? `Le logement est loué meublé au sens du décret n° 2015-981 du 31 juillet 2015. Un inventaire du mobilier et un état des lieux contradictoires sont établis à l'entrée et à la sortie. ${b.inventaireMeubles || "L'inventaire détaillé est annexé au présent bail."}`
          : `Le logement est remis meublé. Un inventaire et un état des lieux sont établis à l'entrée et à la sortie. ${b.inventaireMeubles || ""}`.trim(),
    });
  } else {
    arts.push({
      titre: "Article 6 — État des lieux",
      corps: "Un état des lieux contradictoire d'entrée est établi lors de la remise des clés, conformément à l'article 3-2 de la loi du 6 juillet 1989. Un état des lieux de sortie sera établi à la restitution des lieux. À défaut d'état des lieux d'entrée, le preneur est présumé avoir reçu le logement en bon état.",
    });
  }

  arts.push({
    titre: "Article 7 — Congé et fin de bail",
    corps:
      t === "Bail mobilité"
        ? "Le preneur peut mettre fin au bail à tout moment moyennant un préavis d'un mois notifié par lettre recommandée avec accusé de réception, acte d'huissier ou remise en main propre contre récépissé. Le bailleur ne peut donner congé que pour le terme du contrat."
        : t === "Location saisonnière"
          ? "Le contrat prend fin de plein droit à la date prévue, sans reconduction tacite. Toute prolongation fait l'objet d'un avenant écrit. En cas de départ anticipé du preneur, le loyer de la période reste dû sauf accord contraire."
          : t === "Bail d'habitation nu"
            ? "Congé du preneur : préavis de trois mois (réduit à un mois en zone tendue ou dans les cas prévus par la loi). Congé du bailleur : six mois avant le terme, motivé par la reprise, la vente ou un motif légitime et sérieux, notifié selon les formes légales."
            : "Congé du preneur : préavis d'un mois. Congé du bailleur : trois mois avant le terme, pour motif légitime et sérieux (reprise, vente ou motif sérieux), notifié selon les formes légales.",
  });

  arts.push({
    titre: "Article 8 — Clause résolutoire",
    corps:
      t === "Location saisonnière"
        ? "En cas de non-paiement du loyer ou d'inexécution d'une obligation essentielle, le bailleur pourra résoudre le contrat dans les conditions de droit commun, après mise en demeure restée infructueuse."
        : "À défaut de paiement du loyer ou des charges aux termes convenus, ou à défaut de justification d'une assurance habitation, le présent bail sera résilié de plein droit deux mois après un commandement de payer ou une sommation demeurés infructueux, conformément à l'article 24 de la loi du 6 juillet 1989.",
  });

  const diagBits = [
    b.dpeClasse && `DPE classe énergie ${b.dpeClasse}${b.gesClasse ? ` / GES ${b.gesClasse}` : ""}${b.dateDpe ? ` (établi le ${b.dateDpe})` : ""}`,
    b.termites && `diagnostic termites : ${b.termites}`,
    b.ernmt && `ERNMT / risques : ${b.ernmt}`,
  ].filter(Boolean);
  arts.push({
    titre: "Article 9 — Diagnostics et informations",
    corps:
      (diagBits.length
        ? `Les diagnostics suivants sont annexés au présent contrat : ${diagBits.join(" ; ")}. `
        : "Le dossier de diagnostics techniques (DPE, risques et pollutions, termites en zone couverte) est annexé au présent contrat. ") +
      "En Martinique, le diagnostic termites est obligatoire dans les zones délimitées par arrêté préfectoral. Le preneur reconnaît avoir reçu ces documents avant la signature.",
  });

  arts.push({
    titre: "Article 10 — Jouissance des lieux",
    corps:
      `${b.animauxAutorises ? "Les animaux familiers sont autorisés, sous réserve qu'ils ne causent aucun trouble de jouissance ni dégradation." : "Les animaux sont interdits dans les lieux loués, sauf accord écrit ultérieur du bailleur."} ` +
      `${b.sousLocationAutorisee ? "La sous-location est autorisée avec information préalable du bailleur." : "Toute sous-location, cession ou prêt des lieux est interdit sans accord écrit du bailleur."} ` +
      (b.preneurs.length > 1
        ? "Les preneurs sont tenus solidairement et indivisiblement de l'exécution de toutes les obligations du présent bail."
        : ""),
  });

  if (b.garant && (b.garant.nom || b.garant.prenom)) {
    arts.push({
      titre: "Article 11 — Caution solidaire",
      corps:
        `${identite(b.garant)} se porte caution solidaire du preneur pour l'exécution de toutes les obligations nées du présent bail, et notamment le paiement des loyers, charges, réparations locatives et indemnités d'occupation. La caution reconnaît avoir reçu un exemplaire du bail et être informée du caractère solidaire de son engagement.`,
    });
  }

  if (b.honorairesAgence > 0) {
    arts.push({
      titre: "Article 12 — Honoraires d'agence",
      corps: `Les honoraires de ${b.agenceNom} au titre de la mise en location s'élèvent à ${b.honorairesAgence} € TTC, charge : ${b.chargeHonoraires}. ${b.agenceMention}. Conformément à la loi ALUR, la part locataire des honoraires liés à la visite, la constitution du dossier et la rédaction du bail est plafonnée.`,
    });
  }

  if (b.clausesSpecifiques.trim()) {
    arts.push({ titre: "Article 13 — Clauses particulières", corps: b.clausesSpecifiques.trim() });
  }

  arts.push({
    titre: "Article 14 — Annexes et élection de domicile",
    corps:
      "Font partie intégrante du présent bail : l'état des lieux, l'inventaire le cas échéant, le dossier de diagnostics techniques, et tout avenant ultérieur. " +
      "Pour l'exécution des présentes, les parties élisent domicile en leurs demeures respectives ci-dessus indiquées. " +
      "Tout litige relève des tribunaux compétents du ressort du lieu de situation de l'immeuble.",
  });

  return arts;
}
