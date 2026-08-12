import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Estimation } from "../schemas/estimation.schema";
import { nombreEnLettres } from "../schemas/estimation.schema";

const PRIMARY = "#1A3A52";
const BEIGE   = "#F5EFE6";
const LINE    = "#E4E4E0";
const INK     = "#1A1A18";
const SUB     = "#5B5B57";
const MUTED   = "#9B9B97";
const BG_ALT  = "#FAFAF8";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: INK, padding: "18mm 16mm 22mm" },

  /* ── Couverture ── */
  coverBand:     { backgroundColor: PRIMARY, padding: "10 0", marginBottom: 14, alignItems: "center" },
  coverBandTop:  { fontSize: 8, color: "#B0C4D8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  coverTitle:    { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#FFFFFF", textAlign: "center", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  coverSub:      { fontSize: 11, color: "#B0C4D8", textAlign: "center", letterSpacing: 0.5 },

  coverBienType: { fontSize: 11, fontFamily: "Helvetica-Bold", color: INK, textAlign: "center", marginBottom: 2 },
  coverBienAdr:  { fontSize: 10, textAlign: "center", color: INK, marginBottom: 2 },
  coverCad:      { fontSize: 8.5, textAlign: "center", color: SUB, fontStyle: "italic", marginBottom: 12 },

  coverBlock:    { border: `0.5 solid ${LINE}`, padding: "8 12", flex: 1 },
  coverBlockLbl: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: PRIMARY, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  coverBlockVal: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 1 },
  coverBlockSub: { fontSize: 8.5, color: SUB, fontStyle: "italic" },
  coverDate:     { fontSize: 9, color: SUB, textAlign: "center", fontStyle: "italic", marginTop: 10 },
  coverPhoto:    { width: "100%", height: 210, objectFit: "cover", marginTop: 14, borderRadius: 4 },

  /* ── En-têtes ── */
  secTitle:    { fontSize: 11, fontFamily: "Helvetica-Bold", color: PRIMARY, marginTop: 14, marginBottom: 2, textTransform: "uppercase" },
  secDivider:  { height: 1.5, backgroundColor: PRIMARY, marginBottom: 8 },
  subTitle:    { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: PRIMARY, marginTop: 8, marginBottom: 5, borderLeft: `3 solid ${PRIMARY}`, paddingLeft: 6 },

  /* ── Corps ── */
  body:   { fontSize: 9, color: INK, lineHeight: 1.6, marginBottom: 5 },
  bold:   { fontFamily: "Helvetica-Bold" },
  italic: { fontStyle: "italic" },

  /* ── Grille 2 colonnes ── */
  row2:   { flexDirection: "row", marginBottom: 3 },
  cell2L: { width: "50%", paddingRight: 8 },
  cell2R: { width: "50%" },
  lbl:    { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: SUB, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  val:    { fontSize: 9, color: INK },

  /* ── Tableau ── */
  tableHead: { flexDirection: "row", backgroundColor: PRIMARY },
  th:  { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 8, padding: "5 6" },
  tr:  { flexDirection: "row", borderBottom: `0.5 solid ${LINE}` },
  trA: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, backgroundColor: BG_ALT },
  td:  { fontSize: 8.5, padding: "4 6", color: INK },
  tdB: { fontFamily: "Helvetica-Bold" },

  /* ── Valeur vénale ── */
  valBox:     { backgroundColor: BEIGE, border: `1 solid ${LINE}`, borderRadius: 5, padding: "14 20", alignItems: "center", marginTop: 10, marginBottom: 10 },
  valLabel:   { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: PRIMARY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  valNum:     { fontSize: 30, fontFamily: "Helvetica-Bold", color: PRIMARY, marginBottom: 4 },
  valLettres: { fontSize: 9, color: INK, fontStyle: "italic", marginBottom: 3 },
  valM2:      { fontSize: 8.5, color: SUB, marginBottom: 4 },
  valFourch:  { fontSize: 8.5, color: SUB, fontStyle: "italic" },

  /* ── Signature ── */
  sigBlock:   { marginTop: 20, flexDirection: "row", justifyContent: "flex-end" },
  sigInner:   { width: "45%", alignItems: "center" },
  sigLine:    { height: 0.5, backgroundColor: LINE, width: "100%", marginBottom: 4 },
  sigName:    { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: INK, textAlign: "center" },
  sigRole:    { fontSize: 7.5, color: SUB, textAlign: "center", fontStyle: "italic" },

  /* ── Pied de page ── */
  footer:    { position: "absolute", bottom: "10mm", left: "16mm", right: "16mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 5, flexDirection: "row", justifyContent: "space-between" },
  footerTxt: { fontSize: 7, color: MUTED },

  /* ── Notice ── */
  notice:    { marginTop: 12, backgroundColor: BG_ALT, border: `0.5 solid ${LINE}`, borderRadius: 4, padding: "8 10" },
  noticeTxt: { fontSize: 8, color: SUB, lineHeight: 1.5 },
});

