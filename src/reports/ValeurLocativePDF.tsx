import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "./pdfFonts";
import type { ValeurLocative } from "../schemas/valeurLocative.schema";
import { loyerAnnuel, syntheseRevenus } from "../schemas/valeurLocative.schema";
import logo from "../assets/logo.png";

const NAVY = "#1A3A52";
const BEIGE = "#F3EEE4";
const LINE = "#D8D4CC";
const INK = "#1A1A18";
const SUB = "#5B5B57";
const MUTED = "#8A8A86";

const s = StyleSheet.create({
  page: { fontFamily: "Montserrat", fontSize: 9.5, color: INK, padding: "16mm 16mm 18mm" },
  coverPage: { fontFamily: "Montserrat", color: INK, padding: "24mm 22mm 22mm", alignItems: "center", justifyContent: "center" },
  coverInner: { width: "100%", alignItems: "center" },
  logo: { width: 176, height: 60, objectFit: "contain", marginBottom: 28 },
  hair: { width: "42%", height: 0.9, backgroundColor: NAVY, marginBottom: 22 },
  hairThin: { width: "28%", height: 0.5, backgroundColor: NAVY, marginVertical: 16 },
  coverKicker: { fontSize: 8, fontFamily: "Montserrat", fontWeight: 700, color: SUB, letterSpacing: 2.2, textAlign: "center", marginBottom: 8 },
  coverTitle: { fontSize: 20, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, textAlign: "center", letterSpacing: 1.8, lineHeight: 1.35 },
  coverSub: { fontSize: 11, color: INK, textAlign: "center", marginTop: 12, lineHeight: 1.45 },
  coverPlace: { fontSize: 10.5, color: INK, textAlign: "center", marginTop: 4 },
  coverCad: { fontSize: 9, color: SUB, textAlign: "center", marginTop: 4 },
  parties: { flexDirection: "row", width: "100%", marginTop: 32, border: `0.8 solid ${LINE}` },
  partie: { flex: 1, padding: "16 14", alignItems: "center" },
  partieR: { flex: 1, padding: "16 14", alignItems: "center", borderLeft: `0.8 solid ${LINE}` },
  partieLbl: { fontSize: 8, fontFamily: "Montserrat", fontWeight: 700, color: SUB, letterSpacing: 1.1, marginBottom: 8, textAlign: "center" },
  partieVal: { fontSize: 10.5, fontFamily: "Montserrat", fontWeight: 700, color: INK, textAlign: "center" },
  partieSub: { fontSize: 9, color: SUB, marginTop: 3, textAlign: "center" },
  coverDate: { fontSize: 9, color: SUB, fontStyle: "italic", marginTop: 26, textAlign: "center" },
  sec: { fontSize: 11, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, marginTop: 12, marginBottom: 3 },
  secLine: { height: 1.2, backgroundColor: NAVY, marginBottom: 8 },
  sub: { fontSize: 10, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, marginTop: 10, marginBottom: 6 },
  body: { fontSize: 9.5, color: INK, lineHeight: 1.55, textAlign: "justify", marginBottom: 6 },
  bullet: { fontSize: 9.5, color: INK, lineHeight: 1.5, marginLeft: 8, marginBottom: 2 },
  row: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}` },
  lab: { width: "38%", fontSize: 9, fontFamily: "Montserrat", fontWeight: 700, color: INK, padding: "5 7", backgroundColor: "#FAFAF8", textAlign: "center" },
  val: { width: "62%", fontSize: 9, color: INK, padding: "5 7", textAlign: "center" },
  thRow: { flexDirection: "row", backgroundColor: NAVY },
  th: { color: "#fff", fontFamily: "Montserrat", fontWeight: 700, fontSize: 8.5, padding: "5 6", textAlign: "center" },
  td: { fontSize: 9, padding: "4 6", color: INK, textAlign: "center" },
  tr: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}` },
  trA: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, backgroundColor: "#F7F7F5" },
  note: { fontSize: 8, color: SUB, fontStyle: "italic", marginTop: 5, marginBottom: 6, lineHeight: 1.4, textAlign: "justify" },
  box: { backgroundColor: BEIGE, border: `0.8 solid ${LINE}`, padding: "14 16", alignItems: "center", marginVertical: 10 },
  boxLbl: { fontSize: 8.5, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, letterSpacing: 1, marginBottom: 6 },
  boxNum: { fontSize: 22, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, marginBottom: 4 },
  boxSub: { fontSize: 9.5, color: INK, marginBottom: 6 },
  boxFine: { fontSize: 8, color: SUB, textAlign: "center", lineHeight: 1.4 },
  sigWrap: { marginTop: 16, alignItems: "center" },
  sigFait: { fontSize: 9.5, color: INK, marginBottom: 14 },
  sigBox: { width: 220, border: `0.8 solid ${LINE}`, padding: "12 10", alignItems: "center", minHeight: 90 },
  sigLbl: { fontSize: 8, fontFamily: "Montserrat", fontWeight: 700, color: SUB, letterSpacing: 0.6 },
  sigName: { fontSize: 10, fontFamily: "Montserrat", fontWeight: 700, color: INK, marginTop: 4 },
  sigHint: { fontSize: 8, color: MUTED, fontStyle: "italic", marginTop: 18 },
  footer: { position: "absolute", bottom: "10mm", left: "16mm", right: "16mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 5, flexDirection: "row", justifyContent: "space-between" },
  footerTxt: { fontSize: 7, color: MUTED },
});

