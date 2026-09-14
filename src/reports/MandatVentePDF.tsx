import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "./pdfFonts";
import logoSrc from "../assets/logo.png";
import type { MandatVenteFull, Mandant } from "../schemas/redacteur/mandatVenteFull.schema";
import { calcMandatVente, needsDPE } from "../schemas/redacteur/mandatVenteFull.schema";

const P = "#1A3A52";
const LINE = "#E4E4E0";
const INK = "#1A1A18";
const SUB = "#6B6B67";

const s = StyleSheet.create({
  page: { fontFamily: "Montserrat", fontSize: 9.5, color: INK, padding: "18mm 16mm 16mm" },
  logoBox: { alignItems: "center", marginBottom: 14, paddingBottom: 12, borderBottom: `1 solid ${LINE}` },
  docTitre: { fontSize: 18, fontFamily: "Montserrat", fontWeight: 700, color: INK, textAlign: "center", marginBottom: 3 },
  docNum: { fontSize: 11, fontFamily: "Montserrat", fontWeight: 700, color: P, textAlign: "center", marginBottom: 2 },
  docLieu: { fontSize: 9, color: SUB, textAlign: "center", fontStyle: "italic", marginBottom: 12 },
  partiesHead: { flexDirection: "row" },
  partiesHeadCell: { flex: 1, backgroundColor: P, padding: "6 10", alignItems: "center" },
  partiesHeadTxt: { color: "#fff", fontFamily: "Montserrat", fontWeight: 700, fontSize: 9, letterSpacing: 0.5 },
  name: { fontFamily: "Montserrat", fontWeight: 700, fontSize: 9.5, textAlign: "center", marginBottom: 3 },
  line: { fontSize: 8.5, color: SUB, textAlign: "center", lineHeight: 1.4 },
  articleTitle: { fontSize: 10.5, fontFamily: "Montserrat", fontWeight: 700, color: P, marginTop: 12, marginBottom: 5, borderLeft: `3 solid ${P}`, paddingLeft: 8 },
  body: { fontSize: 9.5, color: INK, lineHeight: 1.55, marginBottom: 5, textAlign: "justify" },
  bold: { fontFamily: "Montserrat", fontWeight: 700 },
  tableBox: { border: `0.5 solid ${LINE}`, marginVertical: 6 },
  tableRow: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, padding: "5 8" },
  tableRowLast: { flexDirection: "row", padding: "5 8" },
  tableLbl: { flex: 2, fontSize: 9, color: SUB },
  tableVal: { flex: 1, fontSize: 9.5, fontFamily: "Montserrat", fontWeight: 700, textAlign: "right" },
  footer: { position: "absolute", bottom: "9mm", left: "16mm", right: "16mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 5 },
  footerTxt: { fontSize: 7, color: SUB, textAlign: "center" },
  sigRow: { flexDirection: "row", marginTop: 16 },
  sigBox: { flex: 1, border: `0.5 solid ${LINE}`, padding: 10, marginHorizontal: 4, minHeight: 72, alignItems: "center" },
});

const E = (n: number) => `${String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0")} \u20ac`;
const fd = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "\u2026";
const fdShort = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR") : "\u2026";
const FOOTER = "Casa Cara\u00efbes SARL \u2014 RCS 928 647 981 \u2014 CPI 97212024000000007 \u2014 GALIAN \u2014 MMA IARD 120 137 405";

function MandantBlock({ m }: { m: Mandant }) {
  const name = [m.civilite, m.prenom, m.nom].filter(Boolean).join(" ");
  return (
    <View>
      <Text style={s.name}>{name || "\u2014"}</Text>
      {!!m.dateNaissance && <Text style={s.line}>N\u00e9(e) le {fdShort(m.dateNaissance)}</Text>}
      {!!m.adresse && <Text style={s.line}>{m.adresse}</Text>}
      {!!(m.codePostal || m.ville) && <Text style={s.line}>{m.codePostal} {m.ville}</Text>}
      {!!m.tel && <Text style={s.line}>T\u00e9l. {m.tel}</Text>}
      {!!m.email && <Text style={s.line}>{m.email}</Text>}
      <Text style={[s.line, { color: P, fontFamily: "Montserrat", fontWeight: 700, marginTop: 3 }]}>Qualit\u00e9 : {m.qualite}</Text>
    </View>
  );
}

