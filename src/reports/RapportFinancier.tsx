import {
  Document, Page, Text, View, StyleSheet, Font,
} from "@react-pdf/renderer";
import type { AgencyData } from "../types/domain";
import type { Financials } from "../hooks/useFinancials";
import { commissionMontant } from "../schemas/compromis.schema";

Font.register({
  family: "Montserrat",
  fonts: [
    { src: "https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/montserrat/v26/JTURjIg1_i6t8kCHKm45_dJE3gnD-w.ttf", fontWeight: 700 },
  ],
});

const C = {
  primary: "#1A3A52", emerald: "#2D7A5F", amber: "#9A6D22", danger: "#A03A30",
  ink: "#1A1A18", sub: "#6B6B67", muted: "#9B9B97", line: "#E4E4E0",
  bg: "#FAFAF8", emeraldSoft: "#EAF5F0", amberSoft: "#FBF4E6", primarySoft: "#EBF1F6",
};

const s = StyleSheet.create({
  page: { padding: "16mm 15mm", fontFamily: "Montserrat", fontSize: 9, color: C.ink },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, paddingBottom: 12, borderBottom: `3 solid ${C.primary}` },
  logo: { fontSize: 22, fontWeight: 700, color: C.primary },
  sub: { fontSize: 9, color: C.sub, marginTop: 2 },
  meta: { textAlign: "right", fontSize: 8, color: C.sub, lineHeight: 1.5 },
  sectionTitle: { fontSize: 8, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1.5 solid ${C.line}`, paddingBottom: 4, marginTop: 16, marginBottom: 10 },
  synth: { flexDirection: "row", gap: 8, marginBottom: 10 },
  synthCard: { flex: 1, borderRadius: 6, padding: 10, border: `1 solid ${C.line}` },
  synthLbl: { fontSize: 7, fontWeight: 700, textTransform: "uppercase" },
  synthVal: { fontSize: 14, fontWeight: 700, marginTop: 3 },
  synthNote: { fontSize: 7, marginTop: 2 },
  dossier: { border: `1 solid ${C.line}`, borderRadius: 6, marginBottom: 8 },
  dossierAlert: { borderColor: "#E0A93D", borderLeft: "3 solid #B07D2E" },
  dossierTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#F4F6F8", padding: 7, borderBottom: `1 solid ${C.line}` },
  ref: { fontSize: 10, fontWeight: 700, color: C.primary },
  comm: { fontSize: 11, fontWeight: 700, color: C.primary, textAlign: "right" },
  body: { flexDirection: "row", flexWrap: "wrap", padding: 8 },
  field: { width: "50%", marginBottom: 4 },
  lbl: { fontSize: 6.5, fontWeight: 700, color: C.muted, textTransform: "uppercase" },
  val: { fontSize: 8.5, color: C.ink, marginTop: 1 },
  dates: { flexDirection: "row", borderTop: `1 dashed ${C.line}`, backgroundColor: "#FCFCFB" },
  dateCell: { flex: 1, padding: 6, borderRight: `1 dashed ${C.line}`, alignItems: "center" },
  dateLbl: { fontSize: 6, fontWeight: 700, color: C.muted, textTransform: "uppercase" },
  dateVal: { fontSize: 8.5, fontWeight: 700, marginTop: 1 },
  total: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.primary, borderRadius: 6, padding: "9 14", marginTop: 4 },
  totalLbl: { color: "#fff", fontSize: 9, fontWeight: 700 },
  totalVal: { color: "#fff", fontSize: 11, fontWeight: 700 },
  table: { marginTop: 4 },
  trHead: { flexDirection: "row", backgroundColor: C.primary },
  th: { color: "#fff", fontSize: 8, fontWeight: 700, padding: "6 8" },
  tr: { flexDirection: "row", borderBottom: `1 solid #EBEAE7` },
  td: { fontSize: 8.5, padding: "5 8" },
  pill: { fontSize: 7, fontWeight: 700, paddingVertical: 1.5, paddingHorizontal: 6, borderRadius: 8, textTransform: "uppercase" },
  alertBox: { backgroundColor: C.amberSoft, border: `1 solid #E0A93D`, borderLeft: `3 solid ${C.danger}`, borderRadius: 6, padding: 10, marginBottom: 12 },
  alertTitle: { fontSize: 9, fontWeight: 700, color: C.danger, marginBottom: 4 },
  alertRow: { fontSize: 8.5, color: C.danger, marginBottom: 2 },
  footer: { position: "absolute", bottom: "10mm", left: "15mm", right: "15mm", borderTop: `1 solid ${C.line}`, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerTxt: { fontSize: 7.5, color: C.muted },
  empty: { padding: 16, textAlign: "center", fontSize: 9, color: C.muted, border: `1 dashed ${C.line}`, borderRadius: 6 },
});

const E = (n: number) => `${(n || 0).toLocaleString("fr-FR")} €`;
const fd = (d: string) => (d ? new Date(d + "T12:00").toLocaleDateString("fr-FR") : "—");
const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const dd = (d: string): number | null => (d ? Math.round((new Date(d + "T12:00").getTime() - Date.now()) / 86400000) : null);

function Header({ subtitle }: { subtitle: string }) {
  return (
    <View style={s.header}>
      <View>
        <Text style={s.logo}>CASA CARAÏBES</Text>
        <Text style={s.sub}>{subtitle}</Text>
      </View>
      <View>
        <Text style={[s.meta, { fontWeight: 700, color: C.ink }]}>{today}</Text>
        <Text style={s.meta}>SARL — RCS Fort-de-France 928 647 981</Text>
        <Text style={s.meta}>CPI 97212024000000007</Text>
      </View>
    </View>
  );
}

function Synthese({ fin, compact }: { fin: Financials; compact?: boolean }) {
  return (
    <View style={s.synth}>
      <View style={[s.synthCard, { backgroundColor: C.emeraldSoft }]}>
        <Text style={[s.synthLbl, { color: C.emerald }]}>Encaissé réel</Text>
        <Text style={[s.synthVal, { color: C.emerald, fontSize: compact ? 12 : 14 }]}>{E(fin.globalEncaisse)}</Text>
        {!compact && <Text style={[s.synthNote, { color: C.emerald }]}>Ce mois : {E(fin.revMois)}</Text>}
      </View>
      <View style={[s.synthCard, { backgroundColor: C.amberSoft }]}>
        <Text style={[s.synthLbl, { color: C.amber }]}>À encaisser</Text>
        <Text style={[s.synthVal, { color: C.amber, fontSize: compact ? 12 : 14 }]}>{E(fin.globalAEncaisser)}</Text>
        {!compact && <Text style={[s.synthNote, { color: C.amber }]}>Portefeuille sécurisé</Text>}
      </View>
      <View style={[s.synthCard, { backgroundColor: C.primarySoft }]}>
        <Text style={[s.synthLbl, { color: C.primary }]}>Volume total</Text>
        <Text style={[s.synthVal, { color: C.primary, fontSize: compact ? 12 : 14 }]}>{E(fin.totalPotentiel)}</Text>
        {!compact && <Text style={[s.synthNote, { color: C.primary }]}>{fin.pctRealise}% réalisé</Text>}
      </View>
    </View>
  );
}

function Footer({ tag }: { tag: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>CASA CARAÏBES SARL — CPI 97212024000000007 — Martinique</Text>
      <Text style={s.footerTxt}>{tag} · {today} · Confidentiel</Text>
    </View>
  );
}

export function RapportFinancier({ data, fin }: { data: AgencyData; fin: Financials }) {
  return (
    <Document>
      {/* PAGE 1 — ACTES SIGNÉS ENCAISSÉS */}
      <Page size="A4" style={s.page}>
        <Header subtitle="Actes signés & commissions encaissées" />
        <Text style={s.sectionTitle}>Synthèse financière globale</Text>
        <Synthese fin={fin} />
        <Text style={s.sectionTitle}>Actes signés — commissions encaissées</Text>
        {fin.actesEncaisses.length === 0 ? (
          <Text style={s.empty}>Aucun acte signé encaissé à ce jour.</Text>
        ) : (
          fin.actesEncaisses.map((c) => (
            <View key={c.id} style={s.dossier} wrap={false}>
              <View style={s.dossierTop}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={s.ref}>{c.ref}</Text>
                  <Text style={[s.pill, { backgroundColor: C.emeraldSoft, color: C.emerald }]}>Acte signé</Text>
                </View>
                <Text style={s.comm}>{E(commissionMontant(c))}</Text>
              </View>
              <View style={s.body}>
                <View style={s.field}><Text style={s.lbl}>Acheteur</Text><Text style={s.val}>{c.acheteur}</Text></View>
                <View style={s.field}><Text style={s.lbl}>Vendeur</Text><Text style={s.val}>{c.vendeur || "—"}</Text></View>
                <View style={s.field}><Text style={s.lbl}>Bien</Text><Text style={s.val}>{c.bienRef} {c.bienDesc}</Text></View>
                <View style={s.field}><Text style={s.lbl}>Notaire</Text><Text style={s.val}>{c.notaire || "—"}</Text></View>
              </View>
              <View style={s.dates}>
                <View style={s.dateCell}><Text style={s.dateLbl}>Compromis</Text><Text style={s.dateVal}>{fd(c.dateCompromis)}</Text></View>
                <View style={[s.dateCell, { backgroundColor: C.primarySoft }]}><Text style={s.dateLbl}>Acte prévu</Text><Text style={[s.dateVal, { color: C.primary }]}>{fd(c.dateActePrev)}</Text></View>
                <View style={[s.dateCell, { backgroundColor: C.emeraldSoft, borderRight: 0 }]}><Text style={s.dateLbl}>Acte signé</Text><Text style={[s.dateVal, { color: C.emerald }]}>{fd(c.dateActeReel)}</Text></View>
              </View>
            </View>
          ))
        )}
        {fin.actesEncaisses.length > 0 && (
          <View style={s.total}>
            <Text style={s.totalLbl}>Total encaissé sur actes signés ({fin.actesEncaisses.length})</Text>
            <Text style={s.totalVal}>{E(fin.totalActesEncaisses)}</Text>
          </View>
        )}
        <Footer tag="Page 1/3 — Actes encaissés" />
      </Page>

      {/* PAGE 2 — COMPROMIS À ENCAISSER */}
      <Page size="A4" style={s.page}>
        <Header subtitle="Compromis signés — commissions à encaisser" />
        <Synthese fin={fin} compact />
        {fin.alertesDelais.length > 0 && (
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Délais critiques — action requise</Text>
            {fin.alertesDelais.map((c) => {
              const sru = dd(c.sruExpire), cond = dd(c.condSuspExpire);
              return (
                <Text key={c.id} style={s.alertRow}>
                  {c.ref} — {c.acheteur}
                  {sru !== null && sru <= 3 ? ` · SRU : ${sru <= 0 ? "expiré" : sru + "j"}` : ""}
                  {cond !== null && cond <= 7 ? ` · Cond. susp. : ${cond <= 0 ? "expirée" : cond + "j"}` : ""}
                </Text>
              );
            })}
          </View>
        )}
        <Text style={s.sectionTitle}>Portefeuille de compromis à encaisser</Text>
        {fin.compromisAEncaisser.length === 0 ? (
          <Text style={s.empty}>Aucun compromis en attente d'encaissement.</Text>
        ) : (
          fin.compromisAEncaisser.map((c) => {
            const sru = dd(c.sruExpire), cond = dd(c.condSuspExpire);
            const sruWarn = sru !== null && sru <= 3, condWarn = cond !== null && cond <= 7;
            const alert = sruWarn || condWarn;
            const pillBg = c.statut === "Compromis" ? C.primarySoft : C.amberSoft;
            const pillCol = c.statut === "Compromis" ? C.primary : C.amber;
            return (
              <View key={c.id} style={[s.dossier, ...(alert ? [s.dossierAlert] : [])]} wrap={false}>
                <View style={s.dossierTop}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={s.ref}>{c.ref}</Text>
                    <Text style={[s.pill, { backgroundColor: pillBg, color: pillCol }]}>{c.statut}</Text>
                    {alert && <Text style={[s.pill, { backgroundColor: "#FBEDED", color: C.danger }]}>Délai</Text>}
                  </View>
                  <Text style={s.comm}>{E(commissionMontant(c))}</Text>
                </View>
                <View style={s.body}>
                  <View style={s.field}><Text style={s.lbl}>Acheteur</Text><Text style={s.val}>{c.acheteur}</Text></View>
                  <View style={s.field}><Text style={s.lbl}>Vendeur</Text><Text style={s.val}>{c.vendeur || "—"}</Text></View>
                  <View style={s.field}><Text style={s.lbl}>Bien</Text><Text style={s.val}>{c.bienRef} {c.bienDesc}</Text></View>
                  <View style={s.field}><Text style={s.lbl}>Notaire</Text><Text style={s.val}>{c.notaire || "—"}</Text></View>
                  <View style={[s.field, { width: "100%" }]}><Text style={s.lbl}>Financement</Text><Text style={s.val}>{c.financement || "—"}</Text></View>
                </View>
                <View style={s.dates}>
                  <View style={s.dateCell}><Text style={s.dateLbl}>Offre</Text><Text style={s.dateVal}>{fd(c.dateOffre)}</Text></View>
                  <View style={s.dateCell}><Text style={s.dateLbl}>Compromis</Text><Text style={s.dateVal}>{fd(c.dateCompromis)}</Text></View>
                  <View style={[s.dateCell, { backgroundColor: C.primarySoft }]}><Text style={s.dateLbl}>Acte prévu</Text><Text style={[s.dateVal, { color: C.primary }]}>{fd(c.dateActePrev)}</Text></View>
                  <View style={[s.dateCell, ...(sruWarn ? [{ backgroundColor: "#FBEDED" }] : [])]}><Text style={s.dateLbl}>Fin SRU</Text><Text style={[s.dateVal, ...(sruWarn ? [{ color: C.danger }] : [])]}>{sru !== null && sru <= 0 ? "Expiré" : fd(c.sruExpire)}</Text></View>
                  <View style={[s.dateCell, { borderRight: 0 }, ...(condWarn ? [{ backgroundColor: "#FBEDED" }] : [])]}><Text style={s.dateLbl}>Cond. susp.</Text><Text style={[s.dateVal, ...(condWarn ? [{ color: C.danger }] : [])]}>{cond !== null && cond <= 0 ? "Expirée" : fd(c.condSuspExpire)}</Text></View>
                </View>
              </View>
            );
          })
        )}
        {fin.compromisAEncaisser.length > 0 && (
          <View style={s.total}>
            <Text style={s.totalLbl}>Total à encaisser sur compromis ({fin.compromisAEncaisser.length})</Text>
            <Text style={s.totalVal}>{E(fin.totalCompromisAEncaisser)}</Text>
          </View>
        )}
        <Footer tag="Page 2/3 — Compromis à encaisser" />
      </Page>

      {/* PAGE 3 — MANDATS EN COURS */}
      <Page size="A4" style={s.page}>
        <Header subtitle="Mandats en cours — suivi des échéances" />
        <Synthese fin={fin} compact />
        <Text style={s.sectionTitle}>Mandats actifs</Text>
        {fin.mandatsEnCours.length === 0 ? (
          <Text style={s.empty}>Aucun mandat actif.</Text>
        ) : (
          <View style={s.table}>
            <View style={s.trHead}>
              <Text style={[s.th, { width: "20%" }]}>Réf. mandat</Text>
              <Text style={[s.th, { width: "15%" }]}>Type</Text>
              <Text style={[s.th, { width: "30%" }]}>Mandant</Text>
              <Text style={[s.th, { width: "15%" }]}>Bien</Text>
              <Text style={[s.th, { width: "10%" }]}>Hon.</Text>
              <Text style={[s.th, { width: "20%", textAlign: "right" }]}>Échéance</Text>
            </View>
            {[...fin.mandatsEnCours].sort((a, b) => (a.dateFin || "").localeCompare(b.dateFin || "")).map((m) => {
              const d = dd(m.dateFin);
              const exp = d !== null && d < 0, soon = d !== null && d >= 0 && d <= 30;
              const bg = exp ? "#FBEDED" : soon ? C.amberSoft : C.emeraldSoft;
              const cl = exp ? C.danger : soon ? C.amber : C.emerald;
              const lbl = exp ? `Expiré (${Math.abs(d!)}j)` : soon ? `${d}j` : fd(m.dateFin);
              const bien = data.biens.find((b) => b.id === m.bienId || b.ref === m.bienId);
              return (
                <View key={m.id} style={s.tr} wrap={false}>
                  <Text style={[s.td, { width: "20%", fontWeight: 700 }]}>{m.ref}</Text>
                  <Text style={[s.td, { width: "15%" }]}>{m.type}</Text>
                  <Text style={[s.td, { width: "30%" }]}>{m.mandant}</Text>
                  <Text style={[s.td, { width: "15%", color: C.sub }]}>{bien ? bien.commune : m.bienId || "—"}</Text>
                  <Text style={[s.td, { width: "10%", fontWeight: 700 }]}>{m.honoraires}%</Text>
                  <View style={[s.td, { width: "20%", alignItems: "flex-end" }]}>
                    <Text style={[s.pill, { backgroundColor: bg, color: cl }]}>{lbl}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <Text style={s.sectionTitle}>Performances par négociateur</Text>
        <View style={{ border: `1 solid ${C.line}`, borderRadius: 6 }}>
          {fin.agentPerformance.map((a) => (
            <View key={a.id} style={{ flexDirection: "row", alignItems: "center", padding: 9, borderBottom: `1 solid #EBEAE7`, gap: 8 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: a.color }} />
              <Text style={{ fontSize: 9.5, fontWeight: 700, width: 55 }}>{a.name}</Text>
              <Text style={{ fontSize: 8.5, color: C.sub, flex: 1, textAlign: "right" }}>
                {E(a.caVentes)} · {a.compromis} dossier(s) · {a.clients} client(s)
              </Text>
            </View>
          ))}
        </View>
        <Footer tag="Page 3/3 — Mandats en cours" />
      </Page>
    </Document>
  );
}
