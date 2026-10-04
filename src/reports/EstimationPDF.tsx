import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type {
  Estimation, RefMarche, CritereMarche,
  DiagnosticDDT, ObservationVisuelle, IndicateurMarche,
  SynthesePonderation, PieceAnalysee, SourceExpertise,
} from "../schemas/estimation.schema";
import { nombreEnLettres } from "../schemas/estimation.schema";

const PRIMARY  = "#1A3A52";
const BEIGE    = "#F5EFE6";
const LINE     = "#E4E4E0";
const INK      = "#1A1A18";
const SUB      = "#5B5B57";
const MUTED    = "#9B9B97";
const BG_ALT   = "#FAFAF8";

const IMPACT_TO_APPREC: Record<string, string> = {
  "Positif fort": "Très supérieure",
  "Positif":      "Supérieure",
  "Neutre":       "Similaire",
  "Négatif":      "Inférieure",
  "Négatif fort": "Très inférieure",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: INK, padding: "18mm 16mm 22mm" },

  /* ── Couverture ── */
  coverTitle:    { fontSize: 28, fontFamily: "Helvetica-Bold", color: PRIMARY, textAlign: "center", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  coverDivider:  { height: 2.5, backgroundColor: PRIMARY, marginBottom: 10 },
  coverSub:      { fontSize: 12, fontFamily: "Helvetica-Bold", color: PRIMARY, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16 },
  coverBienType: { fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, textAlign: "center", marginBottom: 3 },
  coverBienAdr:  { fontSize: 10, textAlign: "center", color: INK, marginBottom: 2 },
  coverCad:      { fontSize: 8.5, textAlign: "center", color: SUB, fontStyle: "italic", marginBottom: 14 },
  coverBlock:    { border: `0.5 solid ${LINE}`, padding: "8 12", flex: 1 },
  coverBlockLbl: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: PRIMARY, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  coverBlockVal: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 1 },
  coverBlockSub: { fontSize: 8.5, color: SUB, fontStyle: "italic" },
  coverDate:     { fontSize: 9, color: SUB, textAlign: "center", fontStyle: "italic", marginTop: 10 },
  coverPhoto:    { width: "100%", height: 200, objectFit: "cover", marginTop: 14, borderRadius: 4 },

  /* ── En-têtes de section ── */
  sectionNum:     { fontSize: 11, fontFamily: "Helvetica-Bold", color: PRIMARY, marginTop: 16, marginBottom: 2, textTransform: "uppercase" },
  sectionDivider: { height: 1, backgroundColor: PRIMARY, marginBottom: 8 },
  subTitle:       { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: PRIMARY, marginTop: 10, marginBottom: 5, borderLeft: `3 solid ${PRIMARY}`, paddingLeft: 6 },

  /* ── Corps ── */
  body:   { fontSize: 9, color: INK, lineHeight: 1.6, marginBottom: 6 },
  bold:   { fontFamily: "Helvetica-Bold" },
  italic: { fontStyle: "italic" },

  /* ── Tableaux ── */
  tableHead: { flexDirection: "row", backgroundColor: PRIMARY },
  th:  { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 8, padding: "5 6" },
  tr:  { flexDirection: "row", borderBottom: `0.5 solid ${LINE}` },
  trA: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, backgroundColor: BG_ALT },
  td:  { fontSize: 8.5, padding: "4 6", color: INK },
  tdB: { fontFamily: "Helvetica-Bold" },

  /* ── Valeur vénale ── */
  valBox:      { backgroundColor: BEIGE, border: `1 solid ${LINE}`, borderRadius: 5, padding: "14 20", alignItems: "center", marginTop: 10, marginBottom: 10 },
  valLabel:    { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: PRIMARY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  valNum:      { fontSize: 30, fontFamily: "Helvetica-Bold", color: PRIMARY, marginBottom: 4 },
  valLettres:  { fontSize: 9, color: INK, fontStyle: "italic", marginBottom: 3 },
  valM2:       { fontSize: 8.5, color: SUB, marginBottom: 4 },
  valFourch:   { fontSize: 8.5, color: SUB, fontStyle: "italic" },

  /* ── Pied de page ── */
  footer:    { position: "absolute", bottom: "10mm", left: "16mm", right: "16mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 5, flexDirection: "row", justifyContent: "space-between" },
  footerTxt: { fontSize: 7, color: MUTED },
});

const E = (n: number) => {
  const str = String(Math.round(n || 0));
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
};
const fd = (d: string) =>
  d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";

