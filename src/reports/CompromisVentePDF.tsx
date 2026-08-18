import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import logoSrc from "../assets/logo.png";
import type { CompromisVente, PartieCompromis } from "../schemas/redacteur/compromisVente.schema";
import { calcCompromis } from "../schemas/redacteur/compromisVente.schema";

const P = "#1A3A52";
const LINE = "#E4E4E0";
const INK = "#1A1A18";
const SUB = "#6B6B67";
const BG = "#F8F9FB";
const BF = "Helvetica-Bold";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: INK, padding: "18mm 17mm 15mm" },
  logoBox: { alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: `1 solid ${LINE}` },
  logoTxt: { fontSize: 22, fontFamily: BF, color: INK },
  logoSub: { fontSize: 8.5, color: SUB, marginTop: 2, fontStyle: "italic" },
  docTitre: { fontSize: 22, fontFamily: BF, color: INK, textAlign: "center", marginBottom: 10 },
  summaryBox: { border: `1 solid ${LINE}`, borderRadius: 5, padding: "10 18", marginBottom: 14, alignItems: "center" },
  summaryTitre: { fontSize: 11, fontFamily: BF, color: INK, marginBottom: 3 },
  summaryLine: { fontSize: 9.5, color: SUB, marginBottom: 2, textAlign: "center" },
  summaryPrice: { fontSize: 13, fontFamily: BF, color: INK, marginTop: 4 },
  summaryPriceSub: { fontSize: 8.5, color: SUB, fontStyle: "italic" },
  preambule: { fontSize: 9, color: INK, lineHeight: 1.6, textAlign: "justify", marginBottom: 8 },
  art: { fontSize: 10, fontFamily: BF, color: P, marginTop: 12, marginBottom: 5, borderLeft: `3 solid ${P}`, paddingLeft: 8 },
  subArt: { fontSize: 9.5, fontFamily: BF, color: P, marginTop: 7, marginBottom: 3, paddingLeft: 8, textDecoration: "underline" },
  body: { fontSize: 9, color: INK, lineHeight: 1.6, textAlign: "justify", marginBottom: 5 },
  bf: { fontFamily: BF },
  tableBox: { border: `0.5 solid ${LINE}`, borderRadius: 4, marginVertical: 5 },
  tr: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, padding: "4.5 8" },
  trLast: { flexDirection: "row", padding: "4.5 8" },
  trHead: { flexDirection: "row", backgroundColor: P, padding: "5 8" },
  th: { color: "#fff", fontFamily: BF, fontSize: 8 },
  tdL: { flex: 2, fontSize: 9, color: SUB },
  tdR: { flex: 1.5, fontSize: 9, fontFamily: BF, color: INK, textAlign: "right" },
  highlight: { backgroundColor: BG, border: `0.5 solid ${LINE}`, borderRadius: 4, padding: "7 12", marginVertical: 5 },
  warningBox: { backgroundColor: "#FBF4E6", border: `0.5 solid #C8A050`, borderRadius: 4, padding: "7 12", marginVertical: 5 },
  footer: { position: "absolute", bottom: "9mm", left: "17mm", right: "17mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 5 },
  footerTxt: { fontSize: 7, color: SUB, textAlign: "center" },
  footerPage: { fontSize: 7.5, color: SUB, textAlign: "right" },
  sigSection: { marginTop: 14, paddingTop: 10, borderTop: `1 solid ${LINE}` },
});

const E = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR")} €`;
const fd = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "……………";
const fdS = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR") : "……………";
const dash = "……………………………………";

function Partie({ p }: { p: PartieCompromis }) {
  const name = [p.civilite, p.prenom?.toUpperCase(), p.nom?.toUpperCase()].filter(Boolean).join(" ");
  const neLe = p.dateNaissance ? `né${p.civilite === "Mme" || p.civilite === "Madame" ? "e" : ""} le ${fdS(p.dateNaissance)}` : "";
  const neLieu = p.lieuNaissance ? `à ${p.lieuNaissance}` : "";
  return (
    <Text style={s.body}>
      {name || dash}, de nationalité {p.nationalite || "française"}{neLe ? `, ${neLe}` : ""}{neLieu ? ` ${neLieu}` : ""}, demeurant {p.adresse || dash}{p.codePostal ? `, ${p.codePostal}` : ""}{p.ville ? ` ${p.ville}` : ""} (Martinique), {p.etatCivil || "célibataire"}, agissant en son nom personnel.{p.email ? `\nEmail : ${p.email}` : ""}{p.tel ? ` | Tél. : ${p.tel}` : ""}
    </Text>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text
        style={s.footerTxt}
        render={({ pageNumber, totalPages }) =>
          `CASA CARAÏBES – Compromis de vente | Page ${pageNumber}/${totalPages}`
        }
      />
    </View>
  );
}

