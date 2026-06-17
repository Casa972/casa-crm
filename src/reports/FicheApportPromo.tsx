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
};

const PAD = 26;

const S = StyleSheet.create({
  // Page avec padding global — s'applique à toutes les pages (y compris page 2+)
  page: {
    fontFamily: "Montserrat",
    fontWeight: 400,
    fontSize: 11,
    color: C.ink,
    backgroundColor: C.white,
    paddingTop: PAD,
    paddingBottom: 16,
    paddingHorizontal: PAD,
  },

  // TOP BAR — sort du padding de la page pour rester bord-à-bord
  topBar: { height: 6, flexDirection: "row", marginTop: -PAD, marginHorizontal: -PAD },
  topA: { flex: 2, backgroundColor: C.teal },
  topB: { flex: 1, backgroundColor: C.gold },
  topC: { flex: 3, backgroundColor: C.navy },

  // HERO — sort du padding horizontal pour rester pleine largeur
  hero: {
    backgroundColor: C.navy,
    paddingHorizontal: PAD,
    paddingTop: 22,
    paddingBottom: 22,
    marginHorizontal: -PAD,
  },
  heroLogo: { width: 120, height: 37, objectFit: "contain", marginBottom: 14 },
  heroTitle: { color: C.white, fontWeight: 700, fontSize: 23, lineHeight: 1.25, marginBottom: 9 },
  heroAccent: { color: C.teal },
  heroSub: { color: "#8BA5BF", fontSize: 11, lineHeight: 1.6, marginBottom: 16 },
  heroBadgeRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroBadge: { backgroundColor: C.teal, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10, alignItems: "center" },
  heroBadgePct: { color: C.white, fontWeight: 700, fontSize: 30 },
  heroBadgeLabel: { color: "#B2EEE8", fontSize: 9, fontWeight: 500, textAlign: "center", marginTop: 2 },
  heroBadgeSub: { color: "#8BA5BF", fontSize: 11, lineHeight: 1.55, flex: 1 },

  // BODY — juste un espaceur vertical, le padding horiz est géré par la page
  body: { paddingTop: 16, paddingBottom: 0 },

  // SECTION LABEL
  sectionLabel: { fontSize: 8.5, fontWeight: 700, letterSpacing: 2, color: C.teal, marginBottom: 11, marginTop: 20 },

  // ÉTAPES
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 9, gap: 13 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.teal, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  stepNum: { color: C.white, fontWeight: 700, fontSize: 13 },
  stepContent: { flex: 1 },
  stepTitle: { fontWeight: 700, fontSize: 12, color: C.navy, marginBottom: 2 },
  stepText: { fontSize: 10.5, color: C.sub, lineHeight: 1.5 },

  // CARDS
  card: { borderRadius: 7, borderWidth: 1, borderColor: C.line, overflow: "hidden", marginBottom: 10 },
  cardHeadNavy: { backgroundColor: C.navyMid, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  cardHeadGold: { backgroundColor: C.goldSoft, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EDD9A3" },
  cardTag: { backgroundColor: C.teal, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  cardTagTxt: { color: C.white, fontWeight: 700, fontSize: 10 },
  cardTitle: { color: C.white, fontWeight: 700, fontSize: 13 },
  cardTitleGold: { color: C.gold, fontWeight: 700, fontSize: 13 },
  cardSub: { color: "#8BA5BF", fontSize: 9.5, marginTop: 1 },
  cardBody: { padding: 12, backgroundColor: C.white },
  pill: { backgroundColor: C.teal, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillGold: { backgroundColor: C.gold, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillTxt: { color: C.white, fontWeight: 700, fontSize: 10 },

  // ITEMS
  item: { flexDirection: "row", marginBottom: 5 },
  itemDot: { width: 12, color: C.teal, fontWeight: 700, fontSize: 11 },
  itemDotGold: { width: 12, color: C.gold, fontWeight: 700, fontSize: 11 },
  itemTxt: { flex: 1, fontSize: 11, color: C.sub, lineHeight: 1.5 },
  itemBold: { fontWeight: 600, color: C.ink },

  // NOTE LÉGALE
  legalNote: { marginTop: 8, backgroundColor: C.offWhite, borderRadius: 4, padding: 8, borderLeftWidth: 2, borderLeftColor: C.gold },
  legalNoteTxt: { fontSize: 9.5, color: C.sub, lineHeight: 1.55 },
  legalNoteBold: { fontWeight: 600, color: C.gold },

  // TABLEAU
  tableSection: { marginTop: 20 },
  tableTitle: { fontWeight: 700, fontSize: 12, color: C.navy, marginBottom: 8 },
  tableWrap: { borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: C.line },
  tableHead: { flexDirection: "row", backgroundColor: C.navy },
  thCell: { color: C.white, fontWeight: 600, fontSize: 10.5, paddingHorizontal: 10, paddingVertical: 8, textAlign: "center" },
  th1: { width: "42%" }, th2: { width: "20%" }, th3: { width: "38%" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line },
  tableRowAlt: { backgroundColor: C.offWhite },
  td: { fontSize: 11, paddingHorizontal: 10, paddingVertical: 7, textAlign: "center" },
  td1: { width: "42%", fontWeight: 700, color: C.navy },
  td2: { width: "20%", color: C.sub, fontWeight: 600 },
  td3: { width: "38%", fontWeight: 700, color: C.teal },

  // CONDITIONS
  condBox: { backgroundColor: C.offWhite, borderRadius: 8, padding: 14, marginTop: 20, borderWidth: 1, borderColor: C.line },
  condTitle: { fontWeight: 700, fontSize: 12, color: C.navy, marginBottom: 9 },
  condRow: { flexDirection: "row", marginBottom: 6 },
  condNum: { width: 18, fontWeight: 700, fontSize: 11, color: C.teal },
  condTxt: { flex: 1, fontSize: 11, color: C.sub, lineHeight: 1.55 },
  condBold: { fontWeight: 600, color: C.ink },

  // CTA
  ctaBox: { backgroundColor: C.navy, borderRadius: 10, padding: 20, marginTop: 20 },
  ctaTitle: { color: C.white, fontWeight: 700, fontSize: 15, marginBottom: 6, textAlign: "center" },
  ctaSub: { color: "#8BA5BF", fontSize: 11, lineHeight: 1.6, textAlign: "center", marginBottom: 16 },
  ctaItem: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 7 },
  ctaDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.teal },
  ctaVal: { color: C.white, fontWeight: 600, fontSize: 13 },

  // FOOTER
  footer: { paddingTop: 9, borderTopWidth: 1, borderTopColor: C.line, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerBrand: { fontWeight: 700, fontSize: 10, color: C.navy },
  footerLegal: { fontSize: 8, color: "#9AA3B0", textAlign: "right", lineHeight: 1.5 },
});

function Item({ bold, text, gold }: { bold: string; text: string; gold?: boolean }) {
  return (
    <View style={S.item}>
      <Text style={gold ? S.itemDotGold : S.itemDot}>›</Text>
      <Text style={S.itemTxt}><Text style={S.itemBold}>{bold}</Text>{text}</Text>
    </View>
  );
}

const BAREME = [
  { prix: "100 000 a 200 000 EUR", taux: "8 %",  apport: "800 a 1 600 EUR" },
  { prix: "200 000 a 300 000 EUR", taux: "7 %",  apport: "1 400 a 2 100 EUR" },
  { prix: "300 000 a 400 000 EUR", taux: "6 %",  apport: "1 800 a 2 400 EUR" },
  { prix: "400 000 a 500 000 EUR", taux: "5 %",  apport: "2 000 a 2 500 EUR" },
];

export function FicheApportPromo() {
  return (
    <Document title="Apport d'affaires — Casa Caraibes" author="Casa Caraibes">
      <Page size="A4" style={S.page}>

        {/* Barre colorée — marges négatives pour couvrir le padding de la page */}
        <View style={S.topBar}>
          <View style={S.topA} /><View style={S.topB} /><View style={S.topC} />
        </View>

        {/* ── HERO ── */}
        <View style={S.hero}>
          <Image src={logoWhite} style={S.heroLogo} />
          <Text style={S.heroTitle}>
            Vous connaissez un vendeur{"\n"}ou un bailleur ?{" "}
            <Text style={S.heroAccent}>Parlez-nous de lui.</Text>
          </Text>
          <Text style={S.heroSub}>
            Mettez-nous en contact avec un proprietaire souhaitant vendre ou louer son bien.
            Si la transaction aboutit, nous vous versons une retribution par virement bancaire.
          </Text>
          <View style={S.heroBadgeRow}>
            <View style={S.heroBadge}>
              <Text style={S.heroBadgePct}>10 %</Text>
              <Text style={S.heroBadgeLabel}>de nos honoraires</Text>
            </View>
            <Text style={S.heroBadgeSub}>
              Verses directement sur votre compte des la transaction finalisee et nos honoraires encaisses.
            </Text>
          </View>
        </View>

        <View style={S.body}>

          {/* ── ÉTAPES ── */}
          <Text style={S.sectionLabel}>COMMENT CA MARCHE</Text>
          {[
            { n: "1", t: "Vous nous signalez le bien", txt: "Remplissez la fiche de declaration jointe et transmettez-la a votre conseiller Casa Caraibes." },
            { n: "2", t: "Nous contactons le proprietaire", txt: "Nos agents prennent contact sous 24 heures et organisent la visite." },
            { n: "3", t: "La transaction se conclut", txt: "Acte authentique chez le notaire (vente) ou bail definitif signe (location)." },
            { n: "4", t: "Vous etes retribue(e)", txt: "Virement bancaire de 10 % de nos honoraires TTC des leur encaissement." },
          ].map((s, i) => (
            <View key={i} style={S.stepRow}>
              <View style={S.stepCircle}><Text style={S.stepNum}>{s.n}</Text></View>
              <View style={S.stepContent}>
                <Text style={S.stepTitle}>{s.t}</Text>
                <Text style={S.stepText}>{s.txt}</Text>
              </View>
            </View>
          ))}

          {/* ── MISSIONS ── */}
          <Text style={S.sectionLabel}>DEUX TYPES DE MISSIONS</Text>

          <View wrap={false} style={S.card}>
            <View style={S.cardHeadNavy}>
              <View style={S.cardTag}><Text style={S.cardTagTxt}>VENTE</Text></View>
              <View>
                <Text style={S.cardTitle}>Mandat de vente</Text>
                <Text style={S.cardSub}>Appartement, villa, terrain, local commercial...</Text>
              </View>
            </View>
            <View style={S.cardBody}>
              <Item bold="Vous signalez " text="un proprietaire souhaitant vendre son bien immobilier" />
              <Item bold="Retribution " text="a la signature de l'acte authentique chez le notaire" />
              <Item bold="Honoraires degressifs " text="de 8 % a 5 % selon le prix de vente (voir tableau)" />
            </View>
          </View>

          <View wrap={false} style={S.card}>
            <View style={S.cardHeadNavy}>
              <View style={S.cardTag}><Text style={S.cardTagTxt}>LOCATION</Text></View>
              <View>
                <Text style={S.cardTitle}>Mise en location</Text>
                <Text style={S.cardSub}>Appartement, villa, maison, local...</Text>
              </View>
            </View>
            <View style={S.cardBody}>
              <Item bold="Vous signalez " text="un proprietaire bailleur souhaitant mettre son bien en location" />
              <Item bold="Retribution " text="a la signature du bail definitif et encaissement de nos honoraires" />
              <Item bold="Honoraires " text="equivalents a un mois de loyer charges comprises" />
            </View>
          </View>

          {/* ── RÉTRIBUTION ── */}
          <Text style={S.sectionLabel}>VOTRE RETRIBUTION — 10 % DE NOS HONORAIRES</Text>

          <View wrap={false} style={S.card}>
            <View style={S.cardHeadNavy}>
              <View style={{ flex: 1 }}>
                <Text style={S.cardTitle}>Professionnel</Text>
                <Text style={S.cardSub}>Agent commercial, mandataire, societe de conseil</Text>
              </View>
              <View style={S.pill}><Text style={S.pillTxt}>10 % HT — virement sur facture</Text></View>
            </View>
            <View style={S.cardBody}>
              <Item bold="Requis : " text="SIRET valide + RIB + facture detaillant la mission" />
              <Item bold="TVA : " text="applicable selon votre regime fiscal a la date d'emission" />
            </View>
          </View>

          <View wrap={false} style={S.card}>
            <View style={S.cardHeadGold}>
              <Text style={S.cardTitleGold}>Particulier</Text>
              <View style={S.pillGold}><Text style={S.pillTxt}>10 % TTC — virement bancaire</Text></View>
            </View>
            <View style={S.cardBody}>
              <Item bold="Requis : " text="RIB + copie de votre piece d'identite — aucune facture necessaire" gold />
              <Item bold="Apport ponctuel : " text="non rattache a une activite commerciale reguliere" gold />
              <View style={S.legalNote}>
                <Text style={S.legalNoteTxt}>
                  <Text style={S.legalNoteBold}>Note fiscale : </Text>
                  Ce versement est legal en France pour un apport occasionnel. Il doit etre declare comme revenu accessoire (BNC). Un justificatif vous sera fourni.
                </Text>
              </View>
            </View>
          </View>

          {/* ── TABLEAU ── */}
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
                  <Text style={[S.td, S.td1]}>{r.prix}</Text>
                  <Text style={[S.td, S.td2]}>{r.taux}</Text>
                  <Text style={[S.td, S.td3]}>{r.apport}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── CONDITIONS ── */}
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

          {/* ── CTA ── */}
          <View wrap={false} style={S.ctaBox}>
            <Text style={S.ctaTitle}>Pret(e) a nous recommander un bien ?</Text>
            <Text style={S.ctaSub}>
              Remplissez la fiche de declaration ci-jointe et remettez-la a votre conseiller.{"\n"}
              Nous contactons le proprietaire sous 24 heures ouvrees.
            </Text>
            {[["Tel.", "0696 43 39 49"], ["Email", "contact@casacaraibes.com"], ["Web", "www.casacaraibes.com"]].map(([l, v]) => (
              <View key={l} style={S.ctaItem}>
                <View style={S.ctaDot} />
                <Text style={S.ctaVal}>{l}  {v}</Text>
              </View>
            ))}
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
