import type { Bail, PartieBail } from "./bail.schema";
import { loyerCc, usageDefaut } from "./bail.schema";

function fdFr(d: string) {
  if (!d) return "";
  const x = new Date(d.length <= 10 ? d + "T12:00" : d);
  return Number.isNaN(x.getTime()) ? d : x.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function nomPartie(p?: PartieBail) {
  if (!p) return "\u2014";
  return [p.civilite, p.prenom, p.nom].filter(Boolean).join(" ") || "\u2014";
}
function identite(p: PartieBail) {
  const bits = [nomPartie(p)];
  if (p.dateNaissance) bits.push(`n\u00e9(e) le ${fdFr(p.dateNaissance)}${p.lieuNaissance ? ` \u00e0 ${p.lieuNaissance}` : ""}`);
  if (p.nationalite) bits.push(`de nationalit\u00e9 ${p.nationalite}`);
  const adr = [p.adresse, p.codePostal, p.ville].filter(Boolean).join(" ");
  if (adr) bits.push(`demeurant ${adr}`);
  return bits.join(", ");
}

export function articlesBail(b: Bail): { titre: string; corps: string }[] {
  const cc = loyerCc(b);
  const debut = b.dateDebut ? fdFr(b.dateDebut) : "\u2026";
  const fin = b.dateFin ? fdFr(b.dateFin) : "\u2026";
  const t = b.typeBail;
  const designation = [b.typeBien, b.adresseBien, `${b.codePostal} ${b.commune}`].filter(Boolean).join(", ") || "\u2014";
  const arts: { titre: string; corps: string }[] = [];
  const add = (titre: string, corps: string) => arts.push({ titre, corps });

  add("Objet et d\u00e9signation",
    `Le bailleur donne \u00e0 bail au preneur le bien d\u00e9sign\u00e9 : ${designation}. ` +
    `${b.surfaceHabitable ? `Surface habitable : ${String(b.surfaceHabitable).replace(".", ",")} m\u00b2. ` : ""}` +
    `${b.nbPieces ? `Composition : ${b.nbPieces}. ` : ""}` +
    `${b.etage ? `Situation : ${b.etage}. ` : ""}` +
    `${b.annexes ? `Annexes : ${b.annexes}. ` : ""}` +
    `${b.copropriete ? `Copropri\u00e9t\u00e9 : ${b.copropriete}. ` : ""}` +
    `${b.descriptionBien ? b.descriptionBien + " " : ""}` +
    `Usage convenu : ${b.usage || usageDefaut(t)}.`);

  add("Dur\u00e9e",
    t === "Bail mobilit\u00e9"
      ? `Bail mobilit\u00e9 de ${b.dureeMois || "\u2026"} mois, du ${debut} au ${fin} (1 \u00e0 10 mois, non renouvelable). Motif : ${b.motifMobilite || "\u00e0 pr\u00e9ciser"}.`
      : t === "Location saisonni\u00e8re"
        ? `P\u00e9riode du ${debut} au ${fin} (${b.dureeMois || "\u2026"} mois), location saisonni\u00e8re hors titre Ier de la loi de 1989.`
        : t === "Bail d'habitation nu"
          ? `Dur\u00e9e de ${b.dureeMois || 36} mois \u00e0 compter du ${debut} (jusqu'au ${fin}). Reconduction tacite de trois ans sauf cong\u00e9.`
          : `Bail meubl\u00e9 de ${b.dureeMois || 12} mois \u00e0 compter du ${debut} (jusqu'au ${fin}). Reconduction tacite d'un an sauf cong\u00e9.`);

  add("Loyer et charges",
    t === "Location saisonni\u00e8re"
      ? `Loyer de p\u00e9riode : ${b.loyerHc || 0} \u20ac HC + ${b.charges || 0} \u20ac de charges, soit ${cc} \u20ac CC. Paiement : ${b.modePaiement}.`
      : `Loyer mensuel ${b.loyerHc || 0} \u20ac HC + ${b.typeCharges || "provision sur charges"} de ${b.charges || 0} \u20ac, soit ${cc} \u20ac CC, payable le ${b.jourPaiement} de chaque mois par ${b.modePaiement}` +
        `${b.iban ? ` \u2014 IBAN ${b.iban}` : ""}. ` +
        (b.revisionIrl ? `R\u00e9vision annuelle IRL, trimestre ${b.trimestreIrl}.` : "Pas de r\u00e9vision pendant la dur\u00e9e initiale."));

  add("D\u00e9p\u00f4t de garantie",
    t === "Bail mobilit\u00e9"
      ? "Aucun d\u00e9p\u00f4t de garantie (art. 25-17 de la loi du 6 juillet 1989)."
      : `D\u00e9p\u00f4t de ${b.depotGarantie || 0} \u20ac vers\u00e9 \u00e0 la signature, restitu\u00e9 dans le d\u00e9lai l\u00e9gal apr\u00e8s remise des cl\u00e9s.`);

  add("Obligations des parties",
    "Le bailleur d\u00e9livre un logement d\u00e9cent et en assure la jouissance paisible. Le preneur paie le loyer aux termes convenus, use paisiblement des lieux, s'assure contre les risques locatifs et restitue le bien en bon \u00e9tat, usure normale except\u00e9e.");

  if (t === "Bail d'habitation meubl\u00e9" || t === "Bail mobilit\u00e9" || t === "Location saisonni\u00e8re") {
    add("Caract\u00e8re meubl\u00e9 et inventaire",
      `Logement remis meubl\u00e9. Inventaire et \u00e9tat des lieux \u00e0 l'entr\u00e9e et \u00e0 la sortie. ${b.inventaireMeubles || "L'inventaire est annex\u00e9 au bail."}`);
  } else {
    add("\u00c9tat des lieux", "\u00c9tat des lieux contradictoire \u00e0 l'entr\u00e9e et \u00e0 la sortie (art. 3-2 loi 1989).");
  }

  add("Cong\u00e9 et fin de bail",
    t === "Bail mobilit\u00e9"
      ? "Preneur : pr\u00e9avis d'un mois. Bailleur : uniquement au terme du contrat."
      : t === "Location saisonni\u00e8re"
        ? "Fin de plein droit \u00e0 la date pr\u00e9vue, sans reconduction tacite."
        : t === "Bail d'habitation nu"
          ? "Cong\u00e9 preneur : 3 mois (1 mois en zone tendue). Cong\u00e9 bailleur : 6 mois avant terme, motiv\u00e9."
          : "Cong\u00e9 preneur : 1 mois. Cong\u00e9 bailleur : 3 mois avant terme, motiv\u00e9.");

  add("Clause r\u00e9solutoire",
    t === "Location saisonni\u00e8re"
      ? "Inex\u00e9cution d'une obligation essentielle : r\u00e9siliation apr\u00e8s mise en demeure infructueuse."
      : "D\u00e9faut de paiement ou d'assurance : r\u00e9siliation de plein droit deux mois apr\u00e8s commandement infructueux (art. 24 loi 1989).");

  const diag = [
    b.dpeClasse && `DPE ${b.dpeClasse}${b.gesClasse ? ` / GES ${b.gesClasse}` : ""}${b.dateDpe ? ` (${fdFr(b.dateDpe)})` : ""}`,
    b.termites && `termites : ${b.termites}`,
    b.ernmt && `ERNMT : ${b.ernmt}`,
  ].filter(Boolean);
  add("Diagnostics",
    (diag.length ? `Diagnostics annex\u00e9s : ${diag.join(" ; ")}. ` : "Dossier de diagnostics techniques annex\u00e9. ") +
    "En Martinique, le diagnostic termites est obligatoire dans les zones d'arr\u00eat\u00e9 pr\u00e9fectoral.");

  add("Jouissance des lieux",
    `${b.animauxAutorises ? "Animaux familiers autoris\u00e9s s'ils ne causent aucun trouble." : "Animaux interdits, sauf accord \u00e9crit."} ` +
    `${b.sousLocationAutorisee ? "Sous-location autoris\u00e9e avec information du bailleur." : "Sous-location interdite sans accord \u00e9crit."} ` +
    (b.preneurs.length > 1 ? "Les preneurs sont tenus solidairement." : ""));

  if (b.garant && (b.garant.nom || b.garant.prenom)) {
    add("Caution solidaire", `${identite(b.garant)} se porte caution solidaire du preneur pour toutes les obligations du pr\u00e9sent bail.`);
  }
  if (b.honorairesAgence > 0) {
    add("Honoraires d'agence", `Honoraires ${b.agenceNom} : ${b.honorairesAgence} \u20ac TTC, charge : ${b.chargeHonoraires}. ${b.agenceMention}. Plafonds ALUR applicables \u00e0 la part locataire.`);
  }
  if (b.clausesSpecifiques.trim()) add("Clauses particuli\u00e8res", b.clausesSpecifiques.trim());
  add("Annexes et \u00e9lection de domicile",
    "\u00c9tat des lieux, inventaire le cas \u00e9ch\u00e9ant et diagnostics font partie du bail. \u00c9lection de domicile aux adresses ci-dessus. Tribunaux du lieu de l'immeuble.");

  return arts.map((a, i) => ({ titre: `Article ${i + 1} \u2014 ${a.titre}`, corps: a.corps }));
}
