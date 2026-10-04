import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "./pdfFonts";
import logo from "../assets/logo.png";
import type { MandatLocation } from "../schemas/redacteur/mandatLocation.schema";
import { calcMandatLocation } from "../schemas/redacteur/mandatLocation.schema";

const NAVY = "#1B365D";
const LINE = "#B8B8B8";
const GRID = "#D5D5D5";
const INK = "#111111";
const SOFT = "#5A6570";

const s = StyleSheet.create({
  page: { fontFamily: "Montserrat", fontSize: 9, color: INK, padding: "16mm 18mm 18mm" },
  cover: { fontFamily: "Montserrat", color: INK, padding: "16mm 18mm 18mm" },
  logo: { width: 220, height: 68, objectFit: "contain", alignSelf: "center", marginTop: 8, marginBottom: 10 },
  hair: { height: 1.1, backgroundColor: NAVY, marginBottom: 14 },
  kicker: { fontSize: 8.5, color: NAVY, textAlign: "center", marginBottom: 6 },
  title: { fontSize: 18, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, textAlign: "center", lineHeight: 1.25 },
  sub: { fontSize: 11, color: SOFT, textAlign: "center", marginTop: 4 },
  meta: { fontSize: 8.5, color: SOFT, textAlign: "center", marginTop: 3 },
  parties: { flexDirection: "row", marginTop: 18, marginBottom: 16 },
  partie: { flex: 1, border: `0.4 solid ${LINE}`, padding: 10, alignItems: "center" },
  lbl: { fontSize: 8, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, marginBottom: 3 },
  val: { fontSize: 9, textAlign: "center" },
  muted: { fontSize: 8, color: SOFT, marginTop: 2, textAlign: "center" },
  table: { border: `0.4 solid ${LINE}`, marginBottom: 8 },
  row: { flexDirection: "row", borderBottom: `0.3 solid ${GRID}` },
  lab: { width: "38%", fontSize: 8, fontFamily: "Montserrat", fontWeight: 600, color: NAVY, padding: "4 5", textAlign: "center" },
  cell: { width: "62%", fontSize: 8, padding: "4 5", textAlign: "center" },
  th: { fontSize: 7.5, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, padding: "4 5", textAlign: "center", borderRight: `0.3 solid ${GRID}` },
  td: { fontSize: 7.8, padding: "4 5", textAlign: "center", borderRight: `0.3 solid ${GRID}` },
  sec: { fontSize: 10, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, marginTop: 10 },
  secLine: { height: 0.8, backgroundColor: NAVY, marginTop: 3, marginBottom: 8 },
  h3: { fontSize: 10, fontFamily: "Montserrat", fontWeight: 600, color: "#243E6D", marginTop: 8, marginBottom: 4 },
  body: { fontSize: 9, lineHeight: 1.38, textAlign: "justify", marginBottom: 5 },
  small: { fontSize: 8, color: SOFT, lineHeight: 1.35, textAlign: "justify", marginBottom: 5 },
  bullet: { fontSize: 9, lineHeight: 1.38, textAlign: "justify", marginBottom: 3, paddingLeft: 10 },
  box: { border: `0.4 solid ${LINE}`, padding: 8, marginVertical: 6 },
  footer: { position: "absolute", bottom: "8mm", left: "18mm", right: "18mm", borderTop: `0.6 solid ${NAVY}`, paddingTop: 4, flexDirection: "row", justifyContent: "space-between" },
  foot: { fontSize: 7, color: SOFT },
  sigRow: { flexDirection: "row", marginTop: 14 },
  sigBox: { flex: 1, border: `0.4 solid ${LINE}`, padding: 10, minHeight: 92, marginRight: 6 },
});

const money = (n: number) =>
  `${(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\s/g, " ")} €`;
const money0 = (n: number) =>
  `${Math.round(n || 0).toLocaleString("fr-FR").replace(/\s/g, " ")} €`;
const fd = (d: string) =>
  d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
