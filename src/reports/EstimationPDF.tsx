import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Estimation, RefMarche, CritereMarche, SaisonLocatif } from "../schemas/estimation.schema";
import { nombreEnLettres } from "../schemas/estimation.schema";

const PRIMARY = "#1A3A52";
const BLUE_SOFT = "#EBF1F6";
const AMBER_SOFT = "#FBF4E6";
const AMBER = "#9A6D22";
const LINE = "#E4E4E0";
const INK = "#1A1A18";
const SUB = "#5B5B57";
const MUTED = "#9B9B97";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: INK, padding: "18mm 16mm 16mm" },
  /* Cover */
  coverTitle: { fontSize: 26, fontFamily: "Helvetica-Bold", color: PRIMARY, textAlign: "center", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 },
  coverDivider: { height: 2, backgroundColor: PRIMARY, marginBottom: 18 },
  coverSub: { fontSize: 12, fontFamily: "Helvetica-Bold", color: PRIMARY, textAlign: "center", textTransform: "uppercase", marginBottom: 6 },
  coverAdr: { fontSize: 11, textAlign: "center", color: INK, marginBottom: 3 },
  coverCad: { fontSize: 9, textAlign: "center", color: SUB, marginBottom: 18 },
  coverMeta: { fontSize: 9, color: SUB, marginBottom: 4 },
  coverMetaVal: { fontFamily: "Helvetica-Bold", color: INK },
  coverPhoto: { width: "100%", height: 200, objectFit: "cover", marginTop: 18, borderRadius: 6 },
  /* Section headers */
  sectionNum: { fontSize: 11, fontFamily: "Helvetica-Bold", color: PRIMARY, marginTop: 18, marginBottom: 4 },
  sectionDivider: { height: 1, backgroundColor: LINE, marginBottom: 10 },
  body: { fontSize: 9, color: INK, lineHeight: 1.55, marginBottom: 6 },
  /* Tables */
  tableHead: { flexDirection: "row", backgroundColor: PRIMARY },
  th: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 8, padding: "5 7" },
  tr: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}` },
  trAlt: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, backgroundColor: "#FAFAF8" },
  td: { fontSize: 8.5, padding: "4.5 7", color: INK },
  /* Grille */
  grilleRow: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, padding: "5 7" },
  grilleLabel: { width: "35%", fontFamily: "Helvetica-Bold", fontSize: 8.5, color: INK },
  grilleVal: { width: "45%", fontSize: 8.5, color: SUB },
  grilleImpact: { width: "20%", fontSize: 8, textAlign: "right" },
  /* KPI box */
  valBox: { backgroundColor: BLUE_SOFT, border: `1 solid ${LINE}`, borderRadius: 6, padding: "14 20", alignItems: "center", marginTop: 10, marginBottom: 8 },
  valLabel: { fontSize: 9, color: PRIMARY, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  valNum: { fontSize: 28, fontFamily: "Helvetica-Bold", color: PRIMARY, marginBottom: 2 },
  valLettres: { fontSize: 9, color: PRIMARY, fontStyle: "italic", marginBottom: 2 },
  valM2: { fontSize: 9, color: SUB, fontStyle: "italic" },
  coeurBox: { backgroundColor: AMBER_SOFT, border: `1 solid ${AMBER}`, borderRadius: 6, padding: "14 20", alignItems: "center", marginTop: 10, marginBottom: 8 },
  coeurLabel: { fontSize: 9, color: AMBER, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  coeurNum: { fontSize: 24, fontFamily: "Helvetica-Bold", color: AMBER, marginBottom: 2 },
  /* Footer */
  footer: { position: "absolute", bottom: "10mm", left: "16mm", right: "16mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerTxt: { fontSize: 7.5, color: MUTED },
  /* Locatif */
  locatifRow: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}` },
  locatifTotal: { flexDirection: "row", backgroundColor: BLUE_SOFT, padding: "6 7", borderRadius: 4, marginTop: 4 },
});

const E = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR")} €`;
const fd = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";

const IMPACT_COLOR: Record<string, string> = {
  "Positif fort": "#2D7A5F", "Positif": "#5BAF89", "Neutre": MUTED, "Négatif": "#B07D2E", "Négatif fort": "#A03A30",
};

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <>
      <Text style={s.sectionNum}>{num}. {title.toUpperCase()}</Text>
      <View style={s.sectionDivider} />
    </>
  );
}

