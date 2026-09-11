import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "./pdfFonts";
import logo from "../assets/logo.png";
import type { Estimation } from "../schemas/estimation.schema";
import { nombreEnLettres } from "../schemas/estimation.schema";
import { LIMITES_VENALE, commentaireMarcheVenaleAuto, argumentaireVenaleAuto } from "../lib/estimationTextes";

const PRIMARY = "#1A3A52";
const BEIGE = "#F5EFE6";
const LINE = "#E4E4E0";
const INK = "#1A1A18";
const SUB = "#5B5B57";
const MUTED = "#9B9B97";
const BG = "#FAFAF8";

const s = StyleSheet.create({
  page: { fontFamily: "Montserrat", fontSize: 9, color: INK, padding: "18mm 16mm 22mm" },
  cover: { fontFamily: "Montserrat", color: INK, padding: "22mm 20mm", alignItems: "center", justifyContent: "center" },
  coverInner: { width: "100%", alignItems: "center" },
  logo: { width: 168, height: 56, objectFit: "contain", marginBottom: 22 },
  hair: { width: "42%", height: 0.9, backgroundColor: PRIMARY, marginBottom: 18 },
  band: { backgroundColor: PRIMARY, padding: "12 10", marginBottom: 16, alignItems: "center", width: "100%" },
  bandTop: { fontSize: 8, color: "#B0C4D8", letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 4 },
  coverTitle: { fontSize: 20, fontFamily: "Montserrat", fontWeight: 700, color: "#fff", textAlign: "center", letterSpacing: 1.2 },
  coverSub: { fontSize: 10, color: "#B0C4D8", textAlign: "center", marginTop: 4 },
  coverType: { fontSize: 11, fontFamily: "Montserrat", fontWeight: 700, textAlign: "center", marginBottom: 3 },
  coverAdr: { fontSize: 10, textAlign: "center", marginBottom: 2 },
  coverCad: { fontSize: 8.5, textAlign: "center", color: SUB, fontStyle: "italic", marginBottom: 12 },
  block: { border: `0.5 solid ${LINE}`, padding: "10 12", flex: 1 },
  blockLbl: { fontSize: 7.5, fontFamily: "Montserrat", fontWeight: 700, color: PRIMARY, letterSpacing: 0.7, marginBottom: 3, textAlign: "center" },
  blockVal: { fontSize: 10, fontFamily: "Montserrat", fontWeight: 700, textAlign: "center" },
  blockSub: { fontSize: 8.5, color: SUB, textAlign: "center", marginTop: 2 },
  coverDate: { fontSize: 9, color: SUB, fontStyle: "italic", textAlign: "center", marginTop: 12 },
  photo: { width: "100%", height: 180, objectFit: "cover", marginTop: 14 },
  sec: { fontSize: 11, fontFamily: "Montserrat", fontWeight: 700, color: PRIMARY, marginTop: 12, marginBottom: 2, textTransform: "uppercase" },
  secLine: { height: 1.4, backgroundColor: PRIMARY, marginBottom: 8 },
  sub: { fontSize: 9.5, fontFamily: "Montserrat", fontWeight: 700, color: PRIMARY, marginTop: 8, marginBottom: 5, borderLeft: `3 solid ${PRIMARY}`, paddingLeft: 6 },
  body: { fontSize: 9, color: INK, lineHeight: 1.6, marginBottom: 5, textAlign: "justify" },
  thRow: { flexDirection: "row", backgroundColor: PRIMARY },
  th: { color: "#fff", fontFamily: "Montserrat", fontWeight: 700, fontSize: 8, padding: "5 6", textAlign: "center" },
  tr: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}` },
  trA: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, backgroundColor: BG },
  td: { fontSize: 8.5, padding: "4 6", color: INK, textAlign: "center" },
  tdB: { fontFamily: "Montserrat", fontWeight: 700 },
  row2: { flexDirection: "row", marginBottom: 2 },
  valBox: { backgroundColor: BEIGE, border: `1 solid ${LINE}`, padding: "14 20", alignItems: "center", marginVertical: 10 },
  valLbl: { fontSize: 8.5, fontFamily: "Montserrat", fontWeight: 700, color: PRIMARY, letterSpacing: 1, marginBottom: 6 },
  valNum: { fontSize: 26, fontFamily: "Montserrat", fontWeight: 700, color: PRIMARY, marginBottom: 4 },
  valFine: { fontSize: 8.5, color: SUB, marginBottom: 3 },
  notice: { marginTop: 10, backgroundColor: BG, border: `0.5 solid ${LINE}`, padding: "8 10" },
  noticeTxt: { fontSize: 8, color: SUB, lineHeight: 1.5, textAlign: "justify" },
  footer: { position: "absolute", bottom: "10mm", left: "16mm", right: "16mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 5, flexDirection: "row", justifyContent: "space-between" },
  footerTxt: { fontSize: 7, color: MUTED },
});

const E = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR").replace(/\s/g, "\u00A0")} \u20AC`;
const fd = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "\u2014";

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>Casa Caraïbes — Estimation de valeur vénale — Document confidentiel</Text>
      <Text style={s.footerTxt} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  );
}
function SH({ title }: { title: string }) {
  return (<><Text style={s.sec}>{title}</Text><View style={s.secLine} /></>);
}
function LV({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "" || value === 0) return null;
  return (
    <View style={s.row2}>
      <Text style={[s.td, s.tdB, { width: "40%", paddingLeft: 0 }]}>{label}</Text>
      <Text style={[s.td, { flex: 1, paddingLeft: 0 }]}>{String(value)}</Text>
    </View>
  );
}

