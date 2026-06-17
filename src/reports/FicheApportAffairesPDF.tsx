import { Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer";

// ── Enregistrement Montserrat depuis @fontsource ──────────────────────────────
Font.register({
  family: "Montserrat",
  fonts: [
    { src: new URL("@fontsource/montserrat/files/montserrat-latin-400-normal.woff", import.meta.url).href, fontWeight: 400 },
    { src: new URL("@fontsource/montserrat/files/montserrat-latin-500-normal.woff", import.meta.url).href, fontWeight: 500 },
    { src: new URL("@fontsource/montserrat/files/montserrat-latin-600-normal.woff", import.meta.url).href, fontWeight: 600 },
  ],
});
Font.registerHyphenationCallback(w => [w]);

// ── Couleurs ──────────────────────────────────────────────────────────────────
const C = {
  primary:   "#1A3A52",
  accent:    "#2563EB",
  warning:   "#B45309",
  warnBg:    "#FFFBEB",
  warnBorder:"#F59E0B",
  line:      "#E5E7EB",
  lightBg:   "#F8FAFC",
  ink:       "#1A1A18",
  sub:       "#6B7280",
  white:     "#FFFFFF",
};

const S = StyleSheet.create({
  page: { fontFamily: "Montserrat", fontWeight: 400, fontSize: 9, color: C.ink, paddingTop: 42, paddingBottom: 48, paddingHorizontal: 48, lineHeight: 1.5 },

  // Header
  headerBar:    { backgroundColor: C.primary, borderRadius: 4, paddingHorizontal: 18, paddingVertical: 12, marginBottom: 6 },
  headerTitle:  { color: C.white, fontWeight: 600, fontSize: 15, letterSpacing: 0.3 },
  headerSub:    { color: "#A8C4D8", fontSize: 8, marginTop: 2 },
  tagline:      { textAlign: "center", fontWeight: 600, fontSize: 10.5, color: C.primary, marginBottom: 2, marginTop: 10 },
  taglineSub:   { textAlign: "center", fontSize: 8, color: C.sub, fontStyle: "italic", marginBottom: 14 },

  // Séparateurs & sections
  divider:      { borderBottomWidth: 1, borderBottomColor: C.line, marginVertical: 10 },
  sectionTitle: { backgroundColor: C.primary, color: C.white, fontWeight: 600, fontSize: 8.5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 3, marginBottom: 8, letterSpacing: 0.5 },

  // Cases à cocher
  row:          { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  checkbox:     { width: 11, height: 11, borderWidth: 1, borderColor: C.primary, borderRadius: 2, marginRight: 7, marginTop: 1 },
  checkLabel:   { flex: 1, fontSize: 8.5 },
  checkBold:    { fontWeight: 600 },

  // Tableau champs
  fieldTable:   { marginBottom: 6 },
  fieldRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 4 },
  fieldLabel:   { width: "42%", fontSize: 8, color: C.sub, fontWeight: 500 },
  fieldValue:   { flex: 1, fontSize: 8.5, borderBottomWidth: 1, borderBottomColor: C.accent, paddingBottom: 1 },

  // Bloc rétribution
  retribBlock:  { backgroundColor: C.lightBg, borderRadius: 4, padding: 10, marginBottom: 8 },
  retribTitle:  { fontWeight: 600, fontSize: 8.5, color: C.primary, marginBottom: 5 },
  bullet:       { flexDirection: "row", marginBottom: 3 },
  bulletDot:    { width: 12, fontSize: 8.5, color: C.accent, fontWeight: 600 },
  bulletText:   { flex: 1, fontSize: 8.5 },

  // Tableau exemples
  tableHeader:  { flexDirection: "row", backgroundColor: C.primary, borderRadius: 3, marginBottom: 1 },
  tableHeaderCell: { flex: 1, color: C.white, fontWeight: 600, fontSize: 7.5, paddingHorizontal: 7, paddingVertical: 5, textAlign: "center" },
  tableRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line },
  tableCell:    { flex: 1, fontSize: 8, paddingHorizontal: 7, paddingVertical: 4, textAlign: "center" },
  tableCellAlt: { backgroundColor: C.lightBg },

  // Encadré avertissement
  warnBox:      { borderWidth: 1.5, borderColor: C.warnBorder, borderRadius: 4, backgroundColor: C.warnBg, padding: 10, marginVertical: 8 },
  warnTitle:    { fontWeight: 600, fontSize: 8.5, color: C.warning, marginBottom: 5, textAlign: "center" },
  warnText:     { fontSize: 8, color: "#78350F", lineHeight: 1.6 },
  warnBold:     { fontWeight: 600 },

  // Mentions légales
  legalBlock:   { backgroundColor: C.lightBg, borderRadius: 3, padding: 9, marginBottom: 6 },
  legalTitle:   { fontWeight: 600, fontSize: 7.5, color: C.primary, marginBottom: 3 },
  legalText:    { fontSize: 7, color: C.sub, lineHeight: 1.55 },

  // Signatures
  sigTable:     { flexDirection: "row", marginTop: 14, gap: 16 },
  sigBlock:     { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 4, padding: 10 },
  sigTitle:     { fontWeight: 600, fontSize: 8, color: C.primary, textAlign: "center", marginBottom: 4 },
  sigName:      { fontSize: 8, color: C.sub, textAlign: "center", marginBottom: 16 },
  sigLine:      { borderTopWidth: 1, borderTopColor: C.ink, marginTop: 30 },
  sigMention:   { fontSize: 7, color: C.sub, textAlign: "center", marginTop: 3, fontStyle: "italic" },

  // Divers
  note:         { fontSize: 7.5, color: C.sub, fontStyle: "italic", marginTop: 4 },
  validite:     { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", borderRadius: 3, padding: 7, marginTop: 4, marginBottom: 2 },
  validiteText: { fontSize: 8, color: C.accent, flex: 1 },
  bold:         { fontWeight: 600 },
  mt4:          { marginTop: 4 },
  mb4:          { marginBottom: 4 },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function Checkbox({ label, bold }: { label: string; bold?: string }) {
  return (
    <View style={S.row}>
      <View style={S.checkbox} />
      <Text style={S.checkLabel}>
        {bold ? <Text style={S.checkBold}>{bold}</Text> : null}{label}
      </Text>
    </View>
  );
}

function FieldRow({ label }: { label: string }) {
  return (
    <View style={S.fieldRow}>
      <Text style={S.fieldLabel}>{label}</Text>
      <Text style={S.fieldValue}> </Text>
    </View>
  );
}

function Bullet({ text, bold }: { text: string; bold?: string }) {
  return (
    <View style={S.bullet}>
      <Text style={S.bulletDot}>›</Text>
      <Text style={S.bulletText}>
        {bold ? <Text style={S.bold}>{bold}</Text> : null}{text}
      </Text>
    </View>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export function FicheApportAffairesPDF() {
  return (
    <Document title="Fiche Apport d'Affaires — Casa Caraïbes" author="Casa Caraïbes">
      <Page size="A4" style={S.page}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={S.headerBar}>
          <Text style={S.headerTitle}>CASA CARAÏBES — FICHE D'APPORT D'AFFAIRES</Text>
          <Text style={S.headerSub}>Agence Immobilière — Martinique · RCS Fort-de-France 928 647 981 · Carte pro T n°CPI97212024000000007</Text>
        </View>
        <Text style={S.tagline}>Vous connaissez un vendeur ou un bailleur ? Signalez-le nous — et soyez récompensé(e).</Text>
        <Text style={S.taglineSub}>Cette fiche formalise votre mise en relation et constitue la base contractuelle de votre rétribution.</Text>

        <View style={S.divider} />

        {/* ── Section 1 — Apporteur ──────────────────────────────────── */}
        <Text style={S.sectionTitle}>SECTION 1 — COORDONNÉES DE L'APPORTEUR D'AFFAIRES</Text>

        <Text style={[S.bold, S.mb4]}>Statut de l'apporteur :</Text>
        <Checkbox bold="PROFESSIONNEL" label=" — Agent commercial, mandataire, conseiller, société (facture obligatoire)" />
        <Checkbox bold="PARTICULIER" label=" — Apport ponctuel et unique, sans activité commerciale régulière" />

        <View style={[S.fieldTable, S.mt4]}>
          <FieldRow label="Nom & Prénom / Dénomination sociale" />
          <FieldRow label="Adresse" />
          <FieldRow label="Code postal / Ville" />
          <FieldRow label="Téléphone" />
          <FieldRow label="Email" />
          <FieldRow label="SIRET (professionnels uniquement)" />
          <FieldRow label="N° TVA intracommunautaire (si applicable)" />
        </View>

        <View style={S.divider} />

        {/* ── Section 2 — Client & Bien ──────────────────────────────── */}
        <Text style={S.sectionTitle}>SECTION 2 — INFORMATIONS SUR LE CLIENT APPORTÉ ET LE BIEN</Text>

        <Text style={[S.bold, S.mb4]}>Nature de la mission :</Text>
        <Checkbox bold="VENTE" label=" — Mandat de vente (exclusif ou simple)" />
        <Checkbox bold="LOCATION / GESTION" label=" — Mandat de gestion locative ou mise en location" />

        <View style={[S.mt4, S.mb4]}>
          <Text style={[S.bold, S.mb4]}>Coordonnées du client apporté (vendeur ou bailleur) :</Text>
          <View style={S.fieldTable}>
            <FieldRow label="Nom & Prénom" />
            <FieldRow label="Téléphone" />
            <FieldRow label="Email" />
          </View>
          <Text style={S.note}>⚠ En communiquant ces informations, l'apporteur certifie avoir obtenu le consentement préalable de la personne concernée (RGPD).</Text>
        </View>

        <Text style={[S.bold, S.mb4]}>Informations sur le bien :</Text>
        <View style={S.row}>
          <View style={S.checkbox} /><Text style={S.checkLabel}>Appartement</Text>
          <View style={S.checkbox} /><Text style={S.checkLabel}>Villa / Maison</Text>
          <View style={S.checkbox} /><Text style={S.checkLabel}>Terrain</Text>
          <View style={S.checkbox} /><Text style={S.checkLabel}>Local commercial</Text>
          <View style={S.checkbox} /><Text style={S.checkLabel}>Autre : _____________</Text>
        </View>
        <View style={[S.fieldTable, S.mt4]}>
          <FieldRow label="Adresse du bien" />
          <FieldRow label="Commune" />
          <FieldRow label="Prix de vente envisagé (vente)" />
          <FieldRow label="Loyer mensuel envisagé (location)" />
          <FieldRow label="Informations complémentaires" />
          <FieldRow label="Date de la mise en relation" />
        </View>

        <View style={S.validite}>
          <Text style={S.validiteText}>
            <Text style={S.bold}>Validité : </Text>
            La mise en relation doit aboutir à un mandat signé dans un délai de <Text style={S.bold}>12 mois maximum</Text> à compter de la signature de cette fiche. Passé ce délai, aucune rétribution ne sera due.
          </Text>
        </View>

        <View style={S.divider} />

        {/* ── Section 3 — Rétribution ────────────────────────────────── */}
        <Text style={S.sectionTitle}>SECTION 3 — ENGAGEMENTS DE L'AGENCE ET MODALITÉS DE RÉTRIBUTION</Text>

        <View style={S.retribBlock}>
          <Text style={S.retribTitle}>► APPORTEUR PROFESSIONNEL</Text>
          <Bullet bold="Taux : " text="12 % HT des honoraires TTC perçus par l'agence" />
          <Bullet bold="Versement : " text="par virement, sur présentation d'une facture conforme (SIRET + RIB)" />
          <Bullet text="TVA applicable à la date d'émission de la facture" />
        </View>

        <View style={S.retribBlock}>
          <Text style={S.retribTitle}>► APPORTEUR PARTICULIER</Text>
          <Bullet bold="Gratification : " text="valeur équivalente à 12 % TTC des honoraires perçus" />
          <Bullet bold="Forme : " text="dotation en nature au choix de l'agence — coffret voyage, croisière, cartes cadeaux, bons d'achat" />
          <Bullet text="Aucune somme en espèces ne sera versée directement à un particulier (réglementation en vigueur)" />
        </View>

        {/* Tableau exemples */}
        <View style={[S.tableHeader, S.mt4]}>
          <Text style={S.tableHeaderCell}>Honoraires agence TTC</Text>
          <Text style={S.tableHeaderCell}>Pro — 12 % HT</Text>
          <Text style={S.tableHeaderCell}>Particulier — dotation ≈ 12 %</Text>
        </View>
        {[
          ["5 000 €", "600 € HT", "~600 € bons d'achat"],
          ["8 000 €", "960 € HT", "~960 € coffret voyage"],
          ["12 000 €", "1 440 € HT", "~1 440 € croisière"],
          ["15 000 €", "1 800 € HT", "~1 800 € dotation sur mesure"],
        ].map(([h, p, part], i) => (
          <View key={i} style={[S.tableRow, i % 2 !== 0 ? S.tableCellAlt : {}]}>
            <Text style={[S.tableCell, S.bold]}>{h}</Text>
            <Text style={S.tableCell}>{p}</Text>
            <Text style={S.tableCell}>{part}</Text>
          </View>
        ))}

        {/* Encadré avertissement */}
        <View style={S.warnBox}>
          <Text style={S.warnTitle}>⚠ CONDITIONS DE DÉCLENCHEMENT DU PAIEMENT — À LIRE ATTENTIVEMENT</Text>
          <Text style={S.warnText}>
            <Text style={S.warnBold}>La commission ou dotation n'est exigible que si et seulement si les trois conditions suivantes sont réunies simultanément :{"\n"}</Text>
            {"  "}1. Le client apporté a signé un mandat avec Casa Caraïbes dans les 12 mois suivant la présente fiche ;{"\n"}
            {"  "}2. La transaction a abouti à sa conclusion définitive :{"\n"}
            {"     "}• Pour une vente : <Text style={S.warnBold}>signature de l'acte authentique chez le notaire</Text> ;{"\n"}
            {"     "}• Pour une location : <Text style={S.warnBold}>signature du bail définitif</Text> par le locataire retenu ;{"\n"}
            {"  "}3. L'agence a <Text style={S.warnBold}>encaissé intégralement</Text> ses honoraires.{"\n\n"}
            Si l'une de ces conditions n'est pas remplie — transaction non aboutie, client défaillant, honoraires non perçus — <Text style={S.warnBold}>aucune rémunération ni dotation ne sera due.</Text>
          </Text>
        </View>

        <View style={S.divider} />

        {/* ── Section 4 — Mentions légales ──────────────────────────── */}
        <Text style={S.sectionTitle}>SECTION 4 — MENTIONS LÉGALES</Text>

        <View style={S.legalBlock}>
          <Text style={S.legalTitle}>Loi Hoguet (n° 70-9 du 2 janvier 1970)</Text>
          <Text style={S.legalText}>L'apporteur déclare ne pas exercer, même à titre accessoire, une activité de négociation ou d'entremise immobilière sans habilitation. La présente fiche ne lui confère aucun droit de négocier, de représenter l'agence, ni de signer tout document en son nom. Tout manquement dégagerait immédiatement l'agence de ses obligations.</Text>
        </View>

        <View style={S.legalBlock}>
          <Text style={S.legalTitle}>Indépendance des parties</Text>
          <Text style={S.legalText}>L'apporteur intervient à titre indépendant, sans lien de subordination. La présente fiche ne constitue ni un contrat de travail, ni une promesse d'embauche, ni une association commerciale.</Text>
        </View>

        <View style={S.legalBlock}>
          <Text style={S.legalTitle}>Protection des données personnelles (RGPD — Règlement UE 2016/679)</Text>
          <Text style={S.legalText}>Les données du client apporté sont collectées aux seules fins de la mise en relation immobilière. Elles sont traitées par Casa Caraïbes, responsable de traitement, sans transmission à des tiers. Toute personne dispose d'un droit d'accès, de rectification et d'opposition. L'apporteur certifie avoir informé et obtenu l'accord de la personne concernée.</Text>
        </View>

        <View style={S.legalBlock}>
          <Text style={S.legalTitle}>Droit applicable</Text>
          <Text style={S.legalText}>Droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours. À défaut, les tribunaux de Fort-de-France seront seuls compétents.</Text>
        </View>

        <View style={S.divider} />

        {/* ── Signatures ────────────────────────────────────────────── */}
        <Text style={[S.note, { textAlign: "center", marginBottom: 6 }]}>
          Je soussigné(e), _____________________________________________, déclare avoir pris connaissance de l'ensemble des conditions ci-dessus et les accepter sans réserve.
        </Text>
        <Text style={[S.note, { textAlign: "center" }]}>
          Fait à _________________________, le _____ / _____ / ________
        </Text>

        <View style={S.sigTable}>
          <View style={S.sigBlock}>
            <Text style={S.sigTitle}>L'APPORTEUR D'AFFAIRES</Text>
            <Text style={S.sigName}>Nom : _________________________</Text>
            <View style={S.sigLine} />
            <Text style={S.sigMention}>Lu et approuvé — Signature</Text>
          </View>
          <View style={S.sigBlock}>
            <Text style={S.sigTitle}>CASA CARAÏBES</Text>
            <Text style={S.sigName}>M. Luc CLEMENTE — Directeur</Text>
            <View style={S.sigLine} />
            <Text style={S.sigMention}>Lu et approuvé — Signature et cachet</Text>
          </View>
        </View>

        <Text style={[S.note, { textAlign: "center", marginTop: 12 }]}>
          Document établi en deux exemplaires originaux — un pour chaque partie.{"\n"}
          Casa Caraïbes SARL — RCS Fort-de-France 928 647 981 — Carte pro T n°CPI97212024000000007
        </Text>

      </Page>
    </Document>
  );
}

// ── Fonction de téléchargement ────────────────────────────────────────────────
export async function downloadFicheApportAffaires() {
  const blob = await pdf(<FicheApportAffairesPDF />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Casa_Caraibes_Fiche_Apport_Affaires.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 200);
}