const m2 = (n: number) => `${String(n).replace(".", ",")} m²`;

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.foot}>Casa Caraïbes SARL  —  RCS Fort-de-France 928 647 981  —  Document confidentiel</Text>
      <Text style={s.foot} render={({ pageNumber }) => `${pageNumber}`} />
    </View>
  );
}
function SH({ n, t }: { n: string; t: string }) {
  return (<><Text style={s.sec}>{n}.  {t}</Text><View style={s.secLine} /></>);
}
function KV({ rows }: { rows: [string, string][] }) {
  return (
    <View style={s.table}>
      {rows.filter(([, v]) => v).map(([k, v], i) => (
        <View key={k} style={[s.row, i === rows.length - 1 ? { borderBottomWidth: 0 } : {}]}>
          <Text style={s.lab}>{k}</Text>
          <Text style={s.cell}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function honorairesALUR(surface: number, partBailleur: number) {
  const capVisite = Math.round(surface * 10.09 * 100) / 100;
  const capEdl = Math.round(surface * 3.03 * 100) / 100;
  const capTotal = Math.round((capVisite + capEdl) * 100) / 100;
  const b = Math.round(partBailleur * 100) / 100;
  const bVisite = capTotal > 0 ? Math.round((b * capVisite / capTotal) * 100) / 100 : 0;
  const bEdl = Math.round((b - bVisite) * 100) / 100;
  const pVisite = Math.min(bVisite, capVisite);
  const pEdl = Math.min(bEdl, capEdl);
  return { capVisite, capEdl, capTotal, bVisite, bEdl, pVisite, pEdl, pTotal: Math.round((pVisite + pEdl) * 100) / 100, bTotal: b };
}

export function MandatLocationPDF({ f }: { f: MandatLocation }) {
  const { honoraires } = calcMandatLocation(f);
  const m = f.mandants[0];
  const prenom = (m?.prenom || "").trim().split(/[\s-]/)[0] || "";
  const nom = (m?.nom || "").trim();
  const mandantCourt = [m?.civilite === "Mme" ? "Madame" : m?.civilite === "M. et Mme" ? "Monsieur et Madame" : "Monsieur", prenom, nom].filter(Boolean).join(" ");
  const identite = [m?.civilite === "Mme" ? "Madame" : "Monsieur", prenom, nom].filter(Boolean).join(" ");
  const titreType = (f.typeMandat || "Exclusif").toUpperCase();
  const h = honorairesALUR(f.surfaceHabitable || 0, honoraires || 0);
  const loyer = f.loyerSouhaite || 0;
  const depot = loyer;
  const adresse = [f.adresseBien, f.codePostal, f.commune].filter(Boolean).join(", ");

  return (
    <Document>
      <Page size="A4" style={s.cover}>
        <Image src={logo} style={s.logo} />
        <View style={s.hair} />
        <Text style={s.kicker}>CASA CARAÏBES  —  AGENCE IMMOBILIÈRE</Text>
        <Text style={s.title}>MANDAT {titreType}</Text>
        <Text style={s.title}>DE MISE EN LOCATION</Text>
        <Text style={s.sub}>{f.regimeLocatif || "Location longue durée nue  ·  Loi du 6 juillet 1989"}</Text>
        <Text style={s.sub}>{[f.typeBien, adresse].filter(Boolean).join("  —  ")}</Text>
        {!!f.refCadastrale && <Text style={s.meta}>{f.refCadastrale}</Text>}
        <View style={s.parties}>
          <View style={s.partie}>
            <Text style={s.lbl}>MANDANT</Text>
            <Text style={s.val}>{mandantCourt || "—"}</Text>
            <Text style={s.muted}>{m?.ville || f.commune || "Martinique"}</Text>
          </View>
          <View style={[s.partie, { borderLeftWidth: 0 }]}>
            <Text style={s.lbl}>MANDATAIRE</Text>
            <Text style={s.val}>Casa Caraïbes SARL</Text>
            <Text style={s.muted}>Agence immobilière — Martinique</Text>
          </View>
        </View>
        <KV rows={[
          ["N° d’enregistrement au registre des mandats", f.numero || ""],
          ["Nature", `Mandat ${ (f.typeMandat || "exclusif").toLowerCase() } de mise en location, avec pouvoir de signer le bail au nom du bailleur`],
          ["Durée", `${f.dureeMois || 3} mois à compter de la signature`],
          ["Loyer recherché", loyer ? `${money0(loyer)} par mois hors charges` : ""],
          ["Document établi le", fd(f.date)],
        ]} />
        <Text style={s.small}>
          Document établi conformément à la loi n° 70-9 du 2 janvier 1970 (loi Hoguet),
          au décret n° 72-678 du 20 juillet 1972, à la loi n° 2014-366 du 24 mars 2014 (ALUR)
          et à l’article 5 de la loi n° 89-462 du 6 juillet 1989. Le mandataire est habilité à
          signer le bail au nom du bailleur dans les limites de l’article 06.
        </Text>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <SH n="01" t="DÉSIGNATION DES PARTIES" />
        <Text style={s.h3}>Le mandant (bailleur)</Text>
        <KV rows={[
          ["Identité", identite],
          ["Né(e) le", m?.dateNaissance || ""],
          ["Demeurant", [m?.adresse, m?.codePostal, m?.ville].filter(Boolean).join(", ")],
          ["Qualité", m?.qualite || "Personne physique, propriétaire du bien désigné ci-après"],
        ]} />
        <Text style={s.small}>
          Le mandant déclare être pleinement habilité à disposer du bien et à en confier la mise en location.
        </Text>
        <Text style={s.h3}>Le mandataire</Text>
        <KV rows={[
          ["Agence", "Casa Caraïbes SARL"],
          ["Immatriculation", "RCS Fort-de-France 928 647 981  —  SIRET 928 647 981 00010"],
          ["TVA", "FR68 928 647 981  —  TVA applicable en Martinique : 8,5 %"],
          ["Siège", "560 Impasse des Capucines, Apt 13 Bât. A, 97232 Le Lamentin"],
          ["Gérant habilité", f.redacteur || "Monsieur Luc-Olivier CLEMENTE"],
          ["Carte professionnelle", "CPI 97212024000000007 — Transaction sur immeubles et fonds de commerce"],
          ["Délivrée par", "CCI de Martinique"],
          ["Assurance RCP", "MMA IARD"],
          ["Détention de fonds", "L’agence n’est pas dépositaire de fonds. Le dépôt de garantie est versé directement au bailleur."],
        ]} />

        <SH n="02" t="OBJET DU MANDAT" />
        <Text style={s.body}>
          Le mandant confie au mandataire, qui accepte, la mission {(f.typeMandat || "exclusif").toLowerCase()}e de mettre en location le bien désigné
          à l’article 03, sous le régime {f.regimeLocatif}, et de signer le contrat de location au nom et pour le compte du mandant, dans les limites de l’article 06.
        </Text>
        <Text style={s.body}>
          La mission s’achève à la signature du bail et à l’état des lieux d’entrée, avec remise des clés au preneur.
        </Text>

        <SH n="03" t="DÉSIGNATION DU BIEN" />
        <KV rows={[
          ["Adresse", adresse],
          ["Référence cadastrale", f.refCadastrale],
          ["Nature", f.typeBien],
          ["Régime envisagé", f.regimeLocatif],
          ["Surface retenue", f.surfaceHabitable ? m2(f.surfaceHabitable) : ""],
          ["Composition", f.nbPieces],
          ["Commune", f.commune],
        ]} />
        {!!f.descriptionBien && <Text style={s.small}>{f.descriptionBien}</Text>}
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <SH n="04" t="CONDITIONS LOCATIVES RECHERCHÉES" />
        <KV rows={[
          ["Loyer", loyer ? `${money0(loyer)} par mois hors charges` : ""],
          ["Charges", f.chargesMensuelles ? `${money0(f.chargesMensuelles)} / mois` : "Eau et électricité à la charge exclusive du preneur. TEOM récupérable au réel."],
          ["Dépôt de garantie", loyer ? `Un (1) mois de loyer hors charges, soit ${money0(depot)}, versé directement au bailleur` : "Un mois de loyer hors charges, versé directement au bailleur"],
          ["Durée du bail", "Trois (3) ans, tacitement reconductible, bailleur personne physique"],
          ["Révision", "Annuelle selon l’IRL DOM publié par l’INSEE"],
        ]} />

        <SH n="05" t="DURÉE — EXCLUSIVITÉ — RÉSILIATION" />
        <KV rows={[
          ["Prise d’effet", f.dateDebut ? fd(f.dateDebut) : "À la date de signature électronique des présentes"],
          ["Durée initiale", `${f.dureeMois || 3} mois, ferme et déterminée`],
          ["Reconduction", "Possible par avenant écrit, pour une nouvelle période déterminée"],
        ]} />
        {f.typeMandat === "Exclusif" ? (
          <Text style={s.body}>
            Le présent mandat est consenti à titre exclusif. Pendant sa durée, le mandant s’interdit de confier
            le bien à un autre professionnel de l’immobilier, de le faire publier par une autre agence et de conclure
            un bail avec un candidat présenté par un tiers professionnel. Les candidatures reçues spontanément
            par le mandant sont transmises sans délai au mandataire. Toute location conclue en violation de la présente clause
            pendant la durée du mandat rend les honoraires du mandataire exigibles comme si l’opération avait été réalisée par ses soins.
          </Text>
        ) : (
          <Text style={s.body}>
            Le présent mandat est consenti à titre {(f.typeMandat || "simple").toLowerCase()}. Le mandant conserve la faculté de rechercher un locataire par ses propres moyens.
          </Text>
        )}
        <Text style={s.body}>
          Le mandant agissant hors de son activité professionnelle est informé qu’en cas de reconduction ou de durée
          supérieure à trois mois, chacune des parties pourra dénoncer le mandat à tout moment après l’expiration
          d’un délai de trois mois à compter de sa signature, en avisant l’autre partie quinze jours au moins à l’avance
          par lettre recommandée avec demande d’avis de réception.
        </Text>

        <SH n="06" t="POUVOIRS CONFÉRÉS AU MANDATAIRE" />
        <Text style={s.body}>
          Le mandant donne pouvoir au mandataire, agissant par {f.redacteur || "son gérant Luc-Olivier CLEMENTE"} ou toute personne habilitée,
          de commercialiser le bien, d’organiser les visites, d’instruire les dossiers et de conclure et signer, au nom et pour le compte du bailleur,
          le contrat de location ainsi que l’état des lieux d’entrée, dans les limites ci-après.
        </Text>
        <KV rows={[
          ["Loyer", loyer ? `${money0(loyer)} HC par mois. Tout loyer différent exige l’accord écrit préalable du mandant.` : ""],
          ["Durée", "Bail de 3 ans, résidence principale, reconduction tacite légale"],
          ["Dépôt de garantie", "Un mois de loyer HC, versé par le preneur directement au bailleur"],
          ["Remise des clés", "Autorisée après signature du bail, état des lieux d’entrée et justification de l’assurance habitation"],
        ]} />
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <SH n="07" t="ACTIONS DU MANDATAIRE ET COMPTE-RENDU" />
        <Text style={s.body}>Le mandataire s’engage à mettre en œuvre les actions suivantes :</Text>
        <View style={s.table}>
          <View style={s.row}>
            <Text style={[s.th, { width: "24%" }]}>Action</Text>
            <Text style={[s.th, { width: "44%" }]}>Modalités</Text>
            <Text style={[s.th, { width: "32%", borderRightWidth: 0 }]}>Délai</Text>
          </View>
          {[
            ["Dossier photo et annonce", "Rédaction, mise en ligne sur au moins deux portails", "Sous 7 jours"],
            ["Diffusion", "Portails, fichier demandeurs, réseau partenaires", "Continue pendant le mandat"],
            ["Visites", "Sur rendez-vous", "Selon la demande"],
            ["Instruction des dossiers", "Pièces d’identité, contrat, 3 bulletins, avis d’imposition", "Sous 5 jours ouvrés"],
            ["Compte-rendu", "Courriel : vues, contacts, visites, dossiers", "Tous les quinze jours"],
            ["Bail et EDL", "Projet, signature, état des lieux d’entrée", "Dès dossier retenu"],
          ].map((r, i, arr) => (
            <View key={r[0]} style={[s.row, i === arr.length - 1 ? { borderBottomWidth: 0 } : {}]}>
              <Text style={[s.td, { width: "24%" }]}>{r[0]}</Text>
              <Text style={[s.td, { width: "44%" }]}>{r[1]}</Text>
              <Text style={[s.td, { width: "32%", borderRightWidth: 0 }]}>{r[2]}</Text>
            </View>
          ))}
        </View>
        <Text style={s.small}>Le mandataire n’est pas tenu d’un résultat de location dans un délai déterminé. Il est tenu d’une obligation de moyens.</Text>

        <SH n="08" t="HONORAIRES" />
        <Text style={s.body}>
          Les honoraires sont exigibles uniquement si un contrat de location est effectivement conclu pendant la durée du mandat
          ou, dans les douze mois suivant son terme, avec un candidat auquel le bien a été présenté par le mandataire.
        </Text>
        {f.surfaceHabitable > 0 && (
          <Text style={s.body}>
            Surface de référence : {m2(f.surfaceHabitable)}. Plafonds 2026 de la part preneur en zone tendue :
            10,09 € TTC/m² (visite, dossier, bail) soit {money(h.capVisite)} et 3,03 € TTC/m² (état des lieux) soit {money(h.capEdl)}.
            La part du preneur ne peut excéder celle du bailleur pour chaque prestation.
          </Text>
        )}
        {honoraires > 0 && (
          <>
            <Text style={s.body}>
              Part bailleur : {money(h.bTotal)} TTC. Aucune remise n’est consentie au preneur : sa part est égale à celle du bailleur pour chaque prestation, dans la limite des plafonds.
            </Text>
            <View style={s.table}>
              <View style={s.row}>
                <Text style={[s.th, { width: "40%" }]}>Prestation</Text>
                <Text style={[s.th, { width: "20%" }]}>Total TTC</Text>
                <Text style={[s.th, { width: "20%" }]}>Bailleur</Text>
                <Text style={[s.th, { width: "20%", borderRightWidth: 0 }]}>Preneur</Text>
              </View>
              <View style={s.row}>
                <Text style={[s.td, { width: "40%" }]}>Visite, dossier et rédaction du bail</Text>
                <Text style={[s.td, { width: "20%" }]}>{money(h.bVisite + h.pVisite)}</Text>
                <Text style={[s.td, { width: "20%" }]}>{money(h.bVisite)}</Text>
                <Text style={[s.td, { width: "20%", borderRightWidth: 0 }]}>{money(h.pVisite)}</Text>
              </View>
              <View style={s.row}>
                <Text style={[s.td, { width: "40%" }]}>État des lieux d’entrée</Text>
                <Text style={[s.td, { width: "20%" }]}>{money(h.bEdl + h.pEdl)}</Text>
                <Text style={[s.td, { width: "20%" }]}>{money(h.bEdl)}</Text>
                <Text style={[s.td, { width: "20%", borderRightWidth: 0 }]}>{money(h.pEdl)}</Text>
              </View>
              <View style={[s.row, { borderBottomWidth: 0 }]}>
                <Text style={[s.td, { width: "40%" }]}>Total TTC</Text>
                <Text style={[s.td, { width: "20%" }]}>{money(h.bTotal + h.pTotal)}</Text>
                <Text style={[s.td, { width: "20%" }]}>{money(h.bTotal)}</Text>
                <Text style={[s.td, { width: "20%", borderRightWidth: 0 }]}>{money(h.pTotal)}</Text>
              </View>
            </View>
            <Text style={s.body}>
              Ces sommes comprennent la TVA applicable en Martinique (8,5 %). Elles sont exigibles le jour de la signature du bail.
            </Text>
          </>
        )}

        <SH n="09" t="OBLIGATIONS DES PARTIES" />
        <Text style={s.bullet}>•  Le mandant remet les clés de visite, les diagnostics à jour, et n’entrave pas les visites.</Text>
        <Text style={s.bullet}>•  Le mandataire exécute la mission avec diligence, loyauté et non-discrimination, et rend compte tous les quinze jours.</Text>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <SH n="10" t="GARANTIE DE RÉMUNÉRATION" />
        <Text style={s.body}>
          Les honoraires prévus à l’article 08 sont dus au mandataire si, pendant la durée du mandat ou dans les douze mois suivant son expiration,
          le bien est loué à une personne à laquelle il a été présenté par le mandataire, même si le bail est ensuite signé directement par le mandant.
          Ils sont également dus en cas de violation de la clause d’exclusivité.
        </Text>

        <SH n="11" t="FACULTÉ DE RÉTRACTATION" />
        <Text style={s.body}>
          Si le mandat est conclu hors établissement, le mandant dispose d’un délai de quatorze jours pour se rétracter, sans motif et sans pénalité.
          Le formulaire figure en annexe.
        </Text>
        <View style={s.box}>
          <Text style={s.body}>Exécution anticipée :  ☒  Je demande l’exécution immédiate du mandat avant la fin du délai de rétractation.</Text>
        </View>

        <SH n="12" t="LITIGES — ÉLECTION DE DOMICILE" />
        <Text style={s.body}>
          Les parties élisent domicile en leurs sièges et adresses respectifs. À défaut d’accord amiable, compétence est attribuée aux juridictions du ressort de Fort-de-France.
          Le contrat est conclu par voie électronique conformément aux articles 1366 et 1367 du Code civil.
        </Text>

        {!!f.observations && (<><SH n="13" t="OBSERVATIONS" /><Text style={s.body}>{f.observations}</Text></>)}

        <SH n="14" t="SIGNATURES" />
        <Text style={s.body}>
          Les soussignés reconnaissent avoir pris connaissance de l’intégralité du présent mandat, l’accepter sans réserve et le signer par voie électronique.
        </Text>
        <Text style={s.body}>Fait à {f.lieu || "Fort-de-France"}, le {fd(f.date)}.</Text>
        <View style={s.sigRow}>
          <View style={s.sigBox}>
            <Text style={s.lbl}>LE MANDANT</Text>
            <Text style={s.val}>{identite}</Text>
            <Text style={s.muted}>Propriétaire</Text>
            <Text style={s.muted}>Signature électronique</Text>
          </View>
          <View style={[s.sigBox, { marginRight: 0 }]}>
            <Text style={s.lbl}>LE MANDATAIRE</Text>
            <Text style={s.val}>Casa Caraïbes SARL</Text>
            <Text style={s.muted}>{f.redacteur || "Luc-Olivier CLEMENTE"}</Text>
            <Text style={s.muted}>Signature électronique</Text>
          </View>
        </View>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>ANNEXE A</Text>
        <Text style={s.title}>FORMULAIRE DE RÉTRACTATION</Text>
        <Text style={s.sub}>À n’utiliser que si le mandat a été conclu hors établissement</Text>
        <View style={s.box}>
          <Text style={s.body}>
            À l’attention de Casa Caraïbes SARL, 560 Impasse des Capucines, Apt 13 Bât. A, 97232 Le Lamentin.{"\n\n"}
            Je vous notifie par la présente ma rétractation du mandat {(f.typeMandat || "exclusif").toLowerCase()} de mise en location
            réf. {f.numero || "—"} concernant le bien sis {adresse || "—"}.{"\n\n"}
            Mandat signé le : ________________{"\n\n"}
            Nom du mandant : {identite || "—"}{"\n\n"}
            Date : ________________      Signature :
          </Text>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
