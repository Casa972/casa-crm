import { Document, Page, Text, View, StyleSheet, Font, Image, pdf } from "@react-pdf/renderer";
import logoWhite from "../assets/logo-white.png";

Font.register({
  family: "Montserrat",
  fonts: [
    { src: new URL("@fontsource/montserrat/files/montserrat-latin-400-normal.woff", import.meta.url).href, fontWeight: 400 },
    { src: new URL("@fontsource/montserrat/files/montserrat-latin-500-normal.woff", import.meta.url).href, fontWeight: 500 },
    { src: new URL("@fontsource/montserrat/files/montserrat-latin-600-normal.woff", import.meta.url).href, fontWeight: 600 },
    { src: new URL("@fontsource/montserrat/files/montserrat-latin-700-normal.woff", import.meta.url).href, fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback(w => [w]);

const C = {
  navy:    "#0D2137",
  navyMid: "#1A3A52",
  teal:    "#0E9F8E",
  gold:    "#C9831A",
  goldSoft:"#FEF6E8",
  white:   "#FFFFFF",
  offWhite:"#F7F9FB",
  ink:     "#1C1C1A",
  sub:     "#5A6478",
  line:    "#DDE3EC",
  green:   "#059669",
};

const PAD = 28;

const S = StyleSheet.create({
  page: {
    fontFamily: "Montserrat",
    fontWeight: 400,
    fontSize: 10,
    color: C.ink,
    backgroundColor: C.white,
  },

  // ── TOP BAR ──
  topBar: { height: 5, flexDirection: "row" },
  topA: { flex: 2, backgroundColor: C.teal },
  topB: { flex: 1, backgroundColor: C.gold },
  topC: { flex: 3, backgroundColor: C.navy },

  // ── HERO ──
  hero: {
    backgroundColor: C.navy,
    paddingHorizontal: PAD,
    paddingTop: 26,
    paddingBottom: 22,
  },
  heroLogo: { width: 120, height: 37, objectFit: "contain", marginBottom: 16 },
  heroTitle: {
    color: C.white,
    fontWeight: 700,
    fontSize: 24,
    lineHeight: 1.25,
    marginBottom: 10,
  },
  heroAccent: { color: C.teal },
  heroSub: { color: "#8BA5BF", fontSize: 11, lineHeight: 1.65, marginBottom: 16 },
  heroBadgeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroBadge: {
    backgroundColor: C.teal,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "center",
  },
  heroBadgePct: { color: C.white, fontWeight: 700, fontSize: 30 },
  heroBadgeLabel: { color: "#B2EEE8", fontSize: 8.5, fontWeight: 500, textAlign: "center", marginTop: 2 },
  heroBadgeSub: { color: "#8BA5BF", fontSize: 10, lineHeight: 1.5, flex: 1 },

  // ── BODY ──
  body: { paddingHorizontal: PAD, paddingTop: 20, paddingBottom: 16 },

  // ── SECTION LABEL ──
  sectionLabel: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 2,
    color: C.teal,
    marginBottom: 12,
    marginTop: 22,
  },

  // ── ÉTAPES ──
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 14,
  },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.teal,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  stepNum: { color: C.white, fontWeight: 700, fontSize: 14 },
  stepContent: { flex: 1, paddingTop: 3 },
  stepTitle: { fontWeight: 700, fontSize: 11, color: C.navy, marginBottom: 2 },
  stepText: { fontSize: 9.5, color: C.sub, lineHeight: 1.55 },

  // ── MISSIONS ──
  missionCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.line,
    overflow: "hidden",
    marginBottom: 10,
  },
  missionHead: {
    backgroundColor: C.navyMid,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  missionTag: {
    backgroundColor: C.teal, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  missionTagTxt: { color: C.white, fontWeight: 700, fontSize: 9 },
  missionTitle: { color: C.white, fontWeight: 700, fontSize: 12 },
  missionSub: { color: "#8BA5BF", fontSize: 8.5, marginTop: 1 },
  missionBody: { padding: 12, backgroundColor: C.white },
  missionItem: { flexDirection: "row", marginBottom: 5 },
  missionDot: { width: 12, color: C.teal, fontWeight: 700, fontSize: 10 },
  missionTxt: { flex: 1, fontSize: 9.5, color: C.sub, lineHeight: 1.55 },
  missionBold: { fontWeight: 600, color: C.ink },

  // ── RÉTRIBUTION ──
  rewardCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.line,
    overflow: "hidden",
    marginBottom: 10,
  },
  rewardHeadPro: {
    backgroundColor: C.navyMid,
    paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  rewardHeadPart: {
    backgroundColor: C.goldSoft,
    paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderBottomWidth: 1, borderBottomColor: "#EDD9A3",
  },
  rewardTitlePro: { color: C.white, fontWeight: 700, fontSize: 11 },
  rewardTitlePart: { color: C.gold, fontWeight: 700, fontSize: 11 },
  rewardPill: { backgroundColor: C.teal, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  rewardPillGold: { backgroundColor: C.gold, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  rewardPillTxt: { color: C.white, fontWeight: 700, fontSize: 9 },
  rewardBody: { padding: 12, backgroundColor: C.white },
  rewardItem: { flexDirection: "row", marginBottom: 5 },
  rewardDot: { width: 12, color: C.teal, fontWeight: 700, fontSize: 10 },
  rewardDotGold: { width: 12, color: C.gold, fontWeight: 700, fontSize: 10 },
  rewardTxt: { flex: 1, fontSize: 9.5, color: C.sub, lineHeight: 1.55 },
  rewardBold: { fontWeight: 600, color: C.ink },
  legalNote: {
    marginTop: 8,
    backgroundColor: C.offWhite,
    borderRadius: 5,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: C.gold,
  },
  legalNoteTxt: { fontSize: 8, color: C.sub, lineHeight: 1.6 },
  legalNoteBold: { fontWeight: 600, color: C.gold },

  // ── TABLEAU 3 colonnes ──
  tableSection: { marginTop: 22, marginBottom: 0 },
  tableTitle: { fontWeight: 700, fontSize: 11, color: C.navy, marginBottom: 8 },
  tableWrap: { borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: C.line },
  tableHead: { flexDirection: "row", backgroundColor: C.navy },
  thCell: { color: C.white, fontWeight: 600, fontSize: 9, paddingHorizontal: 10, paddingVertical: 8, textAlign: "center" },
  th1: { width: "42%" },
  th2: { width: "22%" },
  th3: { width: "36%" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line },
  tableRowAlt: { backgroundColor: C.offWhite },
  tdBase: { fontSize: 9.5, paddingHorizontal: 10, paddingVertical: 7, textAlign: "center" },
  td1: { width: "42%", fontWeight: 700, color: C.navy },
  td2: { width: "22%", color: C.sub, fontWeight: 600, textAlign: "center" },
  td3: { width: "36%", fontWeight: 700, color: C.teal },

  // ── CONDITIONS ──
  condBox: {
    backgroundColor: C.offWhite,
    borderRadius: 8,
    padding: 14,
    marginTop: 22,
    borderWidth: 1,
    borderColor: C.line,
  },
  condTitle: { fontWeight: 700, fontSize: 11, color: C.navy, marginBottom: 10 },
  condRow: { flexDirection: "row", marginBottom: 6 },
  condNum: { width: 18, fontWeight: 700, fontSize: 9.5, color: C.teal },
  condTxt: { flex: 1, fontSize: 9.5, color: C.sub, lineHeight: 1.6 },
  condBold: { fontWeight: 600, color: C.ink },

  // ── CTA ──
  ctaBox: {
    backgroundColor: C.navy,
    borderRadius: 10,
    padding: 20,
    marginTop: 22,
  },
  ctaTitle: { color: C.white, fontWeight: 700, fontSize: 14, marginBottom: 6, textAlign: "center" },
  ctaSub: { color: "#8BA5BF", fontSize: 10, lineHeight: 1.65, textAlign: "center", marginBottom: 16 },
  ctaItemsCol: { gap: 8 },
  ctaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  ctaDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.teal },
  ctaVal: { color: C.white, fontWeight: 600, fontSize: 11 },

  // ── FOOTER ──
  footer: {
    paddingHorizontal: PAD,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerBrand: { fontWeight: 700, fontSize: 9, color: C.navy },
  footerLegal: { fontSize: 7, color: "#9AA3B0", textAlign: "right", lineHeight: 1.5 },
});

function MItem({ bold, text }: { bold: string; text: string }) {
  return (
    <View style={S.missionItem}>
      <Text style={S.missionDot}>›</Text>
      <Text style={S.missionTxt}><Text style={S.missionBold}>{bold}</Text>{text}</Text>
    </View>
  );
}

function RItem({ bold, text, gold }: { bold: string; text: string; gold?: boolean }) {
  return (
    <View style={S.rewardItem}>
      <Text style={gold ? S.rewardDotGold : S.rewardDot}>›</Text>
      <Text style={S.rewardTxt}><Text style={S.rewardBold}>{bold}</Text>{text}</Text>
    </View>
  );
}

const BAREME = [
  { prix: "100 000 a 200 000 EUR", taux: "8 %", apport: "800 a 1 600 EUR" },
  { prix: "200 000 a 300 000 EUR", taux: "7 %", apport: "1 400 a 2 100 EUR" },
  { prix: "300 000 a 400 000 EUR", taux: "6 %", apport: "1 800 a 2 400 EUR" },
  { prix: "400 000 a 500 000 EUR", taux: "5 %", apport: "2 000 a 2 500 EUR" },
];

export function FicheApportPromo() {
  return (
    <Document title="Apport d'affaires — Casa Caraibes" author="Casa Caraibes">
      <Page size="A4" style={S.page}>

        <View style={S.topBar}>
          <View style={S.topA} /><View style={S.topB} /><View style={S.topC} />
        </View>

        {/* HERO */}
        <View style={S.hero}>
          <Image src={logoWhite} style={S.heroLogo} />
          <Text style={S.heroTitle}>
            Vous connaissez un vendeur{"\n"}ou un bailleur ?{" "}
            <Text style={S.heroAccent}>Parlez-nous de lui.</Text>
          </Text>
          <Text style={S.heroSub}>
            Mettez-nous en contact avec un proprietaire souhaitant vendre
            ou mettre son bien en location. Si la transaction aboutit,
            nous vous versons une retribution par virement bancaire.
          </Text>
          <View style={S.heroBadgeRow}>
            <View style={S.heroBadge}>
              <Text style={S.heroBadgePct}>10 %</Text>
              <Text style={S.heroBadgeLabel}>de nos honoraires</Text>
            </View>
            <Text style={S.heroBadgeSub}>
              Verses directement sur votre compte, des la transaction finalisee.
            </Text>
          </View>
        </View>

        <View style={S.body}>

          {/* ETAPES */}
          <Text style={S.sectionLabel}>COMMENT CA MARCHE</Text>
          {[
            { n: "1", t: "Vous nous signalez le bien", txt: "Remplissez la fiche de declaration jointe et transmettez-la a votre conseiller Casa Caraibes." },
            { n: "2", t: "Nous contactons le proprietaire", txt: "Nos agents prennent contact avec lui sous 24 heures ouvrees et organisent une visite." },
            { n: "3", t: "La transaction se conclut", txt: "Acte authentique signe chez le notaire (vente) ou bail definitif signe (location)." },
            { n: "4", t: "Vous etes retribue(e)", txt: "Virement bancaire de 10 % de nos honoraires TTC des leur encaissement complet." },
          ].map((s, i) => (
            <View key={i} style={S.stepRow}>
              <View style={S.stepCircle}><Text style={S.stepNum}>{s.n}</Text></View>
              <View style={S.stepContent}>
                <Text style={S.stepTitle}>{s.t}</Text>
                <Text style={S.stepText}>{s.txt}</Text>
              </View>
            </View>
          ))}

          {/* MISSIONS */}
          <Text style={S.sectionLabel}>DEUX TYPES DE MISSIONS</Text>

          <View style={S.missionCard}>
            <View style={S.missionHead}>
              <View style={S.missionTag}><Text style={S.missionTagTxt}>VENTE</Text></View>
              <View>
                <Text style={S.missionTitle}>Mandat de vente</Text>
                <Text style={S.missionSub}>Appartement, villa, terrain, local commercial...</Text>
              </View>
            </View>
            <View style={S.missionBody}>
              <MItem bold="Vous signalez " text="un proprietaire souhaitant vendre son bien immobilier" />
              <MItem bold="Retribution " text="a la signature de l'acte authentique chez le notaire" />
              <MItem bold="Honoraires degressifs " text="de 8 % a 5 % selon le prix de vente (voir tableau)" />
            </View>
          </View>

          <View style={S.missionCard}>
            <View style={S.missionHead}>
              <View style={S.missionTag}><Text style={S.missionTagTxt}>LOCATION</Text></View>
              <View>
                <Text style={S.missionTitle}>Mise en location</Text>
                <Text style={S.missionSub}>Appartement, villa, maison, local...</Text>
              </View>
            </View>
            <View style={S.missionBody}>
              <MItem bold="Vous signalez " text="un proprietaire bailleur souhaitant mettre son bien en location" />
              <MItem bold="Retribution " text="a la signature du bail definitif et encaissement de nos honoraires" />
              <MItem bold="Honoraires " text="equivalents a un mois de loyer charges comprises" />
            </View>
          </View>

          {/* RETRIBUTION */}
          <Text style={S.sectionLabel}>VOTRE RETRIBUTION — 10 % DE NOS HONORAIRES</Text>

          <View style={S.rewardCard}>
            <View style={S.rewardHeadPro}>
              <Text style={S.rewardTitlePro}>PROFESSIONNEL</Text>
              <View style={S.rewardPill}><Text style={S.rewardPillTxt}>10 % HT · virement sur facture</Text></View>
            </View>
            <View style={S.rewardBody}>
              <RItem bold="Requis : " text="SIRET valide + RIB + facture detaillant la mission" />
              <RItem bold="TVA : " text="applicable selon votre regime fiscal a la date d'emission" />
              <RItem bold="Concerne : " text="agents commerciaux, mandataires, societes de conseil" />
            </View>
          </View>

          <View style={S.rewardCard}>
            <View style={S.rewardHeadPart}>
              <Text style={S.rewardTitlePart}>PARTICULIER</Text>
              <View style={S.rewardPillGold}><Text style={S.rewardPillTxt}>10 % TTC · virement bancaire</Text></View>
            </View>
            <View style={S.rewardBody}>
              <RItem bold="Requis : " text="RIB + copie de votre piece d'identite — aucune facture necessaire" gold />
              <RItem bold="Apport ponctuel : " text="non rattache a une activite commerciale reguliere" gold />
              <View style={S.legalNote}>
                <Text style={S.legalNoteTxt}>
                  <Text style={S.legalNoteBold}>Note fiscale : </Text>
                  Ce versement est legal en France pour un apport occasionnel. Il doit etre declare comme revenu accessoire (BNC) dans votre declaration d'impots. Un justificatif de paiement vous sera fourni.
                </Text>
              </View>
            </View>
          </View>

          {/* TABLEAU */}
          <View wrap={false} style={S.tableSection}>
            <Text style={S.tableTitle}>Exemples de retribution</Text>
            <View style={S.tableWrap}>
              <View style={S.tableHead}>
                <Text style={[S.thCell, S.th1]}>Prix de vente</Text>
                <Text style={[S.thCell, S.th2]}>Taux</Text>
                <Text style={[S.thCell, S.th3]}>Votre gain (10 %)</Text>
              </View>
              {BAREME.map((r, i) => (
                <View key={i} style={[S.tableRow, i % 2 !== 0 ? S.tableRowAlt : {}]}>
                  <Text style={[S.tdBase, S.td1]}>{r.prix}</Text>
                  <Text style={[S.tdBase, S.td2]}>{r.taux}</Text>
                  <Text style={[S.tdBase, S.td3]}>{r.apport}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CONDITIONS */}
          <View wrap={false} style={S.condBox}>
            <Text style={S.condTitle}>Conditions de declenchement</Text>
            {[
              ["Mandat signe ", "dans les 12 mois", " suivant la remise de votre fiche de declaration."],
              ["Transaction finalisee : ", "acte notarie (vente) ou bail definitif (location)", " signe."],
              ["Casa Caraibes a ", "integralement encaisse ses honoraires", " avant tout versement."],
            ].map(([a, b, c], i) => (
              <View key={i} style={S.condRow}>
                <Text style={S.condNum}>{i + 1}.</Text>
                <Text style={S.condTxt}>{a}<Text style={S.condBold}>{b}</Text>{c}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View wrap={false} style={S.ctaBox}>
            <Text style={S.ctaTitle}>Pret(e) a nous recommander un bien ?</Text>
            <Text style={S.ctaSub}>
              Remplissez la fiche de declaration ci-jointe et remettez-la a votre conseiller.{"\n"}
              Nous contactons le proprietaire sous 24 heures ouvrees.
            </Text>
            <View style={S.ctaItemsCol}>
              {[["Tel.", "0696 43 39 49"], ["Email", "contact@casacaraibes.com"], ["Web", "www.casacaraibes.com"]].map(([l, v]) => (
                <View key={l} style={S.ctaItem}>
                  <View style={S.ctaDot} />
                  <Text style={S.ctaVal}>{l}  {v}</Text>
                </View>
              ))}
            </View>
          </View>

        </View>

        <View style={S.footer}>
          <Text style={S.footerBrand}>CASA CARAIBES</Text>
          <Text style={S.footerLegal}>
            Agence immobiliere — Martinique · RCS Fort-de-France 928 647 981{"\n"}
            Carte pro T n°CPI97212024000000007 · Garantie financiere AXA
          </Text>
        </View>

      </Page>
    </Document>
  );
}

export async function downloadFicheApportPromo() {
  const blob = await pdf(<FicheApportPromo />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Casa_Caraibes_Apport_Affaires_Flyer.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 200);
}