export function MandatVentePDF({ f }: { f: MandatVenteFull }) {
  const c = calcMandatVente(f);
  const charge = f.chargeHonoraires === "vendeur" ? "vendeur" : "acqu\u00e9reur";
  const surface =
    f.surfaceCarrez || f.surfaceHabitable || f.surfaceTotale || f.surfaceFonciere || 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.logoBox}>
          <Image src={logoSrc} style={{ width: 150, height: 52, objectFit: "contain" }} />
        </View>
        <Text style={s.docTitre}>MANDAT DE VENTE</Text>
        <Text style={s.docNum}>N\u00b0 {f.numero || "\u2014"}</Text>
        <Text style={s.docLieu}>{f.lieu || "Fort-de-France"}, le {fd(f.date)}</Text>

        <View style={{ border: `0.5 solid ${LINE}`, marginBottom: 12 }}>
          <View style={s.partiesHead}>
            <View style={[s.partiesHeadCell, { borderRight: "0.5 solid rgba(255,255,255,0.3)" }]}>
              <Text style={s.partiesHeadTxt}>MANDANTS</Text>
            </View>
            <View style={s.partiesHeadCell}>
              <Text style={s.partiesHeadTxt}>MANDATAIRE</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1, padding: 10, borderRight: `0.5 solid ${LINE}` }}>
              {f.mandants.map((m, i) => (
                <View key={i} style={i > 0 ? { marginTop: 8, paddingTop: 8, borderTop: `0.5 solid ${LINE}` } : {}}>
                  <MandantBlock m={m} />
                </View>
              ))}
            </View>
            <View style={{ flex: 1, padding: 10 }}>
              <Text style={s.name}>Casa Cara\u00efbes SARL</Text>
              <Text style={s.line}>Repr\u00e9sent\u00e9e par {f.redacteur}</Text>
              <Text style={s.line}>RCS Fort-de-France 928 647 981</Text>
              <Text style={s.line}>CPI 97212024000000007</Text>
              <Text style={s.line}>Garantie GALIAN \u00b7 RCP MMA IARD</Text>
              <Text style={s.line}>+596 696 43 39 49</Text>
              <Text style={s.line}>contact@casacaraibes.com</Text>
            </View>
          </View>
        </View>

        <Text style={s.articleTitle}>ARTICLE 1 \u2014 OBJET ET D\u00c9SIGNATION DU BIEN</Text>
        <Text style={s.body}>Le Mandant confie \u00e0 Casa Cara\u00efbes le mandat de vendre le bien suivant :</Text>
        <Text style={s.body}><Text style={s.bold}>Adresse : </Text>{[f.residence, f.adresseBien].filter(Boolean).join(", ") || "\u2014"}</Text>
        <Text style={s.body}><Text style={s.bold}>Commune : </Text>{f.commune}{f.codePostal ? ` (${f.codePostal})` : ""}</Text>
        <Text style={s.body}><Text style={s.bold}>Type : </Text>{f.typeBien}{surface ? ` \u2014 ${surface} m\u00b2` : ""}{f.nbPieces ? ` \u2014 ${f.nbPieces}` : ""}</Text>
        {!!f.refCadastrale && <Text style={s.body}><Text style={s.bold}>Cadastrale : </Text>{f.refCadastrale}</Text>}
        {!!f.descriptionBien && <Text style={s.body}>{f.descriptionBien}</Text>}
        <Text style={s.body}><Text style={s.bold}>Occupation : </Text>{f.occupation === "Libre" ? "Bien libre \u00e0 la vente" : `Occup\u00e9 (${f.bailType}${f.nomLocataire ? ` \u2014 ${f.nomLocataire}` : ""})`}</Text>

        <Text style={s.articleTitle}>ARTICLE 1 BIS \u2014 DIAGNOSTICS</Text>
        <Text style={s.body}>
          Le Mandant est inform\u00e9 de l'obligation de constituer un DDT (DPE{needsDPE(f.typeBien) ? ` classe ${f.classeDPE || "\u00e0 r\u00e9aliser"}` : ""}, \u00e9tat termites \u2014 {f.etatTermites}, ERNMT, et diagnostics applicables).
          Diagnostiqueur : {f.diagnostiqueur || "\u00e0 d\u00e9signer"}. Frais \u00e0 la charge du vendeur.
        </Text>

        <Text style={s.articleTitle}>ARTICLE 2 \u2014 PRIX ET HONORAIRES</Text>
        <View style={s.tableBox}>
          <View style={[s.tableRow, { backgroundColor: P }]}>
            <Text style={{ flex: 2, color: "#fff", fontSize: 9, fontFamily: "Montserrat", fontWeight: 700 }}>D\u00e9signation</Text>
            <Text style={{ flex: 1, color: "#fff", fontSize: 9, fontFamily: "Montserrat", fontWeight: 700, textAlign: "right" }}>Montant</Text>
          </View>
          <View style={s.tableRow}>
            <Text style={s.tableLbl}>Prix de vente FAI</Text>
            <Text style={s.tableVal}>{E(f.prixFAI)}</Text>
          </View>
          <View style={s.tableRow}>
            <Text style={s.tableLbl}>Honoraires TTC ({f.honorairesPct}%)</Text>
            <Text style={s.tableVal}>{E(c.honorairesTTC)}</Text>
          </View>
          <View style={s.tableRowLast}>
            <Text style={[s.tableLbl, { fontFamily: "Montserrat", fontWeight: 700, color: INK }]}>Prix net vendeur</Text>
            <Text style={[s.tableVal, { color: P }]}>{E(c.prixNetVendeur)}</Text>
          </View>
        </View>
        <Text style={s.body}>
          Honoraires \u00e0 la charge du {charge}, exigibles \u00e0 la signature de l'acte authentique (loi Hoguet, art. 6).
        </Text>

        <View style={s.footer} fixed><Text style={s.footerTxt}>{FOOTER}</Text></View>
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.articleTitle}>ARTICLE 3 \u2014 TYPE ET DUR\u00c9E</Text>
        <Text style={s.body}>
          Mandat <Text style={s.bold}>{f.typeMandat}</Text>, n\u00b0 {f.numero || "\u2014"}, pour {f.dureeAns} an(s)
          {f.dateDebut ? ` \u00e0 compter du ${fdShort(f.dateDebut)}` : ""}
          {c.dateFin ? ` (\u00e9ch\u00e9ance {c.dateFin})` : ""}.
          {f.typeMandat === "Exclusif"
            ? " Pass\u00e9 trois mois, d\u00e9nonciation possible \u00e0 tout moment par LRAR avec pr\u00e9avis de quinze jours."
            : " Le Mandant conserve la facult\u00e9 de traiter en direct, sous r\u00e9serve d'en informer le Mandataire."}
        </Text>

        <Text style={s.articleTitle}>ARTICLE 4 \u2014 MISSIONS</Text>
        <Text style={s.body}>
          Diffusion de l'annonce{f.avecPanneau ? ", pose de panneau" : ""}{f.avecInterAgence ? ", inter-agence" : ""},
          organisation des visites, n\u00e9gociation des offres, accompagnement jusqu'\u00e0 l'acte authentique.
          {f.avecSousMandat ? " Sous-mandat autoris\u00e9." : ""}
        </Text>

        <Text style={s.articleTitle}>ARTICLE 5 \u2014 OBLIGATIONS DU MANDANT</Text>
        <Text style={s.body}>
          Le Mandant s'engage \u00e0 fournir les diagnostics, \u00e0 faciliter les visites et \u00e0 ne pas conclure de vente
          {f.typeMandat === "Exclusif" ? " hors l'entremise du Mandataire pendant l'exclusivit\u00e9" : " avec un acqu\u00e9reur pr\u00e9sent\u00e9 par l'agence sans en informer le Mandataire"}.
        </Text>

        <Text style={s.articleTitle}>ARTICLE 6 \u2014 R\u00c9TRACTATION</Text>
        <Text style={s.body}>
          En cas de conclusion hors \u00e9tablissement, d\u00e9lai de r\u00e9tractation de quatorze jours (art. L.221-18 Code de la consommation).
        </Text>

        {!!f.observations && (
          <>
            <Text style={s.articleTitle}>ARTICLE 7 \u2014 OBSERVATIONS</Text>
            <Text style={s.body}>{f.observations}</Text>
          </>
        )}

        <Text style={s.articleTitle}>SIGNATURES</Text>
        <Text style={s.body}>Fait \u00e0 {f.lieu || "Fort-de-France"}, le {fd(f.date)}, en deux exemplaires.</Text>
        <View style={s.sigRow}>
          <View style={s.sigBox}>
            <Text style={[s.line, { fontFamily: "Montserrat", fontWeight: 700, color: SUB }]}>LES MANDANTS</Text>
            {f.mandants.slice(0, 2).map((m, i) => (
              <Text key={i} style={s.name}>{[m.civilite, m.prenom, m.nom].filter(Boolean).join(" ")}</Text>
            ))}
            <Text style={[s.line, { marginTop: 16 }]}>Signature</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={[s.line, { fontFamily: "Montserrat", fontWeight: 700, color: SUB }]}>LE MANDATAIRE</Text>
            <Text style={s.name}>Casa Cara\u00efbes SARL</Text>
            <Text style={s.line}>{f.redacteur}</Text>
            <Text style={[s.line, { marginTop: 16 }]}>Signature</Text>
          </View>
        </View>
        <View style={s.footer} fixed><Text style={s.footerTxt}>{FOOTER}</Text></View>
      </Page>
    </Document>
  );
}
