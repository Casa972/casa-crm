import type { Bail, PartieBail } from "./bail.schema";
import { loyerCc, usageDefaut } from "./bail.schema";

function fdFr(d: string) {
  if (!d) return "";
  const x = new Date(d.length <= 10 ? d + "T12:00" : d);
  return Number.isNaN(x.getTime()) ? d : x.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function nomPartie(p?: PartieBail) {
  if (!p) return "—";
  return [p.civilite, p.prenom, p.nom].filter(Boolean).join(" ") || "—";
}
function identite(p: PartieBail) {
  const bits = [nomPartie(p)];
  if (p.dateNaissance) bits.push(`né(e) le ${fdFr(p.dateNaissance)}${p.lieuNaissance ? ` à ${p.lieuNaissance}` : ""}`);
  if (p.nationalite) bits.push(`de nationalité ${p.nationalite}`);
  const adr = [p.adresse, p.codePostal, p.ville].filter(Boolean).join(" ");
  if (adr) bits.push(`demeurant ${adr}`);
  return bits.join(", ");
}

export function articlesBail(b: Bail): { titre: string; corps: string }[] {
  const cc = loyerCc(b);
  const debut = b.dateDebut ? fdFr(b.dateDebut) : "…";
  const fin = b.dateFin ? fdFr(b.dateFin) : "…";
  const t = b.typeBail;
  const designation = [b.typeBien, b.adresseBien, `${b.codePostal} ${b.commune}`].filter(Boolean).join(", ") || "—";
  const arts: { titre: string; corps: string }[] = [];
  const add = (titre: string, corps: string) => arts.push({ titre, corps });

  add("Objet et désignation",
    `Le bailleur donne à bail au preneur le bien désigné : ${designation}. ` +
    `${b.surfaceHabitable ? `Surface habitable : ${String(b.surfaceHabitable).replace(".", ",")} m². ` : ""}` +
    `${b.nbPieces ? `Composition : ${b.nbPieces}. ` : ""}` +
    `${b.etage ? `Situation : ${b.etage}. ` : ""}` +
    `${b.annexes ? `Annexes : ${b.annexes}. ` : ""}` +
    `${b.copropriete ? `Copropriété : ${b.copropriete}. ` : ""}` +
    `${b.descriptionBien ? b.descriptionBien + " " : ""}` +
    `Usage convenu : ${b.usage || usageDefaut(t)}.`);

  add("Durée",
    t === "Bail mobilité"
      ? `Bail mobilité de ${b.dureeMois || "…"} mois, du ${debut} au ${fin} (1 à 10 mois, non renouvelable). Motif : ${b.motifMobilite || "à préciser"}.`
      : t === "Location saisonnière"
        ? `Période du ${debut} au ${fin} (${b.dureeMois || "…"} mois), location saisonnière hors titre Ier de la loi de 1989.`
        : t === "Bail d'habitation nu"
          ? `Durée de ${b.dureeMois || 36} mois à compter du ${debut} (jusqu'au ${fin}). Reconduction tacite de trois ans sauf congé.`
          : `Bail meublé de ${b.dureeMois || 12} mois à compter du ${debut} (jusqu'au ${fin}). Reconduction tacite d'un an sauf congé.`);

  add("Loyer et charges",
    t === "Location saisonnière"
      ? `Loyer de période : ${b.loyerHc || 0} € HC + ${b.charges || 0} € de charges, soit ${cc} € CC. Paiement : ${b.modePaiement}.`
      : `Loyer mensuel ${b.loyerHc || 0} € HC + ${b.typeCharges || "provision sur charges"} de ${b.charges || 0} €, soit ${cc} € CC, payable le ${b.jourPaiement} de chaque mois par ${b.modePaiement}` +
        `${b.iban ? ` — IBAN ${b.iban}` : ""}. ` +
        (b.revisionIrl ? `Révision annuelle IRL, trimestre ${b.trimestreIrl}.` : "Pas de révision pendant la durée initiale."));

  add("Dépôt de garantie",
    t === "Bail mobilité"
      ? "Aucun dépôt de garantie (art. 25-17 de la loi du 6 juillet 1989)."
      : `Dépôt de ${b.depotGarantie || 0} € versé à la signature, restitué dans le délai légal après remise des clés.`);

  add("Obligations des parties",
    "Le bailleur délivre un logement décent et en assure la jouissance paisible. Le preneur paie le loyer aux termes convenus, use paisiblement des lieux, s'assure contre les risques locatifs et restitue le bien en bon état, usure normale exceptée.");

  if (t === "Bail d'habitation meublé" || t === "Bail mobilité" || t === "Location saisonnière") {
    add("Caractère meublé et inventaire",
      `Logement remis meublé. Inventaire et état des lieux à l'entrée et à la sortie. ${b.inventaireMeubles || "L'inventaire est annexé au bail."}`);
  } else {
    add("État des lieux", "État des lieux contradictoire à l'entrée et à la sortie (art. 3-2 loi 1989).");
  }

  add("Congé et fin de bail",
    t === "Bail mobilité"
      ? "Preneur : préavis d'un mois. Bailleur : uniquement au terme du contrat."
      : t === "Location saisonnière"
        ? "Fin de plein droit à la date prévue, sans reconduction tacite."
        : t === "Bail d'habitation nu"
          ? "Congé preneur : 3 mois (1 mois en zone tendue). Congé bailleur : 6 mois avant terme, motivé."
          : "Congé preneur : 1 mois. Congé bailleur : 3 mois avant terme, motivé.");

  add("Clause résolutoire",
    t === "Location saisonnière"
      ? "Inexécution d'une obligation essentielle : résiliation après mise en demeure infructueuse."
      : "Défaut de paiement ou d'assurance : résiliation de plein droit deux mois après commandement infructueux (art. 24 loi 1989).");

  const diag = [
    b.dpeClasse && `DPE ${b.dpeClasse}${b.gesClasse ? ` / GES ${b.gesClasse}` : ""}${b.dateDpe ? ` (${fdFr(b.dateDpe)})` : ""}`,
    b.termites && `termites : ${b.termites}`,
    b.ernmt && `ERNMT : ${b.ernmt}`,
  ].filter(Boolean);
  add("Diagnostics",
    (diag.length ? `Diagnostics annexés : ${diag.join(" ; ")}. ` : "Dossier de diagnostics techniques annexé. ") +
    "En Martinique, le diagnostic termites est obligatoire dans les zones d'arrêté préfectoral.");

  add("Jouissance des lieux",
    `${b.animauxAutorises ? "Animaux familiers autorisés s'ils ne causent aucun trouble." : "Animaux interdits, sauf accord écrit."} ` +
    `${b.sousLocationAutorisee ? "Sous-location autorisée avec information du bailleur." : "Sous-location interdite sans accord écrit."} ` +
    (b.preneurs.length > 1 ? "Les preneurs sont tenus solidairement." : ""));

  if (b.garant && (b.garant.nom || b.garant.prenom)) {
    add("Caution solidaire", `${identite(b.garant)} se porte caution solidaire du preneur pour toutes les obligations du présent bail.`);
  }
  if (b.honorairesAgence > 0) {
    add("Honoraires d'agence", `Honoraires ${b.agenceNom} : ${b.honorairesAgence} € TTC, charge : ${b.chargeHonoraires}. ${b.agenceMention}. Plafonds ALUR applicables à la part locataire.`);
  }
  if (b.clausesSpecifiques.trim()) add("Clauses particulières", b.clausesSpecifiques.trim());
  add("Annexes et élection de domicile",
    "État des lieux, inventaire le cas échéant et diagnostics font partie du bail. Élection de domicile aux adresses ci-dessus. Tribunaux du lieu de l'immeuble.");

  return arts.map((a, i) => ({ titre: `Article ${i + 1} — ${a.titre}`, corps: a.corps }));
}
