import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "./pdfFonts";
import type { ValeurLocative } from "../schemas/valeurLocative.schema";
import { loyerAnnuel, syntheseRevenus } from "../schemas/valeurLocative.schema";
import logo from "../assets/logo.png";
import {
  refDossier, objetCadre, methodologie, conditionsLocation,
  fourchette, syntheseFinance, conclusion, noteSurfacesDefaut,
} from "./valeurLocativeModele";

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
  coverDate: { fontSize: 9, color: SUB, fontStyle: "italic", marginTop: 20, textAlign: "center" },
  refDos: { fontSize: 8, color: MUTED, marginTop: 6, textAlign: "center" },
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
  sigWrap: { marginTop: 16, flexDirection: "row" },
  sigBox: { flex: 1, border: `0.8 solid ${LINE}`, padding: "12 10", alignItems: "center", minHeight: 90, marginHorizontal: 4 },
  sigLbl: { fontSize: 8, fontFamily: "Montserrat", fontWeight: 700, color: SUB, letterSpacing: 0.6 },
  sigName: { fontSize: 10, fontFamily: "Montserrat", fontWeight: 700, color: INK, marginTop: 4 },
  sigHint: { fontSize: 8, color: MUTED, fontStyle: "italic", marginTop: 18 },
  sigFait: { fontSize: 9.5, color: INK, marginBottom: 12, textAlign: "center" },
  footer: { position: "absolute", bottom: "10mm", left: "16mm", right: "16mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 5, flexDirection: "row", justifyContent: "space-between" },
  footerTxt: { fontSize: 7, color: MUTED },
});

