import { Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer";

// ── Polices Montserrat ────────────────────────────────────────────────────────
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

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  navy:     "#0F2741",
  navyMid:  "#1A3A52",
  teal:     "#0D9488",
  tealLight:"#CCFBF1",
  gold:     "#D97706",
  goldLight:"#FEF3C7",
  white:    "#FFFFFF",
  offWhite: "#F8FAFC",
  ink:      "#1A1A18",
  sub:      "#64748B",
  line:     "#E2E8F0",
  danger:   "#DC2626",
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: "Montserrat", fontWeight: 400, fontSize: 9,
    color: C.ink, backgroundColor: C.white,
  },

  // ── HERO ──
  hero: {
    backgroundColor: C.navy,
    paddingHorizontal: 40, paddingTop: 36, paddingBottom: 32,
    position: "relative",
  },
  heroEyebrow: {
    color: C.teal, fontWeight: 600, fontSize: 8, letterSpacing: 2,
    textTransform: "uppercase", marginBottom: 10,
  },
  heroTitle: {
    color: C.white, fontWeight: 700, fontSize: 28, lineHeight: 1.15,
    marginBottom: 12,
  },
  heroAccent: { color: C.teal },
  heroSub: {
    color: "#94A3B8", fontWeight: 400, fontSize: 11, lineHeight: 1.6,
    maxWidth: 340,
  },
  heroTag: {
    marginTop: 18,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  heroPill: {
    backgroundColor: C.teal, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    flexDirection: "row", alignItems: "center", gap: 5,
  },
  heroPillText: { color: C.white, fontWeight: 700, fontSize: 10 },
  heroPillSub: { color: "#94A3B8", fontSize: 9, fontWeight: 500 },

  // ── BANDE DÉCORATIVE ──
  stripe: {
    height: 4,
    flexDirection: "row",
  },
  stripeA: { flex: 3, backgroundColor: C.teal },
  stripeB: { flex: 1, backgroundColor: C.gold },
  stripeC: { flex: 2, backgroundColor: C.navy },

  // ── BODY ──
  body: { paddingHorizontal: 40, paddingTop: 28, paddingBottom: 24 },

  // ── SECTION TITRE ──
  sectionLabel: {
    fontSize: 7.5, fontWeight: 700, letterSpacing: 1.5,
    color: C.teal, textTransform: "uppercase", marginBottom: 14,
  },

  // ── STEPS ──
  stepsRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  step: {
    flex: 1, alignItems: "center",
  },
  stepNumWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.teal,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  stepNum: { color: C.white, fontWeight: 700, fontSize: 14 },
  stepTitle: { fontWeight: 700, fontSize: 9.5, color: C.navy, textAlign: "center", marginBottom: 4 },
  stepText: { fontSize: 8, color: C.sub, textAlign: "center", lineHeight: 1.5 },
  stepArrow: {
    position: "absolute", top: 17, right: -8,
    fontSize: 14, color: C.teal, fontWeight: 700,
  },

  // ── RÉCOMPENSES ──
  rewardBox: {
    backgroundColor: C.goldLight,
    borderRadius: 8,
    borderLeftWidth: 4, borderLeftColor: C.gold,
    padding: 16, marginBottom: 28,
  },
  rewardTitle: { fontWeight: 700, fontSize: 11, color: C.gold, marginBottom: 10 },
  rewardRow: { flexDirection: "row", gap: 10 },
  rewardCard: {
    flex: 1, backgroundColor: C.white, borderRadius: 6,
    padding: 12, alignItems: "center",
    borderWidth: 1, borderColor: "#FDE68A",
  },
  rewardCardType: { fontWeight: 700, fontSize: 7.5, color: C.gold, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 },
  rewardCardPct: { fontWeight: 700, fontSize: 22, color: C.navy, marginBottom: 2 },
  rewardCardPctSub: { fontSize: 9, color: C.gold, fontWeight: 600 },
  rewardCardDesc: { fontSize: 7.5, color: C.sub, textAlign: "center", marginTop: 6, lineHeight: 1.5 },

  // ── TABLEAU EXEMPLES ──
  exTitle: { fontWeight: 700, fontSize: 9.5, color: C.navy, marginBottom: 10 },
  tableWrap: { borderRadius: 6, overflow: "hidden", marginBottom: 28 },
  tableHead: { flexDirection: "row", backgroundColor: C.navyMid },
  tableHeadCell: { flex: 1, color: C.white, fontWeight: 600, fontSize: 7.5, paddingHorizontal: 10, paddingVertical: 7, textAlign: "center" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line },
  tableRowAlt: { backgroundColor: C.offWhite },
  tableCell: { flex: 1, fontSize: 8, paddingHorizontal: 10, paddingVertical: 6, textAlign: "center", color: C.ink },
  tableCellBold: { fontWeight: 700, color: C.navy },

  // ── CONDITIONS ──
  condBox: {
    backgroundColor: C.offWhite,
    borderRadius: 6, borderWidth: 1, borderColor: C.line,
    padding: 14, marginBottom: 24,
  },
  condTitle: { fontWeight: 700, fontSize: 9, color: C.navy, marginBottom: 8 },
  condItem: { flexDirection: "row", marginBottom: 5, alignItems: "flex-start" },
  condDot: { width: 14, fontSize: 8.5, color: C.teal, fontWeight: 700 },
  condText: { flex: 1, fontSize: 8, color: C.sub, lineHeight: 1.5 },
  condBold: { fontWeight: 600, color: C.ink },

  // ── CTA ──
  ctaBox: {
    backgroundColor: C.navy,
    borderRadius: 8, padding: 20,
    flexDirection: "row", alignItems: "center", gap: 20,
    marginBottom: 20,
  },
  ctaLeft: { flex: 1 },
  ctaTitle: { color: C.white, fontWeight: 700, fontSize: 13, marginBottom: 4 },
  ctaSub: { color: "#94A3B8", fontSize: 8.5, lineHeight: 1.5 },
  ctaRight: {
    backgroundColor: C.teal, borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: "center",
  },
  ctaRightText: { color: C.white, fontWeight: 700, fontSize: 9, textAlign: "center" },

  // ── CONTACT ──
  contactRow: { flexDirection: "row", gap: 12 },
  contactCard: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.offWhite, borderRadius: 6,
    padding: 10, borderWidth: 1, borderColor: C.line,
  },
  contactDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.teal },
  contactLabel: { fontSize: 7, color: C.sub, fontWeight: 500, marginBottom: 1 },
  contactValue: { fontSize: 8.5, color: C.navy, fontWeight: 700 },

  // ── FOOTER ──
  footer: {
    borderTopWidth: 1, borderTopColor: C.line,
    paddingHorizontal: 40, paddingVertical: 10,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  footerBrand: { fontWeight: 700, fontSize: 9, color: C.navy },
  footerLegal: { fontSize: 6.5, color: C.sub, textAlign: "right", lineHeight: 1.5 },
});

