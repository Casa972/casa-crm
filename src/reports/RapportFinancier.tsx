import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";
import type { AgencyData } from "../types/domain";
import type { Financials } from "../hooks/useFinancials";
import { commissionMontant } from "../schemas/compromis.schema";

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  navy:       "#0D2137",   // titres, header fond
  navyLight:  "#1A3A52",   // accents secondaires
  teal:       "#1A6B5A",   // encaissé
  tealBg:     "#E8F4F1",
  amber:      "#8B5E1A",   // à encaisser
  amberBg:    "#FDF4E3",
  slate:      "#3D5A75",   // volume / mandats
  slateBg:    "#EBF1F7",
  ink:        "#12171C",
  mid:        "#4A5568",
  muted:      "#8896A5",
  line:       "#DDE3EA",
  lineSoft:   "#EFF2F5",
  white:      "#FFFFFF",
  pageGray:   "#F6F8FA",
};

const BOLD = "Helvetica-Bold";
const REG  = "Helvetica";

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // Page
  page: {
    backgroundColor: C.white,
    fontFamily: REG,
    fontSize: 8.5,
    color: C.ink,
    paddingTop: 0,
    paddingBottom: "14mm",
    paddingHorizontal: 0,
  },

  // Cover header band
  coverBand: {
    backgroundColor: C.navy,
    paddingTop: "12mm",
    paddingBottom: "10mm",
    paddingHorizontal: "16mm",
  },
  coverEyebrow: {
    fontSize: 7.5,
    color: "#7FA4C2",
    fontFamily: BOLD,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 6,
  },
  coverTitle: {
    fontSize: 26,
    fontFamily: BOLD,
    color: C.white,
    lineHeight: 1.1,
  },
  coverMeta: {
    marginTop: 8,
    fontSize: 8,
    color: "#7FA4C2",
    lineHeight: 1.7,
  },
  coverDate: {
    fontSize: 9,
    fontFamily: BOLD,
    color: C.white,
    marginTop: 2,
  },

  // Inner page header (pages 2+)
  pageHeader: {
    backgroundColor: C.navy,
    paddingVertical: 9,
    paddingHorizontal: "16mm",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  pageHeaderLeft: {
    fontSize: 10,
    fontFamily: BOLD,
    color: C.white,
  },
  pageHeaderRight: {
    fontSize: 7.5,
    color: "#7FA4C2",
  },

  // Body padding wrapper
  body: {
    paddingHorizontal: "16mm",
    paddingTop: 14,
  },

  // KPI strip (cover page)
  kpiStrip: {
    flexDirection: "row",
    gap: 0,
    marginTop: 16,
    marginHorizontal: "16mm",
    border: `1 solid ${C.line}`,
    borderRadius: 8,
    overflow: "hidden",
  },
  kpiCell: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRight: `1 solid ${C.line}`,
  },
  kpiCellLast: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  kpiEyebrow: {
    fontSize: 6.5,
    fontFamily: BOLD,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontFamily: BOLD,
    lineHeight: 1,
  },
  kpiSub: {
    fontSize: 7,
    marginTop: 4,
  },

  // Progress bar
  progressWrap: {
    marginHorizontal: "16mm",
    marginTop: 10,
    marginBottom: 4,
  },
  progressTrack: {
    height: 4,
    backgroundColor: C.lineSoft,
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: C.teal,
    borderRadius: 2,
  },
  progressLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  progressText: {
    fontSize: 7,
    color: C.muted,
  },

  // Section title
  sectionLabel: {
    fontSize: 7,
    fontFamily: BOLD,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 16,
  },

  // Divider
  divider: {
    borderBottom: `1 solid ${C.line}`,
    marginBottom: 12,
  },

  // Transaction row (actes signés)
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottom: `1 solid ${C.lineSoft}`,
    backgroundColor: C.white,
  },
  txRowAlt: {
    backgroundColor: C.pageGray,
  },
  txLeft: {
    flex: 1,
  },
  txParties: {
    fontSize: 8.5,
    fontFamily: BOLD,
    color: C.ink,
  },
  txBien: {
    fontSize: 7.5,
    color: C.mid,
    marginTop: 1.5,
  },
  txMeta: {
    fontSize: 7,
    color: C.muted,
    marginTop: 1.5,
  },
  txRight: {
    alignItems: "flex-end",
    paddingLeft: 12,
  },
  txAmount: {
    fontSize: 12,
    fontFamily: BOLD,
    color: C.teal,
  },
  txStatus: {
    fontSize: 6.5,
    fontFamily: BOLD,
    color: C.teal,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  txDate: {
    fontSize: 7,
    color: C.muted,
    marginTop: 2,
  },

  // Total bar
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.navy,
    padding: "9 14",
    borderRadius: 6,
    marginTop: 6,
  },
  totalBarLabel: {
    color: C.white,
    fontSize: 8,
    fontFamily: BOLD,
  },
  totalBarValue: {
    color: C.white,
    fontSize: 13,
    fontFamily: BOLD,
  },
  totalBarSub: {
    color: "#7FA4C2",
    fontSize: 7,
    marginTop: 1,
  },

  // Compromis card
  compromisCard: {
    border: `1 solid ${C.line}`,
    borderRadius: 6,
    marginBottom: 7,
    overflow: "hidden",
  },
  compromisCardAlert: {
    borderColor: "#D4822A",
    borderLeftWidth: 3,
    borderLeftColor: "#D4822A",
  },
  compromisHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 11,
    backgroundColor: C.pageGray,
    borderBottom: `1 solid ${C.line}`,
  },
  compromisHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compromisRef: {
    fontSize: 9,
    fontFamily: BOLD,
    color: C.navy,
  },
  compromisAmount: {
    fontSize: 13,
    fontFamily: BOLD,
    color: C.amber,
  },
  compromisBody: {
    flexDirection: "row",
    paddingHorizontal: 11,
    paddingTop: 7,
    paddingBottom: 4,
    gap: 0,
  },
  compromisField: {
    flex: 1,
  },
  compromisFieldWide: {
    flex: 2,
  },
  compromisLbl: {
    fontSize: 6,
    fontFamily: BOLD,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  compromisVal: {
    fontSize: 8,
    color: C.ink,
  },
  timeline: {
    flexDirection: "row",
    borderTop: `1 solid ${C.lineSoft}`,
    marginTop: 4,
  },
  tlCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRight: `1 solid ${C.lineSoft}`,
    alignItems: "center",
  },
  tlCellLast: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tlLbl: {
    fontSize: 5.5,
    fontFamily: BOLD,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  tlVal: {
    fontSize: 8,
    fontFamily: BOLD,
    color: C.mid,
  },
  tlValAlert: {
    color: "#C0420A",
  },
  tlValHighlight: {
    color: C.navyLight,
  },

  // Pill badge
  pill: {
    fontSize: 6.5,
    fontFamily: BOLD,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    textTransform: "uppercase",
  },

  // Alert box
  alertBox: {
    backgroundColor: "#FEF5E4",
    border: `1 solid #E0A93D`,
    borderRadius: 6,
    padding: "8 11",
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 8,
    fontFamily: BOLD,
    color: "#7A4500",
    marginBottom: 4,
  },
  alertRow: {
    fontSize: 7.5,
    color: "#7A4500",
    marginBottom: 2,
  },

  // Mandats table
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.navy,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 0,
  },
  th: {
    fontSize: 7,
    fontFamily: BOLD,
    color: "#7FA4C2",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottom: `1 solid ${C.lineSoft}`,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: C.pageGray,
  },
  td: {
    fontSize: 8.5,
  },

  // Agent performance
  agentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottom: `1 solid ${C.lineSoft}`,
  },
  agentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  agentName: {
    fontSize: 9,
    fontFamily: BOLD,
    width: 60,
    color: C.ink,
  },
  agentStat: {
    fontSize: 8,
    color: C.mid,
    flex: 1,
  },
  agentAmount: {
    fontSize: 10,
    fontFamily: BOLD,
    color: C.navyLight,
  },

  // Empty state
  empty: {
    padding: 16,
    textAlign: "center",
    fontSize: 8.5,
    color: C.muted,
    border: `1 dashed ${C.line}`,
    borderRadius: 6,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: "10mm",
    left: "16mm",
    right: "16mm",
    borderTop: `1 solid ${C.line}`,
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontSize: 7,
    color: C.muted,
  },
  footerRight: {
    fontSize: 7,
    color: C.muted,
  },
  footerMark: {
    fontSize: 7,
    fontFamily: BOLD,
    color: C.navy,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const E = (n: number) =>
  `${(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €`;

const fd = (d?: string | null) =>
  d ? new Date(d + "T12:00").toLocaleDateString("fr-FR") : "—";

const today = new Date().toLocaleDateString("fr-FR", {
  day: "numeric", month: "long", year: "numeric",
});

const todayShort = new Date().toLocaleDateString("fr-FR");

const dd = (d?: string | null): number | null =>
  d ? Math.round((new Date(d + "T12:00").getTime() - Date.now()) / 86400000) : null;

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageHeader({ title, page, total }: { title: string; page: number; total: number }) {
  return (
    <View style={s.pageHeader} fixed>
      <Text style={s.pageHeaderLeft}>CASA CARAÏBES — {title}</Text>
      <Text style={s.pageHeaderRight}>{todayShort} · Page {page}/{total}</Text>
    </View>
  );
}

function Footer({ label }: { label: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerLeft}>CASA CARAÏBES SARL · RCS Fort-de-France 928 647 981 · CPI 97212024000000007 · Martinique</Text>
      <View style={{ flexDirection: "row", gap: 4 }}>
        <Text style={s.footerMark}>{label}</Text>
        <Text style={s.footerRight}>· Confidentiel</Text>
      </View>
    </View>
  );
}

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <Text style={[s.pill, { backgroundColor: bg, color }]}>{label}</Text>
  );
}

