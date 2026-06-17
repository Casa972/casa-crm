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
  navy:     "#0D2137",
  navyMid:  "#1A3A52",
  teal:     "#0E9F8E",
  tealSoft: "#E6FAF8",
  gold:     "#C9831A",
  goldSoft: "#FEF6E8",
  white:    "#FFFFFF",
  offWhite: "#F7F9FB",
  ink:      "#1C1C1A",
  sub:      "#5A6478",
  line:     "#DDE3EC",
  green:    "#059669",
};

const S = StyleSheet.create({
  page: {
    fontFamily: "Montserrat",
    fontWeight: 400,
    fontSize: 9,
    color: C.ink,
    backgroundColor: C.white,
  },

  // ── TOP BAR ──
  topBar: { height: 4, flexDirection: "row" },
  topA: { flex: 2, backgroundColor: C.teal },
  topB: { flex: 1, backgroundColor: C.gold },
  topC: { flex: 3, backgroundColor: C.navy },

  // ── HERO ──
  hero: { backgroundColor: C.navy, paddingHorizontal: 40, paddingTop: 22, paddingBottom: 20 },
  heroInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroLeft: { flex: 1, paddingRight: 16 },
  heroEyebrow: { color: C.teal, fontWeight: 600, fontSize: 7, letterSpacing: 2, marginBottom: 8 },
  heroTitle: { color: C.white, fontWeight: 700, fontSize: 20, lineHeight: 1.25, marginBottom: 8 },
  heroAccent: { color: C.teal },
  heroSub: { color: "#8BA5BF", fontSize: 8.5, lineHeight: 1.6 },
  heroRight: { alignItems: "center", gap: 10 },
  logo: { width: 110, height: 34, objectFit: "contain" },
  heroBadge: {
    backgroundColor: C.teal, borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: "center",
  },
  heroBadgePct: { color: C.white, fontWeight: 700, fontSize: 26 },
  heroBadgeLabel: { color: "#B2EEE8", fontSize: 7, fontWeight: 500, textAlign: "center", marginTop: 1 },

  // ── BODY ──
  body: { paddingHorizontal: 40, paddingTop: 18, paddingBottom: 14 },
  sectionLabel: { fontSize: 7, fontWeight: 700, letterSpacing: 2, color: C.teal, marginBottom: 10 },

  // ── COMMENT CA MARCHE ──
  stepsRow: { flexDirection: "row", marginBottom: 18 },
  step: { flex: 1, alignItems: "center", paddingHorizontal: 6 },
  stepCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.teal, alignItems: "center", justifyContent: "center", marginBottom: 5,
  },
  stepNum: { color: C.white, fontWeight: 700, fontSize: 11 },
  stepTitle: { fontWeight: 700, fontSize: 8, color: C.navy, textAlign: "center", marginBottom: 2 },
  stepText: { fontSize: 7, color: C.sub, textAlign: "center", lineHeight: 1.5 },
  stepSep: { width: 1, backgroundColor: C.line, marginTop: 13, alignSelf: "stretch" },

  // ── MISSIONS ──
  missionsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  missionCard: { flex: 1, borderRadius: 6, borderWidth: 1, borderColor: C.line, overflow: "hidden" },
  missionHead: { backgroundColor: C.navyMid, paddingHorizontal: 12, paddingVertical: 8 },
  missionHeadRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  missionTag: {
    backgroundColor: C.teal, borderRadius: 3,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  missionTagText: { color: C.white, fontWeight: 700, fontSize: 7.5 },
  missionTitle: { color: C.white, fontWeight: 700, fontSize: 10 },
  missionSub: { color: "#8BA5BF", fontSize: 7, marginTop: 2 },
  missionBody: { padding: 10, backgroundColor: C.white },
  missionItem: { flexDirection: "row", marginBottom: 4 },
  missionDot: { width: 10, color: C.teal, fontWeight: 700 },
  missionText: { flex: 1, fontSize: 7.5, color: C.sub, lineHeight: 1.5 },
  missionBold: { fontWeight: 600, color: C.ink },

  // ── RETRIBUTION ──
  rewardsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  rewardCard: { flex: 1, borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: C.line },
  rewardHeadPro: { backgroundColor: C.navyMid, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rewardHeadPart: { backgroundColor: C.goldSoft, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EDD9A3" },
  rewardTitlePro: { color: C.white, fontWeight: 700, fontSize: 8.5 },
  rewardTitlePart: { color: C.gold, fontWeight: 700, fontSize: 8.5 },
  rewardPill: { backgroundColor: C.teal, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  rewardPillGold: { backgroundColor: C.gold, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  rewardPillTxt: { color: C.white, fontWeight: 700, fontSize: 7.5 },
  rewardBody: { padding: 10, backgroundColor: C.white },
  rewardItem: { flexDirection: "row", marginBottom: 4 },
  rewardDot: { width: 10, color: C.teal, fontWeight: 700 },
  rewardDotGold: { width: 10, color: C.gold, fontWeight: 700 },
  rewardTxt: { flex: 1, fontSize: 7.5, color: C.sub, lineHeight: 1.5 },
  rewardBold: { fontWeight: 600, color: C.ink },
  legalNote: { marginTop: 7, backgroundColor: C.offWhite, borderRadius: 4, padding: 6, borderLeftWidth: 2, borderLeftColor: C.gold },
  legalNoteTxt: { fontSize: 6.5, color: C.sub, lineHeight: 1.55 },
  legalNoteBold: { fontWeight: 600, color: C.gold },

  // ── TABLEAU ──
  tableTitle: { fontWeight: 700, fontSize: 9, color: C.navy, marginBottom: 7 },
  tableWrap: { borderRadius: 5, overflow: "hidden", marginBottom: 18, borderWidth: 1, borderColor: C.line },
  tableHead: { flexDirection: "row", backgroundColor: C.navy },
  thCell: { color: C.white, fontWeight: 600, fontSize: 7.5, paddingHorizontal: 8, paddingVertical: 6, textAlign: "center" },
  th1: { width: "32%" },
  th2: { width: "24%" },
  th3: { width: "22%" },
  th4: { width: "22%" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line },
  tableRowAlt: { backgroundColor: C.offWhite },
  tdBase: { fontSize: 7.5, paddingHorizontal: 8, paddingVertical: 5, textAlign: "center" },
  td1: { width: "32%", fontWeight: 700, color: C.navy },
  td2: { width: "24%", color: C.sub },
  td3: { width: "22%", fontWeight: 600, color: C.green },
  td4: { width: "22%", fontWeight: 600, color: C.gold },

  // ── CONDITIONS ──
  condBox: { backgroundColor: C.offWhite, borderRadius: 6, padding: 11, marginBottom: 16, borderWidth: 1, borderColor: C.line },
  condTitle: { fontWeight: 700, fontSize: 8.5, color: C.navy, marginBottom: 7 },
  condRow: { flexDirection: "row", marginBottom: 3.5 },
  condNum: { width: 14, fontWeight: 700, fontSize: 7.5, color: C.teal },
  condTxt: { flex: 1, fontSize: 7.5, color: C.sub, lineHeight: 1.5 },
  condBold: { fontWeight: 600, color: C.ink },

  // ── CONTACT ──
  ctaBox: { backgroundColor: C.navy, borderRadius: 8, padding: 16, flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 14 },
  ctaLeft: { flex: 1 },
  ctaTitle: { color: C.white, fontWeight: 700, fontSize: 11, marginBottom: 3 },
  ctaSub: { color: "#8BA5BF", fontSize: 8, lineHeight: 1.6 },
  ctaRight: { gap: 5 },
  ctaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  ctaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.teal },
  ctaVal: { color: C.white, fontWeight: 600, fontSize: 8 },

  // ── FOOTER ──
  footer: {
    paddingHorizontal: 40, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.line,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  footerBrand: { fontWeight: 700, fontSize: 8, color: C.navy },
  footerLegal: { fontSize: 6, color: "#9AA3B0", textAlign: "right", lineHeight: 1.5 },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function MItem({ bold, text }: { bold: string; text: string }) {
  return (
    <View style={S.missionItem}>
      <Text style={S.missionDot}>›</Text>
      <Text style={S.missionText}><Text style={S.missionBold}>{bold}</Text>{text}</Text>
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

// Barème dégressif : tranche → taux
// 100-200k: 8%, 200-300k: 7%, 300-400k: 6%, 400-500k: 5%, >500k: 4%
const BAREME = [
  { prix: "100 000 – 200 000 EUR", taux: "8 %", honoEx: "8 000 – 16 000 EUR", apport: "800 – 1 600 EUR" },
  { prix: "200 000 – 300 000 EUR", taux: "7 %", honoEx: "14 000 – 21 000 EUR", apport: "1 400 – 2 100 EUR" },
  { prix: "300 000 – 450 000 EUR", taux: "6 %", honoEx: "18 000 – 27 000 EUR", apport: "1 800 – 2 700 EUR" },
  { prix: "450 000 – 500 000 EUR", taux: "5 %", honoEx: "22 500 – 25 000 EUR", apport: "2 250 – 2 500 EUR" },
  { prix: "Au-dessus de 500 000 EUR", taux: "4 %", honoEx: "20 000 EUR et +", apport: "2 000 EUR et +" },
];

// ── Document ──────────────────────────────────────────────────────────────────
export function FicheApportPromo() {
  return (
    <Document title="Apport d'affaires — Casa Caraïbes" author="Casa Caraïbes">
      <Page size="A4" style={S.page}>

        {/* TOP BAR */}
        <View style={S.topBar}>
          <View style={S.topA} /><View style={S.topB} /><View style={S.topC} />
        </View>

        {/* HERO */}
        <View style={S.hero}>
          <View style={S.heroInner}>
            <View style={S.heroLeft}>
              <Text style={S.heroEyebrow}>PROGRAMME PARTENAIRES · APPORT D'AFFAIRES</Text>
              <Text style={S.heroTitle}>
                Vous connaissez un{"\n"}vendeur ou un bailleur ?{"\n"}
                <Text style={S.heroAccent}>Parlez-nous de lui.</Text>
              </Text>
              <Text style={S.heroSub}>
                Mettez-nous en contact avec un propriétaire souhaitant vendre{"\n"}
                ou mettre en location son bien. Si la transaction aboutit,{"\n"}
                nous vous versons une rétribution directement par virement.
              </Text>
            </View>
            <View style={S.heroRight}>
              <Image src={logoWhite} style={S.logo} />
              <View style={S.heroBadge}>
                <Text style={S.heroBadgePct}>10 %</Text>
                <Text style={S.heroBadgeLabel}>de nos honoraires{"\n"}reversés</Text>
              </View>
            </View>
          </View>
        </View>

        {/* BODY */}
        <View style={S.body}>

          {/* ÉTAPES */}
          <Text style={S.sectionLabel}>COMMENT CA MARCHE — 4 ETAPES SIMPLES</Text>
          <View style={S.stepsRow}>
            {[
              { n: "1", t: "Vous signalez", txt: "Remplissez la fiche de declaration et remettez-la a votre conseiller." },
              { n: "2", t: "Nous contaction", txt: "Nos agents prennent contact avec le proprietaire sous 24 h." },
              { n: "3", t: "Transaction conclue", txt: "Acte notarie signe (vente) ou bail definitif signe (location)." },
              { n: "4", t: "Vous etes retribue(e)", txt: "Virement bancaire des encaissement de nos honoraires." },
            ].map((s, i, arr) => (
              <View key={i} style={{ flexDirection: "row", flex: 1, alignItems: "flex-start" }}>
                <View style={S.step}>
                  <View style={S.stepCircle}><Text style={S.stepNum}>{s.n}</Text></View>
                  <Text style={S.stepTitle}>{s.t}</Text>
                  <Text style={S.stepText}>{s.txt}</Text>
                </View>
                {i < arr.length - 1 && <View style={S.stepSep} />}
              </View>
            ))}
          </View>

          {/* MISSIONS */}
          <Text style={S.sectionLabel}>DEUX TYPES DE MISSIONS</Text>
          <View style={S.missionsRow}>

            {/* VENTE */}
            <View style={S.missionCard}>
              <View style={S.missionHead}>
                <View style={S.missionHeadRow}>
                  <View style={S.missionTag}><Text style={S.missionTagText}>VENTE</Text></View>
                  <Text style={S.missionTitle}>Mandat de vente</Text>
                </View>
                <Text style={S.missionSub}>Appartement, villa, terrain, local commercial...</Text>
              </View>
              <View style={S.missionBody}>
                <MItem bold="Vous signalez " text="un proprietaire souhaitant vendre son bien immobilier" />
                <MItem bold="Mandat signe " text="avec Casa Caraibes dans les 12 mois suivant votre signalement" />
                <MItem bold="Retribution " text="a la signature de l'acte authentique chez le notaire" />
                <MItem bold="Honoraires " text="degressifs selon le prix de vente (voir tableau ci-dessous)" />
              </View>
            </View>

            {/* LOCATION */}
            <View style={S.missionCard}>
              <View style={S.missionHead}>
                <View style={S.missionHeadRow}>
                  <View style={S.missionTag}><Text style={S.missionTagText}>LOCATION</Text></View>
                  <Text style={S.missionTitle}>Mise en location</Text>
                </View>
                <Text style={S.missionSub}>Appartement, villa, maison, local...</Text>
              </View>
              <View style={S.missionBody}>
                <MItem bold="Vous signalez " text="un proprietaire bailleur souhaitant mettre son bien en location" />
                <MItem bold="Mandat signe " text="avec Casa Caraibes dans les 12 mois suivant votre signalement" />
                <MItem bold="Retribution " text="a la signature du bail definitif et encaissement de nos honoraires" />
                <MItem bold="Honoraires " text="equivalents a un mois de loyer charges comprises" />
              </View>
            </View>

          </View>

          {/* RETRIBUTION */}
          <Text style={S.sectionLabel}>VOTRE RETRIBUTION — 10 % DE NOS HONORAIRES TTC</Text>
          <View style={S.rewardsRow}>

            {/* PRO */}
            <View style={S.rewardCard}>
              <View style={S.rewardHeadPro}>
                <Text style={S.rewardTitlePro}>PROFESSIONNEL</Text>
                <View style={S.rewardPill}><Text style={S.rewardPillTxt}>10 % HT</Text></View>
              </View>
              <View style={S.rewardBody}>
                <RItem bold="Paiement : " text="virement bancaire sur presentation d'une facture" />
                <RItem bold="Requis : " text="SIRET valide + RIB + facture detaillant la mission" />
                <RItem bold="TVA : " text="applicable selon votre regime a la date d'emission" />
                <RItem bold="Concerne : " text="agents commerciaux, mandataires, societes" />
              </View>
            </View>

            {/* PARTICULIER */}
            <View style={S.rewardCard}>
              <View style={S.rewardHeadPart}>
                <Text style={S.rewardTitlePart}>PARTICULIER</Text>
                <View style={S.rewardPillGold}><Text style={S.rewardPillTxt}>10 % TTC</Text></View>
              </View>
              <View style={S.rewardBody}>
                <RItem bold="Paiement : " text="virement bancaire sur votre compte personnel" gold />
                <RItem bold="Requis : " text="RIB + copie de votre piece d'identite" gold />
                <RItem bold="Apport ponctuel : " text="non rattache a une activite commerciale reguliere" gold />
                <View style={S.legalNote}>
                  <Text style={S.legalNoteTxt}>
                    <Text style={S.legalNoteBold}>Note fiscale : </Text>
                    Ce versement est legal en France pour un apport occasionnel. Vous devez le declarer comme revenu accessoire (BNC). Un justificatif vous sera fourni.
                  </Text>
                </View>
              </View>
            </View>

          </View>

          {/* TABLEAU EXEMPLES */}
          <Text style={S.tableTitle}>Exemples de retribution selon le bareme d'honoraires</Text>
          <View style={S.tableWrap}>
            <View style={S.tableHead}>
              <Text style={[S.thCell, S.th1]}>Prix de vente</Text>
              <Text style={[S.thCell, S.th2]}>Taux honoraires</Text>
              <Text style={[S.thCell, S.th3]}>Honoraires agence</Text>
              <Text style={[S.thCell, S.th4]}>Votre gain (10 %)</Text>
            </View>
            {BAREME.map((r, i) => (
              <View key={i} style={[S.tableRow, i % 2 !== 0 ? S.tableRowAlt : {}]}>
                <Text style={[S.tdBase, S.td1]}>{r.prix}</Text>
                <Text style={[S.tdBase, S.td2]}>{r.taux}</Text>
                <Text style={[S.tdBase, S.td3]}>{r.honoEx}</Text>
                <Text style={[S.tdBase, S.td4]}>{r.apport}</Text>
              </View>
            ))}
          </View>

          {/* CONDITIONS */}
          <View style={S.condBox}>
            <Text style={S.condTitle}>Conditions de declenchement de la retribution</Text>
            {[
              ["Le proprietaire apporte a signe un mandat avec Casa Caraibes ", "dans les 12 mois", " suivant la remise de votre fiche."],
              ["La transaction est finalisee : ", "acte authentique signe chez le notaire (vente) ou bail definitif signe (location)", "."],
              ["Casa Caraibes a ", "integralement encaisse ses honoraires", " avant tout versement."],
              ["Si l'une de ces conditions n'est pas remplie, ", "aucune retribution ne sera versee", "."],
            ].map(([a, b, c], i) => (
              <View key={i} style={S.condRow}>
                <Text style={S.condNum}>{i + 1}.</Text>
                <Text style={S.condTxt}>{a}<Text style={S.condBold}>{b}</Text>{c}</Text>
              </View>
            ))}
          </View>

          {/* CONTACT */}
          <View style={S.ctaBox}>
            <View style={S.ctaLeft}>
              <Text style={S.ctaTitle}>Pret(e) a nous recommander un bien ?</Text>
              <Text style={S.ctaSub}>
                Remplissez la fiche de declaration ci-jointe et remettez-la a votre conseiller.{"\n"}
                Nous contactons le proprietaire sous 24 heures ouvrees.
              </Text>
            </View>
            <View style={S.ctaRight}>
              {[["Tel.", "0696 XX XX XX"], ["Email", "contact@casacaraibes.com"], ["Web", "www.casacaraibes.com"]].map(([l, v]) => (
                <View key={l} style={S.ctaItem}>
                  <View style={S.ctaDot} />
                  <Text style={S.ctaVal}>{l}  {v}</Text>
                </View>
              ))}
            </View>
          </View>

        </View>

        {/* FOOTER */}
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