// ── Composant document ────────────────────────────────────────────────────────
export function FicheApportPromo() {
  const examples = [
    { vente: "200 000 €", honos: "12 000 €", pro: "1 440 € HT",  part: "~1 440 € cadeaux" },
    { vente: "300 000 €", honos: "18 000 €", pro: "2 160 € HT",  part: "~2 160 € cadeaux" },
    { vente: "450 000 €", honos: "27 000 €", pro: "3 240 € HT",  part: "~3 240 € cadeaux" },
    { vente: "600 000 €", honos: "36 000 €", pro: "4 320 € HT",  part: "~4 320 € cadeaux" },
  ];

  return (
    <Document title="Apport d'affaires — Casa Caraïbes" author="Casa Caraïbes">
      <Page size="A4" style={S.page}>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <View style={S.hero}>
          <Text style={S.heroEyebrow}>Casa Caraïbes · Programme partenaires</Text>
          <Text style={S.heroTitle}>
            Vous connaissez{"\n"}
            quelqu'un qui{"\n"}
            veut vendre ?{" "}
            <Text style={S.heroAccent}>Dites-le{"\n"}nous.</Text>
          </Text>
          <Text style={S.heroSub}>
            Signalez-nous un propriétaire vendeur ou bailleur,{"\n"}
            et si la transaction aboutit, nous vous récompensons généreusement.
          </Text>
          <View style={S.heroTag}>
            <View style={S.heroPill}>
              <Text style={S.heroPillText}>12 % des honoraires</Text>
            </View>
            <Text style={S.heroPillSub}>reversés à l'apporteur</Text>
          </View>
        </View>

        {/* ── BANDE DÉCORATIVE ──────────────────────────────────────────── */}
        <View style={S.stripe}>
          <View style={S.stripeA} />
          <View style={S.stripeB} />
          <View style={S.stripeC} />
        </View>

        {/* ── BODY ──────────────────────────────────────────────────────── */}
        <View style={S.body}>

          {/* COMMENT ÇA MARCHE */}
          <Text style={S.sectionLabel}>Comment ça marche ?</Text>
          <View style={S.stepsRow}>
            {[
              { n: "1", title: "Vous signalez", text: "Remplissez cette fiche et indiquez-nous les coordonnées du propriétaire et du bien." },
              { n: "2", title: "On s'occupe de tout", text: "Nos agents prennent contact, visitent, obtiennent le mandat et gèrent la vente." },
              { n: "3", title: "Vous êtes récompensé(e)", text: "Dès l'acte signé et nos honoraires encaissés, vous recevez votre part." },
            ].map((step, i, arr) => (
              <View key={i} style={[S.step, { position: "relative" }]}>
                <View style={S.stepNumWrap}>
                  <Text style={S.stepNum}>{step.n}</Text>
                </View>
                <Text style={S.stepTitle}>{step.title}</Text>
                <Text style={S.stepText}>{step.text}</Text>
                {i < arr.length - 1 && (
                  <Text style={S.stepArrow}>›</Text>
                )}
              </View>
            ))}
          </View>

          {/* RÉCOMPENSES */}
          <View style={S.rewardBox}>
            <Text style={S.rewardTitle}>Votre récompense — 12 % des honoraires encaissés</Text>
            <View style={S.rewardRow}>
              <View style={S.rewardCard}>
                <Text style={S.rewardCardType}>Professionnel</Text>
                <Text style={S.rewardCardPct}>12%</Text>
                <Text style={S.rewardCardPctSub}>HT des honoraires TTC</Text>
                <Text style={S.rewardCardDesc}>Versé par virement{"\n"}sur facture (SIRET + RIB){"\n"}TVA applicable</Text>
              </View>
              <View style={S.rewardCard}>
                <Text style={S.rewardCardType}>Particulier</Text>
                <Text style={S.rewardCardPct}>≈12%</Text>
                <Text style={S.rewardCardPctSub}>en dotation cadeaux</Text>
                <Text style={S.rewardCardDesc}>Coffret voyage, croisière,{"\n"}cartes cadeaux ou{"\n"}bons d'achat au choix</Text>
              </View>
            </View>
          </View>

          {/* EXEMPLES */}
          <Text style={S.exTitle}>Quelques exemples concrets</Text>
          <View style={S.tableWrap}>
            <View style={S.tableHead}>
              <Text style={S.tableHeadCell}>Prix de vente</Text>
              <Text style={S.tableHeadCell}>Nos honoraires (6 %)</Text>
              <Text style={S.tableHeadCell}>Vous (pro)</Text>
              <Text style={S.tableHeadCell}>Vous (particulier)</Text>
            </View>
            {examples.map((r, i) => (
              <View key={i} style={[S.tableRow, i % 2 !== 0 ? S.tableRowAlt : {}]}>
                <Text style={[S.tableCell, S.tableCellBold]}>{r.vente}</Text>
                <Text style={S.tableCell}>{r.honos}</Text>
                <Text style={[S.tableCell, { color: C.teal, fontWeight: 600 }]}>{r.pro}</Text>
                <Text style={[S.tableCell, { color: C.gold, fontWeight: 600 }]}>{r.part}</Text>
              </View>
            ))}
          </View>

          {/* CONDITIONS */}
          <View style={S.condBox}>
            <Text style={S.condTitle}>Conditions de paiement — à retenir</Text>
            {[
              ["La rétribution est due uniquement ", "si la transaction est finalisée", " (acte authentique signé ou bail définitif)."],
              ["Nos honoraires doivent être ", "intégralement encaissés", " avant tout versement ou remise de dotation."],
              ["Le mandat doit être signé dans les ", "12 mois", " suivant votre mise en relation."],
              ["Aucune somme en espèces ", "ne peut être versée à un particulier", " (réglementation en vigueur)."],
            ].map(([a, b, c], i) => (
              <View key={i} style={S.condItem}>
                <Text style={S.condDot}>›</Text>
                <Text style={S.condText}>
                  {a}<Text style={S.condBold}>{b}</Text>{c}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View style={S.ctaBox}>
            <View style={S.ctaLeft}>
              <Text style={S.ctaTitle}>Prêt(e) à nous présenter un bien ?</Text>
              <Text style={S.ctaSub}>
                Remplissez la fiche de déclaration ci-jointe et remettez-la à votre{"\n"}
                conseiller Casa Caraïbes. Nous prenons contact sous 24 h.
              </Text>
            </View>
            <View style={S.ctaRight}>
              <Text style={S.ctaRightText}>Fiche de{"\n"}déclaration{"\n"}ci-jointe</Text>
            </View>
          </View>

          {/* CONTACT */}
          <View style={S.contactRow}>
            {[
              { label: "Agence", value: "Casa Caraïbes" },
              { label: "Téléphone", value: "0696 XX XX XX" },
              { label: "Email", value: "contact@casacaraibes.com" },
              { label: "Site", value: "www.casacaraibes.com" },
            ].map((c, i) => (
              <View key={i} style={S.contactCard}>
                <View style={S.contactDot} />
                <View>
                  <Text style={S.contactLabel}>{c.label}</Text>
                  <Text style={S.contactValue}>{c.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <View style={S.footer}>
          <Text style={S.footerBrand}>CASA CARAÏBES</Text>
          <Text style={S.footerLegal}>
            Agence immobilière — Martinique · RCS Fort-de-France 928 647 981{"\n"}
            Carte professionnelle T n°CPI97212024000000007 · Garantie financière AXA
          </Text>
        </View>

      </Page>
    </Document>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
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