export function ValeurVenalePDF({ e }: { e: Estimation }) {
  const surface = e.surfaceHabitable || 0;
  const prixM2 = surface > 0 ? Math.round((e.valeurVenale || 0) / surface) : 0;
  const dateStr = e.dateEstimation ? fd(e.dateEstimation) : fd(new Date().toISOString().slice(0, 10));
  const allRefs = [...(e.refsAnnonces || []), ...(e.refsDVF || [])].filter((r) => r.prix > 0 || r.prixM2 > 0);
  const moyM2 = allRefs.length ? Math.round(allRefs.reduce((a, r) => a + r.prixM2, 0) / allRefs.length) : 0;
  const basse = e.fourchetteBasse || Math.round((e.valeurVenale || 0) * 0.95);
  const haute = e.fourchetteHaute || Math.round((e.valeurVenale || 0) * 1.05);
  const commentaire = (e.commentaireMarche || "").trim() || commentaireMarcheVenaleAuto({ commune: e.commune, nbRefs: allRefs.length, moyM2 });
  const argumentaire = (e.argumentaireValeur || "").trim() || argumentaireVenaleAuto({ typeBien: e.typeBien, commune: e.commune, surface, etat: e.etatGeneral, valeur: e.valeurVenale, prixM2 });
  const limites = (e.limites || "").trim() || LIMITES_VENALE;

  return (
    <Document>
      <Page size="A4" style={s.cover}>
        <View style={s.coverInner}>
          <Image src={logo} style={s.logo} />
          <View style={s.hair} />
          <View style={s.band}>
            <Text style={s.bandTop}>Casa Caraïbes — Agence immobilière</Text>
            <Text style={s.coverTitle}>ESTIMATION DE VALEUR VÉNALE</Text>
            <Text style={s.coverSub}>Avis de valeur — Usage confidentiel</Text>
          </View>
          <Text style={s.coverType}>{(e.typeBien || "Bien").toUpperCase()}</Text>
          {!!e.residence && <Text style={s.coverAdr}>{e.residence}</Text>}
          {!!e.adresse && <Text style={s.coverAdr}>{e.adresse}</Text>}
          <Text style={s.coverAdr}>{e.codePostal} {(e.commune || "").toUpperCase()} — MARTINIQUE</Text>
          {(e.sectionCadastrale || e.parcelles) && (
            <Text style={s.coverCad}>
              {[e.sectionCadastrale && `Section ${e.sectionCadastrale}`, e.parcelles && `Parcelle(s) ${e.parcelles}`].filter(Boolean).join(" — ")}
            </Text>
          )}
          <View style={{ flexDirection: "row", width: "100%", marginTop: 8 }}>
            <View style={[s.block, { marginRight: 6 }]}>
              <Text style={s.blockLbl}>DEMANDEUR</Text>
              <Text style={s.blockVal}>{e.demandeur || "\u2014"}</Text>
            </View>
            <View style={[s.block, { marginLeft: 6 }]}>
              <Text style={s.blockLbl}>ÉTABLI PAR</Text>
              <Text style={s.blockVal}>{e.redacteur || "Casa Caraïbes"}</Text>
              <Text style={s.blockSub}>Agent immobilier</Text>
            </View>
          </View>
          <Text style={s.coverDate}>Établi le {dateStr}</Text>
          {!!e.photoBase64 && <Image style={s.photo} src={e.photoBase64} />}
        </View>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <SH title="Identification du bien" />
        <View style={{ flexDirection: "row", marginBottom: 6 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={s.sub}>Situation</Text>
            <LV label="Type" value={e.typeBien} />
            <LV label="Résidence" value={e.residence} />
            <LV label="Adresse" value={e.adresse} />
            <LV label="Commune" value={`${e.commune} (${e.codePostal})`} />
            <LV label="Régime" value={e.regimeJuridique} />
            <LV label="Étage" value={e.etage} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sub}>Surfaces & prestations</Text>
            <LV label="Surface habitable" value={surface ? `${surface} m²` : ""} />
            <LV label="Terrasse" value={e.surfaceTerrasse ? `${e.surfaceTerrasse} m²` : ""} />
            <LV label="Jardin" value={e.surfaceJardin ? `${e.surfaceJardin} m²` : ""} />
            <LV label="Terrain" value={e.surfaceTerrain ? `${e.surfaceTerrain} m²` : ""} />
            <LV label="Distribution" value={e.distribution} />
            <LV label="Parking" value={e.parking} />
            <LV label="Piscine" value={e.piscine ? "Oui" : ""} />
          </View>
        </View>
        {!!e.notesDescription && (<><Text style={s.sub}>Description</Text><Text style={s.body}>{e.notesDescription}</Text></>)}
        {!!e.descriptionEnvironnement && (<><Text style={s.sub}>Environnement</Text><Text style={s.body}>{e.descriptionEnvironnement}</Text></>)}
        <Text style={s.sub}>État général</Text>
        <View style={s.thRow}><Text style={[s.th, { width: "40%" }]}>Élément</Text><Text style={[s.th, { flex: 1 }]}>Appréciation</Text></View>
        {[["État général", e.etatGeneral], ["Structure", e.structureGeneral], ["Finitions", e.finitionsInterieures], ["Sanitaires", e.equipementsSanitaires], ["Travaux à prévoir", e.travauxAPrevoir || "Aucun à court terme"]].map(([l, v], i) => (
          <View key={l} style={i % 2 ? s.trA : s.tr}>
            <Text style={[s.td, s.tdB, { width: "40%" }]}>{l}</Text>
            <Text style={[s.td, { flex: 1 }]}>{v}</Text>
          </View>
        ))}
        <SH title="Analyse du marché local" />
        <Text style={s.body}>{commentaire}</Text>
        {allRefs.length > 0 && (
          <>
            <View style={s.thRow}>
              <Text style={[s.th, { width: "14%" }]}>Réf.</Text>
              <Text style={[s.th, { width: "22%" }]}>Type · Surface</Text>
              <Text style={[s.th, { flex: 1 }]}>Localisation</Text>
              <Text style={[s.th, { width: "18%" }]}>Prix</Text>
              <Text style={[s.th, { width: "14%" }]}>€/m²</Text>
            </View>
            {allRefs.map((r, i) => (
              <View key={i} style={i % 2 ? s.trA : s.tr}>
                <Text style={[s.td, { width: "14%" }]}>{r.reference || `#${i + 1}`}</Text>
                <Text style={[s.td, { width: "22%" }]}>{r.type}{r.surface ? ` · ${r.surface} m²` : ""}</Text>
                <Text style={[s.td, { flex: 1 }]}>{r.localisation || "\u2014"}</Text>
                <Text style={[s.td, { width: "18%" }]}>{r.prix ? E(r.prix) : "\u2014"}</Text>
                <Text style={[s.td, { width: "14%" }]}>{r.prixM2 ? `${r.prixM2.toLocaleString("fr-FR")} €` : "\u2014"}</Text>
              </View>
            ))}
          </>
        )}
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <SH title="Conclusion — Valeur vénale estimée" />
        {(e.criteres || []).filter((c) => c.critere).length > 0 && (
          <>
            <Text style={s.sub}>Grille d'ajustements</Text>
            <View style={s.thRow}><Text style={[s.th, { width: "40%" }]}>Critère</Text><Text style={[s.th, { flex: 1 }]}>Appréciation</Text><Text style={[s.th, { width: "22%" }]}>Ajustement</Text></View>
            {e.criteres.filter((c) => c.critere).map((c, i) => (
              <View key={i} style={i % 2 ? s.trA : s.tr}>
                <Text style={[s.td, s.tdB, { width: "40%" }]}>{c.critere}</Text>
                <Text style={[s.td, { flex: 1 }]}>{c.situationBien || c.impact || "\u2014"}</Text>
                <Text style={[s.td, { width: "22%" }]}>{c.ajustement || "\u2014"}</Text>
              </View>
            ))}
          </>
        )}
        <Text style={s.sub}>Justification de la valeur</Text>
        <Text style={s.body}>{argumentaire}</Text>
        <View style={s.valBox}>
          <Text style={s.valLbl}>Valeur vénale estimée</Text>
          <Text style={s.valNum}>{E(e.valeurVenale || 0)}</Text>
          <Text style={s.valFine}>{nombreEnLettres(e.valeurVenale || 0)}</Text>
          {prixM2 > 0 && <Text style={s.valFine}>soit {E(prixM2)}/m² pour {surface} m² habitables</Text>}
          {(basse > 0 || haute > 0) && <Text style={s.valFine}>Fourchette : {E(basse)} — {E(haute)}</Text>}
        </View>
        {e.valeurCoupDeCœur > 0 && (
          <Text style={s.body}>Valeur « coup de cœur » : {E(e.valeurCoupDeCœur)}{e.argumentaireCoupDeCœur ? ` — ${e.argumentaireCoupDeCœur}` : ""}</Text>
        )}
        <View style={s.notice}><Text style={s.noticeTxt}>{limites}</Text></View>
        <View style={{ marginTop: 20, alignItems: "flex-end" }}>
          <View style={{ width: "46%", alignItems: "center" }}>
            <Text style={[s.body, { fontStyle: "italic", fontSize: 8, textAlign: "center" }]}>Fait à {e.lieu || "Le Lamentin (Martinique)"}, le {dateStr}</Text>
            <View style={{ height: 0.5, backgroundColor: LINE, width: "100%", marginVertical: 8 }} />
            <Text style={{ fontSize: 8.5, fontFamily: "Montserrat", fontWeight: 700 }}>{e.redacteur || "Casa Caraïbes"}</Text>
            <Text style={{ fontSize: 7.5, color: SUB, fontStyle: "italic" }}>Agent immobilier</Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