const fmtM2 = (n: number) => n ? `${String(n).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0")} m\u00b2` : "\u2014";
const fmtEur = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR").replace(/\s/g, "\u00A0")} \u20ac`;
const fd = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "\u2014";

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>Casa Cara\u00efbes SARL \u2014 CPI 97212024000000007 \u2014 Document confidentiel</Text>
      <Text style={s.footerTxt} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  );
}
function SH({ n, title }: { n: number; title: string }) {
  return (<><Text style={s.sec}>{n}.  {title}</Text><View style={s.secLine} /></>);
}
function KV({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return <View style={s.row}><Text style={s.lab}>{k}</Text><Text style={s.val}>{v}</Text></View>;
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
  const cond = conditionsLocation(e);
  const f = fourchette(e);
  const fin = syntheseFinance(e);
  return (
    <Document>
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverInner}>
          <Image src={logo} style={s.logo} />
          <View style={s.hair} />
          <Text style={s.coverKicker}>CASA CARA\u00cfBES \u2014 AGENCE IMMOBILI\u00c8RE</Text>
          <Text style={s.coverTitle}>ESTIMATION{"\n"}DE VALEUR LOCATIVE</Text>
          {!!e.titreBien && <Text style={s.coverSub}>{e.titreBien}</Text>}
          {!!e.regimeLocatif && <Text style={s.coverSub}>{e.regimeLocatif}</Text>}
          <View style={s.hairThin} />
          <Text style={s.coverPlace}>{e.codePostal} {e.commune}{e.commune ? " \u2014 Martinique" : ""}</Text>
          {(e.sectionCadastrale || e.parcelle) && (
            <Text style={s.coverCad}>{[e.sectionCadastrale && `Section cadastrale ${e.sectionCadastrale}`, e.parcelle && `Parcelle ${e.parcelle}`].filter(Boolean).join(" \u2014 ")}</Text>
          )}
          {!!e.mentionCouverture && <Text style={s.coverCad}>{e.mentionCouverture}</Text>}
          <View style={s.parties}>
            <View style={s.partie}>
              <Text style={s.partieLbl}>MANDANT</Text>
              <Text style={s.partieVal}>{e.mandantNom || "\u2014"}</Text>
              {!!e.mandantVille && <Text style={s.partieSub}>{e.mandantVille}</Text>}
            </View>
            <View style={s.partieR}>
              <Text style={s.partieLbl}>AGENCE MANDATAIRE</Text>
              <Text style={s.partieVal}>{e.agenceNom}</Text>
              <Text style={s.partieSub}>{e.agenceMention}</Text>
            </View>
          </View>
          <Text style={s.coverDate}>Document \u00e9tabli le {dateDoc}</Text>
          <Text style={s.refDos}>R\u00e9f. dossier  \u00b7  {refDossier(e)}</Text>
        </View>
      </Page>

      <Page size="A4" style={s.page}>
        <SH n={1} title="OBJET ET CADRE DE L'ESTIMATION" />
        {objetCadre(e).map((p, i) => <Text key={i} style={s.body}>{p}</Text>)}
        {!!e.referencesAgence.trim() && (<><SH n={2} title="R\u00c9F\u00c9RENCES DE L'AGENCE" />{e.referencesAgence.split("\n").filter(Boolean).map((p, i) => (<Text key={i} style={s.body}>{p}</Text>))}</>)}
        <SH n={3} title="D\u00c9SIGNATION DU BIEN" />
        <View>
          <KV k="Adresse" v={[e.adresse, `${e.codePostal} ${e.commune}`].filter(Boolean).join(", ")} />
          <KV k="R\u00e9f\u00e9rence cadastrale" v={[e.sectionCadastrale && `Section ${e.sectionCadastrale}`, e.parcelle && `Parcelle n\u00b0 ${e.parcelle}`].filter(Boolean).join(" \u2014 ")} />
          <KV k="Nature du bien" v={e.natureBien || e.titreBien} />
          <KV k="R\u00e9gime de location envisag\u00e9" v={e.regimeLocatif} />
          {e.surfaceShon > 0 && <KV k="Surface de plancher (SHON)" v={fmtM2(e.surfaceShon)} />}
          {e.superficieTerrain > 0 && <KV k="Superficie du terrain" v={`${fmtM2(e.superficieTerrain)}${e.zonagePlu ? ` \u2014 Zonage PLU : ${e.zonagePlu}` : ""}`} />}
        </View>
        {!!e.descriptionBien.trim() && (<><SH n={4} title="DESCRIPTION DU BIEN" />{e.descriptionBien.split("\n").filter(Boolean).map((p, i) => (<Text key={i} style={s.body}>{p}</Text>))}</>)}
        {pieces.length > 0 && (
          <>
            <Text style={s.sub}>4.1  Composition int\u00e9rieure</Text>
            <View style={s.thRow}><Text style={[s.th, { width: "34%" }]}>Pi\u00e8ce</Text><Text style={[s.th, { width: "18%" }]}>Surface</Text><Text style={[s.th, { width: "48%" }]}>D\u00e9tail</Text></View>
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
            <Text style={s.note}>{e.noteSurfaces || noteSurfacesDefaut()}</Text>
          </>
        )}
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        {ext.length > 0 && (
          <>
            <Text style={s.sub}>4.2  Ext\u00e9rieurs</Text>
            <View style={s.thRow}><Text style={[s.th, { width: "34%" }]}>\u00c9l\u00e9ment</Text><Text style={[s.th, { width: "18%" }]}>Surface</Text><Text style={[s.th, { width: "48%" }]}>D\u00e9tail</Text></View>
            {ext.map((p, i) => (
              <View key={p.id} style={i % 2 ? s.trA : s.tr}>
                <Text style={[s.td, { width: "34%" }]}>{p.nom}</Text>
                <Text style={[s.td, { width: "18%" }]}>{p.surface ? fmtM2(p.surface) : ""}</Text>
                <Text style={[s.td, { width: "48%" }]}>{p.detail}</Text>
              </View>
            ))}
          </>
        )}
        {eqs.length > 0 && (
          <>
            <Text style={s.sub}>4.3  \u00c9quipements et prestations</Text>
            {eqs.map((eq) => <KV key={eq.id} k={eq.label} v={eq.valeur} />)}
          </>
        )}
        {!!e.localisation.trim() && (<><SH n={5} title="LOCALISATION ET ENVIRONNEMENT" />{e.localisation.split("\n").filter(Boolean).map((p, i) => (<Text key={i} style={s.body}>{p}</Text>))}</>)}
        {atouts.length > 0 && (
          <>
            <Text style={s.sub}>5.1  Atouts du bien</Text>
            {atouts.map((a, i) => (<Text key={i} style={s.bullet}>\u2022  {a}</Text>))}
          </>
        )}
        <SH n={6} title="M\u00c9THODOLOGIE D'ESTIMATION" />
        {methodologie(e).map((p, i) => <Text key={i} style={s.body}>{p}</Text>)}
        {!!e.analyseMarche.trim() && (<><SH n={7} title="ANALYSE DU MARCH\u00c9 LOCATIF" />{e.analyseMarche.split("\n").filter(Boolean).map((p, i) => (<Text key={i} style={s.body}>{p}</Text>))}</>)}
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        {e.loyerMensuelHc > 0 && f && (
          <>
            <SH n={10} title="VALEUR LOCATIVE RETENUE" />
            <Text style={s.body}>Au regard de l'ensemble des \u00e9l\u00e9ments recueillis et de l'objectif de commercialisation dans un d\u00e9lai raisonnable, l'agence estime la valeur locative mensuelle du bien comme suit.</Text>
            <View style={s.box}>
              <Text style={s.boxLbl}>VALEUR LOCATIVE MENSUELLE ESTIM\u00c9E</Text>
              <Text style={s.boxNum}>{fmtEur(e.loyerMensuelHc)} / mois HC</Text>
              <Text style={s.boxSub}>{syntheseRevenus(e.regimeLocatif, fmtEur(annuel))}</Text>
              {f.ratio > 0 && <Text style={s.boxFine}>Ratio retenu : {String(f.ratio).replace(".", ",")} \u20ac / m\u00b2 HC{e.surfaceShon ? `   \u00b7   Surface : ${fmtM2(e.surfaceShon)}` : ""}</Text>}
              {!!e.syntheseLoyer && <Text style={s.boxFine}>{e.syntheseLoyer}</Text>}
            </View>
            <Text style={s.sub}>10.1  Fourchette de commercialisation</Text>
            <View style={s.thRow}><Text style={[s.th, { width: "34%" }]}>Hypoth\u00e8se</Text><Text style={[s.th, { width: "22%" }]}>Loyer HC</Text><Text style={[s.th, { width: "22%" }]}>Annuel</Text><Text style={[s.th, { width: "22%" }]}>Commentaire</Text></View>
            {[
              ["Borne basse", f.basse, "Commercialisation plus rapide"],
              ["Valeur centrale retenue", f.centrale, "\u00c9quilibre prix / d\u00e9lai"],
              ["Borne haute", f.haute, "Risque d'allongement du d\u00e9lai"],
            ].map((row, i) => (
              <View key={String(row[0])} style={i % 2 ? s.trA : s.tr}>
                <Text style={[s.td, { width: "34%" }]}>{row[0]}</Text>
                <Text style={[s.td, { width: "22%" }]}>{fmtEur(row[1] as number)}</Text>
                <Text style={[s.td, { width: "22%" }]}>{fmtEur(loyerAnnuel(row[1] as number))}</Text>
                <Text style={[s.td, { width: "22%" }]}>{row[2]}</Text>
              </View>
            ))}
          </>
        )}
        {!!e.vigilance && (<><SH n={11} title="POINTS DE VIGILANCE" />{e.vigilance.split("\n").filter(Boolean).map((p, i) => (<Text key={i} style={s.body}>{p}</Text>))}</>)}
        {!!e.mentionPrevisionnelle && <Text style={s.body}>{e.mentionPrevisionnelle}</Text>}
        <SH n={12} title="CONDITIONS DE MISE EN LOCATION" />
        <Text style={s.sub}>12.1  Cadre juridique recommand\u00e9</Text>
        <Text style={s.body}>{cond.cadre}</Text>
        <Text style={s.sub}>12.2  Charges et r\u00e9partition indicative</Text>
        {cond.charges.map(([k, v]) => <KV key={k} k={k} v={v} />)}
        <Text style={s.sub}>12.3  Solvabilit\u00e9</Text>
        <Text style={s.body}>{cond.solvabilite}</Text>
        <Text style={s.sub}>12.4  D\u00e9lai de commercialisation</Text>
        <Text style={s.body}>{cond.delai}</Text>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        {fin.length > 0 && (
          <>
            <SH n={13} title="SYNTH\u00c8SE FINANCI\u00c8RE POUR LE BAILLEUR" />
            {fin.map(([k, v]) => <KV key={k} k={k} v={v} />)}
            <Text style={s.note}>Les honoraires d'agence, le co\u00fbt des diagnostics, les travaux et la fiscalit\u00e9 des revenus fonciers ne sont pas chiffr\u00e9s ici. Casa Cara\u00efbes se tient \u00e0 disposition pour un plan de commercialisation ou un mandat de gestion.</Text>
          </>
        )}
        <SH n={14} title="CONCLUSION" />
        {conclusion(e).map((p, i) => <Text key={i} style={s.body}>{p}</Text>)}
        <SH n={15} title="SIGNATURES" />
        {!!e.disclaimer && <Text style={s.body}>{e.disclaimer}</Text>}
        <Text style={s.sigFait}>Fait \u00e0 {e.lieuSignature}, le {dateSig}</Text>
        <View style={s.sigWrap}>
          <View style={s.sigBox}>
            <Text style={s.sigLbl}>MANDANT</Text>
            <Text style={s.sigName}>{e.mandantNom || "\u2014"}</Text>
            <Text style={s.sigHint}>Signature</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={s.sigLbl}>AGENCE MANDATAIRE</Text>
            <Text style={s.sigName}>{e.agenceNom}</Text>
            <Text style={s.sigHint}>Signature</Text>
          </View>
        </View>
        <Text style={[s.note, { marginTop: 14, textAlign: "center" }]}>Carte professionnelle CPI 97212024000000007  \u00b7  RCS Fort-de-France 928 647 981</Text>
        <Footer />
      </Page>
    </Document>
  );
}