export function CompromisVentePDF({ f }: { f: CompromisVente }) {
  const c = calcCompromis(f);
  const vendeur0 = f.vendeurs[0];
  const acquereur0 = f.acquereurs[0];
  const nomVendeur = vendeur0 ? `${vendeur0.prenom} ${vendeur0.nom}` : dash;
  const nomAcquereur = acquereur0 ? `${acquereur0.prenom} ${acquereur0.nom}` : dash;

  return (
    <Document>
      {/* ═══ PAGE DE GARDE ═══ */}
      <Page size="A4" style={s.page}>
        <View style={s.logoBox}>
          <Image src={logoSrc} style={{ width: 160, height: 60, objectFit: "contain" }} />
          <Text style={s.logoSub}>Agence Immobilière — Martinique</Text>
        </View>
        <Text style={s.docTitre}>COMPROMIS DE VENTE</Text>
        <View style={s.summaryBox}>
          <Text style={s.summaryTitre}>{f.residence ? `${f.residence} – ` : ""}{f.typeBien}{f.numLot ? ` n° ${f.numLot}` : ""}</Text>
          {f.adresseBien && <Text style={s.summaryLine}>{f.adresseBien}{f.commune ? ` – ${f.codePostal} ${f.commune}` : ""}</Text>}
          {nomVendeur !== dash && <Text style={s.summaryLine}>VENDEUR : {vendeur0?.civilite} {nomVendeur}</Text>}
          {nomAcquereur !== dash && <Text style={s.summaryLine}>ACQUÉREUR : {acquereur0?.civilite} {nomAcquereur}</Text>}
          {f.prixFAI > 0 && <Text style={s.summaryPrice}>PRIX DE VENTE : {E(f.prixFAI)}</Text>}
          {f.honorairesTTC > 0 && <Text style={s.summaryPriceSub}>Dont honoraires d'agence à la charge du {f.chargeHonoraires === "vendeur" ? "VENDEUR" : "L'ACQUÉREUR"}</Text>}
        </View>

        {/* Préambule */}
        <Text style={[s.art, { marginTop: 6 }]}>PRÉAMBULE</Text>
        <Text style={s.body}>Il a été convenu et arrêté ce qui suit entre les parties ci-après désignées, lesquelles reconnaissent avoir été informées de leurs droits et obligations respectifs dans le cadre de la présente promesse synallagmatique de vente, conformément aux dispositions des articles 1589 et suivants du Code civil ainsi que des lois n° 70-9 du 2 janvier 1970 (dite loi Hoguet), n° 89-462 du 6 juillet 1989 et de la loi ALUR n° 2014-366 du 24 mars 2014.</Text>
        <Text style={s.body}>La présente convention vaut vente dès l'accord des parties sur la chose et le prix. Elle emporte transfert de propriété sous réserve de la réalisation des conditions suspensives stipulées ci-après et du paiement intégral du prix à la date de réitération en acte authentique.</Text>

        <Footer />
      </Page>

      {/* ═══ PAGE 2 — PARTIES & BIEN ═══ */}
      <Page size="A4" style={s.page}>
        <Text style={s.art}>ARTICLE 1 – DÉSIGNATION DES PARTIES</Text>
        <Text style={s.subArt}>1.1 – Le Vendeur</Text>
        {f.vendeurs.map((v: import("../schemas/redacteur/compromisVente.schema").PartieCompromis, i: number) => <Partie key={i} p={v} />)}
        <Text style={s.subArt}>1.2 – L'Acquéreur</Text>
        {f.acquereurs.map((a: import("../schemas/redacteur/compromisVente.schema").PartieCompromis, i: number) => <Partie key={i} p={a} />)}
        <Text style={s.subArt}>1.3 – L'Agence immobilière mandataire</Text>
        <Text style={s.body}>La Société CASA CARAÏBES, SARL au capital de 2 000 euros, immatriculée au Registre du Commerce et des Sociétés de Fort-de-France sous le numéro 928 647 981, dont le siège social est situé Impasse Capucine, 97232 Le Lamentin, représentée par son gérant {f.redacteur}, titulaire de la carte professionnelle de transactions immobilières n° CPI97212024000000007 délivrée à Fort-de-France le 10 juin 2024, couverte par une assurance de responsabilité civile professionnelle souscrite auprès de MMA IARD sous le numéro 120 137 405.{f.mandatRef ? `\nL'agence CASA CARAÏBES a agi en qualité de mandataire du VENDEUR, en vertu du mandat de vente n° ${f.mandatRef}.` : ""}</Text>

        <Text style={s.art}>ARTICLE 2 – DÉSIGNATION DU BIEN VENDU</Text>
        <Text style={s.subArt}>2.1 – Description du bien</Text>
        <Text style={s.body}>Le VENDEUR cède à l'ACQUÉREUR, qui accepte, {f.typeBien.toLowerCase() === "appartement" ? "un appartement" : `un(e) ${f.typeBien.toLowerCase()}`}{f.residence ? ` situé(e) au sein de la ${f.residence}` : ""}{f.adresseBien ? `, sis ${f.adresseBien}` : ""}{f.quartier ? `, ${f.quartier}` : ""}{f.codePostal || f.commune ? `, ${f.codePostal} ${f.commune} (Martinique)` : ""}{f.numLot ? `, constituant le lot numéro ${f.numLot} au sens du règlement de copropriété` : ""}{f.tantiemes ? `, comprenant les droits accessoires qui y sont attachés, soit ${f.tantiemes} des parties communes générales de la copropriété` : ""}.
        </Text>
        {f.surfaceCarrez > 0 && (
          <View style={s.highlight}>
            <Text style={[s.body, { fontFamily: BF, marginBottom: 2 }]}>Superficie privative loi Carrez : {f.surfaceCarrez} m²</Text>
            {f.surfaceTotale > 0 && <Text style={s.body}>Surface au sol totale : {f.surfaceTotale} m²</Text>}
          </View>
        )}
        {f.descriptionSurfaces && <Text style={s.body}>{f.descriptionSurfaces}</Text>}

        {f.nomCopro && (
          <>
            <Text style={s.subArt}>2.2 – La copropriété</Text>
            <Text style={s.body}>L'immeuble est soumis au statut de la copropriété régi par la loi n° 65-557 du 10 juillet 1965 et ses décrets d'application. Le syndicat des copropriétaires{f.nomCopro ? `, dénommé ${f.nomCopro}` : ""}
              {f.numImmatCopro ? `, immatriculé sous le numéro ${f.numImmatCopro}` : ""}
              {f.nomSyndic ? `, est administré par le syndic professionnel ${f.nomSyndic}` : ""}{f.adresseSyndic ? `, ${f.adresseSyndic}` : ""}.
              {f.nbLotsCopro > 0 ? `\nLa copropriété comporte ${f.nbLotsCopro} lots principaux.` : ""}
              {f.anneeConstruction ? ` L'immeuble a été construit approximativement en ${f.anneeConstruction}.` : ""}
            </Text>
          </>
        )}

        <Footer />
      </Page>

      {/* ═══ PAGE 3 — DDT, PRIX, FINANCEMENT ═══ */}
      <Page size="A4" style={s.page}>
        <Text style={s.art}>ARTICLE 3 – DIAGNOSTICS TECHNIQUES (DDT)</Text>
        {f.diagnostiqueur && <Text style={s.body}>Le dossier de diagnostic technique (DDT) a été établi par {f.diagnostiqueur}{f.dateDDT ? `, le ${fd(f.dateDDT)}` : ""}. Ce dossier est annexé aux présentes et remis à l'ACQUÉREUR, qui le reconnaît.</Text>}
        {f.surfaceCarrezDDT > 0 && <Text style={s.body}><Text style={s.bf}>3.1 – Mesurage loi Carrez : </Text>La superficie privative telle que mesurée est de {f.surfaceCarrezDDT} m².</Text>}
        {f.anomaliesElec && <Text style={s.body}><Text style={s.bf}>3.2 – État de l'installation électrique : </Text>{f.anomaliesElec}</Text>}
        <Text style={s.body}><Text style={s.bf}>3.3 – État relatif à la présence de termites : </Text>
          {f.etatTermites === "Absence" ? "La recherche de termites révèle l'absence de tout indice d'infestation de termites dans l'ensemble des parties privatives." : `Des indices d'infestation de termites ont été détectés. ${f.infoTermites}`}
        </Text>
        {f.classeDPE && <Text style={s.body}><Text style={s.bf}>3.4 – DPE : </Text>Le Diagnostic de Performance Énergétique Martinique classe le logement en classe {f.classeDPE}.</Text>}

        <Text style={s.art}>ARTICLE 4 – PRIX DE VENTE ET MODALITÉS DE PAIEMENT</Text>
        <Text style={s.subArt}>4.1 – Prix de vente</Text>
        <Text style={s.body}>La présente vente est consentie et acceptée moyennant le prix de <Text style={s.bf}>{E(f.prixFAI)}</Text>{f.honorairesTTC > 0 ? `, dont honoraires d'agence TTC à la charge exclusive du ${f.chargeHonoraires === "vendeur" ? "VENDEUR" : "L'ACQUÉREUR"} d'un montant de ${E(f.honorairesTTC)}, soit un prix net vendeur de ${E(c.prixNetVendeur)}` : ""}. La vente n'est pas soumise à la TVA.</Text>
        <Text style={s.body}>Le prix sera payable en totalité comptant, dans les mains du notaire chargé de la rédaction de l'acte authentique, le jour de la signature dudit acte, par virement bancaire.</Text>

        {f.typeFinancement === "Prêt bancaire" && (
          <>
            <Text style={s.subArt}>4.2 – Plan de financement de l'Acquéreur</Text>
            <View style={s.tableBox}>
              <View style={s.trHead}>
                <Text style={[s.th, { flex: 3 }]}>COÛT TOTAL DE L'OPÉRATION</Text>
                <Text style={[s.th, { flex: 1, textAlign: "right" }]}> </Text>
              </View>
              {[
                ["Prix d'acquisition", E(f.prixFAI)],
                f.fraisNotaireEstimes > 0 && ["Frais de notaire estimés (8 % logement ancien)", E(f.fraisNotaireEstimes)],
                ["TOTAL DU PROJET", E(f.prixFAI + (f.fraisNotaireEstimes || 0))],
                ["FINANCEMENT", ""],
                f.apportPersonnel > 0 && ["Apport personnel", E(f.apportPersonnel)],
                f.montantPret > 0 && [`Prêt immobilier – ${f.tauxMaxPret}% fixe – ${f.dureePretMois} mois`, E(f.montantPret)],
                f.banqueSollicitee && [`Établissement sollicité`, f.banqueSollicitee],
              ].filter(Boolean).map((row, i, arr) => (
                <View key={i} style={i === arr.length - 1 ? s.trLast : s.tr}>
                  <Text style={s.tdL}>{(row as string[])[0]}</Text>
                  <Text style={s.tdR}>{(row as string[])[1]}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={s.subArt}>4.3 – Dépôt de garantie (séquestre)</Text>
        <Text style={s.body}>À titre de garantie de l'exécution du présent compromis et à valoir sur le prix de vente, l'ACQUÉREUR versera, dans un délai de 10 jours calendaires à compter de l'expiration du délai de rétractation, la somme de <Text style={s.bf}>{E(c.sequestre)} ({f.sequestrePct}% du prix de vente)</Text>, entre les mains du notaire chargé de recevoir l'acte authentique.</Text>

        <Text style={s.art}>ARTICLE 5 – CONDITIONS SUSPENSIVES</Text>
        <Text style={s.body}>La présente promesse synallagmatique de vente est conclue sous les conditions suspensives suivantes, dont la non-réalisation dans les délais impartis entraînera la résolution de plein droit de la vente, sans indemnité de part ni d'autre.</Text>
        {f.typeFinancement === "Prêt bancaire" && f.montantPret > 0 && (
          <>
            <Text style={s.subArt}>5.1 – Obtention du ou des prêts immobiliers</Text>
            <Text style={s.body}>La vente est subordonnée à l'obtention par l'ACQUÉREUR d'un ou plusieurs prêts immobiliers d'un montant minimum de <Text style={s.bf}>{E(f.montantPret)}</Text>, à un taux d'intérêt nominal annuel n'excédant pas <Text style={s.bf}>{f.tauxMaxPret}%</Text>, remboursable sur une durée maximale de <Text style={s.bf}>{f.dureePretMois} mois</Text>. L'ACQUÉREUR s'engage à déposer son dossier de demande de prêt auprès de l'établissement bancaire dans un délai de <Text style={s.bf}>{f.delaiDepotDossierJours} jours calendaires</Text> à compter de la signature du présent compromis. L'ACQUÉREUR devra justifier de l'obtention ou du refus de prêt dans un délai de <Text style={s.bf}>{f.delaiPretJours} jours calendaires</Text> à compter de la même date.</Text>
          </>
        )}
        <Text style={s.subArt}>{f.typeFinancement === "Prêt bancaire" ? "5.2" : "5.1"} – Absence de droit de préemption</Text>
        <Text style={s.body}>La présente vente est soumise à la purge du droit de préemption urbain de la commune de {f.commune || "la commune concernée"}, ainsi qu'à toute préemption susceptible d'être exercée par tout organisme public ou parapublic. Si un droit de préemption est exercé, le présent compromis sera résolu de plein droit, sans indemnité de part ni d'autre.</Text>

        <Footer />
      </Page>

      {/* ═══ PAGE 4 — Articles 6 à 14 ═══ */}
      <Page size="A4" style={s.page}>
        <Text style={s.art}>ARTICLE 6 – DATE DE RÉITÉRATION EN ACTE AUTHENTIQUE</Text>
        <Text style={s.body}>La réitération de la vente en la forme authentique devra intervenir au plus tard le <Text style={s.bf}>{f.dateReiterationMax ? fd(f.dateReiterationMax) : dash}</Text>{f.notaire ? `, par-devant ${f.notaire}${f.adresseNotaire ? `, ${f.adresseNotaire}` : ""}` : ""}. Cette date pourra être prorogée d'un commun accord entre les parties, par avenant écrit et signé.</Text>

        <Text style={s.art}>ARTICLE 7 – OCCUPATION ET JOUISSANCE DU BIEN</Text>
        <Text style={s.body}>Le VENDEUR déclare {f.occupation === "résidence principale" ? "occuper personnellement le bien à titre de résidence principale" : `que le bien est actuellement ${f.occupation}`} et s'engage à le remettre libre de toute occupation à la date de signature de l'acte authentique de vente. L'ACQUÉREUR prendra possession du bien le jour même de la signature de l'acte authentique, concomitamment au paiement intégral du prix et à la remise des clés.</Text>

        <Text style={s.art}>ARTICLE 8 – CHARGES ET FISCALITÉ</Text>
        {f.taxeFonciere > 0 && <Text style={s.body}><Text style={s.bf}>8.1 – Taxe foncière : </Text>La taxe foncière{f.anneeRef ? ` pour l'année ${f.anneeRef}` : ""} a été établie pour un montant de {E(f.taxeFonciere)}. Elle sera proratisée entre le VENDEUR et l'ACQUÉREUR au titre de l'année de la cession.</Text>}
        <Text style={s.body}><Text style={s.bf}>8.2 – Charges afférentes à l'acte : </Text>Les frais, droits et honoraires de notaire liés à la rédaction et à la publication de l'acte authentique seront supportés exclusivement par l'ACQUÉREUR{f.fraisNotaireEstimes > 0 ? `, estimés à environ ${E(f.fraisNotaireEstimes)} (8% du prix de vente, à titre indicatif)` : ""}.</Text>
        <Text style={s.body}><Text style={s.bf}>8.3 – Plus-value immobilière : </Text>Le VENDEUR a été informé que la cession de son bien est susceptible de générer une plus-value immobilière soumise à l'impôt, le cas échéant, conformément aux articles 150 U et suivants du Code général des impôts.</Text>

        {f.honorairesTTC > 0 && (
          <>
            <Text style={s.art}>ARTICLE 9 – HONORAIRES D'AGENCE</Text>
            <Text style={s.body}>En rémunération de ses services, l'agence CASA CARAÏBES percevra des honoraires d'un montant de <Text style={s.bf}>{E(f.honorairesTTC)} TTC</Text>, conformément au barème et au mandat de vente consenti par le VENDEUR. Ces honoraires sont à la charge exclusive du {f.chargeHonoraires === "vendeur" ? "VENDEUR" : "L'ACQUÉREUR"} et seront prélevés sur le prix de vente lors du règlement effectué par le notaire.</Text>
          </>
        )}

        <Text style={s.art}>ARTICLE 10 – CLAUSE PÉNALE</Text>
        <Text style={s.body}>Si, toutes les conditions suspensives étant réalisées et le délai de rétractation étant expiré, l'une des parties refuse de réitérer la vente, l'autre partie pourra, à son choix, poursuivre l'exécution forcée ou se prévaloir de la présente clause pénale et exiger du défaillant le paiement d'une indemnité forfaitaire égale à <Text style={s.bf}>10% du prix de vente, soit {E(c.clausePenale)}</Text>. Si c'est le VENDEUR qui est défaillant, il devra verser cette indemnité à l'ACQUÉREUR, en sus de la restitution du dépôt de garantie. Si c'est l'ACQUÉREUR qui est défaillant, le dépôt de garantie de {E(c.sequestre)} lui sera définitivement acquis à titre d'acompte.</Text>

        <Text style={s.art}>ARTICLE 11 – DROIT DE RÉTRACTATION DE L'ACQUÉREUR</Text>
        <Text style={s.body}>Conformément aux dispositions de l'article L. 271-1 du Code de la Construction et de l'Habitation, l'ACQUÉREUR non professionnel dispose d'un délai de rétractation de <Text style={s.bf}>dix (10) jours</Text> à compter du lendemain de la première présentation de la lettre recommandée avec accusé de réception lui notifiant le présent compromis. En cas de rétractation dans ce délai, toutes les sommes versées par l'ACQUÉREUR lui seront intégralement restituées dans un délai de 21 jours.</Text>

        {(f.sommesDuesVendeur > 0 || f.travauxVotesRestants > 0) && (
          <>
            <Text style={s.art}>ARTICLE 14 – SITUATION FINANCIÈRE DE LA COPROPRIÉTÉ</Text>
            {f.sommesDuesVendeur > 0 && <Text style={s.body}><Text style={s.bf}>14.1 – Sommes dues par le Vendeur au syndicat : </Text>Le VENDEUR est redevable envers le syndicat d'une somme totale de {E(f.sommesDuesVendeur)}{f.detailSommesDues ? ` (${f.detailSommesDues})` : ""}. Le VENDEUR s'engage à apurer l'intégralité de ces sommes au plus tard à la date de l'acte authentique.</Text>}
            {f.remboursementFondsTravaux > 0 && <Text style={s.body}><Text style={s.bf}>14.2 – Fonds de travaux : </Text>L'ACQUÉREUR remboursera directement au VENDEUR la somme de {E(f.remboursementFondsTravaux)} au titre des avances constituées au fonds de travaux (L. art. 14-2).</Text>}
            {f.travauxVotesRestants > 0 && <Text style={s.body}><Text style={s.bf}>14.3 – Travaux votés restant à appeler : </Text>{f.detailTravauxVotes || `Des travaux ont été votés en assemblée générale. La quote-part restant à appeler de ${E(f.travauxVotesRestants)} sera à la charge exclusive de l'ACQUÉREUR, sans recours contre le VENDEUR.`}</Text>}
          </>
        )}

        <Footer />
      </Page>

      {/* ═══ PAGE 5 — Articles 12-17 + Signatures ═══ */}
      <Page size="A4" style={s.page}>
        <Text style={s.art}>ARTICLE 12 – DÉCLARATIONS DU VENDEUR</Text>
        <Text style={s.body}>Le VENDEUR déclare sous sa responsabilité et garantit à l'ACQUÉREUR que :{"\n"}
          {"  "}— il est seul propriétaire du bien vendu, libre et quitte de toute hypothèque, privilège ou sûreté réelle ;{"\n"}
          {"  "}— il n'a consenti aucun bail ni convention d'occupation portant sur le bien, lequel sera remis libre à la date de l'acte authentique ;{"\n"}
          {"  "}— il n'a connaissance d'aucun litige, procédure judiciaire ou administrative susceptible d'affecter le bien ;{"\n"}
          {"  "}— il n'a reçu aucune notification d'expropriation ou de préemption concernant le bien à ce jour ;{"\n"}
          {"  "}— le bien ne fait l'objet d'aucun arrêté de péril, d'insalubrité, ni d'aucune injonction administrative.
        </Text>

        <Text style={s.art}>ARTICLE 13 – SITUATION URBANISTIQUE ET SERVITUDES</Text>
        <Text style={s.body}>Le bien est situé sur la commune de {f.commune || dash}, soumise au Plan Local d'Urbanisme (PLU) en vigueur. Le notaire instrumentaire effectuera les recherches d'urbanisme nécessaires avant la signature de l'acte authentique. Le VENDEUR déclare n'avoir connaissance d'aucune servitude grevant le bien, autre que celles apparentes ou résultant du règlement de copropriété.</Text>

        <Text style={s.art}>ARTICLE 15 – PROTECTION DES DONNÉES PERSONNELLES (RGPD)</Text>
        <Text style={s.body}>Conformément au Règlement (UE) 2016/679 du 27 avril 2016 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée, l'agence CASA CARAÏBES collecte et traite les données personnelles des parties aux fins exclusives d'accomplissement de sa mission de transaction immobilière. Ces données sont conservées pendant la durée légale de prescription. Toute personne concernée dispose d'un droit d'accès, de rectification et d'effacement : contact@casacaraibes.com.</Text>

        <Text style={s.art}>ARTICLE 16 – ÉLECTION DE DOMICILE ET NOTIFICATIONS</Text>
        <Text style={s.body}>Pour l'exécution du présent acte, les parties font élection de domicile à leurs adresses respectives telles qu'indiquées à l'article 1. Toute notification sera valablement adressée par lettre recommandée avec accusé de réception à ces adresses.</Text>

        <Text style={s.art}>ARTICLE 17 – LISTE DES ANNEXES</Text>
        <Text style={s.body}>Sont annexés au présent compromis :{"\n"}
          {"  "}— Dossier de Diagnostic Technique complet (DDT){"\n"}
          {"  "}— Pré-état daté établi par le syndic{"\n"}
          {"  "}— Règlement de copropriété et état descriptif de division{"\n"}
          {"  "}— Procès-verbaux des trois dernières assemblées générales de copropriétaires{"\n"}
          {"  "}— Fiche synthétique de copropriété — Carnet d'entretien{"\n"}
          {"  "}— État des Risques Naturels et Technologiques (ERNT){"\n"}
          {"  "}— Titre de propriété du VENDEUR
        </Text>

        {/* Observations complémentaires — affichées uniquement si renseignées */}
        {!!f.observations && (
          <View wrap={false} style={{ marginTop: 14, border: `0.5 solid ${LINE}`, borderRadius: 4, padding: "8 12" }}>
            <Text style={[s.art, { marginTop: 0, marginBottom: 6 }]}>Observations et précisions complémentaires</Text>
            <Text style={s.body}>{f.observations}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={s.sigSection}>
          <Text style={[s.body, { marginBottom: 8 }]}>Fait à {f.lieu || "Fort-de-France"}, le {fd(f.date)}, en quatre (4) exemplaires.</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <View style={{ flex: 1, marginRight: 20 }}>
              <Text style={[s.body, { fontFamily: BF, marginBottom: 4 }]}>LE VENDEUR</Text>
              {f.vendeurs.map((v: import("../schemas/redacteur/compromisVente.schema").PartieCompromis, i: number) => (
                <Text key={i} style={[s.body, { color: SUB }]}>{v.civilite} {v.prenom} {v.nom}</Text>
              ))}
              <View style={{ height: 35, borderBottom: `0.5 solid ${INK}`, marginTop: 14, width: 120 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.body, { fontFamily: BF, marginBottom: 4 }]}>L'ACQUÉREUR</Text>
              {f.acquereurs.map((a: import("../schemas/redacteur/compromisVente.schema").PartieCompromis, i: number) => (
                <Text key={i} style={[s.body, { color: SUB }]}>{a.civilite} {a.prenom} {a.nom}</Text>
              ))}
              <View style={{ height: 35, borderBottom: `0.5 solid ${INK}`, marginTop: 14, width: 120 }} />
            </View>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
