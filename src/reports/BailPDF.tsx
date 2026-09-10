import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Bail } from "../schemas/bail.schema";
import { articlesBail, loyerCc, titreBail, sousTitreLegal } from "../schemas/bail.schema";
import logo from "../assets/logo.png";

const NAVY = "#1A3A52";
const LINE = "#D8D4CC";
const INK = "#1A1A18";
const SUB = "#5B5B57";
const MUTED = "#8A8A86";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9.5, color: INK, padding: "16mm 16mm 18mm" },
  coverPage: { fontFamily: "Helvetica", color: INK, padding: "20mm 20mm 18mm", alignItems: "center" },
  logo: { width: 168, height: 58, objectFit: "contain", marginBottom: 14 },
  hair: { width: "100%", height: 0.8, backgroundColor: NAVY, marginVertical: 12 },
  coverTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: NAVY, textAlign: "center", letterSpacing: 1.1, lineHeight: 1.35 },
  coverSub: { fontSize: 9.5, color: SUB, textAlign: "center", marginTop: 8, lineHeight: 1.4 },
  coverPlace: { fontSize: 10, color: INK, textAlign: "center", marginTop: 12 },
  parties: { flexDirection: "row", width: "100%", marginTop: 20, border: `0.8 solid ${LINE}` },
  partie: { flex: 1, padding: "10 12" },
  partieR: { flex: 1, padding: "10 12", borderLeft: `0.8 solid ${LINE}` },
  partieLbl: { fontSize: 8, fontFamily: "Helvetica-Bold", color: SUB, letterSpacing: 0.7, marginBottom: 5 },
  partieVal: { fontSize: 10, fontFamily: "Helvetica-Bold", color: INK },
  partieSub: { fontSize: 8.5, color: SUB, marginTop: 2 },
  meta: { fontSize: 9, color: SUB, marginTop: 14 },
  sec: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 10, marginBottom: 3 },
  secLine: { height: 1, backgroundColor: NAVY, marginBottom: 6 },
  body: { fontSize: 9.5, color: INK, lineHeight: 1.5, textAlign: "justify", marginBottom: 6 },
  row: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}` },
  lab: { width: "38%", fontSize: 9, fontFamily: "Helvetica-Bold", color: INK, padding: "4 6", backgroundColor: "#FAFAF8" },
  val: { width: "62%", fontSize: 9, color: INK, padding: "4 6" },
  box: { backgroundColor: "#F3EEE4", border: `0.8 solid ${LINE}`, padding: "10 12", alignItems: "center", marginVertical: 8 },
  boxLbl: { fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY, letterSpacing: 0.8, marginBottom: 4 },
  boxNum: { fontSize: 16, fontFamily: "Helvetica-Bold", color: NAVY },
  boxSub: { fontSize: 9, color: INK, marginTop: 3 },
  sigWrap: { marginTop: 14, flexDirection: "row" },
  sigBox: { flex: 1, border: `0.8 solid ${LINE}`, padding: "10 8", minHeight: 88, marginHorizontal: 4, alignItems: "center" },
  sigLbl: { fontSize: 8, fontFamily: "Helvetica-Bold", color: SUB },
  sigName: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK, marginTop: 4, textAlign: "center" },
  sigHint: { fontSize: 8, color: MUTED, fontStyle: "italic", marginTop: 16 },
  footer: { position: "absolute", bottom: "10mm", left: "16mm", right: "16mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 5, flexDirection: "row", justifyContent: "space-between" },
  footerTxt: { fontSize: 7, color: MUTED },
});

const fd = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
const eur = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR").replace(/\s/g, "\u00A0")} €`;