const E = (n: number) => {
  const str = String(Math.round(n || 0));
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0") + " \u20AC";
};
const fd = (d: string) =>
  d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "\u2014";

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>CASA CARAÏBES — Estimation de valeur vénale — Document confidentiel</Text>
      <Text
        style={s.footerTxt}
        render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `Page ${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

function SH({ title }: { title: string }) {
  return (
    <>
      <Text style={s.secTitle}>{title}</Text>
      <View style={s.secDivider} />
    </>
  );
}

function LV({ label, value }: { label: string; value: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <View style={s.row2}>
      <Text style={[s.td, s.tdB, { width: "38%", paddingLeft: 0 }]}>{label}</Text>
      <Text style={[s.td, { flex: 1, paddingLeft: 0 }]}>{String(value)}</Text>
    </View>
  );
}

export function ValeurVenalePDF({ e }: { e: Estimation }) {
  const surface = e.surfaceHabitable;
  const prixM2  = surface > 0 ? Math.round(e.valeurVenale / surface) : 0;
  const dateStr = e.dateEstimation
    ? fd(e.dateEstimation)
    : new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const allRefs = [...e.refsAnnonces, ...e.refsDVF].filter(r => r.prix > 0 || r.prixM2 > 0);
  const moyM2   = allRefs.length > 0
    ? Math.round(allRefs.reduce((acc, r) => acc + r.prixM2, 0) / allRefs.length)
    : 0;

  const fourchetteBasse = e.fourchetteBasse || Math.round(e.valeurVenale * 0.95);
  const fourchetteHaute = e.fourchetteHaute || Math.round(e.valeurVenale * 1.05);

  return (
    <Document>

      {/* ══════════════════════════════════════════
          PAGE 1 — COUVERTURE
      ══════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        {/* Bandeau titre */}
        <View style={s.coverBand}>
          <Text style={s.coverBandTop}>Casa Caraïbes</Text>
          <Text style={s.coverTitle}>Estimation de valeur vénale</Text>
          <Text style={s.coverSub}>Avis de valeur — Usage confidentiel</Text>
        </View>

        {/* Identification du bien */}
        <Text style={s.coverBienType}>{e.typeBien.toUpperCase()}</Text>
        {!!e.residence && <Text style={s.coverBienAdr}>{e.residence}</Text>}
        {!!e.adresse   && <Text style={s.coverBienAdr}>{e.adresse}</Text>}
        <Text style={s.coverBienAdr}>{e.codePostal} {e.commune.toUpperCase()} — MARTINIQUE</Text>
        {!!(e.sectionCadastrale || e.parcelles) && (
          <Text style={s.coverCad}>
            {e.sectionCadastrale ? `Section ${e.sectionCadastrale}` : ""}
            {e.sectionCadastrale && e.parcelles ? " — " : ""}
            {e.parcelles ? `Parcelle(s) ${e.parcelles}` : ""}
          </Text>
        )}

        {/* Demandeur / Rédacteur */}
        <View style={{ flexDirection: "row", marginTop: 6, marginBottom: 4 }}>
          <View style={[s.coverBlock, { marginRight: 6 }]}>
            <Text style={s.coverBlockLbl}>Demandeur</Text>
            <Text style={s.coverBlockVal}>{e.demandeur || "—"}</Text>
          </View>
          <View style={[s.coverBlock, { marginLeft: 6 }]}>
            <Text style={s.coverBlockLbl}>Établi par</Text>
            <Text style={s.coverBlockVal}>{e.redacteur || "Casa Caraïbes"}</Text>
            <Text style={s.coverBlockSub}>Agent immobilier</Text>
          </View>
        </View>
        <Text style={s.coverDate}>Établi le {dateStr}</Text>

        {/* Photo du bien */}
        {!!e.photoBase64 && <Image style={s.coverPhoto} src={e.photoBase64} />}

        <Footer />
      </Page>

      {/* ══════════════════════════════════════════
          PAGE 2 — IDENTIFICATION + MARCHÉ
      ══════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        {/* ── Section : Identification du bien ── */}
        <SH title="Identification du bien" />

        {/* 2 colonnes */}
        <View style={{ flexDirection: "row", marginBottom: 6 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={s.subTitle}>Situation</Text>
            <LV label="Type" value={e.typeBien} />
            {!!e.residence     && <LV label="Résidence" value={e.residence} />}
            {!!e.adresse       && <LV label="Adresse" value={e.adresse} />}
            <LV label="Commune" value={`${e.commune} (${e.codePostal})`} />
            {!!e.regimeJuridique && <LV label="Régime juridique" value={e.regimeJuridique} />}
            {!!e.etage          && <LV label="Étage" value={e.etage} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.subTitle}>Surfaces & prestations</Text>
            <LV label="Surface habitable" value={`${e.surfaceHabitable} m²`} />
            {e.surfaceTerrasse > 0 && <LV label="Terrasse / Loggia" value={`${e.surfaceTerrasse} m²`} />}
            {e.surfaceJardin > 0   && <LV label="Jardin" value={`${e.surfaceJardin} m²`} />}
            {e.surfaceTerrain > 0  && <LV label="Terrain" value={`${e.surfaceTerrain} m²`} />}
            {!!e.distribution      && <LV label="Distribution" value={e.distribution} />}
            {!!e.parking           && <LV label="Parking" value={e.parking} />}
            {e.piscine             && <LV label="Piscine" value="Oui" />}
          </View>
        </View>

        {/* État général */}
        <Text style={s.subTitle}>État général</Text>
        <View style={s.tableHead}>
          <Text style={[s.th, { width: "40%" }]}>Élément</Text>
          <Text style={[s.th, { flex: 1 }]}>Appréciation</Text>
        </View>
        {[
          ["État général",             e.etatGeneral],
          ["Structure / Gros œuvre",   e.structureGeneral],
          ["Finitions intérieures",    e.finitionsInterieures],
          ["Équipements sanitaires",   e.equipementsSanitaires],
          ["Travaux à prévoir",        e.travauxAPrevoir || "Aucun à court terme"],
        ].map(([lbl, val], i) => (
          <View key={lbl} style={i % 2 === 0 ? s.tr : s.trA}>
            <Text style={[s.td, s.tdB, { width: "40%" }]}>{lbl}</Text>
            <Text style={[s.td, { flex: 1 }]}>{val}</Text>
          </View>
        ))}

        {/* ── Section : Analyse du marché ── */}
        <SH title="Analyse du marché local" />

        {allRefs.length > 0 ? (
          <>
            <Text style={[s.body, { marginBottom: 6 }]}>
              L'étude comparative porte sur {allRefs.length} référence{allRefs.length > 1 ? "s" : ""} de
              biens similaires dans le secteur de {e.commune}.
              {moyM2 > 0 ? ` Prix moyen observé : ${E(moyM2)}/m².` : ""}
            </Text>
            {/* Tableau références */}
            <View style={s.tableHead}>
              <Text style={[s.th, { width: "14%" }]}>Réf.</Text>
              <Text style={[s.th, { width: "20%" }]}>Type · Surface</Text>
              <Text style={[s.th, { flex: 1   }]}>Localisation</Text>
              <Text style={[s.th, { width: "18%" }]}>Prix</Text>
              <Text style={[s.th, { width: "14%" }]}>€/m²</Text>
            </View>
            {allRefs.map((r, i) => (
              <View key={i} style={i % 2 === 0 ? s.tr : s.trA}>
                <Text style={[s.td, { width: "14%" }]}>{r.reference || `#${i + 1}`}</Text>
                <Text style={[s.td, { width: "20%" }]}>{r.type}{r.surface > 0 ? ` · ${r.surface} m²` : ""}</Text>
                <Text style={[s.td, { flex: 1   }]}>{r.localisation || "—"}</Text>
                <Text style={[s.td, { width: "18%" }]}>{r.prix > 0 ? E(r.prix) : "—"}</Text>
                <Text style={[s.td, { width: "14%" }]}>{r.prixM2 > 0 ? `${E(r.prixM2).replace(" €", "")} €` : "—"}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={[s.body, s.italic]}>Aucune référence comparative renseignée.</Text>
        )}

        {!!e.commentaireMarche && (
          <Text style={[s.body, { marginTop: 8 }]}>{e.commentaireMarche}</Text>
        )}

        <Footer />
      </Page>

      {/* ══════════════════════════════════════════
          PAGE 3 — VALEUR VÉNALE + CONCLUSION
      ══════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <SH title="Conclusion — Valeur vénale estimée" />

        {/* Critères d'ajustement (si renseignés) */}
        {e.criteres.filter(c => c.critere).length > 0 && (
          <>
            <Text style={s.subTitle}>Grille d'ajustements</Text>
            <View style={s.tableHead}>
              <Text style={[s.th, { width: "40%" }]}>Critère</Text>
              <Text style={[s.th, { flex: 1 }]}>Appréciation</Text>
              <Text style={[s.th, { width: "22%" }]}>Ajustement</Text>
            </View>
            {e.criteres.filter(c => c.critere).map((c, i) => (
              <View key={i} style={i % 2 === 0 ? s.tr : s.trA}>
                <Text style={[s.td, s.tdB, { width: "40%" }]}>{c.critere}</Text>
                <Text style={[s.td, { flex: 1 }]}>{c.situationBien || c.impact || "—"}</Text>
                <Text style={[s.td, { width: "22%" }]}>{c.ajustement || "—"}</Text>
              </View>
            ))}
          </>
        )}

        {/* Argumentation valeur */}
        {!!e.argumentaireValeur && (
          <>
            <Text style={s.subTitle}>Justification de la valeur</Text>
            <Text style={s.body}>{e.argumentaireValeur}</Text>
          </>
        )}

        {/* Boîte valeur vénale */}
        <View style={s.valBox}>
          <Text style={s.valLabel}>Valeur vénale estimée</Text>
          <Text style={s.valNum}>{E(e.valeurVenale)}</Text>
          <Text style={s.valLettres}>{nombreEnLettres(e.valeurVenale)}</Text>
          {prixM2 > 0 && (
            <Text style={s.valM2}>soit {E(prixM2)}/m² pour {surface} m² habitables</Text>
          )}
          {(fourchetteBasse > 0 || fourchetteHaute > 0) && (
            <Text style={s.valFourch}>
              Fourchette : {E(fourchetteBasse)} — {E(fourchetteHaute)}
            </Text>
          )}
        </View>

        {/* Valeur coup de cœur */}
        {e.valeurCoupDeCœur > 0 && (
          <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 4, padding: "8 12", marginBottom: 8 }}>
            <Text style={[s.body, { marginBottom: 2 }]}>
              <Text style={s.bold}>Valeur « coup de cœur » : </Text>{E(e.valeurCoupDeCœur)}
            </Text>
            {!!e.argumentaireCoupDeCœur && (
              <Text style={[s.body, { marginBottom: 0 }]}>{e.argumentaireCoupDeCœur}</Text>
            )}
          </View>
        )}

        {/* Limites */}
        {!!e.limites && (
          <View style={s.notice}>
            <Text style={s.noticeTxt}>{e.limites}</Text>
          </View>
        )}

        {/* Notice standard */}
        <View style={[s.notice, { marginTop: 8 }]}>
          <Text style={s.noticeTxt}>
            Cet avis de valeur est établi à titre indicatif sur la base des informations communiquées et des
            références de marché disponibles à la date d'établissement. Il ne constitue pas une expertise judiciaire
            ou certifiée. Casa Caraïbes décline toute responsabilité quant à l'utilisation de ce document à des fins
            autres que celles pour lesquelles il a été établi.
          </Text>
        </View>

        {/* Signature */}
        <View style={s.sigBlock}>
          <View style={s.sigInner}>
            <Text style={[s.body, { marginBottom: 8, fontStyle: "italic", fontSize: 8, textAlign: "center" }]}>
              Fait à {e.lieu || "Le Lamentin (Martinique)"}, le {dateStr}
            </Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{e.redacteur || "Casa Caraïbes"}</Text>
            <Text style={s.sigRole}>Agent immobilier</Text>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
