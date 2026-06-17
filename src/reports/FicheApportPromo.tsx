import { Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer";

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
  navy:      "#0D2137",
  navyLight: "#1A3A52",
  teal:      "#0E9F8E",
  tealSoft:  "#E6FAF8",
  gold:      "#C9831A",
  goldSoft:  "#FEF3DC",
  white:     "#FFFFFF",
  offWhite:  "#F7F9FB",
  ink:       "#1C1C1A",
  sub:       "#5A6478",
  line:      "#DDE3EC",
  success:   "#059669",
};

const S = StyleSheet.create({
  page: {
    fontFamily: "Montserrat",
    fontWeight: 400,
    fontSize: 9,
    color: C.ink,
    backgroundColor: C.white,
  },

  // ── BANDE COULEUR TOP ──
  topAccent: { height: 5, flexDirection: "row" },
  topA: { flex: 2, backgroundColor: C.teal },
  topB: { flex: 1, backgroundColor: C.gold },
  topC: { flex: 3, backgroundColor: C.navy },

  // ── HERO ──
  hero: {
    backgroundColor: C.navy,
    paddingHorizontal: 44,
    paddingTop: 28,
    paddingBottom: 26,
  },
  heroEyebrow: {
    color: C.teal,
    fontWeight: 600,
    fontSize: 7.5,
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  heroRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  heroLeft: { flex: 1 },
  heroTitle: {
    color: C.white,
    fontWeight: 700,
    fontSize: 23,
    lineHeight: 1.2,
    marginBottom: 10,
  },
  heroTitleAccent: { color: C.teal },
  heroSub: {
    color: "#8BA5BF",
    fontSize: 9.5,
    lineHeight: 1.65,
    maxWidth: 310,
  },
  heroBadge: {
    backgroundColor: C.teal,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 20,
    minWidth: 100,
  },
  heroBadgePct: { color: C.white, fontWeight: 700, fontSize: 30 },
  heroBadgeLabel: { color: "#B2EEE8", fontSize: 7.5, fontWeight: 500, textAlign: "center", marginTop: 2 },

  // ── BODY ──
  body: { paddingHorizontal: 44, paddingTop: 22, paddingBottom: 18 },

  // ── SECTION LABEL ──
  sectionLabel: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 2,
    color: C.teal,
    marginBottom: 12,
  },

  // ── MISSIONS (2 colonnes) ──
  missionsRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  missionCard: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.line,
    overflow: "hidden",
  },
  missionHeader: {
    backgroundColor: C.navyLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  missionIcon: {
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: C.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  missionIconText: { color: C.white, fontSize: 10 },
  missionTitle: { color: C.white, fontWeight: 700, fontSize: 10.5 },
  missionSub: { color: "#8BA5BF", fontSize: 7.5, marginTop: 1 },
  missionBody: { padding: 12, backgroundColor: C.white },
  missionBullet: { flexDirection: "row", marginBottom: 5 },
  missionDot: { width: 12, color: C.teal, fontWeight: 700, fontSize: 9 },
  missionText: { flex: 1, fontSize: 8, color: C.sub, lineHeight: 1.5 },
  missionBold: { fontWeight: 600, color: C.ink },

  // ── RÉCOMPENSES ──
  rewardsRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  rewardCard: {
    flex: 1,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.line,
  },
  rewardCardHead: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rewardCardHeadPro: { backgroundColor: C.navyLight },
  rewardCardHeadPart: { backgroundColor: C.goldSoft, borderBottomWidth: 1, borderBottomColor: "#F0D8A8" },
  rewardCardTitlePro: { color: C.white, fontWeight: 700, fontSize: 9 },
  rewardCardTitlePart: { color: C.gold, fontWeight: 700, fontSize: 9 },
  rewardPill: {
    backgroundColor: C.teal,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rewardPillGold: {
    backgroundColor: C.gold,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rewardPillText: { color: C.white, fontWeight: 700, fontSize: 8 },
  rewardCardBody: { padding: 12, backgroundColor: C.white },
  rewardItem: { flexDirection: "row", marginBottom: 5 },
  rewardDot: { width: 12, color: C.teal, fontWeight: 700, fontSize: 9 },
  rewardDotGold: { width: 12, color: C.gold, fontWeight: 700, fontSize: 9 },
  rewardText: { flex: 1, fontSize: 8, color: C.sub, lineHeight: 1.5 },
  rewardBold: { fontWeight: 600, color: C.ink },
  legalNote: {
    marginTop: 8,
    backgroundColor: C.offWhite,
    borderRadius: 4,
    padding: 7,
    borderLeftWidth: 2,
    borderLeftColor: C.gold,
  },
  legalNoteText: { fontSize: 7, color: C.sub, lineHeight: 1.55 },
  legalNoteBold: { fontWeight: 600, color: C.gold },

  // ── TABLEAU EXEMPLES ──
  tableTitle: { fontWeight: 700, fontSize: 9.5, color: C.navy, marginBottom: 8 },
  tableWrap: { borderRadius: 6, overflow: "hidden", marginBottom: 22, borderWidth: 1, borderColor: C.line },
  tableHead: { flexDirection: "row", backgroundColor: C.navy },
  tableHeadCell: {
    flex: 1,
    color: C.white,
    fontWeight: 600,
    fontSize: 7.5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    textAlign: "center",
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line },
  tableRowAlt: { backgroundColor: C.offWhite },
  tableCell: { flex: 1, fontSize: 8, paddingHorizontal: 9, paddingVertical: 6, textAlign: "center" },
  tableCellPrix: { fontWeight: 700, color: C.navy },
  tableCellHonos: { color: C.sub },
  tableCellGain: { fontWeight: 700, color: C.success },

  // ── ÉTAPES ──
  stepsRow: { flexDirection: "row", gap: 0, marginBottom: 22 },
  step: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.teal,
    alignItems: "center", justifyContent: "center",
    marginBottom: 6,
  },
  stepNum: { color: C.white, fontWeight: 700, fontSize: 12 },
  stepTitle: { fontWeight: 700, fontSize: 8.5, color: C.navy, textAlign: "center", marginBottom: 3 },
  stepText: { fontSize: 7.5, color: C.sub, textAlign: "center", lineHeight: 1.5 },
  stepDivider: { width: 1, backgroundColor: C.line, alignSelf: "stretch", marginTop: 14 },

  // ── CONDITIONS ──
  condBox: {
    backgroundColor: C.offWhite,
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.line,
  },
  condTitle: { fontWeight: 700, fontSize: 8.5, color: C.navy, marginBottom: 8 },
  condRow: { flexDirection: "row", marginBottom: 4 },
  condNum: { width: 14, fontWeight: 700, fontSize: 8, color: C.teal },
  condText: { flex: 1, fontSize: 8, color: C.sub, lineHeight: 1.55 },
  condBold: { fontWeight: 600, color: C.ink },

  // ── CONTACT ──
  contactBox: {
    backgroundColor: C.navy,
    borderRadius: 8,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    marginBottom: 16,
  },
  contactLeft: { flex: 1 },
  contactTitle: { color: C.white, fontWeight: 700, fontSize: 12, marginBottom: 3 },
  contactSub: { color: "#8BA5BF", fontSize: 8.5, lineHeight: 1.6 },
  contactRight: { gap: 6 },
  contactItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  contactDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.teal },
  contactValue: { color: C.white, fontWeight: 600, fontSize: 8.5 },

  // ── FOOTER ──
  footer: {
    paddingHorizontal: 44,
    paddingBottom: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerBrand: { fontWeight: 700, fontSize: 8.5, color: C.navy },
  footerLegal: { fontSize: 6.5, color: "#9AA3B0", textAlign: "right", lineHeight: 1.5 },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function MissionBullet({ bold, text }: { bold: string; text: string }) {
  return (
    <View style={S.missionBullet}>
      <Text style={S.missionDot}>›</Text>
      <Text style={S.missionText}><Text style={S.missionBold}>{bold}</Text>{text}</Text>
    </View>
  );
}

function RewardItem({ bold, text, gold }: { bold: string; text: string; gold?: boolean }) {
  return (
    <View style={S.rewardItem}>
      <Text style={gold ? S.rewardDotGold : S.rewardDot}>›</Text>
      <Text style={S.rewardText}><Text style={S.rewardBold}>{bold}</Text>{text}</Text>
    </View>
  );
}

// ── Composant ─────────────────────────────────────────────────────────────────
export function FicheApportPromo() {
  const examples = [
    ["180 000 EUR", "10 800 EUR", "1 080 EUR"],
    ["280 000 EUR", "16 800 EUR", "1 680 EUR"],
    ["420 000 EUR", "25 200 EUR", "2 520 EUR"],
    ["650 000 EUR", "39 000 EUR", "3 900 EUR"],
  ];

  return (
    <Document title="Apport d'affaires — Casa Caraïbes" author="Casa Caraïbes">
      <Page size="A4" style={S.page}>

        {/* ── TOP ACCENT ───────────────────────────── */}
        <View style={S.topAccent}>
          <View style={S.topA} /><View style={S.topB} /><View style={S.topC} />
        </View>

        {/* ── HERO ─────────────────────────────────── */}
        <View style={S.hero}>
          <Text style={S.heroEyebrow}>CASA CARAÏBES · PROGRAMME PARTENAIRES</Text>
          <View style={S.heroRow}>
            <View style={S.heroLeft}>
              <Text style={S.heroTitle}>
                Vous connaissez{"\n"}un vendeur ou{"\n"}un bailleur ?{" "}
                <Text style={S.heroTitleAccent}>Parlez-nous de lui.</Text>
              </Text>
              <Text style={S.heroSub}>
                Mettez-nous en contact avec un propriétaire souhaitant vendre ou louer son bien.
                Si la transaction aboutit, nous vous versons une rétribution en argent.
              </Text>
            </View>
            <View style={S.heroBadge}>
              <Text style={S.heroBadgePct}>10%</Text>
              <Text style={S.heroBadgeLabel}>de nos honoraires{"\n"}reversés</Text>
            </View>
          </View>
        </View>

        {/* ── BODY ─────────────────────────────────── */}
        <View style={S.body}>

          {/* COMMENT ÇA MARCHE */}
          <Text style={S.sectionLabel}>COMMENT ÇA MARCHE</Text>
          <View style={S.stepsRow}>
            {[
              { n: "1", title: "Vous signalez", text: "Remplissez la fiche ci-jointe et transmettez-la à votre conseiller Casa Caraïbes." },
              { n: "2", title: "Nous prenons contact", text: "Nos agents contactent le propriétaire, visitent et obtiennent le mandat." },
              { n: "3", title: "La vente ou location se conclut", text: "Acte signé chez le notaire ou bail définitif signé." },
              { n: "4", title: "Vous êtes rétribué(e)", text: "Dès nos honoraires encaissés, nous vous versons 10 % par virement bancaire." },
            ].map((s, i, arr) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", flex: 1 }}>
                <View style={S.step}>
                  <View style={S.stepCircle}><Text style={S.stepNum}>{s.n}</Text></View>
                  <Text style={S.stepTitle}>{s.title}</Text>
                  <Text style={S.stepText}>{s.text}</Text>
                </View>
                {i < arr.length - 1 && <View style={S.stepDivider} />}
              </View>
            ))}
          </View>

          {/* MISSIONS */}
          <Text style={S.sectionLabel}>DEUX TYPES DE MISSIONS</Text>
          <View style={S.missionsRow}>
            {/* VENTE */}
            <View style={S.missionCard}>
              <View style={S.missionHeader}>
                <View style={S.missionIcon}><Text style={S.missionIconText}>🏠</Text></View>
                <View>
                  <Text style={S.missionTitle}>VENTE</Text>
                  <Text style={S.missionSub}>Mandat de vente</Text>
                </View>
              </View>
              <View style={S.missionBody}>
                <MissionBullet bold="Vous signalez " text="un propriétaire qui souhaite vendre un bien (appartement, villa, terrain, local…)" />
                <MissionBullet bold="Mandat signé " text="avec Casa Caraïbes dans les 12 mois suivant votre signalement" />
                <MissionBullet bold="Rétribution déclenchée " text="à la signature de l'acte authentique chez le notaire" />
              </View>
            </View>
            {/* LOCATION */}
            <View style={S.missionCard}>
              <View style={S.missionHeader}>
                <View style={S.missionIcon}><Text style={S.missionIconText}>🔑</Text></View>
                <View>
                  <Text style={S.missionTitle}>LOCATION / GESTION</Text>
                  <Text style={S.missionSub}>Mandat de gestion locative</Text>
                </View>
              </View>
              <View style={S.missionBody}>
                <MissionBullet bold="Vous signalez " text="un propriétaire bailleur souhaitant louer ou confier la gestion de son bien" />
                <MissionBullet bold="Mandat de gestion signé " text="avec Casa Caraïbes dans les 12 mois suivant votre signalement" />
                <MissionBullet bold="Rétribution déclenchée " text="à la signature du bail définitif et encaissement de nos honoraires" />
              </View>
            </View>
          </View>

          {/* RÉTRIBUTION */}
          <Text style={S.sectionLabel}>VOTRE RÉTRIBUTION — 10 % DE NOS HONORAIRES</Text>
          <View style={S.rewardsRow}>
            {/* PRO */}
            <View style={S.rewardCard}>
              <View style={[S.rewardCardHead, S.rewardCardHeadPro]}>
                <Text style={S.rewardCardTitlePro}>APPORTEUR PROFESSIONNEL</Text>
                <View style={S.rewardPill}><Text style={S.rewardPillText}>10 % HT</Text></View>
              </View>
              <View style={S.rewardCardBody}>
                <RewardItem bold="Paiement : " text="virement bancaire, sur présentation d'une facture conforme" />
                <RewardItem bold="Conditions : " text="SIRET valide + RIB + facture mentionnant la nature de la mission" />
                <RewardItem bold="TVA : " text="applicable selon votre régime fiscal à la date d'émission" />
                <RewardItem bold="Concerne : " text="agents commerciaux, mandataires, conseillers, sociétés" />
              </View>
            </View>
            {/* PARTICULIER */}
            <View style={S.rewardCard}>
              <View style={[S.rewardCardHead, S.rewardCardHeadPart]}>
                <Text style={S.rewardCardTitlePart}>APPORTEUR PARTICULIER</Text>
                <View style={S.rewardPillGold}><Text style={S.rewardPillText}>10 % TTC</Text></View>
              </View>
              <View style={S.rewardCardBody}>
                <RewardItem bold="Paiement : " text="virement bancaire sur votre compte personnel" gold />
                <RewardItem bold="Conditions : " text="RIB + copie pièce d'identité — aucune facture requise" gold />
                <RewardItem bold="Apport ponctuel : " text="non rattaché à une activité commerciale régulière" gold />
                <View style={S.legalNote}>
                  <Text style={S.legalNoteText}>
                    <Text style={S.legalNoteBold}>Information fiscale : </Text>
                    Ce versement est légal en France pour un apport occasionnel. Vous devez le déclarer comme revenu accessoire (BNC) dans votre déclaration d'impôts. Casa Caraïbes vous fournira un justificatif de paiement.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* EXEMPLES */}
          <Text style={S.tableTitle}>Exemples de rétribution (honoraires d'agence 6 % TTC)</Text>
          <View style={S.tableWrap}>
            <View style={S.tableHead}>
              <Text style={S.tableHeadCell}>Prix de vente / Loyer annuel</Text>
              <Text style={S.tableHeadCell}>Honoraires agence</Text>
              <Text style={S.tableHeadCell}>Votre rétribution (10 %)</Text>
            </View>
            {examples.map(([prix, honos, gain], i) => (
              <View key={i} style={[S.tableRow, i % 2 !== 0 ? S.tableRowAlt : {}]}>
                <Text style={[S.tableCell, S.tableCellPrix]}>{prix}</Text>
                <Text style={[S.tableCell, S.tableCellHonos]}>{honos}</Text>
                <Text style={[S.tableCell, S.tableCellGain]}>{gain}</Text>
              </View>
            ))}
          </View>

          {/* CONDITIONS */}
          <View style={S.condBox}>
            <Text style={S.condTitle}>Conditions de déclenchement de la rétribution</Text>
            {[
              ["La rétribution est due uniquement si ", "les trois conditions suivantes sont réunies simultanément", "."],
              ["Le propriétaire apporté a signé un mandat avec Casa Caraïbes ", "dans les 12 mois", " suivant votre fiche."],
              ["La transaction est finalisée : ", "acte authentique signé (vente) ou bail définitif signé (location)", "."],
              ["Casa Caraïbes a ", "intégralement encaissé ses honoraires", " avant tout versement."],
            ].map(([a, b, c], i) => (
              <View key={i} style={S.condRow}>
                <Text style={S.condNum}>{i + 1}.</Text>
                <Text style={S.condText}>{a}<Text style={S.condBold}>{b}</Text>{c}</Text>
              </View>
            ))}
          </View>

          {/* CONTACT */}
          <View style={S.contactBox}>
            <View style={S.contactLeft}>
              <Text style={S.contactTitle}>Prêt(e) à nous recommander un bien ?</Text>
              <Text style={S.contactSub}>
                Remplissez la fiche de déclaration ci-jointe et remettez-la à votre conseiller.{"\n"}
                Nous prenons contact avec le propriétaire sous 24 heures ouvrées.
              </Text>
            </View>
            <View style={S.contactRight}>
              {[
                ["Téléphone", "0696 XX XX XX"],
                ["Email", "contact@casacaraibes.com"],
                ["Site web", "www.casacaraibes.com"],
              ].map(([label, val]) => (
                <View key={label} style={S.contactItem}>
                  <View style={S.contactDot} />
                  <Text style={S.contactValue}>{label} : {val}</Text>
                </View>
              ))}
            </View>
          </View>

        </View>

        {/* ── FOOTER ───────────────────────────────── */}
        <View style={S.footer}>
          <Text style={S.footerBrand}>CASA CARAÏBES</Text>
          <Text style={S.footerLegal}>
            Agence immobilière — Martinique · RCS Fort-de-France 928 647 981{"\n"}
            Carte pro T n°CPI97212024000000007 · Garantie financière AXA
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
