import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import logoSrc from "../assets/logo.png";
import type { CompteRendu } from "../schemas/compteRendu.schema";
import { eur } from "../lib/format";

const P = "#1A3A52";
const LINE = "#E4E4E0";
const INK = "#1A1A18";
const SUB = "#6B6B67";
const MUT = "#9B9B97";
const GREEN = "#2D7A5F";
const GREEN_S = "#EAF5F0";
const AMBER = "#9A6D22";
const AMBER_S = "#FBF4E6";
const RED = "#A03A30";
const RED_S = "#FBEDED";
const VIOLET = "#5B4E8C";
const VIOLET_S = "#F0EEFB";

const AVIS_COLOR: Record<string, string> = {
  "Très intéressé": GREEN, "Intéressé": GREEN,
  "Mitigé": AMBER, "En réflexion": AMBER,
  "Pas intéressé": RED, "Offre possible": VIOLET,
};
const AVIS_BG: Record<string, string> = {
  "Très intéressé": GREEN_S, "Intéressé": GREEN_S,
  "Mitigé": AMBER_S, "En réflexion": AMBER_S,
  "Pas intéressé": RED_S, "Offre possible": VIOLET_S,
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: INK, padding: "16mm 15mm 14mm" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingBottom: 12, borderBottom: `2 solid ${P}` },
  logo: { fontSize: 20, fontFamily: "Helvetica-Bold", color: P },
  logoSub: { fontSize: 9, color: SUB, marginTop: 2 },
  docTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: P, textAlign: "center", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, paddingBottom: 8, borderBottom: `1 solid ${LINE}` },
  meta: { textAlign: "right", fontSize: 8, color: SUB, lineHeight: 1.5 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: P, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1 solid ${LINE}`, paddingBottom: 4, marginTop: 14, marginBottom: 8 },
  grid2: { flexDirection: "row", gap: 12, marginBottom: 8 },
  col: { flex: 1 },
  row: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, padding: "4.5 0" },
  rowAlt: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, padding: "4.5 0", backgroundColor: "#FAFAF8" },
  lbl: { width: "42%", fontSize: 8, color: SUB },
  val: { flex: 1, fontSize: 8.5, fontFamily: "Helvetica-Bold", color: INK },
  card: { border: `0.5 solid ${LINE}`, borderRadius: 5, padding: 9, marginBottom: 8 },
  cardTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: SUB, textTransform: "uppercase", marginBottom: 4 },
  cardText: { fontSize: 8.5, color: INK, lineHeight: 1.5 },
  pill: { fontSize: 7, fontFamily: "Helvetica-Bold", padding: "2 7", borderRadius: 8, textTransform: "uppercase" },
  avisBox: { borderRadius: 6, padding: "10 14", alignItems: "center", marginBottom: 10 },
  suiteBox: { backgroundColor: "#EBF1F6", borderRadius: 6, padding: "9 12", marginBottom: 10 },
  footer: { position: "absolute", bottom: "10mm", left: "15mm", right: "15mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 7, flexDirection: "row", justifyContent: "space-between" },
  footerTxt: { fontSize: 7.5, color: MUT },
});

const fd = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";

function Row({ label, value, alt }: { label: string; value: string; alt?: boolean }) {
  return (
    <View style={alt ? s.rowAlt : s.row}>
      <Text style={s.lbl}>{label}</Text>
      <Text style={s.val}>{value || "—"}</Text>
    </View>
  );
}

export function CompteRenduPDF({ cr }: { cr: CompteRendu }) {
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const avisColor = AVIS_COLOR[cr.avisClient] ?? P;
  const avisBg = AVIS_BG[cr.avisClient] ?? "#EBF1F6";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={s.header}>
          <View>
            <Image src={logoSrc} style={{ width: 140, height: 52, objectFit: "contain" }} />
            <Text style={s.logoSub}>Compte rendu de visite — Confidentiel</Text>
          </View>
          <View>
            <Text style={[s.meta, { fontFamily: "Helvetica-Bold", color: INK }]}>
              {fd(cr.date)}
            </Text>
            <Text style={s.meta}>SARL — RCS Fort-de-France 928 647 981</Text>
            <Text style={s.meta}>CPI 97212024000000007</Text>
          </View>
        </View>

        <Text style={s.docTitle}>Compte Rendu de Visite</Text>

        {/* Infos visite */}
        <Text style={s.sectionTitle}>Informations de la visite</Text>
        <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 5, marginBottom: 10 }}>
          <Row label="Date de visite" value={fd(cr.date)} />
          <Row label="Horaire" value={cr.heureDebut && cr.heureFin ? `${cr.heureDebut} – ${cr.heureFin}` : cr.heureDebut || "—"} alt />
          <Row label="Rédacteur" value={cr.redacteur} />
          <Row label="Visiteur(s)" value={`${cr.visiteurNom}${cr.nbPersonnes > 1 ? ` + ${cr.nbPersonnes - 1} pers.` : ""}`} alt />
          {cr.visiteurTel && <Row label="Téléphone" value={cr.visiteurTel} />}
          {cr.visiteurEmail && <Row label="Email" value={cr.visiteurEmail} alt />}
        </View>

        {/* Bien visité */}
        <Text style={s.sectionTitle}>Bien visité</Text>
        <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 5, marginBottom: 10 }}>
          {cr.bienRef && <Row label="Référence" value={cr.bienRef} />}
          <Row label="Type" value={cr.bienType || "—"} alt />
          <Row label="Adresse" value={cr.bienAdresse || "—"} />
          <Row label="Commune" value={cr.bienCommune || "—"} alt />
          {cr.bienSurface > 0 && <Row label="Surface" value={`${cr.bienSurface} m²`} />}
          {cr.bienPrix > 0 && <Row label="Prix affiché" value={eur(cr.bienPrix)} alt />}
          {cr.proprietaireNom && <Row label="Propriétaire / Mandant" value={cr.proprietaireNom} />}
          {cr.proprietaireTel && <Row label="Tél. propriétaire" value={cr.proprietaireTel} alt />}
        </View>

        {/* Avis client — encadré coloré selon intérêt */}
        <Text style={s.sectionTitle}>Avis et ressenti du visiteur</Text>
        <View style={[s.avisBox, { backgroundColor: avisBg }]}>
          <Text style={[s.pill, { backgroundColor: avisColor, color: "#fff", marginBottom: 4 }]}>
            {cr.avisClient}
          </Text>
          {cr.budgetClient > 0 && (
            <Text style={{ fontSize: 9, color: avisColor, marginTop: 2 }}>
              Budget déclaré : {eur(cr.budgetClient)}
            </Text>
          )}
          {cr.financement && (
            <Text style={{ fontSize: 8.5, color: SUB, marginTop: 2 }}>
              Financement : {cr.financement}
            </Text>
          )}
          {cr.delaiAchat && (
            <Text style={{ fontSize: 8.5, color: SUB, marginTop: 1 }}>
              Délai d'achat : {cr.delaiAchat}
            </Text>
          )}
        </View>

        {/* Points + / - */}
        <View style={s.grid2}>
          {cr.pointsPositifs ? (
            <View style={[s.card, { flex: 1, borderLeftWidth: 3, borderLeftColor: GREEN }]}>
              <Text style={[s.cardTitle, { color: GREEN }]}>✓ Points positifs</Text>
              <Text style={s.cardText}>{cr.pointsPositifs}</Text>
            </View>
          ) : null}
          {cr.pointsNegatifs ? (
            <View style={[s.card, { flex: 1, borderLeftWidth: 3, borderLeftColor: AMBER }]}>
              <Text style={[s.cardTitle, { color: AMBER }]}>⚠ Points négatifs / réserves</Text>
              <Text style={s.cardText}>{cr.pointsNegatifs}</Text>
            </View>
          ) : null}
        </View>

        {/* Suite à donner */}
        <View style={s.suiteBox}>
          <Text style={[s.cardTitle, { color: P, marginBottom: 5 }]}>Suite à donner</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[s.pill, { backgroundColor: P, color: "#fff" }]}>{cr.suiteDonner}</Text>
            {cr.dateRelance && (
              <Text style={{ fontSize: 8.5, color: SUB }}>Relance prévue : {fd(cr.dateRelance)}</Text>
            )}
          </View>
        </View>

        {/* Observations libres */}
        {cr.observations ? (
          <>
            <Text style={s.sectionTitle}>Observations et notes complémentaires</Text>
            <View style={s.card}>
              <Text style={s.cardText}>{cr.observations}</Text>
            </View>
          </>
        ) : null}

        {/* Signature */}
        <View style={{ marginTop: 20, flexDirection: "row", justifyContent: "flex-end" }}>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8.5, color: SUB, fontStyle: "italic", marginBottom: 6 }}>
              Fait à Fort-de-France, le {today}
            </Text>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>{cr.redacteur}</Text>
            <Text style={{ fontSize: 8.5, color: SUB }}>Agence Immobilière Casa Caraïbes</Text>
            <View style={{ marginTop: 20, width: 110, borderBottom: `1 solid ${INK}` }} />
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>CASA CARAÏBES — Compte rendu de visite — Confidentiel</Text>
          <Text style={s.footerTxt}>{today}</Text>
        </View>
      </Page>
    </Document>
  );
}