const fmtM2 = (n: number) => n ? `${String(n).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0")} m²` : "—";
const fmtEur = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR").replace(/\s/g, "\u00A0")} €`;
const fd = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>Casa Caraïbes SARL — Estimation de valeur locative — Document confidentiel</Text>
      <Text style={s.footerTxt} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  );
}
function SH({ n, title }: { n: number; title: string }) {
  return (<><Text style={s.sec}>{n}.  {title}</Text><View style={s.secLine} /></>);
}

export function ValeurLocativePDF({ e }: { e: ValeurLocative }) {
  const annuel = loyerAnnuel(e.loyerMensuelHc);
  const dateDoc = fd(e.dateDocument);
  const dateSig = fd(e.dateSignature || e.dateDocument);
  const pieces = e.pieces.filter((p) => p.nom);
  const ext = e.exterieurs.filter((p) => p.nom);
  const eqs = e.equipements.filter((p) => p.label && p.valeur);
  const atouts = e.atouts.filter(Boolean);
  const totalPieces = pieces.reduce((acc, p) => acc + (p.surface || 0), 0);
  return (
    <Document>
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverInner}>
          <Image src={logo} style={s.logo} />
          <View style={s.hair} />
          <Text style={s.coverKicker}>CASA CARAÏBES — AGENCE IMMOBILIÈRE</Text>
          <Text style={s.coverTitle}>ESTIMATION{"\n"}DE VALEUR LOCATIVE</Text>
          {!!e.titreBien && <Text style={s.coverSub}>{e.titreBien}</Text>}
          {!!e.regimeLocatif && <Text style={s.coverSub}>{e.regimeLocatif}</Text>}
          <View style={s.hairThin} />
          <Text style={s.coverPlace}>{e.codePostal} {e.commune}{e.commune ? " — Martinique" : ""}</Text>
          {(e.sectionCadastrale || e.parcelle) && (
            <Text style={s.coverCad}>{[e.sectionCadastrale && `Section cadastrale ${e.sectionCadastrale}`, e.parcelle && `Parcelle ${e.parcelle}`].filter(Boolean).join(" — ")}</Text>
          )}
          {!!e.mentionCouverture && <Text style={s.coverCad}>{e.mentionCouverture}</Text>}
          <View style={s.parties}>
            <View style={s.partie}>
              <Text style={s.partieLbl}>MANDANT</Text>
              <Text style={s.partieVal}>{e.mandantNom || "—"}</Text>
              {!!e.mandantVille && <Text style={s.partieSub}>{e.mandantVille}</Text>}
            </View>
            <View style={s.partieR}>
              <Text style={s.partieLbl}>AGENCE MANDATAIRE</Text>
              <Text style={s.partieVal}>{e.agenceNom}</Text>
              <Text style={s.partieSub}>{e.agenceMention}</Text>
            </View>
          </View>
          <Text style={s.coverDate}>Document établi le {dateDoc}</Text>
        </View>
      </Page>
      <Page size="A4" style={s.page}>
        {!!e.referencesAgence.trim() && (<><SH n={1} title="RÉFÉRENCES DE L'AGENCE" />{e.referencesAgence.split("\n").filter(Boolean).map((p, i) => (<Text key={i} style={s.body}>{p}</Text>))}</>)}
        <SH n={2} title="DÉSIGNATION DU BIEN" />
        <View>
          {!!(e.adresse || e.commune) && <View style={s.row}><Text style={s.lab}>Adresse</Text><Text style={s.val}>{[e.adresse, `${e.codePostal} ${e.commune}`].filter(Boolean).join(", ")}</Text></View>}
          {!!(e.sectionCadastrale || e.parcelle) && <View style={s.row}><Text style={s.lab}>Référence cadastrale</Text><Text style={s.val}>{[e.sectionCadastrale && `Section ${e.sectionCadastrale}`, e.parcelle && `Parcelle n° ${e.parcelle}`].filter(Boolean).join(" — ")}</Text></View>}
          {e.superficieTerrain > 0 && <View style={s.row}><Text style={s.lab}>Superficie du terrain</Text><Text style={s.val}>{fmtM2(e.superficieTerrain)}{e.zonagePlu ? ` — Zonage PLU : ${e.zonagePlu}` : ""}</Text></View>}
          {!!e.natureBien && <View style={s.row}><Text style={s.lab}>Nature du bien</Text><Text style={s.val}>{e.natureBien}</Text></View>}
          {e.surfaceShon > 0 && <View style={s.row}><Text style={s.lab}>Surface de plancher (SHON)</Text><Text style={s.val}>{fmtM2(e.surfaceShon)}</Text></View>}
          {e.empriseSol > 0 && <View style={s.row}><Text style={s.lab}>Emprise au sol (construction)</Text><Text style={s.val}>{fmtM2(e.empriseSol)}</Text></View>}
        </View>
        {!!e.descriptionBien.trim() && (<><SH n={3} title="DESCRIPTION DU BIEN" />{e.descriptionBien.split("\n").filter(Boolean).map((p, i) => (<Text key={i} style={s.body}>{p}</Text>))}</>)}
        {pieces.length > 0 && (
          <>
            <Text style={s.sub}>3.1  Composition</Text>
            <View style={s.thRow}><Text style={[s.th, { width: "34%" }]}>Pièce</Text><Text style={[s.th, { width: "18%" }]}>Surface</Text><Text style={[s.th, { width: "48%" }]}>Détail</Text></View>
            {pieces.map((p, i) => (
              <View key={p.id} style={i % 2 ? s.trA : s.tr}>
                <Text style={[s.td, { width: "34%" }]}>{p.nom}</Text>
                <Text style={[s.td, { width: "18%" }]}>{p.surface ? fmtM2(p.surface) : ""}</Text>
                <Text style={[s.td, { width: "48%" }]}>{p.detail}</Text>
              </View>
            ))}
            <View style={[s.tr, { backgroundColor: "#EEF2F5" }]}>
              <Text style={[s.td, { width: "34%", fontFamily: "Montserrat", fontWeight: 700 }]}>Total habitable (SHON)</Text>
              <Text style={[s.td, { width: "18%", fontFamily: "Montserrat", fontWeight: 700 }]}>{fmtM2(e.surfaceShon || totalPieces)}</Text>
              <Text style={[s.td, { width: "48%" }]} />
            </View>
          </>
        )}
        <Footer />
      </Page>
      <Page size="A4" style={s.page}>
        {ext.length > 0 && (
          <>
            <View style={s.thRow}><Text style={[s.th, { width: "34%" }]}>Extérieurs</Text><Text style={[s.th, { width: "18%" }]}>Surface</Text><Text style={[s.th, { width: "48%" }]}>Détail</Text></View>
            {ext.map((p, i) => (
              <View key={p.id} style={i % 2 ? s.trA : s.tr}>
                <Text style={[s.td, { width: "34%" }]}>{p.nom}</Text>
                <Text style={[s.td, { width: "18%" }]}>{p.surface ? fmtM2(p.surface) : ""}</Text>
                <Text style={[s.td, { width: "48%" }]}>{p.detail}</Text>
              </View>
            ))}
          </>
        )}
        {!!e.noteSurfaces && <Text style={s.note}>{e.noteSurfaces}</Text>}
        {eqs.length > 0 && (
          <>
            <Text style={s.sub}>3.2  Équipements et prestations</Text>
            {eqs.map((eq) => (
              <View key={eq.id} style={s.row}><Text style={s.lab}>{eq.label}</Text><Text style={s.val}>{eq.valeur}</Text></View>
            ))}
          </>
        )}
        {!!e.localisation.trim() && (<><SH n={4} title="LOCALISATION ET ENVIRONNEMENT" />{e.localisation.split("\n").filter(Boolean).map((p, i) => (<Text key={i} style={s.body}>{p}</Text>))}</>)}
        {atouts.length > 0 && (
          <>
            <Text style={[s.body, { fontFamily: "Montserrat", fontWeight: 700, marginBottom: 3 }]}>Atouts du bien :</Text>
            {atouts.map((a, i) => (<Text key={i} style={s.bullet}>•  {a}</Text>))}
          </>
        )}
        {!!e.analyseMarche.trim() && (<><SH n={5} title="ESTIMATION DE LA VALEUR LOCATIVE" />{e.analyseMarche.split("\n").filter(Boolean).map((p, i) => (<Text key={i} style={s.body}>{p}</Text>))}</>)}
        <Footer />
      </Page>
      <Page size="A4" style={s.page}>
        {e.loyerMensuelHc > 0 && (
          <>
            <Text style={s.body}>Au regard de l'ensemble des éléments recueillis, l'agence estime la valeur locative mensuelle du bien comme suit :</Text>
            <View style={s.box}>
              <Text style={s.boxLbl}>VALEUR LOCATIVE MENSUELLE ESTIMÉE</Text>
              <Text style={s.boxNum}>{fmtEur(e.loyerMensuelHc)} / mois HC</Text>
              <Text style={s.boxSub}>{syntheseRevenus(e.regimeLocatif, fmtEur(annuel))}</Text>
              {!!e.syntheseLoyer && <Text style={s.boxFine}>{e.syntheseLoyer}</Text>}
            </View>
          </>
        )}
        {!!e.vigilance && (<><Text style={s.sub}>Points de vigilance et décote appliquée</Text>{e.vigilance.split("\n").filter(Boolean).map((p, i) => (<Text key={i} style={s.body}>{p}</Text>))}</>)}
        {!!e.mentionPrevisionnelle && <Text style={s.body}>{e.mentionPrevisionnelle}</Text>}
        <SH n={6} title="SIGNATURES" />
        {!!e.disclaimer && <Text style={s.body}>{e.disclaimer}</Text>}
        <View style={s.sigWrap}>
          <Text style={s.sigFait}>Fait à {e.lieuSignature}, le {dateSig}</Text>
          <View style={s.sigBox}>
            <Text style={s.sigLbl}>AGENCE MANDATAIRE</Text>
            <Text style={s.sigName}>{e.agenceNom}</Text>
            <Text style={s.sigHint}>Signature</Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
