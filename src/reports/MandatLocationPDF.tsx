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
  `${(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\s/g, "\u00A0")} \u20ac`;
const money0 = (n: number) =>
  `${Math.round(n || 0).toLocaleString("fr-FR").replace(/\s/g, "\u00A0")} \u20ac`;
const fd = (d: string) =>
  d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "\u2014";
const m2 = (n: number) => `${String(n).replace(".", ",")} m\u00b2`;

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.foot}>Casa Cara\u00efbes SARL  \u2014  RCS Fort-de-France 928 647 981  \u2014  Document confidentiel</Text>
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
        <Text style={s.kicker}>CASA CARA\u00cfBES  \u2014  AGENCE IMMOBILI\u00c8RE</Text>
        <Text style={s.title}>MANDAT {titreType}</Text>
        <Text style={s.title}>DE MISE EN LOCATION</Text>
        <Text style={s.sub}>{f.regimeLocatif || "Location longue dur\u00e9e nue  \u00b7  Loi du 6 juillet 1989"}</Text>
        <Text style={s.sub}>{[f.typeBien, adresse].filter(Boolean).join("  \u2014  ")}</Text>
        {!!f.refCadastrale && <Text style={s.meta}>{f.refCadastrale}</Text>}
        <View style={s.parties}>
          <View style={s.partie}>
            <Text style={s.lbl}>MANDANT</Text>
            <Text style={s.val}>{mandantCourt || "\u2014"}</Text>
            <Text style={s.muted}>{m?.ville || f.commune || "Martinique"}</Text>
          </View>
          <View style={[s.partie, { borderLeftWidth: 0 }]}>
            <Text style={s.lbl}>MANDATAIRE</Text>
            <Text style={s.val}>Casa Cara\u00efbes SARL</Text>
            <Text style={s.muted}>Agence immobili\u00e8re \u2014 Martinique</Text>
          </View>
        </View>
        <KV rows={[
          ["N\u00b0 d\u2019enregistrement au registre des mandats", f.numero || ""],
          ["Nature", `Mandat ${ (f.typeMandat || "exclusif").toLowerCase() } de mise en location, avec pouvoir de signer le bail au nom du bailleur`],
          ["Dur\u00e9e", `${f.dureeMois || 3} mois \u00e0 compter de la signature`],
          ["Loyer recherch\u00e9", loyer ? `${money0(loyer)} par mois hors charges` : ""],
          ["Document \u00e9tabli le", fd(f.date)],
        ]} />
        <Text style={s.small}>
          Document \u00e9tabli conform\u00e9ment \u00e0 la loi n\u00b0 70-9 du 2 janvier 1970 (loi Hoguet),
          au d\u00e9cret n\u00b0 72-678 du 20 juillet 1972, \u00e0 la loi n\u00b0 2014-366 du 24 mars 2014 (ALUR)
          et \u00e0 l\u2019article 5 de la loi n\u00b0 89-462 du 6 juillet 1989. Le mandataire est habilit\u00e9 \u00e0
          signer le bail au nom du bailleur dans les limites de l\u2019article 06.
        </Text>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <SH n="01" t="D\u00c9SIGNATION DES PARTIES" />
        <Text style={s.h3}>Le mandant (bailleur)</Text>
        <KV rows={[
          ["Identit\u00e9", identite],
          ["N\u00e9(e) le", m?.dateNaissance || ""],
          ["Demeurant", [m?.adresse, m?.codePostal, m?.ville].filter(Boolean).join(", ")],
          ["Qualit\u00e9", m?.qualite || "Personne physique, propri\u00e9taire du bien d\u00e9sign\u00e9 ci-apr\u00e8s"],
        ]} />
        <Text style={s.small}>
          Le mandant d\u00e9clare \u00eatre pleinement habilit\u00e9 \u00e0 disposer du bien et \u00e0 en confier la mise en location.
        </Text>
        <Text style={s.h3}>Le mandataire</Text>
        <KV rows={[
          ["Agence", "Casa Cara\u00efbes SARL"],
          ["Immatriculation", "RCS Fort-de-France 928 647 981  \u2014  SIRET 928 647 981 00010"],
          ["TVA", "FR68 928 647 981  \u2014  TVA applicable en Martinique : 8,5 %"],
          ["Si\u00e8ge", "560 Impasse des Capucines, Apt 13 B\u00e2t. A, 97232 Le Lamentin"],
          ["G\u00e9rant habilit\u00e9", f.redacteur || "Monsieur Luc-Olivier CLEMENTE"],
          ["Carte professionnelle", "CPI 97212024000000007 \u2014 Transaction sur immeubles et fonds de commerce"],
          ["D\u00e9livr\u00e9e par", "CCI de Martinique"],
          ["Assurance RCP", "MMA IARD"],
          ["D\u00e9tention de fonds", "L\u2019agence n\u2019est pas d\u00e9positaire de fonds. Le d\u00e9p\u00f4t de garantie est vers\u00e9 directement au bailleur."],
        ]} />

        <SH n="02" t="OBJET DU MANDAT" />
        <Text style={s.body}>
          Le mandant confie au mandataire, qui accepte, la mission {(f.typeMandat || "exclusif").toLowerCase()}e de mettre en location le bien d\u00e9sign\u00e9
          \u00e0 l\u2019article 03, sous le r\u00e9gime {f.regimeLocatif}, et de signer le contrat de location au nom et pour le compte du mandant, dans les limites de l\u2019article 06.
        </Text>
        <Text style={s.body}>
          La mission s\u2019ach\u00e8ve \u00e0 la signature du bail et \u00e0 l\u2019\u00e9tat des lieux d\u2019entr\u00e9e, avec remise des cl\u00e9s au preneur.
        </Text>

        <SH n="03" t="D\u00c9SIGNATION DU BIEN" />
        <KV rows={[
          ["Adresse", adresse],
          ["R\u00e9f\u00e9rence cadastrale", f.refCadastrale],
          ["Nature", f.typeBien],
          ["R\u00e9gime envisag\u00e9", f.regimeLocatif],
          ["Surface retenue", f.surfaceHabitable ? m2(f.surfaceHabitable) : ""],
          ["Composition", f.nbPieces],
          ["Commune", f.commune],
        ]} />
        {!!f.descriptionBien && <Text style={s.small}>{f.descriptionBien}</Text>}
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <SH n="04" t="CONDITIONS LOCATIVES RECHERCH\u00c9ES" />
        <KV rows={[
          ["Loyer", loyer ? `${money0(loyer)} par mois hors charges` : ""],
          ["Charges", f.chargesMensuelles ? `${money0(f.chargesMensuelles)} / mois` : "Eau et \u00e9lectricit\u00e9 \u00e0 la charge exclusive du preneur. TEOM r\u00e9cup\u00e9rable au r\u00e9el."],
          ["D\u00e9p\u00f4t de garantie", loyer ? `Un (1) mois de loyer hors charges, soit ${money0(depot)}, vers\u00e9 directement au bailleur` : "Un mois de loyer hors charges, vers\u00e9 directement au bailleur"],
          ["Dur\u00e9e du bail", "Trois (3) ans, tacitement reconductible, bailleur personne physique"],
          ["R\u00e9vision", "Annuelle selon l\u2019IRL DOM publi\u00e9 par l\u2019INSEE"],
        ]} />

        <SH n="05" t="DUR\u00c9E \u2014 EXCLUSIVIT\u00c9 \u2014 R\u00c9SILIATION" />
        <KV rows={[
          ["Prise d\u2019effet", f.dateDebut ? fd(f.dateDebut) : "\u00c0 la date de signature \u00e9lectronique des pr\u00e9sentes"],
          ["Dur\u00e9e initiale", `${f.dureeMois || 3} mois, ferme et d\u00e9termin\u00e9e`],
          ["Reconduction", "Possible par avenant \u00e9crit, pour une nouvelle p\u00e9riode d\u00e9termin\u00e9e"],
        ]} />
        {f.typeMandat === "Exclusif" ? (
          <Text style={s.body}>
            Le pr\u00e9sent mandat est consenti \u00e0 titre exclusif. Pendant sa dur\u00e9e, le mandant s\u2019interdit de confier
            le bien \u00e0 un autre professionnel de l\u2019immobilier, de le faire publier par une autre agence et de conclure
            un bail avec un candidat pr\u00e9sent\u00e9 par un tiers professionnel. Les candidatures re\u00e7ues spontan\u00e9ment
            par le mandant sont transmises sans d\u00e9lai au mandataire. Toute location conclue en violation de la pr\u00e9sente clause
            pendant la dur\u00e9e du mandat rend les honoraires du mandataire exigibles comme si l\u2019op\u00e9ration avait \u00e9t\u00e9 r\u00e9alis\u00e9e par ses soins.
          </Text>
        ) : (
          <Text style={s.body}>
            Le pr\u00e9sent mandat est consenti \u00e0 titre {(f.typeMandat || "simple").toLowerCase()}. Le mandant conserve la facult\u00e9 de rechercher un locataire par ses propres moyens.
          </Text>
        )}
        <Text style={s.body}>
          Le mandant agissant hors de son activit\u00e9 professionnelle est inform\u00e9 qu\u2019en cas de reconduction ou de dur\u00e9e
          sup\u00e9rieure \u00e0 trois mois, chacune des parties pourra d\u00e9noncer le mandat \u00e0 tout moment apr\u00e8s l\u2019expiration
          d\u2019un d\u00e9lai de trois mois \u00e0 compter de sa signature, en avisant l\u2019autre partie quinze jours au moins \u00e0 l\u2019avance
          par lettre recommand\u00e9e avec demande d\u2019avis de r\u00e9ception.
        </Text>

        <SH n="06" t="POUVOIRS CONF\u00c9R\u00c9S AU MANDATAIRE" />
        <Text style={s.body}>
          Le mandant donne pouvoir au mandataire, agissant par {f.redacteur || "son g\u00e9rant Luc-Olivier CLEMENTE"} ou toute personne habilit\u00e9e,
          de commercialiser le bien, d\u2019organiser les visites, d\u2019instruire les dossiers et de conclure et signer, au nom et pour le compte du bailleur,
          le contrat de location ainsi que l\u2019\u00e9tat des lieux d\u2019entr\u00e9e, dans les limites ci-apr\u00e8s.
        </Text>
        <KV rows={[
          ["Loyer", loyer ? `${money0(loyer)} HC par mois. Tout loyer diff\u00e9rent exige l\u2019accord \u00e9crit pr\u00e9alable du mandant.` : ""],
          ["Dur\u00e9e", "Bail de 3 ans, r\u00e9sidence principale, reconduction tacite l\u00e9gale"],
          ["D\u00e9p\u00f4t de garantie", "Un mois de loyer HC, vers\u00e9 par le preneur directement au bailleur"],
          ["Remise des cl\u00e9s", "Autoris\u00e9e apr\u00e8s signature du bail, \u00e9tat des lieux d\u2019entr\u00e9e et justification de l\u2019assurance habitation"],
        ]} />
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <SH n="07" t="ACTIONS DU MANDATAIRE ET COMPTE-RENDU" />
        <Text style={s.body}>Le mandataire s\u2019engage \u00e0 mettre en \u0153uvre les actions suivantes :</Text>
        <View style={s.table}>
          <View style={s.row}>
            <Text style={[s.th, { width: "24%" }]}>Action</Text>
            <Text style={[s.th, { width: "44%" }]}>Modalit\u00e9s</Text>
            <Text style={[s.th, { width: "32%", borderRightWidth: 0 }]}>D\u00e9lai</Text>
          </View>
          {[
            ["Dossier photo et annonce", "R\u00e9daction, mise en ligne sur au moins deux portails", "Sous 7 jours"],
            ["Diffusion", "Portails, fichier demandeurs, r\u00e9seau partenaires", "Continue pendant le mandat"],
            ["Visites", "Sur rendez-vous", "Selon la demande"],
            ["Instruction des dossiers", "Pi\u00e8ces d\u2019identit\u00e9, contrat, 3 bulletins, avis d\u2019imposition", "Sous 5 jours ouvr\u00e9s"],
            ["Compte-rendu", "Courriel : vues, contacts, visites, dossiers", "Tous les quinze jours"],
            ["Bail et EDL", "Projet, signature, \u00e9tat des lieux d\u2019entr\u00e9e", "D\u00e8s dossier retenu"],
          ].map((r, i, arr) => (
            <View key={r[0]} style={[s.row, i === arr.length - 1 ? { borderBottomWidth: 0 } : {}]}>
              <Text style={[s.td, { width: "24%" }]}>{r[0]}</Text>
              <Text style={[s.td, { width: "44%" }]}>{r[1]}</Text>
              <Text style={[s.td, { width: "32%", borderRightWidth: 0 }]}>{r[2]}</Text>
            </View>
          ))}
        </View>
        <Text style={s.small}>Le mandataire n\u2019est pas tenu d\u2019un r\u00e9sultat de location dans un d\u00e9lai d\u00e9termin\u00e9. Il est tenu d\u2019une obligation de moyens.</Text>

        <SH n="08" t="HONORAIRES" />
        <Text style={s.body}>
          Les honoraires sont exigibles uniquement si un contrat de location est effectivement conclu pendant la dur\u00e9e du mandat
          ou, dans les douze mois suivant son terme, avec un candidat auquel le bien a \u00e9t\u00e9 pr\u00e9sent\u00e9 par le mandataire.
        </Text>
        {f.surfaceHabitable > 0 && (
          <Text style={s.body}>
            Surface de r\u00e9f\u00e9rence : {m2(f.surfaceHabitable)}. Plafonds 2026 de la part preneur en zone tendue :
            10,09 \u20ac TTC/m\u00b2 (visite, dossier, bail) soit {money(h.capVisite)} et 3,03 \u20ac TTC/m\u00b2 (\u00e9tat des lieux) soit {money(h.capEdl)}.
            La part du preneur ne peut exc\u00e9der celle du bailleur pour chaque prestation.
          </Text>
        )}
        {honoraires > 0 && (
          <>
            <Text style={s.body}>
              Part bailleur : {money(h.bTotal)} TTC. Aucune remise n\u2019est consentie au preneur : sa part est \u00e9gale \u00e0 celle du bailleur pour chaque prestation, dans la limite des plafonds.
            </Text>
            <View style={s.table}>
              <View style={s.row}>
                <Text style={[s.th, { width: "40%" }]}>Prestation</Text>
                <Text style={[s.th, { width: "20%" }]}>Total TTC</Text>
                <Text style={[s.th, { width: "20%" }]}>Bailleur</Text>
                <Text style={[s.th, { width: "20%", borderRightWidth: 0 }]}>Preneur</Text>
              </View>
              <View style={s.row}>
                <Text style={[s.td, { width: "40%" }]}>Visite, dossier et r\u00e9daction du bail</Text>
                <Text style={[s.td, { width: "20%" }]}>{money(h.bVisite + h.pVisite)}</Text>
                <Text style={[s.td, { width: "20%" }]}>{money(h.bVisite)}</Text>
                <Text style={[s.td, { width: "20%", borderRightWidth: 0 }]}>{money(h.pVisite)}</Text>
              </View>
              <View style={s.row}>
                <Text style={[s.td, { width: "40%" }]}>\u00c9tat des lieux d\u2019entr\u00e9e</Text>
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
        <Text style={s.bullet}>\u2022  Le mandant remet les cl\u00e9s de visite, les diagnostics \u00e0 jour, et n\u2019entrave pas les visites.</Text>
        <Text style={s.bullet}>\u2022  Le mandataire ex\u00e9cute la mission avec diligence, loyaut\u00e9 et non-discrimination, et rend compte tous les quinze jours.</Text>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <SH n="10" t="GARANTIE DE R\u00c9MUN\u00c9RATION" />
        <Text style={s.body}>
          Les honoraires pr\u00e9vus \u00e0 l\u2019article 08 sont dus au mandataire si, pendant la dur\u00e9e du mandat ou dans les douze mois suivant son expiration,
          le bien est lou\u00e9 \u00e0 une personne \u00e0 laquelle il a \u00e9t\u00e9 pr\u00e9sent\u00e9 par le mandataire, m\u00eame si le bail est ensuite sign\u00e9 directement par le mandant.
          Ils sont \u00e9galement dus en cas de violation de la clause d\u2019exclusivit\u00e9.
        </Text>

        <SH n="11" t="FACULT\u00c9 DE R\u00c9TRACTATION" />
        <Text style={s.body}>
          Si le mandat est conclu hors \u00e9tablissement, le mandant dispose d\u2019un d\u00e9lai de quatorze jours pour se r\u00e9tracter, sans motif et sans p\u00e9nalit\u00e9.
          Le formulaire figure en annexe.
        </Text>
        <View style={s.box}>
          <Text style={s.body}>Ex\u00e9cution anticip\u00e9e :  \u2612  Je demande l\u2019ex\u00e9cution imm\u00e9diate du mandat avant la fin du d\u00e9lai de r\u00e9tractation.</Text>
        </View>

        <SH n="12" t="LITIGES \u2014 \u00c9LECTION DE DOMICILE" />
        <Text style={s.body}>
          Les parties \u00e9lisent domicile en leurs si\u00e8ges et adresses respectifs. \u00c0 d\u00e9faut d\u2019accord amiable, comp\u00e9tence est attribu\u00e9e aux juridictions du ressort de Fort-de-France.
          Le contrat est conclu par voie \u00e9lectronique conform\u00e9ment aux articles 1366 et 1367 du Code civil.
        </Text>

        {!!f.observations && (<><SH n="13" t="OBSERVATIONS" /><Text style={s.body}>{f.observations}</Text></>)}

        <SH n="14" t="SIGNATURES" />
        <Text style={s.body}>
          Les soussign\u00e9s reconnaissent avoir pris connaissance de l\u2019int\u00e9gralit\u00e9 du pr\u00e9sent mandat, l\u2019accepter sans r\u00e9serve et le signer par voie \u00e9lectronique.
        </Text>
        <Text style={s.body}>Fait \u00e0 {f.lieu || "Fort-de-France"}, le {fd(f.date)}.</Text>
        <View style={s.sigRow}>
          <View style={s.sigBox}>
            <Text style={s.lbl}>LE MANDANT</Text>
            <Text style={s.val}>{identite}</Text>
            <Text style={s.muted}>Propri\u00e9taire</Text>
            <Text style={s.muted}>Signature \u00e9lectronique</Text>
          </View>
          <View style={[s.sigBox, { marginRight: 0 }]}>
            <Text style={s.lbl}>LE MANDATAIRE</Text>
            <Text style={s.val}>Casa Cara\u00efbes SARL</Text>
            <Text style={s.muted}>{f.redacteur || "Luc-Olivier CLEMENTE"}</Text>
            <Text style={s.muted}>Signature \u00e9lectronique</Text>
          </View>
        </View>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>ANNEXE A</Text>
        <Text style={s.title}>FORMULAIRE DE R\u00c9TRACTATION</Text>
        <Text style={s.sub}>\u00c0 n\u2019utiliser que si le mandat a \u00e9t\u00e9 conclu hors \u00e9tablissement</Text>
        <View style={s.box}>
          <Text style={s.body}>
            \u00c0 l\u2019attention de Casa Cara\u00efbes SARL, 560 Impasse des Capucines, Apt 13 B\u00e2t. A, 97232 Le Lamentin.{"\n\n"}
            Je vous notifie par la pr\u00e9sente ma r\u00e9tractation du mandat {(f.typeMandat || "exclusif").toLowerCase()} de mise en location
            r\u00e9f. {f.numero || "\u2014"} concernant le bien sis {adresse || "\u2014"}.{"\n\n"}
            Mandat sign\u00e9 le : ________________{"\n\n"}
            Nom du mandant : {identite || "\u2014"}{"\n\n"}
            Date : ________________      Signature :
          </Text>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
