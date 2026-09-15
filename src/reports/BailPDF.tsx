import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "./pdfFonts";
import type { Bail, PartieBail } from "../schemas/bail.schema";
import { articlesBail, loyerCc, titreBail, sousTitreLegal } from "../schemas/bail.schema";
import logo from "../assets/logo.png";

const NAVY = "#1A3A52";
const LINE = "#D8D4CC";
const INK = "#1A1A18";
const SUB = "#5B5B57";
const MUTED = "#8A8A86";

const s = StyleSheet.create({
  page: { fontFamily: "Montserrat", fontSize: 9.5, color: INK, padding: "16mm 16mm 18mm" },
  coverPage: { fontFamily: "Montserrat", color: INK, padding: "22mm 20mm 18mm", alignItems: "center" },
  logo: { width: 160, height: 54, objectFit: "contain", marginBottom: 18 },
  hair: { width: "42%", height: 0.9, backgroundColor: NAVY, marginBottom: 16 },
  kicker: { fontSize: 8, fontFamily: "Montserrat", fontWeight: 700, color: SUB, letterSpacing: 2, marginBottom: 8 },
  coverTitle: { fontSize: 16, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, textAlign: "center", letterSpacing: 1.1, lineHeight: 1.35 },
  coverSub: { fontSize: 9.5, color: SUB, textAlign: "center", marginTop: 8, lineHeight: 1.4 },
  coverPlace: { fontSize: 10, color: INK, textAlign: "center", marginTop: 12 },
  parties: { flexDirection: "row", width: "100%", marginTop: 22, border: `0.8 solid ${LINE}` },
  partie: { flex: 1, padding: "10 12" },
  partieR: { flex: 1, padding: "10 12", borderLeft: `0.8 solid ${LINE}` },
  partieLbl: { fontSize: 8, fontFamily: "Montserrat", fontWeight: 700, color: SUB, letterSpacing: 0.7, marginBottom: 5 },
  partieVal: { fontSize: 10, fontFamily: "Montserrat", fontWeight: 700, color: INK },
  partieSub: { fontSize: 8.5, color: SUB, marginTop: 2 },
  meta: { fontSize: 9, color: SUB, marginTop: 14 },
  sec: { fontSize: 10.5, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, marginTop: 10, marginBottom: 3 },
  secLine: { height: 1.1, backgroundColor: NAVY, marginBottom: 6 },
  body: { fontSize: 9.5, color: INK, lineHeight: 1.5, textAlign: "justify", marginBottom: 6 },
  row: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}` },
  lab: { width: "38%", fontSize: 9, fontFamily: "Montserrat", fontWeight: 700, color: INK, padding: "4 6", backgroundColor: "#FAFAF8" },
  val: { width: "62%", fontSize: 9, color: INK, padding: "4 6" },
  box: { backgroundColor: "#F3EEE4", border: `0.8 solid ${LINE}`, padding: "10 12", alignItems: "center", marginVertical: 8 },
  boxLbl: { fontSize: 8, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, letterSpacing: 0.8, marginBottom: 4 },
  boxNum: { fontSize: 16, fontFamily: "Montserrat", fontWeight: 700, color: NAVY },
  boxSub: { fontSize: 9, color: INK, marginTop: 3 },
  sigWrap: { marginTop: 14, flexDirection: "row" },
  sigBox: { flex: 1, border: `0.8 solid ${LINE}`, padding: "10 8", minHeight: 88, marginHorizontal: 4, alignItems: "center" },
  sigLbl: { fontSize: 8, fontFamily: "Montserrat", fontWeight: 700, color: SUB },
  sigName: { fontSize: 9.5, fontFamily: "Montserrat", fontWeight: 700, color: INK, marginTop: 4, textAlign: "center" },
  sigHint: { fontSize: 8, color: MUTED, fontStyle: "italic", marginTop: 16 },
  footer: { position: "absolute", bottom: "10mm", left: "16mm", right: "16mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 5, flexDirection: "row", justifyContent: "space-between" },
  footerTxt: { fontSize: 7, color: MUTED },
});

const fd = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "\u2014";
const eur = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR").replace(/\s/g, "\u00A0")} \u20ac`;

function nom(p: { civilite: string; prenom: string; nom: string }) {
  return [p.civilite, p.prenom, p.nom].filter(Boolean).join(" ") || "\u2014";
}

function Row({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (<View style={s.row}><Text style={s.lab}>{k}</Text><Text style={s.val}>{v}</Text></View>);
}

function Sig({ label, p }: { label: string; p?: PartieBail }) {
  return (
    <View style={s.sigBox}>
      <Text style={s.sigLbl}>{label}</Text>
      <Text style={s.sigName}>{p ? nom(p) : "\u2014"}</Text>
      <Text style={s.sigHint}>Signature</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>Casa Cara\u00efbes SARL \u2014 CPI 97212024000000007 \u2014 Le Lamentin \u2014 Confidentiel</Text>
      <Text style={s.footerTxt} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function BailPDF({ e }: { e: Bail }) {
  const arts = articlesBail(e);
  const bailleurs = e.bailleurs.filter((p) => p.nom || p.prenom);
  const preneurs = e.preneurs.filter((p) => p.nom || p.prenom);
  const bailleur = bailleurs[0] ?? e.bailleurs[0];
  const preneur = preneurs[0] ?? e.preneurs[0];
  const extraB = bailleurs.slice(1).map(nom).join(" \u00b7 ");
  const extraP = preneurs.slice(1).map(nom).join(" \u00b7 ");
  const cadastre = [e.sectionCadastrale && `Section ${e.sectionCadastrale}`, e.parcelle && `Parcelle ${e.parcelle}`].filter(Boolean).join(" \u2014 ");
  const surf = [e.surfaceHabitable ? `${String(e.surfaceHabitable).replace(".", ",")} m\u00b2` : "", e.nbPieces, e.etage].filter(Boolean).join(" \u2014 ");
  const dpe = [e.dpeClasse && `\u00c9nergie ${e.dpeClasse}`, e.gesClasse && `GES ${e.gesClasse}`].filter(Boolean).join(" \u2014 ");

  return (
    <Document>
      <Page size="A4" style={s.coverPage}>
        <Image src={logo} style={s.logo} />
        <View style={s.hair} />
        <Text style={s.kicker}>CASA CARA\u00cfBES \u2014 AGENCE IMMOBILI\u00c8RE</Text>
        <Text style={s.coverTitle}>{titreBail(e.typeBail)}</Text>
        <Text style={s.coverSub}>{sousTitreLegal(e.typeBail)}</Text>
        {!!e.numero && <Text style={s.coverSub}>N\u00b0 {e.numero}</Text>}
        {!!(e.adresseBien || e.commune) && (
          <Text style={s.coverPlace}>{[e.adresseBien, `${e.codePostal} ${e.commune}`].filter(Boolean).join(" \u2014 ")}</Text>
        )}
        <View style={s.parties}>
          <View style={s.partie}>
            <Text style={s.partieLbl}>{bailleurs.length > 1 ? "BAILLEURS" : "BAILLEUR"}</Text>
            <Text style={s.partieVal}>{bailleur ? nom(bailleur) : "\u2014"}</Text>
            {!!bailleur?.ville && <Text style={s.partieSub}>{bailleur.ville}</Text>}
            {!!extraB && <Text style={s.partieSub}>{extraB}</Text>}
          </View>
          <View style={s.partieR}>
            <Text style={s.partieLbl}>{preneurs.length > 1 ? "PRENEURS" : "PRENEUR"}</Text>
            <Text style={s.partieVal}>{preneur ? nom(preneur) : "\u2014"}</Text>
            {!!preneur?.ville && <Text style={s.partieSub}>{preneur.ville}</Text>}
            {!!extraP && <Text style={s.partieSub}>{extraP}</Text>}
          </View>
        </View>
        {e.garant && (e.garant.nom || e.garant.prenom) ? (
          <Text style={s.meta}>Caution : {nom(e.garant)}</Text>
        ) : null}
        <Text style={s.meta}>\u00c9tabli \u00e0 {e.lieuSignature || "Le Lamentin"}, le {fd(e.dateDocument)} \u2014 {e.agenceNom}</Text>
      </Page>
      <Page size="A4" style={s.page}>
        <Text style={s.sec}>D\u00e9signation du bien</Text>
        <View style={s.secLine} />
        <Row k="Type" v={e.typeBien} />
        <Row k="Adresse" v={[e.adresseBien, `${e.codePostal} ${e.commune}`].filter(Boolean).join(", ")} />
        <Row k="Cadastre" v={cadastre} />
        <Row k="Surface / pi\u00e8ces" v={surf} />
        <Row k="P\u00e9riode" v={`${fd(e.dateDebut)} \u2192 ${fd(e.dateFin)}${e.dureeMois ? ` (${e.dureeMois} mois)` : ""}`} />
        <Row k="Annexes" v={e.annexes} />
        <Row k="DPE / GES" v={dpe} />
        {e.loyerHc > 0 && (
          <View style={s.box}>
            <Text style={s.boxLbl}>LOYER MENSUEL</Text>
            <Text style={s.boxNum}>{eur(e.loyerHc)} HC</Text>
            <Text style={s.boxSub}>soit {eur(loyerCc(e))} CC{e.depotGarantie > 0 ? ` \u2014 d\u00e9p\u00f4t ${eur(e.depotGarantie)}` : ""}</Text>
          </View>
        )}
        {e.bailleurs.map((p, i) => (
          <Text key={p.id} style={s.body}>
            Bailleur{e.bailleurs.length > 1 ? ` ${i + 1}` : ""} : {nom(p)}
            {p.dateNaissance ? `, n\u00e9(e) le ${fd(p.dateNaissance)}` : ""}
            {p.adresse ? `, demeurant ${[p.adresse, p.codePostal, p.ville].filter(Boolean).join(" ")}` : ""}.
          </Text>
        ))}
        {e.preneurs.map((p, i) => (
          <Text key={p.id} style={s.body}>
            Preneur{e.preneurs.length > 1 ? ` ${i + 1}` : ""} : {nom(p)}
            {p.dateNaissance ? `, n\u00e9(e) le ${fd(p.dateNaissance)}` : ""}
            {p.adresse ? `, demeurant ${[p.adresse, p.codePostal, p.ville].filter(Boolean).join(" ")}` : ""}.
          </Text>
        ))}
        <Footer />
      </Page>
      <Page size="A4" style={s.page}>
        {arts.map((a) => (
          <View key={a.titre}>
            <Text style={s.sec}>{a.titre}</Text>
            <View style={s.secLine} />
            <Text style={s.body}>{a.corps}</Text>
          </View>
        ))}
        {!!e.observations?.trim() && <Text style={s.body}>{e.observations}</Text>}
        <Text style={s.body}>Fait \u00e0 {e.lieuSignature || "Le Lamentin"}, le {fd(e.dateDocument)}, en autant d'exemplaires que de parties.</Text>
        <View style={s.sigWrap}>
          <Sig label={bailleurs.length > 1 ? "LES BAILLEURS" : "LE BAILLEUR"} p={bailleur} />
          <Sig label={preneurs.length > 1 ? "LES PRENEURS" : "LE PRENEUR"} p={preneur} />
        </View>
        {e.garant && (e.garant.nom || e.garant.prenom) ? (
          <View style={s.sigWrap}>
            <Sig label="LA CAUTION" p={e.garant} />
            <View style={{ flex: 1, marginHorizontal: 4 }} />
          </View>
        ) : null}
        <Footer />
      </Page>
    </Document>
  );
}