function Footer({ page, total }: { page: number; total: number }) {
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>CASA CARAÏBES — Estimation de valeur vénale — Confidentiel</Text>
      <Text style={s.footerTxt}>Page {page}/{total} · {today}</Text>
    </View>
  );
}

export function EstimationPDF({ e }: { e: Estimation }) {
  const prixM2Calc = e.surfaceHabitable > 0 ? Math.round(e.valeurVenale / e.surfaceHabitable) : 0;
  const prixM2Coeur = e.surfaceHabitable > 0 && e.valeurCoupDeCœur > 0 ? Math.round(e.valeurCoupDeCœur / e.surfaceHabitable) : 0;
  const totalLocatif = e.saisons.reduce((s: number, x: SaisonLocatif) => s + (x.tarifNuit * x.nbNuits), 0);
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // Moyennes marché
  const allRefs = [...e.refsAnnonces, ...e.refsDVF].filter((r) => r.prixM2 > 0);
  const moyM2 = allRefs.length > 0 ? Math.round(allRefs.reduce((s, r) => s + r.prixM2, 0) / allRefs.length) : 0;

  return (
    <Document>
      {/* ══ PAGE DE GARDE ══ */}
      <Page size="A4" style={s.page}>
        <Text style={s.coverTitle}>Estimation de valeur vénale</Text>
        <View style={s.coverDivider} />
        <Text style={s.coverSub}>{e.typeBien}</Text>
        {e.residence && <Text style={s.coverAdr}>{e.residence}</Text>}
        <Text style={s.coverAdr}>{e.adresse}</Text>
        <Text style={s.coverAdr}>{e.codePostal} {e.commune.toUpperCase()} – MARTINIQUE</Text>
        {e.sectionCadastrale && <Text style={s.coverCad}>Sections cadastrales {e.sectionCadastrale} – Parcelles {e.parcelles}</Text>}
        <View style={{ marginTop: 16 }}>
          {[["Demandeur", e.demandeur], ["Rédacteur", e.redacteur], ["Date", e.dateEstimation ? fd(e.dateEstimation) : today]].map(([l, v]) => (
            <View key={l} style={{ flexDirection: "row", marginBottom: 5 }}>
              <Text style={[s.coverMeta, { width: 80 }]}>{l} :</Text>
              <Text style={[s.coverMeta, s.coverMetaVal]}>{v}</Text>
            </View>
          ))}
        </View>
        {e.photoBase64 && <Image src={e.photoBase64} style={s.coverPhoto} />}
        <Footer page={1} total={5} />
      </Page>

      {/* ══ PAGE 2 — OBJET / IDENTIFICATION / ÉTAT ══ */}
      <Page size="A4" style={s.page}>
        <SectionHeader num="1" title="Objet de la mission" />
        <Text style={s.body}>
          La présente estimation a pour objet de déterminer la valeur vénale {e.typeBien === "Appartement en copropriété" ? "d'un bien en copropriété" : `d'un(e) ${e.typeBien.toLowerCase()}`} situé(e){e.residence ? ` au sein de la ${e.residence},` : ""}{e.adresse ? ` ${e.adresse},` : ""} {e.codePostal} {e.commune} (Martinique), à la demande de {e.demandeur || "…"}, dans le cadre d'un projet de vente.{"\n\n"}La valeur vénale désigne le prix le plus probable auquel un bien immobilier pourrait être cédé sur le marché, à une date donnée, lors d'une transaction conclue à des conditions normales. Elle suppose que la vente soit réalisée entre un vendeur et un acquéreur agissant de manière libre, consentante et éclairée, après une exposition suffisante du bien sur le marché, et en l'absence de tout facteur de convenance ou de contrainte particulière.
        </Text>

        <SectionHeader num="2" title="Identification du bien" />
        <Text style={[s.body, { fontFamily: "Helvetica-Bold", marginBottom: 4 }]}>2.1 Situation géographique et cadastrale</Text>
        <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 4, marginBottom: 10 }}>
          {[
            ["Adresse", `${e.residence ? e.residence + " – " : ""}${e.adresse}`],
            ["Commune", `${e.codePostal} ${e.commune} (Martinique)`],
            ["Référence cadastrale", e.sectionCadastrale ? `Section ${e.sectionCadastrale} – Parcelles ${e.parcelles}` : "—"],
            ["Étage", e.etage || "—"],
            ["Régime juridique", e.regimeJuridique || "—"],
            ["Charges de copropriété", e.chargesCopro > 0 ? `${E(e.chargesCopro)} par trimestre (environ ${E(Math.round(e.chargesCopro / 3))}/mois)` : "—"],
          ].map(([l, v], i) => (
            <View key={l} style={i % 2 === 0 ? s.tr : s.trAlt}>
              <Text style={[s.td, { width: "35%", fontFamily: "Helvetica-Bold" }]}>{l}</Text>
              <Text style={[s.td, { width: "65%" }]}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={[s.body, { fontFamily: "Helvetica-Bold", marginBottom: 4 }]}>2.2 Description du bien</Text>
        <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 4, marginBottom: 10 }}>
          {[
            ["Type de bien", e.typeBien],
            ["Surface habitable (loi Carrez)", `${e.surfaceHabitable} m²`],
            ...(e.surfaceTerrasse > 0 ? [["Terrasse privative", `${e.surfaceTerrasse} m²`]] : []),
            ...(e.surfaceJardin > 0 ? [["Jardin", `${e.surfaceJardin} m²`]] : []),
            ...(e.surfaceTerrain > 0 ? [["Surface terrain", `${e.surfaceTerrain} m²`]] : []),
            ["Mode constructif", e.modeConstructif || "—"],
            ["État général", e.etatGeneral],
            ...(e.parking ? [["Parking", e.parking]] : []),
            ["Cave", e.cave ? "Oui – cave privative" : "Non"],
            ["Vendu meublé", e.venduMeuble ? "Oui (inclus dans l'estimation)" : "Non"],
          ].map(([l, v], i) => (
            <View key={l} style={i % 2 === 0 ? s.tr : s.trAlt}>
              <Text style={[s.td, { width: "40%", fontFamily: "Helvetica-Bold" }]}>{l}</Text>
              <Text style={[s.td, { width: "60%" }]}>{v}</Text>
            </View>
          ))}
        </View>
        {e.distribution && <Text style={[s.body, { fontStyle: "italic" }]}>Distribution : {e.distribution}</Text>}

        <SectionHeader num="3" title="État général" />
        <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 4 }}>
          {[
            ["Structure générale", e.structureGeneral],
            ["Finitions intérieures", e.finitionsInterieures],
            ["Équipements sanitaires", e.equipementsSanitaires],
            ["Travaux à prévoir", e.travauxAPrevoir],
          ].map(([l, v], i) => (
            <View key={l} style={i % 2 === 0 ? s.tr : s.trAlt}>
              <Text style={[s.td, { width: "40%", fontFamily: "Helvetica-Bold" }]}>{l}</Text>
              <Text style={[s.td, { width: "60%" }]}>{v}</Text>
            </View>
          ))}
        </View>
        <Footer page={2} total={5} />
      </Page>

      {/* ══ PAGE 3 — ENVIRONNEMENT / ÉTUDE DE MARCHÉ ══ */}
      <Page size="A4" style={s.page}>
        <SectionHeader num="4" title="Environnement et situation" />
        <Text style={s.body}>{e.descriptionEnvironnement || "Description de l'environnement à compléter."}</Text>

        <SectionHeader num="5" title="Étude de marché – Analyse comparative" />

        {e.refsAnnonces.length > 0 && (
          <>
            <Text style={[s.body, { fontFamily: "Helvetica-Bold", marginBottom: 4 }]}>5.1 Références – Annonces actives</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 4, marginBottom: 10 }}>
              <View style={s.tableHead}>
                <Text style={[s.th, { width: "12%" }]}>Type</Text>
                <Text style={[s.th, { width: "15%" }]}>Surface</Text>
                <Text style={[s.th, { width: "20%" }]}>Prix</Text>
                <Text style={[s.th, { width: "18%" }]}>€/m²</Text>
                <Text style={[s.th, { width: "35%" }]}>Observations</Text>
              </View>
              {e.refsAnnonces.map((r: RefMarche, i: number) => (
                <View key={r.id} style={i % 2 === 0 ? s.tr : s.trAlt}>
                  <Text style={[s.td, { width: "12%" }]}>{r.type || "—"}</Text>
                  <Text style={[s.td, { width: "15%" }]}>{r.surface ? `${r.surface} m²` : "—"}</Text>
                  <Text style={[s.td, { width: "20%", fontFamily: "Helvetica-Bold" }]}>{r.prix ? E(r.prix) : "—"}</Text>
                  <Text style={[s.td, { width: "18%", color: PRIMARY }]}>{r.prixM2 ? `${r.prixM2.toLocaleString("fr-FR")} €/m²` : "—"}</Text>
                  <Text style={[s.td, { width: "35%", color: SUB }]}>{r.observations || "—"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {e.refsDVF.length > 0 && (
          <>
            <Text style={[s.body, { fontFamily: "Helvetica-Bold", marginBottom: 4 }]}>5.2 Données DVF – Transactions réelles</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 4, marginBottom: 10 }}>
              <View style={s.tableHead}>
                <Text style={[s.th, { width: "12%" }]}>Type</Text>
                <Text style={[s.th, { width: "15%" }]}>Surface</Text>
                <Text style={[s.th, { width: "25%" }]}>Valeur foncière</Text>
                <Text style={[s.th, { width: "18%" }]}>€/m²</Text>
                <Text style={[s.th, { width: "30%" }]}>Observations</Text>
              </View>
              {e.refsDVF.map((r: RefMarche, i: number) => (
                <View key={r.id} style={i % 2 === 0 ? s.tr : s.trAlt}>
                  <Text style={[s.td, { width: "12%" }]}>{r.type || "—"}</Text>
                  <Text style={[s.td, { width: "15%" }]}>{r.surface ? `${r.surface} m²` : "—"}</Text>
                  <Text style={[s.td, { width: "25%", fontFamily: "Helvetica-Bold" }]}>{r.prix ? E(r.prix) : "—"}</Text>
                  <Text style={[s.td, { width: "18%", color: PRIMARY }]}>{r.prixM2 ? `${r.prixM2.toLocaleString("fr-FR")} €/m²` : "—"}</Text>
                  <Text style={[s.td, { width: "30%", color: SUB }]}>{r.observations || "—"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {moyM2 > 0 && (
          <Text style={[s.body, { fontStyle: "italic", color: SUB }]}>
            L'analyse comparative de marché, portant sur un panel de {allRefs.length} référence(s), établit une valeur vénale moyenne de {moyM2.toLocaleString("fr-FR")} €/m².
          </Text>
        )}

        {e.avecLocatif && totalLocatif > 0 && (
          <>
            <Text style={[s.body, { fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 4 }]}>5.3 Potentiel locatif saisonnier</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 4 }}>
              <View style={s.tableHead}>
                <Text style={[s.th, { width: "40%" }]}>Période</Text>
                <Text style={[s.th, { width: "20%" }]}>Tarif/nuit</Text>
                <Text style={[s.th, { width: "20%" }]}>Nb nuits</Text>
                <Text style={[s.th, { width: "20%" }]}>Revenu brut</Text>
              </View>
              {e.saisons.filter((ss: SaisonLocatif) => ss.tarifNuit > 0).map((ss: SaisonLocatif, i: number) => (
                <View key={i} style={i % 2 === 0 ? s.tr : s.trAlt}>
                  <Text style={[s.td, { width: "40%" }]}>{ss.periode}</Text>
                  <Text style={[s.td, { width: "20%" }]}>{E(ss.tarifNuit)}/nuit</Text>
                  <Text style={[s.td, { width: "20%" }]}>~{ss.nbNuits} nuits</Text>
                  <Text style={[s.td, { width: "20%", fontFamily: "Helvetica-Bold" }]}>~{E(ss.tarifNuit * ss.nbNuits)}</Text>
                </View>
              ))}
              <View style={s.locatifTotal}>
                <Text style={{ flex: 1, fontFamily: "Helvetica-Bold", fontSize: 8.5, color: PRIMARY }}>TOTAL ESTIMÉ ({e.saisons.filter((ss: SaisonLocatif) => ss.nbNuits > 0).reduce((s: number, x: SaisonLocatif) => s + x.nbNuits, 0)} nuits/an)</Text>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: PRIMARY }}>~{E(totalLocatif)} brut</Text>
              </View>
            </View>
          </>
        )}
        <Footer page={3} total={5} />
      </Page>

      {/* ══ PAGE 4 — ESTIMATION ══ */}
      <Page size="A4" style={s.page}>
        <SectionHeader num="6" title="Estimation de valeur vénale" />
        <Text style={[s.body, { fontFamily: "Helvetica-Bold", marginBottom: 4 }]}>6.1 Grille d'analyse</Text>
        <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 4, marginBottom: 10 }}>
          <View style={s.tableHead}>
            <Text style={[s.th, { width: "35%" }]}>Critère</Text>
            <Text style={[s.th, { width: "45%" }]}>Analyse</Text>
            <Text style={[s.th, { width: "20%" }]}>Impact</Text>
          </View>
          {e.criteres.map((c: CritereMarche, i: number) => (
            <View key={c.id} style={i % 2 === 0 ? s.grilleRow : { ...s.grilleRow, backgroundColor: "#FAFAF8" }}>
              <Text style={[s.grilleLabel]}>{c.critere}</Text>
              <Text style={[s.grilleVal]}>{c.analyse}</Text>
              <Text style={[s.grilleImpact, { color: IMPACT_COLOR[c.impact] ?? MUTED, fontFamily: "Helvetica-Bold" }]}>{c.impact}</Text>
            </View>
          ))}
        </View>

        <Text style={[s.body, { fontFamily: "Helvetica-Bold", marginBottom: 4 }]}>6.2 Argumentation</Text>
        <Text style={s.body}>{e.argumentaireValeur}</Text>

        <View style={s.valBox}>
          <Text style={s.valLabel}>Valeur vénale estimée</Text>
          <Text style={s.valNum}>{E(e.valeurVenale)}</Text>
          <Text style={s.valLettres}>({nombreEnLettres(e.valeurVenale)})</Text>
          {prixM2Calc > 0 && <Text style={s.valM2}>Soit environ {prixM2Calc.toLocaleString("fr-FR")} €/m² habitable</Text>}
        </View>

        <Text style={[s.body, { color: SUB, fontStyle: "italic" }]}>
          Cette valeur s'entend hors frais de mutation, hors honoraires d'agence{e.venduMeuble ? " et hors mobilier spécifique non inclus dans la transaction." : "."}
        </Text>

        {e.valeurCoupDeCœur > 0 && (
          <>
            <SectionHeader num="7" title="Estimation coup de cœur" />
            {e.argumentaireCoupDeCœur && <Text style={s.body}>{e.argumentaireCoupDeCœur}</Text>}
            <View style={s.coeurBox}>
              <Text style={s.coeurLabel}>Valeur coup de cœur estimée</Text>
              <Text style={s.coeurNum}>{E(e.valeurCoupDeCœur)}</Text>
              <Text style={[s.valLettres, { color: AMBER }]}>({nombreEnLettres(e.valeurCoupDeCœur)})</Text>
              {prixM2Coeur > 0 && <Text style={[s.valM2, { color: AMBER }]}>Soit environ {prixM2Coeur.toLocaleString("fr-FR")} €/m² habitable</Text>}
            </View>
          </>
        )}
        <Footer page={4} total={5} />
      </Page>

      {/* ══ PAGE 5 — LIMITES & SIGNATURE ══ */}
      <Page size="A4" style={s.page}>
        <SectionHeader num="8" title="Limites, réserves et conclusion" />
        <Text style={s.body}>{e.limites}</Text>
        <View style={{ marginTop: 30, flexDirection: "row", justifyContent: "flex-end" }}>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[s.body, { fontStyle: "italic", marginBottom: 8 }]}>
              Fait à Fort-de-France, le {e.dateEstimation ? fd(e.dateEstimation) : today}
            </Text>
            <Text style={[s.body, { fontFamily: "Helvetica-Bold", marginBottom: 2 }]}>{e.redacteur}</Text>
            <Text style={[s.body, { color: SUB }]}>Agence Immobilière Casa Caraïbes</Text>
            <View style={{ marginTop: 30, width: 120, borderBottom: `1 solid ${INK}` }} />
          </View>
        </View>
        <Footer page={5} total={5} />
      </Page>
    </Document>
  );
}