function SH({ num, title }: { num: string; title: string }) {
  return (
    <>
      <Text style={s.sectionNum}>{num}. {title}</Text>
      <View style={s.sectionDivider} />
    </>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>CASA CARAÏBES — Rapport d'expertise immobilière — Confidentiel</Text>
      <Text
        style={s.footerTxt}
        render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `Page ${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

function TableHead({ cols }: { cols: { label: string; w: string }[] }) {
  return (
    <View style={s.tableHead}>
      {cols.map(c => <Text key={c.label} style={[s.th, { width: c.w }]}>{c.label}</Text>)}
    </View>
  );
}

export function EstimationPDF({ e }: { e: Estimation }) {
  const surface    = e.surfaceHabitable;
  const prixM2     = surface > 0 ? Math.round(e.valeurVenale / surface) : 0;
  const dateStr    = e.dateEstimation ? fd(e.dateEstimation) : new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const lieu       = e.lieu || "Le Lamentin (Martinique)";
  const certif     = e.certificationExpert || "Expert Immobilier Certifié INIGEP®";
  const allRefs    = [...e.refsAnnonces, ...e.refsDVF].filter(r => r.prixM2 > 0);
  const moyM2      = allRefs.length > 0 ? Math.round(allRefs.reduce((s, r) => s + r.prixM2, 0) / allRefs.length) : 0;
  const avecLocLd  = e.avecLocatif && (e.loyerBrut > 0 || e.loyerRetenu > 0);

  // Calculs locatifs longue durée
  const loyer      = e.loyerRetenu || e.loyerBrut || 0;
  const revBrut    = loyer * 12;
  const charges    = (e.chargesLocatif || 0) + (e.taxeFonciere || 0) + (e.partNonRecuperable || 0);
  const revNet     = revBrut - charges;
  const rdtBrut    = e.valeurVenale > 0 && revBrut > 0 ? ((revBrut / e.valeurVenale) * 100).toFixed(2) + " %" : "—";
  const rdtNet     = e.valeurVenale > 0 && revNet > 0 ? ((revNet / e.valeurVenale) * 100).toFixed(2) + " %" : "—";

  const annexeNum  = avecLocLd ? "8" : "7";

  return (
    <Document>

      {/* ══════════════════════════════════════════
          PAGE 1 — COUVERTURE
      ══════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Text style={s.coverTitle}>Rapport d'expertise immobilière</Text>
        <View style={s.coverDivider} />
        <Text style={s.coverSub}>Détermination de la valeur vénale</Text>

        <Text style={s.coverBienType}>{e.typeBien.toUpperCase()}</Text>
        {!!e.residence && <Text style={s.coverBienAdr}>{e.residence}</Text>}
        {!!e.adresse   && <Text style={s.coverBienAdr}>{e.adresse}</Text>}
        <Text style={s.coverBienAdr}>{e.codePostal} {e.commune.toUpperCase()} — MARTINIQUE</Text>
        {!!(e.sectionCadastrale || e.parcelles) && (
          <Text style={s.coverCad}>
            {e.sectionCadastrale ? `Section cadastrale ${e.sectionCadastrale}` : ""}
            {e.sectionCadastrale && e.parcelles ? " — " : ""}
            {e.parcelles ? `Parcelle(s) ${e.parcelles}` : ""}
          </Text>
        )}

        <View style={{ flexDirection: "row", marginTop: 8, marginBottom: 4 }}>
          <View style={[s.coverBlock, { marginRight: 6 }]}>
            <Text style={s.coverBlockLbl}>Demandeur</Text>
            <Text style={s.coverBlockVal}>{e.demandeur || "—"}</Text>
          </View>
          <View style={[s.coverBlock, { marginLeft: 6 }]}>
            <Text style={s.coverBlockLbl}>Expert rédacteur</Text>
            <Text style={s.coverBlockVal}>{e.redacteur}</Text>
            <Text style={s.coverBlockSub}>{certif}</Text>
          </View>
        </View>

        <Text style={s.coverDate}>Fait à {lieu}, le {dateStr}</Text>

        {!!e.photoBase64 && <Image src={e.photoBase64} style={s.coverPhoto} />}
        <Footer />
      </Page>

      {/* ══════════════════════════════════════════
          PAGE 2 — OBJET + IDENTIFICATION
      ══════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <SH num="1" title="Objet de la mission" />
        <Text style={s.body}>
          {"La présente expertise a pour objet de déterminer la valeur vénale "}
          {e.typeBien === "Appartement en copropriété" ? "d'un bien en copropriété" : `d’un(e) ${e.typeBien.toLowerCase()}`}
          {e.residence ? ` au sein de la ${e.residence},` : ""}
          {e.adresse   ? ` situé(e) ${e.adresse},` : ""}
          {` ${e.codePostal} ${e.commune} (Martinique), à la demande de ${e.demandeur || "…"}.`}
          {"\n\nLa valeur vénale désigne le prix le plus probable auquel un bien immobilier pourrait être cédé sur le marché à la date de l’expertise, lors d’une transaction conclue à des conditions normales de marché, entre un vendeur et un acquéreur agissant librement, en connaissance de cause, après une exposition suffisante sur le marché."}
        </Text>

        <SH num="2" title="Identification du bien" />

        <Text style={s.subTitle}>2.1 Situation géographique et cadastrale</Text>
        <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
          {([
            ["Adresse", [e.residence, e.adresse].filter(Boolean).join(" — ") || "—"],
            ["Commune", `${e.codePostal} ${e.commune} (Martinique)`],
            ["Référence cadastrale", e.sectionCadastrale ? `Section ${e.sectionCadastrale} — Parcelle(s) ${e.parcelles}` : "—"],
            ["Étage", e.etage || "—"],
            ["Régime juridique", e.regimeJuridique || "—"],
            ...(e.chargesCopro > 0 ? [["Charges de copropriété", `${E(e.chargesCopro)}/trimestre`]] : []),
          ] as [string, string][]).map(([l, v], i) => (
            <View key={l} style={i % 2 === 0 ? s.tr : s.trA}>
              <Text style={[s.td, s.tdB, { width: "38%" }]}>{l}</Text>
              <Text style={[s.td, { width: "62%" }]}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={s.subTitle}>2.2 Description du bien</Text>
        <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 6 }}>
          {([
            ["Type de bien", e.typeBien],
            ["Surface habitable (loi Carrez)", `${e.surfaceHabitable} m²`],
            ...(e.surfaceTerrasse > 0 ? [["Terrasse", `${e.surfaceTerrasse} m²`]] : []),
            ...(e.surfaceJardin   > 0 ? [["Jardin",   `${e.surfaceJardin} m²`]]   : []),
            ...(e.surfaceTerrain  > 0 ? [["Terrain",  `${e.surfaceTerrain} m²`]]  : []),
            ["Mode constructif", e.modeConstructif || "—"],
            ["État général", e.etatGeneral],
            ...(e.parking ? [["Stationnement", e.parking]] : []),
            ...(e.cave    ? [["Cave",    "Oui — cave privative"]] : []),
            ...(e.piscine ? [["Piscine", "Oui"]] : []),
            ["Vendu meublé", e.venduMeuble ? "Oui (inclus dans l’estimation)" : "Non"],
          ] as [string, string][]).map(([l, v], i) => (
            <View key={l} style={i % 2 === 0 ? s.tr : s.trA}>
              <Text style={[s.td, s.tdB, { width: "38%" }]}>{l}</Text>
              <Text style={[s.td, { width: "62%" }]}>{v}</Text>
            </View>
          ))}
        </View>
        {!!e.distribution && (
          <Text style={[s.body, s.italic]}>Distribution : {e.distribution}</Text>
        )}
        <Footer />
      </Page>

      {/* ══════════════════════════════════════════
          PAGE 3 — ÉTAT & DIAGNOSTICS
      ══════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <SH num="3" title="État général et diagnostics" />

        <Text style={s.subTitle}>3.1 État général du bien</Text>
        <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
          {([
            ["Structure générale",    e.structureGeneral],
            ["Finitions intérieures",       e.finitionsInterieures],
            ["Équipements sanitaires",           e.equipementsSanitaires],
            ["Travaux à prévoir",      e.travauxAPrevoir || "Aucun travaux identifié"],
          ] as [string, string][]).map(([l, v], i) => (
            <View key={l} style={i % 2 === 0 ? s.tr : s.trA}>
              <Text style={[s.td, s.tdB, { width: "40%" }]}>{l}</Text>
              <Text style={[s.td, { width: "60%" }]}>{v}</Text>
            </View>
          ))}
        </View>

        {e.diagnosticsDDT && e.diagnosticsDDT.length > 0 && (
          <>
            <Text style={s.subTitle}>3.2 Synthèse DDT (Dossier de Diagnostics Techniques)</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
              <TableHead cols={[
                { label: "Diagnostic", w: "40%" },
                { label: "Résultat", w: "35%" },
                { label: "Impact valeur", w: "25%" },
              ]} />
              {(e.diagnosticsDDT as DiagnosticDDT[]).map((d, i) => (
                <View key={d.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, s.tdB, { width: "40%" }]}>{d.diagnostic}</Text>
                  <Text style={[s.td, { width: "35%" }]}>{d.resultat || "—"}</Text>
                  <Text style={[s.td, { width: "25%", color: SUB }]}>{d.impact}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {e.observationsVisuelles && e.observationsVisuelles.length > 0 && (
          <>
            <Text style={s.subTitle}>3.3 Observations visuelles</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
              <TableHead cols={[
                { label: "Zone", w: "25%" },
                { label: "Constat technique", w: "40%" },
                { label: "Préconisation", w: "35%" },
              ]} />
              {(e.observationsVisuelles as ObservationVisuelle[]).map((o, i) => (
                <View key={o.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, s.tdB, { width: "25%" }]}>{o.zone}</Text>
                  <Text style={[s.td, { width: "40%" }]}>{o.constat}</Text>
                  <Text style={[s.td, { width: "35%", color: SUB }]}>{o.preconisation}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Footer />
      </Page>

      {/* ══════════════════════════════════════════
          PAGE 4 — ENVIRONNEMENT + MARCHÉ
      ══════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <SH num="4" title="Environnement et situation" />
        <Text style={s.body}>
          {e.descriptionEnvironnement || "Description de l’environnement et de la situation géographique à compléter."}
        </Text>

        <SH num="5" title="Étude de marché — Analyse comparative" />

        {e.indicateursMarche && e.indicateursMarche.length > 0 && (
          <>
            <Text style={s.subTitle}>5.1 Indicateurs de marché</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
              <TableHead cols={[
                { label: "Indicateur de marché", w: "45%" },
                { label: "Valeur", w: "30%" },
                { label: "Source", w: "25%" },
              ]} />
              {(e.indicateursMarche as IndicateurMarche[]).map((ind, i) => (
                <View key={ind.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, { width: "45%" }]}>{ind.indicateur}</Text>
                  <Text style={[s.td, s.tdB, { width: "30%" }]}>{ind.valeur || "—"}</Text>
                  <Text style={[s.td, { width: "25%", color: SUB }]}>{ind.source}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {(e.refsAnnonces.length > 0 || e.refsDVF.length > 0) && (
          <>
            <Text style={s.subTitle}>
              {(e.indicateursMarche?.length ?? 0) > 0 ? "5.2" : "5.1"} Analyse comparative — Références de marché
            </Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 8 }}>
              <TableHead cols={[
                { label: "Réf", w: "10%" },
                { label: "Type / Surface", w: "18%" },
                { label: "Localisation", w: "20%" },
                { label: "Prix", w: "15%" },
                { label: "€/m²", w: "12%" },
                { label: "Différences vs bien étudié", w: "25%" },
              ]} />
              {[...e.refsAnnonces, ...e.refsDVF].map((r: RefMarche, i: number) => (
                <View key={r.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, s.tdB, { width: "10%", color: PRIMARY }]}>
                    {r.reference || `REF-${String(i + 1).padStart(2, "0")}`}
                  </Text>
                  <Text style={[s.td, { width: "18%" }]}>
                    {r.type || "—"}{r.surface ? ` — ${r.surface} m²` : ""}
                  </Text>
                  <Text style={[s.td, { width: "20%" }]}>{r.localisation || r.observations || "—"}</Text>
                  <Text style={[s.td, s.tdB, { width: "15%" }]}>{r.prix ? E(r.prix) : "—"}</Text>
                  <Text style={[s.td, { width: "12%", color: PRIMARY }]}>
                    {r.prixM2 ? r.prixM2.toLocaleString("fr-FR") : "—"}
                  </Text>
                  <Text style={[s.td, { width: "25%", color: SUB }]}>{r.differences || r.observations || "—"}</Text>
                </View>
              ))}
            </View>
            {moyM2 > 0 && (
              <Text style={[s.body, s.italic, { color: SUB }]}>
                {`L’analyse comparative porte sur ${allRefs.length} référence(s) et établit une valeur moyenne de ${moyM2.toLocaleString("fr-FR")} €/m².`}
                {e.commentaireMarche ? ` ${e.commentaireMarche}` : ""}
              </Text>
            )}
          </>
        )}

        <Footer />
      </Page>

      {/* ══════════════════════════════════════════
          PAGE 5 — ESTIMATION
      ══════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <SH num="6" title="Estimation de la valeur vénale" />

        {e.criteres.length > 0 && (
          <>
            <Text style={s.subTitle}>6.1 Grille d’ajustements</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
              <TableHead cols={[
                { label: "Critère", w: "25%" },
                { label: "Situation du bien", w: "30%" },
                { label: "Appréciation", w: "25%" },
                { label: "Ajustement", w: "20%" },
              ]} />
              {e.criteres.map((c: CritereMarche, i: number) => (
                <View key={c.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, s.tdB, { width: "25%" }]}>{c.critere}</Text>
                  <Text style={[s.td, { width: "30%", color: SUB }]}>{c.situationBien || c.analyse || "—"}</Text>
                  <Text style={[s.td, { width: "25%" }]}>{IMPACT_TO_APPREC[c.impact] || c.impact}</Text>
                  <Text style={[s.td, s.tdB, { width: "20%", textAlign: "right" }]}>{c.ajustement || "—"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={s.subTitle}>6.2 Argumentation</Text>
        <Text style={s.body}>{e.argumentaireValeur || "Argumentation de la valeur à compléter."}</Text>

        {e.synthesePonderation && e.synthesePonderation.length > 0 && (
          <>
            <Text style={s.subTitle}>6.3 Synthèse et pondération des méthodes</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
              <TableHead cols={[
                { label: "Méthode", w: "35%" },
                { label: "Valeur indicative", w: "25%" },
                { label: "Pondération", w: "20%" },
                { label: "Contribution", w: "20%" },
              ]} />
              {(e.synthesePonderation as SynthesePonderation[]).map((sp, i) => (
                <View key={sp.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, { width: "35%" }]}>{sp.methode}</Text>
                  <Text style={[s.td, s.tdB, { width: "25%" }]}>{sp.valeurIndicative > 0 ? E(sp.valeurIndicative) : "—"}</Text>
                  <Text style={[s.td, { width: "20%", textAlign: "center" }]}>{sp.ponderation}</Text>
                  <Text style={[s.td, s.tdB, { width: "20%", color: PRIMARY }]}>{sp.contribution > 0 ? E(sp.contribution) : "—"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Encadré valeur vénale */}
        <View style={s.valBox}>
          <Text style={s.valLabel}>Valeur vénale estimée</Text>
          <Text style={s.valNum}>{E(e.valeurVenale)}</Text>
          <Text style={s.valLettres}>({nombreEnLettres(e.valeurVenale)})</Text>
          {prixM2 > 0 && (
            <Text style={s.valM2}>
              {`soit ${prixM2.toLocaleString("fr-FR")} €/m² loi Carrez (base ${e.surfaceHabitable} m²)`}
            </Text>
          )}
          {(e.fourchetteBasse > 0 || e.fourchetteHaute > 0) && (
            <Text style={s.valFourch}>
              {`Fourchette de marché : ${e.fourchetteBasse > 0 ? E(e.fourchetteBasse) : "—"} – ${e.fourchetteHaute > 0 ? E(e.fourchetteHaute) : "—"}`}
              {e.venduMeuble ? " | Bien vendu meublé" : " | Bien libre d’occupation, non meublé"}
            </Text>
          )}
        </View>

        <Footer />
      </Page>

      {/* ══════════════════════════════════════════
          PAGE 6 — LOCATIF + ANNEXES + SIGNATURE
      ══════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        {avecLocLd && (
          <>
            <SH num="7" title="Analyse du potentiel locatif" />
            <Text style={s.subTitle}>7.1 Loyer potentiel</Text>
            <Text style={s.body}>
              {`Sur la base des données de marché locatif disponibles pour ${e.commune} et des caractéristiques du bien, le loyer mensuel estimé s’établit à ${loyer > 0 ? E(loyer) : "…"} HC/mois.`}
            </Text>

            <Text style={s.subTitle}>7.2 Paramètres locatifs</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 12 }}>
              <TableHead cols={[{ label: "Paramètre", w: "60%" }, { label: "Valeur", w: "40%" }]} />
              {([
                ["Loyer estimé brut", e.loyerBrut > 0 ? `${E(e.loyerBrut)}/mois HC` : "—"],
                ["Loyer retenu", e.loyerRetenu > 0 ? `${E(e.loyerRetenu)}/mois HC` : "—"],
                ["Revenu brut annuel", revBrut > 0 ? E(revBrut) : "—"],
                ["Charges de copropriété (annuel)", e.chargesLocatif > 0 ? E(e.chargesLocatif) : "—"],
                ["Taxe foncière (annuel)", e.taxeFonciere > 0 ? E(e.taxeFonciere) : "—"],
                ["Part non récupérable (annuel)", e.partNonRecuperable > 0 ? E(e.partNonRecuperable) : "—"],
                ["Revenu net annuel estimé", revNet > 0 ? E(revNet) : "—"],
                ["Rendement brut", rdtBrut],
                ["Rendement net", rdtNet],
                ["Cible locataire", e.cibleLocataire || "—"],
                ["Taux de vacance estimé", e.tauxVacance || "—"],
                ["Délai de relocation", e.delaiRelocation || "—"],
              ] as [string, string][]).map(([l, v], i) => (
                <View key={l} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, s.tdB, { width: "60%" }]}>{l}</Text>
                  <Text style={[s.td, { width: "40%" }]}>{v}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <SH num={annexeNum} title="Annexes et limites" />

        {e.piecesAnalysees && e.piecesAnalysees.length > 0 && (
          <>
            <Text style={s.subTitle}>{annexeNum}.1 Pièces analysées</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 8 }}>
              <TableHead cols={[
                { label: "Référence", w: "18%" },
                { label: "Nature", w: "37%" },
                { label: "Date", w: "18%" },
                { label: "Émetteur", w: "27%" },
              ]} />
              {(e.piecesAnalysees as PieceAnalysee[]).map((p, i) => (
                <View key={p.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, { width: "18%" }]}>{p.reference || "—"}</Text>
                  <Text style={[s.td, { width: "37%" }]}>{p.nature}</Text>
                  <Text style={[s.td, { width: "18%" }]}>{p.date || "—"}</Text>
                  <Text style={[s.td, { width: "27%", color: SUB }]}>{p.emetteur || "—"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {e.sourcesExpertise && e.sourcesExpertise.length > 0 && (
          <>
            <Text style={s.subTitle}>{annexeNum}.2 Sources et références utilisées</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 8 }}>
              <TableHead cols={[
                { label: "Source", w: "40%" },
                { label: "Usage", w: "40%" },
                { label: "Date", w: "20%" },
              ]} />
              {(e.sourcesExpertise as SourceExpertise[]).map((src, i) => (
                <View key={src.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, { width: "40%" }]}>{src.source}</Text>
                  <Text style={[s.td, { width: "40%", color: SUB }]}>{src.usage}</Text>
                  <Text style={[s.td, { width: "20%" }]}>{src.date || "—"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={s.subTitle}>{annexeNum}.{e.piecesAnalysees?.length > 0 ? (e.sourcesExpertise?.length > 0 ? "3" : "2") : (e.sourcesExpertise?.length > 0 ? "2" : "1")} Limites de l’expertise</Text>
        <Text style={[s.body, { color: SUB }]}>
          {e.limites ||
            "La présente expertise est établie sur la base des informations et documents communiqués par le demandeur, d’une visite du bien et d’une analyse de marché à la date de l’expertise. Elle ne constitue pas une garantie de prix de vente et pourra être revisée en cas d’informations complémentaires ou de modification des conditions de marché. L’expert ne saurait être tenu responsable des informations erronées ou incomplètes qui lui auraient été communiquées."}
        </Text>

        {/* Signature */}
        <View style={{ marginTop: 28, flexDirection: "row", justifyContent: "flex-end" }}>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[s.body, s.italic, { marginBottom: 6 }]}>
              {`Fait à ${lieu}, le ${dateStr}`}
            </Text>
            <Text style={[s.body, s.bold, { fontSize: 10.5, marginBottom: 2 }]}>{e.redacteur}</Text>
            <Text style={[s.body, s.italic, { color: SUB, marginBottom: 1 }]}>{certif}</Text>
            <Text style={[s.body, { color: SUB }]}>Agence Immobilière Casa Caraïbes</Text>
            <View style={{ marginTop: 22, width: 130, borderBottom: `1 solid ${INK}` }} />
            <Text style={[s.body, { color: MUTED, fontSize: 7.5, marginTop: 2 }]}>Signature</Text>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