function nom(p: { civilite: string; prenom: string; nom: string }) {
  return [p.civilite, p.prenom, p.nom].filter(Boolean).join(" ") || "—";
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>Casa Caraïbes SARL — Contrat de location — Document confidentiel</Text>
      <Text style={s.footerTxt} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function BailPDF({ e }: { e: Bail }) {
  const arts = articlesBail(e);
  const bailleur = e.bailleurs[0];
  const preneur = e.preneurs[0];
  return (
    <Document>
      <Page size="A4" style={s.coverPage}>
        <Image src={logo} style={s.logo} />
        <View style={s.hair} />
        <Text style={s.coverTitle}>{titreBail(e.typeBail)}</Text>
        <Text style={s.coverSub}>{sousTitreLegal(e.typeBail)}</Text>
        {!!e.numero && <Text style={s.coverSub}>N° {e.numero}</Text>}
        <Text style={s.coverPlace}>{[e.adresseBien, `${e.codePostal} ${e.commune}`].filter(Boolean).join(" — ")}</Text>
        <View style={s.parties}>
          <View style={s.partie}>
            <Text style={s.partieLbl}>BAILLEUR</Text>
            <Text style={s.partieVal}>{bailleur ? nom(bailleur) : "—"}</Text>
            {!!bailleur?.ville && <Text style={s.partieSub}>{bailleur.ville}</Text>}
          </View>
          <View style={s.partieR}>
            <Text style={s.partieLbl}>PRENEUR</Text>
            <Text style={s.partieVal}>{preneur ? nom(preneur) : "—"}</Text>
            {!!preneur?.ville && <Text style={s.partieSub}>{preneur.ville}</Text>}
          </View>
        </View>
        <Text style={s.meta}>Établi à {e.lieuSignature}, le {fd(e.dateDocument)} — {e.agenceNom}</Text>
      </Page>
      <Page size="A4" style={s.page}>
        <Text style={s.sec}>Désignation du bien</Text>
        <View style={s.secLine} />
        <View>
          <View style={s.row}><Text style={s.lab}>Type</Text><Text style={s.val}>{e.typeBien}</Text></View>
          <View style={s.row}><Text style={s.lab}>Adresse</Text><Text style={s.val}>{[e.adresseBien, `${e.codePostal} ${e.commune}`].filter(Boolean).join(", ")}</Text></View>
          <View style={s.row}><Text style={s.lab}>Cadastre</Text><Text style={s.val}>{[e.sectionCadastrale && `Section ${e.sectionCadastrale}`, e.parcelle && `Parcelle ${e.parcelle}`].filter(Boolean).join(" — ") || "—"}</Text></View>
          <View style={s.row}><Text style={s.lab}>Surface / pièces</Text><Text style={s.val}>{[e.surfaceHabitable ? `${e.surfaceHabitable} m²` : "", e.nbPieces, e.etage].filter(Boolean).join(" — ") || "—"}</Text></View>
          <View style={s.row}><Text style={s.lab}>Période</Text><Text style={s.val}>{fd(e.dateDebut)} → {fd(e.dateFin)} ({e.dureeMois} mois)</Text></View>
          {!!e.annexes && <View style={s.row}><Text style={s.lab}>Annexes</Text><Text style={s.val}>{e.annexes}</Text></View>}
          {!!(e.dpeClasse || e.gesClasse) && <View style={s.row}><Text style={s.lab}>DPE / GES</Text><Text style={s.val}>{[e.dpeClasse && `Énergie ${e.dpeClasse}`, e.gesClasse && `GES ${e.gesClasse}`].filter(Boolean).join(" — ")}</Text></View>}
        </View>
        <View style={s.box}>
          <Text style={s.boxLbl}>LOYER MENSUEL</Text>
          <Text style={s.boxNum}>{eur(e.loyerHc)} HC</Text>
          <Text style={s.boxSub}>soit {eur(loyerCc(e))} CC — dépôt {eur(e.depotGarantie)}</Text>
        </View>
        {e.bailleurs.map((p, i) => (
          <Text key={p.id} style={s.body}>Bailleur {e.bailleurs.length > 1 ? i + 1 : ""} : {nom(p)}{p.dateNaissance ? `, né(e) le ${fd(p.dateNaissance)}` : ""}{p.adresse ? `, demeurant ${p.adresse} ${p.codePostal} ${p.ville}` : ""}.</Text>
        ))}
        {e.preneurs.map((p, i) => (
          <Text key={p.id} style={s.body}>Preneur {e.preneurs.length > 1 ? i + 1 : ""} : {nom(p)}{p.dateNaissance ? `, né(e) le ${fd(p.dateNaissance)}` : ""}{p.adresse ? `, demeurant ${p.adresse} ${p.codePostal} ${p.ville}` : ""}.</Text>
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
        {!!e.observations && <Text style={s.body}>{e.observations}</Text>}
        <Text style={s.body}>Fait à {e.lieuSignature}, le {fd(e.dateDocument)}, en autant d'exemplaires que de parties.</Text>
        <View style={s.sigWrap}>
          <View style={s.sigBox}>
            <Text style={s.sigLbl}>LE BAILLEUR</Text>
            <Text style={s.sigName}>{bailleur ? nom(bailleur) : "—"}</Text>
            <Text style={s.sigHint}>Signature</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={s.sigLbl}>LE PRENEUR</Text>
            <Text style={s.sigName}>{preneur ? nom(preneur) : "—"}</Text>
            <Text style={s.sigHint}>Signature</Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