// ─── COVER PAGE ───────────────────────────────────────────────────────────────
function CoverPage({ fin, pct }: { fin: Financials; pct: number }) {
  const pctClamped = Math.min(100, Math.max(0, pct));

  return (
    <Page size="A4" style={s.page}>
      {/* Header band */}
      <View style={s.coverBand}>
        <Text style={s.coverEyebrow}>Rapport financier · {today}</Text>
        <Text style={s.coverTitle}>Casa Caraïbes</Text>
        <Text style={s.coverMeta}>
          SARL · RCS Fort-de-France 928 647 981 · CPI 97212024000000007{"\n"}
          Martinique · Confidentiel
        </Text>
      </View>

      {/* KPI strip */}
      <View style={s.kpiStrip}>
        <View style={[s.kpiCell, { backgroundColor: C.tealBg }]}>
          <Text style={[s.kpiEyebrow, { color: C.teal }]}>Commissions encaissées</Text>
          <Text style={[s.kpiValue, { color: C.teal }]}>{E(fin.globalEncaisse)}</Text>
          <Text style={[s.kpiSub, { color: C.teal }]}>
            {fin.actesEncaisses.length} acte{fin.actesEncaisses.length > 1 ? "s" : ""} signé{fin.actesEncaisses.length > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={[s.kpiCell, { backgroundColor: C.amberBg }]}>
          <Text style={[s.kpiEyebrow, { color: C.amber }]}>À encaisser</Text>
          <Text style={[s.kpiValue, { color: C.amber }]}>{E(fin.globalAEncaisser)}</Text>
          <Text style={[s.kpiSub, { color: C.amber }]}>
            {fin.compromisAEncaisser.length} compromis en cours
          </Text>
        </View>
        <View style={[s.kpiCellLast, { backgroundColor: C.slateBg }]}>
          <Text style={[s.kpiEyebrow, { color: C.slate }]}>Volume portefeuille</Text>
          <Text style={[s.kpiValue, { color: C.slate }]}>{E(fin.totalPotentiel)}</Text>
          <Text style={[s.kpiSub, { color: C.slate }]}>
            {fin.mandatsEnCours.length} mandat{fin.mandatsEnCours.length > 1 ? "s" : ""} actif{fin.mandatsEnCours.length > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={s.progressWrap}>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${pctClamped}%` }]} />
        </View>
        <View style={s.progressLabel}>
          <Text style={s.progressText}>Taux de réalisation</Text>
          <Text style={[s.progressText, { fontFamily: BOLD, color: C.teal }]}>{pct}%</Text>
        </View>
      </View>

      {/* Summary section */}
      <View style={s.body}>
        <Text style={s.sectionLabel}>Contenu du rapport</Text>
        <View style={{ border: `1 solid ${C.line}`, borderRadius: 6, overflow: "hidden" }}>
          {[
            { n: "01", title: "Actes signés & commissions encaissées", desc: "Historique complet des transactions abouties" },
            { n: "02", title: "Portefeuille compromis", desc: "Commissions sécurisées en attente d'encaissement" },
            { n: "03", title: "Mandats actifs & performances", desc: "Suivi des mandats en cours et performances par négociateur" },
          ].map((item, i) => (
            <View
              key={item.n}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 11,
                paddingHorizontal: 14,
                borderBottom: i < 2 ? `1 solid ${C.lineSoft}` : 0,
                backgroundColor: i % 2 === 1 ? C.pageGray : C.white,
              }}
            >
              <Text style={{ fontSize: 18, fontFamily: BOLD, color: C.line, width: 34 }}>{item.n}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, fontFamily: BOLD, color: C.navy }}>{item.title}</Text>
                <Text style={{ fontSize: 7.5, color: C.muted, marginTop: 2 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Footer label="Synthèse" />
    </Page>
  );
}

// ─── PAGE 2 — ACTES SIGNÉS ────────────────────────────────────────────────────
function ActesPage({ fin }: { fin: Financials }) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Actes signés" page={2} total={4} />
      <View style={s.body}>
        <Text style={s.sectionLabel}>Commissions encaissées · {fin.actesEncaisses.length} transaction{fin.actesEncaisses.length > 1 ? "s" : ""}</Text>

        {fin.actesEncaisses.length === 0 ? (
          <Text style={s.empty}>Aucun acte signé encaissé à ce jour.</Text>
        ) : (
          <View style={{ border: `1 solid ${C.line}`, borderRadius: 6, overflow: "hidden" }}>
            {fin.actesEncaisses.map((c, i) => (
              <View key={c.id} style={[s.txRow, i % 2 === 1 ? s.txRowAlt : {}]} wrap={false}>
                <View style={s.txLeft}>
                  <Text style={s.txParties}>
                    {c.acheteur}
                    {c.vendeur ? <Text style={{ color: C.mid, fontFamily: REG }}> — {c.vendeur}</Text> : ""}
                  </Text>
                  <Text style={s.txBien}>{c.bienRef ? `${c.bienRef} · ` : ""}{c.bienDesc || "—"}</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 3 }}>
                    {c.notaire && <Text style={s.txMeta}>Me {c.notaire}</Text>}
                    {c.dateActePrev && (
                      <Text style={s.txMeta}>Acte le {fd(c.dateActePrev)}</Text>
                    )}
                  </View>
                </View>
                <View style={s.txRight}>
                  <Text style={s.txAmount}>{E(commissionMontant(c))}</Text>
                  <Text style={s.txStatus}>✓ Encaissé</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {fin.actesEncaisses.length > 0 && (
          <View style={s.totalBar}>
            <View>
              <Text style={s.totalBarLabel}>Total commissions encaissées</Text>
              <Text style={s.totalBarSub}>{fin.actesEncaisses.length} acte{fin.actesEncaisses.length > 1 ? "s" : ""} signé{fin.actesEncaisses.length > 1 ? "s" : ""}</Text>
            </View>
            <Text style={s.totalBarValue}>{E(fin.totalActesEncaisses)}</Text>
          </View>
        )}
      </View>
      <Footer label="Actes signés" />
    </Page>
  );
}

// ─── PAGE 3 — COMPROMIS ───────────────────────────────────────────────────────
function CompromisPage({ fin }: { fin: Financials }) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Portefeuille compromis" page={3} total={4} />
      <View style={s.body}>

        {fin.alertesDelais.length > 0 && (
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>⚠ Délais critiques — action requise</Text>
            {fin.alertesDelais.map((c) => {
              const sru = dd(c.sruExpire), cond = dd(c.condSuspExpire);
              return (
                <Text key={c.id} style={s.alertRow}>
                  {c.ref} · {c.acheteur}
                  {sru !== null && sru <= 3 ? ` · SRU : ${sru <= 0 ? "expiré" : `${sru}j`}` : ""}
                  {cond !== null && cond <= 7 ? ` · Cond. susp. : ${cond <= 0 ? "expirée" : `${cond}j`}` : ""}
                </Text>
              );
            })}
          </View>
        )}

        <Text style={s.sectionLabel}>
          Commissions à encaisser · {fin.compromisAEncaisser.length} dossier{fin.compromisAEncaisser.length > 1 ? "s" : ""}
        </Text>

        {fin.compromisAEncaisser.length === 0 ? (
          <Text style={s.empty}>Aucun compromis en attente d'encaissement.</Text>
        ) : (
          fin.compromisAEncaisser.map((c) => {
            const sru = dd(c.sruExpire), cond = dd(c.condSuspExpire);
            const sruWarn = sru !== null && sru <= 3;
            const condWarn = cond !== null && cond <= 7;
            const alert = sruWarn || condWarn;
            const isCompromis = c.statut === "Compromis";
            const pillBg = isCompromis ? C.slateBg : C.amberBg;
            const pillCol = isCompromis ? C.slate : C.amber;

            return (
              <View
                key={c.id}
                style={[s.compromisCard, ...(alert ? [s.compromisCardAlert] : [])]}
                wrap={false}
              >
                {/* Head */}
                <View style={s.compromisHead}>
                  <View style={s.compromisHeadLeft}>
                    <Text style={s.compromisRef}>{c.ref || "—"}</Text>
                    <Pill label={c.statut} bg={pillBg} color={pillCol} />
                    {alert && <Pill label="Délai" bg="#FBEDED" color="#C0420A" />}
                  </View>
                  <Text style={s.compromisAmount}>{E(commissionMontant(c))}</Text>
                </View>

                {/* Body */}
                <View style={s.compromisBody}>
                  <View style={s.compromisFieldWide}>
                    <Text style={s.compromisLbl}>Parties</Text>
                    <Text style={s.compromisVal}>{c.acheteur} / {c.vendeur || "—"}</Text>
                  </View>
                  <View style={s.compromisField}>
                    <Text style={s.compromisLbl}>Bien</Text>
                    <Text style={s.compromisVal}>{c.bienRef ? `${c.bienRef}` : ""}{c.bienDesc ? ` · ${c.bienDesc}` : "—"}</Text>
                  </View>
                  <View style={s.compromisField}>
                    <Text style={s.compromisLbl}>Notaire</Text>
                    <Text style={s.compromisVal}>{c.notaire ? `Me ${c.notaire}` : "—"}</Text>
                  </View>
                </View>
                {c.financement && (
                  <View style={{ paddingHorizontal: 11, paddingBottom: 6 }}>
                    <Text style={[s.compromisLbl, { marginBottom: 1 }]}>Financement</Text>
                    <Text style={s.compromisVal}>{c.financement}</Text>
                  </View>
                )}

                {/* Timeline */}
                <View style={s.timeline}>
                  <View style={s.tlCell}>
                    <Text style={s.tlLbl}>Offre</Text>
                    <Text style={s.tlVal}>{fd(c.dateOffre)}</Text>
                  </View>
                  <View style={s.tlCell}>
                    <Text style={s.tlLbl}>Compromis</Text>
                    <Text style={s.tlVal}>{fd(c.dateCompromis)}</Text>
                  </View>
                  <View style={[s.tlCell, { backgroundColor: C.slateBg }]}>
                    <Text style={s.tlLbl}>Acte prévu</Text>
                    <Text style={[s.tlVal, s.tlValHighlight]}>{fd(c.dateActePrev)}</Text>
                  </View>
                  <View style={[s.tlCell, sruWarn ? { backgroundColor: "#FBEDED" } : {}]}>
                    <Text style={s.tlLbl}>Fin SRU</Text>
                    <Text style={[s.tlVal, sruWarn ? s.tlValAlert : {}]}>
                      {sru !== null && sru <= 0 ? "Expiré" : fd(c.sruExpire)}
                    </Text>
                  </View>
                  <View style={[s.tlCellLast, condWarn ? { backgroundColor: "#FBEDED" } : {}]}>
                    <Text style={s.tlLbl}>Cond. susp.</Text>
                    <Text style={[s.tlVal, condWarn ? s.tlValAlert : {}]}>
                      {cond !== null && cond <= 0 ? "Expirée" : fd(c.condSuspExpire)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {fin.compromisAEncaisser.length > 0 && (
          <View style={s.totalBar}>
            <View>
              <Text style={s.totalBarLabel}>Total à encaisser</Text>
              <Text style={s.totalBarSub}>{fin.compromisAEncaisser.length} compromis · sécurisé</Text>
            </View>
            <Text style={s.totalBarValue}>{E(fin.totalCompromisAEncaisser)}</Text>
          </View>
        )}
      </View>
      <Footer label="Portefeuille compromis" />
    </Page>
  );
}

// ─── PAGE 4 — MANDATS + AGENTS ────────────────────────────────────────────────
function MandatsPage({ fin, data }: { fin: Financials; data: AgencyData }) {
  const sorted = [...fin.mandatsEnCours].sort((a, b) =>
    (a.dateFin || "").localeCompare(b.dateFin || "")
  );

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title="Mandats & performances" page={4} total={4} />
      <View style={s.body}>

        <Text style={s.sectionLabel}>Mandats actifs · {fin.mandatsEnCours.length} en cours</Text>

        {fin.mandatsEnCours.length === 0 ? (
          <Text style={s.empty}>Aucun mandat actif.</Text>
        ) : (
          <View style={{ border: `1 solid ${C.line}`, borderRadius: 6, overflow: "hidden" }}>
            {/* Table head */}
            <View style={s.tableHead}>
              <Text style={[s.th, { width: "18%" }]}>Réf.</Text>
              <Text style={[s.th, { width: "12%" }]}>Type</Text>
              <Text style={[s.th, { width: "28%" }]}>Mandant</Text>
              <Text style={[s.th, { width: "20%" }]}>Bien / Commune</Text>
              <Text style={[s.th, { width: "8%", textAlign: "center" }]}>Hon.</Text>
              <Text style={[s.th, { width: "14%", textAlign: "right" }]}>Échéance</Text>
            </View>
            {sorted.map((m, i) => {
              const d = dd(m.dateFin);
              const exp = d !== null && d < 0;
              const soon = d !== null && d >= 0 && d <= 30;
              const bg = exp ? "#FBEDED" : soon ? C.amberBg : C.tealBg;
              const cl = exp ? "#C0420A" : soon ? C.amber : C.teal;
              const lbl = exp ? `Expiré (${Math.abs(d!)}j)` : soon ? `${d}j` : fd(m.dateFin);
              const bien = data.biens.find((b) => b.id === m.bienId || b.ref === m.bienId);

              return (
                <View
                  key={m.id}
                  style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
                  wrap={false}
                >
                  <Text style={[s.td, { width: "18%", fontFamily: BOLD, color: C.navy }]}>{m.ref || "—"}</Text>
                  <Text style={[s.td, { width: "12%", color: C.mid }]}>{m.type}</Text>
                  <Text style={[s.td, { width: "28%" }]}>{m.mandant}</Text>
                  <Text style={[s.td, { width: "20%", color: C.mid }]}>
                    {bien ? bien.commune : m.bienId || "—"}
                  </Text>
                  <Text style={[s.td, { width: "8%", textAlign: "center", fontFamily: BOLD }]}>
                    {m.honoraires}%
                  </Text>
                  <View style={{ width: "14%", alignItems: "flex-end" }}>
                    <Text style={[s.pill, { backgroundColor: bg, color: cl }]}>{lbl}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={[s.sectionLabel, { marginTop: 20 }]}>Performances par négociateur</Text>

        <View style={{ border: `1 solid ${C.line}`, borderRadius: 6, overflow: "hidden" }}>
          {fin.agentPerformance.map((a, i) => (
            <View
              key={a.id}
              style={[s.agentRow, i % 2 === 1 ? { backgroundColor: C.pageGray } : {}]}
            >
              <View style={[s.agentDot, { backgroundColor: a.color }]} />
              <Text style={s.agentName}>{a.name}</Text>
              <Text style={s.agentStat}>
                {a.compromis} dossier{a.compromis > 1 ? "s" : ""} · {a.clients} client{a.clients > 1 ? "s" : ""}
              </Text>
              <Text style={s.agentAmount}>{E(a.caVentes)}</Text>
            </View>
          ))}
        </View>

        {/* Récapitulatif financier en bas de dernière page */}
        <View style={{ marginTop: 18 }}>
          <Text style={s.sectionLabel}>Récapitulatif financier</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: C.tealBg, borderRadius: 6, padding: 10 }}>
              <Text style={{ fontSize: 7, fontFamily: BOLD, color: C.teal, textTransform: "uppercase", marginBottom: 3 }}>Encaissé</Text>
              <Text style={{ fontSize: 15, fontFamily: BOLD, color: C.teal }}>{E(fin.globalEncaisse)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: C.amberBg, borderRadius: 6, padding: 10 }}>
              <Text style={{ fontSize: 7, fontFamily: BOLD, color: C.amber, textTransform: "uppercase", marginBottom: 3 }}>À encaisser</Text>
              <Text style={{ fontSize: 15, fontFamily: BOLD, color: C.amber }}>{E(fin.globalAEncaisser)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: C.slateBg, borderRadius: 6, padding: 10 }}>
              <Text style={{ fontSize: 7, fontFamily: BOLD, color: C.slate, textTransform: "uppercase", marginBottom: 3 }}>Total potentiel</Text>
              <Text style={{ fontSize: 15, fontFamily: BOLD, color: C.slate }}>{E(fin.totalPotentiel)}</Text>
            </View>
          </View>
        </View>

      </View>
      <Footer label="Mandats & performances" />
    </Page>
  );
}

// ─── EXPORT PRINCIPAL ─────────────────────────────────────────────────────────
export function RapportFinancier({ data, fin }: { data: AgencyData; fin: Financials }) {
  const pct = fin.pctRealise ?? 0;

  return (
    <Document>
      <CoverPage fin={fin} pct={pct} />
      <ActesPage fin={fin} />
      <CompromisPage fin={fin} />
      <MandatsPage fin={fin} data={data} />
    </Document>
  );
}
