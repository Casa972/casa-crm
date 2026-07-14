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
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0") + " \u20AC";
};
const fd = (d: string) =>
  d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "\u2014";

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
  const certif     = e.certificationExpert || "Expert Immobilier Certifié INIGEP\u00AE";
  const allRefs    = [...e.refsAnnonces, ...e.refsDVF].filter(r => r.prixM2 > 0);
  const moyM2      = allRefs.length > 0 ? Math.round(allRefs.reduce((s, r) => s + r.prixM2, 0) / allRefs.length) : 0;
  const avecLocLd  = e.avecLocatif && (e.loyerBrut > 0 || e.loyerRetenu > 0);

  // Calculs locatifs longue durée
  const loyer      = e.loyerRetenu || e.loyerBrut || 0;
  const revBrut    = loyer * 12;
  const charges    = (e.chargesLocatif || 0) + (e.taxeFonciere || 0) + (e.partNonRecuperable || 0);
  const revNet     = revBrut - charges;
  const rdtBrut    = e.valeurVenale > 0 && revBrut > 0 ? ((revBrut / e.valeurVenale) * 100).toFixed(2) + " %" : "\u2014";
  const rdtNet     = e.valeurVenale > 0 && revNet > 0 ? ((revNet / e.valeurVenale) * 100).toFixed(2) + " %" : "\u2014";

  const annexeNum  = avecLocLd ? "8" : "7";

  return (
    <Document>

      {/* ══════════════════════════════════════════
          PAGE 1 — COUVERTURE
      ══════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Text style={s.coverTitle}>Rapport d'expertise immobili\u00E8re</Text>
        <View style={s.coverDivider} />
        <Text style={s.coverSub}>D\u00E9termination de la valeur v\u00E9nale</Text>

        <Text style={s.coverBienType}>{e.typeBien.toUpperCase()}</Text>
        {!!e.residence && <Text style={s.coverBienAdr}>{e.residence}</Text>}
        {!!e.adresse   && <Text style={s.coverBienAdr}>{e.adresse}</Text>}
        <Text style={s.coverBienAdr}>{e.codePostal} {e.commune.toUpperCase()} \u2014 MARTINIQUE</Text>
        {!!(e.sectionCadastrale || e.parcelles) && (
          <Text style={s.coverCad}>
            {e.sectionCadastrale ? `Section cadastrale ${e.sectionCadastrale}` : ""}
            {e.sectionCadastrale && e.parcelles ? " \u2014 " : ""}
            {e.parcelles ? `Parcelle(s) ${e.parcelles}` : ""}
          </Text>
        )}

        <View style={{ flexDirection: "row", marginTop: 8, marginBottom: 4 }}>
          <View style={[s.coverBlock, { marginRight: 6 }]}>
            <Text style={s.coverBlockLbl}>Demandeur</Text>
            <Text style={s.coverBlockVal}>{e.demandeur || "\u2014"}</Text>
          </View>
          <View style={[s.coverBlock, { marginLeft: 6 }]}>
            <Text style={s.coverBlockLbl}>Expert r\u00E9dacteur</Text>
            <Text style={s.coverBlockVal}>{e.redacteur}</Text>
            <Text style={s.coverBlockSub}>{certif}</Text>
          </View>
        </View>

        <Text style={s.coverDate}>Fait \u00E0 {lieu}, le {dateStr}</Text>

        {!!e.photoBase64 && <Image src={e.photoBase64} style={s.coverPhoto} />}
        <Footer />
      </Page>

      {/* ══════════════════════════════════════════
          PAGE 2 — OBJET + IDENTIFICATION
      ══════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <SH num="1" title="Objet de la mission" />
        <Text style={s.body}>
          {"La pr\u00E9sente expertise a pour objet de d\u00E9terminer la valeur v\u00E9nale "}
          {e.typeBien === "Appartement en copropri\u00E9t\u00E9" ? "d'un bien en copropri\u00E9t\u00E9" : `d\u2019un(e) ${e.typeBien.toLowerCase()}`}
          {e.residence ? ` au sein de la ${e.residence},` : ""}
          {e.adresse   ? ` situ\u00E9(e) ${e.adresse},` : ""}
          {` ${e.codePostal} ${e.commune} (Martinique), \u00E0 la demande de ${e.demandeur || "\u2026"}.`}
          {"\n\nLa valeur v\u00E9nale d\u00E9signe le prix le plus probable auquel un bien immobilier pourrait \u00EAtre c\u00E9d\u00E9 sur le march\u00E9 \u00E0 la date de l\u2019expertise, lors d\u2019une transaction conclue \u00E0 des conditions normales de march\u00E9, entre un vendeur et un acqu\u00E9reur agissant librement, en connaissance de cause, apr\u00E8s une exposition suffisante sur le march\u00E9."}
        </Text>

        <SH num="2" title="Identification du bien" />

        <Text style={s.subTitle}>2.1 Situation g\u00E9ographique et cadastrale</Text>
        <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
          {([
            ["Adresse", [e.residence, e.adresse].filter(Boolean).join(" \u2014 ") || "\u2014"],
            ["Commune", `${e.codePostal} ${e.commune} (Martinique)`],
            ["R\u00E9f\u00E9rence cadastrale", e.sectionCadastrale ? `Section ${e.sectionCadastrale} \u2014 Parcelle(s) ${e.parcelles}` : "\u2014"],
            ["Étage", e.etage || "\u2014"],
            ["R\u00E9gime juridique", e.regimeJuridique || "\u2014"],
            ...(e.chargesCopro > 0 ? [["Charges de copropri\u00E9t\u00E9", `${E(e.chargesCopro)}/trimestre`]] : []),
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
            ["Surface habitable (loi Carrez)", `${e.surfaceHabitable} m\u00B2`],
            ...(e.surfaceTerrasse > 0 ? [["Terrasse", `${e.surfaceTerrasse} m\u00B2`]] : []),
            ...(e.surfaceJardin   > 0 ? [["Jardin",   `${e.surfaceJardin} m\u00B2`]]   : []),
            ...(e.surfaceTerrain  > 0 ? [["Terrain",  `${e.surfaceTerrain} m\u00B2`]]  : []),
            ["Mode constructif", e.modeConstructif || "\u2014"],
            ["État g\u00E9n\u00E9ral", e.etatGeneral],
            ...(e.parking ? [["Stationnement", e.parking]] : []),
            ...(e.cave    ? [["Cave",    "Oui \u2014 cave privative"]] : []),
            ...(e.piscine ? [["Piscine", "Oui"]] : []),
            ["Vendu meubl\u00E9", e.venduMeuble ? "Oui (inclus dans l\u2019estimation)" : "Non"],
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
        <SH num="3" title="\u00C9tat g\u00E9n\u00E9ral et diagnostics" />

        <Text style={s.subTitle}>3.1 État g\u00E9n\u00E9ral du bien</Text>
        <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
          {([
            ["Structure g\u00E9n\u00E9rale",    e.structureGeneral],
            ["Finitions int\u00E9rieures",       e.finitionsInterieures],
            ["Équipements sanitaires",           e.equipementsSanitaires],
            ["Travaux \u00E0 pr\u00E9voir",      e.travauxAPrevoir || "Aucun travaux identifi\u00E9"],
          ] as [string, string][]).map(([l, v], i) => (
            <View key={l} style={i % 2 === 0 ? s.tr : s.trA}>
              <Text style={[s.td, s.tdB, { width: "40%" }]}>{l}</Text>
              <Text style={[s.td, { width: "60%" }]}>{v}</Text>
            </View>
          ))}
        </View>

        {e.diagnosticsDDT && e.diagnosticsDDT.length > 0 && (
          <>
            <Text style={s.subTitle}>3.2 Synth\u00E8se DDT (Dossier de Diagnostics Techniques)</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
              <TableHead cols={[
                { label: "Diagnostic", w: "40%" },
                { label: "R\u00E9sultat", w: "35%" },
                { label: "Impact valeur", w: "25%" },
              ]} />
              {(e.diagnosticsDDT as DiagnosticDDT[]).map((d, i) => (
                <View key={d.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, s.tdB, { width: "40%" }]}>{d.diagnostic}</Text>
                  <Text style={[s.td, { width: "35%" }]}>{d.resultat || "\u2014"}</Text>
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
                { label: "Pr\u00E9conisation", w: "35%" },
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
          {e.descriptionEnvironnement || "Description de l\u2019environnement et de la situation g\u00E9ographique \u00E0 compl\u00E9ter."}
        </Text>

        <SH num="5" title="\u00C9tude de march\u00E9 \u2014 Analyse comparative" />

        {e.indicateursMarche && e.indicateursMarche.length > 0 && (
          <>
            <Text style={s.subTitle}>5.1 Indicateurs de march\u00E9</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
              <TableHead cols={[
                { label: "Indicateur de march\u00E9", w: "45%" },
                { label: "Valeur", w: "30%" },
                { label: "Source", w: "25%" },
              ]} />
              {(e.indicateursMarche as IndicateurMarche[]).map((ind, i) => (
                <View key={ind.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, { width: "45%" }]}>{ind.indicateur}</Text>
                  <Text style={[s.td, s.tdB, { width: "30%" }]}>{ind.valeur || "\u2014"}</Text>
                  <Text style={[s.td, { width: "25%", color: SUB }]}>{ind.source}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {(e.refsAnnonces.length > 0 || e.refsDVF.length > 0) && (
          <>
            <Text style={s.subTitle}>
              {(e.indicateursMarche?.length ?? 0) > 0 ? "5.2" : "5.1"} Analyse comparative \u2014 R\u00E9f\u00E9rences de march\u00E9
            </Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 8 }}>
              <TableHead cols={[
                { label: "R\u00E9f", w: "10%" },
                { label: "Type / Surface", w: "18%" },
                { label: "Localisation", w: "20%" },
                { label: "Prix", w: "15%" },
                { label: "\u20AC/m\u00B2", w: "12%" },
                { label: "Diff\u00E9rences vs bien \u00E9tudi\u00E9", w: "25%" },
              ]} />
              {[...e.refsAnnonces, ...e.refsDVF].map((r: RefMarche, i: number) => (
                <View key={r.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, s.tdB, { width: "10%", color: PRIMARY }]}>
                    {r.reference || `REF-${String(i + 1).padStart(2, "0")}`}
                  </Text>
                  <Text style={[s.td, { width: "18%" }]}>
                    {r.type || "\u2014"}{r.surface ? ` \u2014 ${r.surface} m\u00B2` : ""}
                  </Text>
                  <Text style={[s.td, { width: "20%" }]}>{r.localisation || r.observations || "\u2014"}</Text>
                  <Text style={[s.td, s.tdB, { width: "15%" }]}>{r.prix ? E(r.prix) : "\u2014"}</Text>
                  <Text style={[s.td, { width: "12%", color: PRIMARY }]}>
                    {r.prixM2 ? r.prixM2.toLocaleString("fr-FR") : "\u2014"}
                  </Text>
                  <Text style={[s.td, { width: "25%", color: SUB }]}>{r.differences || r.observations || "\u2014"}</Text>
                </View>
              ))}
            </View>
            {moyM2 > 0 && (
              <Text style={[s.body, s.italic, { color: SUB }]}>
                {`L\u2019analyse comparative porte sur ${allRefs.length} r\u00E9f\u00E9rence(s) et \u00E9tablit une valeur moyenne de ${moyM2.toLocaleString("fr-FR")} \u20AC/m\u00B2.`}
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
        <SH num="6" title="Estimation de la valeur v\u00E9nale" />

        {e.criteres.length > 0 && (
          <>
            <Text style={s.subTitle}>6.1 Grille d\u2019ajustements</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
              <TableHead cols={[
                { label: "Crit\u00E8re", w: "25%" },
                { label: "Situation du bien", w: "30%" },
                { label: "Appr\u00E9ciation", w: "25%" },
                { label: "Ajustement", w: "20%" },
              ]} />
              {e.criteres.map((c: CritereMarche, i: number) => (
                <View key={c.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, s.tdB, { width: "25%" }]}>{c.critere}</Text>
                  <Text style={[s.td, { width: "30%", color: SUB }]}>{c.situationBien || c.analyse || "\u2014"}</Text>
                  <Text style={[s.td, { width: "25%" }]}>{IMPACT_TO_APPREC[c.impact] || c.impact}</Text>
                  <Text style={[s.td, s.tdB, { width: "20%", textAlign: "right" }]}>{c.ajustement || "\u2014"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={s.subTitle}>6.2 Argumentation</Text>
        <Text style={s.body}>{e.argumentaireValeur || "Argumentation de la valeur \u00E0 compl\u00E9ter."}</Text>

        {e.synthesePonderation && e.synthesePonderation.length > 0 && (
          <>
            <Text style={s.subTitle}>6.3 Synth\u00E8se et pond\u00E9ration des m\u00E9thodes</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 10 }}>
              <TableHead cols={[
                { label: "M\u00E9thode", w: "35%" },
                { label: "Valeur indicative", w: "25%" },
                { label: "Pond\u00E9ration", w: "20%" },
                { label: "Contribution", w: "20%" },
              ]} />
              {(e.synthesePonderation as SynthesePonderation[]).map((sp, i) => (
                <View key={sp.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, { width: "35%" }]}>{sp.methode}</Text>
                  <Text style={[s.td, s.tdB, { width: "25%" }]}>{sp.valeurIndicative > 0 ? E(sp.valeurIndicative) : "\u2014"}</Text>
                  <Text style={[s.td, { width: "20%", textAlign: "center" }]}>{sp.ponderation}</Text>
                  <Text style={[s.td, s.tdB, { width: "20%", color: PRIMARY }]}>{sp.contribution > 0 ? E(sp.contribution) : "\u2014"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Encadré valeur vénale */}
        <View style={s.valBox}>
          <Text style={s.valLabel}>Valeur v\u00E9nale estim\u00E9e</Text>
          <Text style={s.valNum}>{E(e.valeurVenale)}</Text>
          <Text style={s.valLettres}>({nombreEnLettres(e.valeurVenale)})</Text>
          {prixM2 > 0 && (
            <Text style={s.valM2}>
              {`soit ${prixM2.toLocaleString("fr-FR")} \u20AC/m\u00B2 loi Carrez (base ${e.surfaceHabitable}\u00A0m\u00B2)`}
            </Text>
          )}
          {(e.fourchetteBasse > 0 || e.fourchetteHaute > 0) && (
            <Text style={s.valFourch}>
              {`Fourchette de march\u00E9\u00A0: ${e.fourchetteBasse > 0 ? E(e.fourchetteBasse) : "\u2014"} \u2013 ${e.fourchetteHaute > 0 ? E(e.fourchetteHaute) : "\u2014"}`}
              {e.venduMeuble ? " | Bien vendu meubl\u00E9" : " | Bien libre d\u2019occupation, non meubl\u00E9"}
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
              {`Sur la base des donn\u00E9es de march\u00E9 locatif disponibles pour ${e.commune} et des caract\u00E9ristiques du bien, le loyer mensuel estim\u00E9 s\u2019\u00E9tablit \u00E0 ${loyer > 0 ? E(loyer) : "\u2026"} HC/mois.`}
            </Text>

            <Text style={s.subTitle}>7.2 Param\u00E8tres locatifs</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 12 }}>
              <TableHead cols={[{ label: "Param\u00E8tre", w: "60%" }, { label: "Valeur", w: "40%" }]} />
              {([
                ["Loyer estim\u00E9 brut", e.loyerBrut > 0 ? `${E(e.loyerBrut)}/mois HC` : "\u2014"],
                ["Loyer retenu", e.loyerRetenu > 0 ? `${E(e.loyerRetenu)}/mois HC` : "\u2014"],
                ["Revenu brut annuel", revBrut > 0 ? E(revBrut) : "\u2014"],
                ["Charges de copropri\u00E9t\u00E9 (annuel)", e.chargesLocatif > 0 ? E(e.chargesLocatif) : "\u2014"],
                ["Taxe fonci\u00E8re (annuel)", e.taxeFonciere > 0 ? E(e.taxeFonciere) : "\u2014"],
                ["Part non r\u00E9cup\u00E9rable (annuel)", e.partNonRecuperable > 0 ? E(e.partNonRecuperable) : "\u2014"],
                ["Revenu net annuel estim\u00E9", revNet > 0 ? E(revNet) : "\u2014"],
                ["Rendement brut", rdtBrut],
                ["Rendement net", rdtNet],
                ["Cible locataire", e.cibleLocataire || "\u2014"],
                ["Taux de vacance estim\u00E9", e.tauxVacance || "\u2014"],
                ["D\u00E9lai de relocation", e.delaiRelocation || "\u2014"],
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
            <Text style={s.subTitle}>{annexeNum}.1 Pi\u00E8ces analys\u00E9es</Text>
            <View style={{ border: `0.5 solid ${LINE}`, borderRadius: 3, marginBottom: 8 }}>
              <TableHead cols={[
                { label: "R\u00E9f\u00E9rence", w: "18%" },
                { label: "Nature", w: "37%" },
                { label: "Date", w: "18%" },
                { label: "\u00C9metteur", w: "27%" },
              ]} />
              {(e.piecesAnalysees as PieceAnalysee[]).map((p, i) => (
                <View key={p.id} style={i % 2 === 0 ? s.tr : s.trA}>
                  <Text style={[s.td, { width: "18%" }]}>{p.reference || "\u2014"}</Text>
                  <Text style={[s.td, { width: "37%" }]}>{p.nature}</Text>
                  <Text style={[s.td, { width: "18%" }]}>{p.date || "\u2014"}</Text>
                  <Text style={[s.td, { width: "27%", color: SUB }]}>{p.emetteur || "\u2014"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {e.sourcesExpertise && e.sourcesExpertise.length > 0 && (
          <>
            <Text style={s.subTitle}>{annexeNum}.2 Sources et r\u00E9f\u00E9rences utilis\u00E9es</Text>
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
                  <Text style={[s.td, { width: "20%" }]}>{src.date || "\u2014"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={s.subTitle}>{annexeNum}.{e.piecesAnalysees?.length > 0 ? (e.sourcesExpertise?.length > 0 ? "3" : "2") : (e.sourcesExpertise?.length > 0 ? "2" : "1")} Limites de l\u2019expertise</Text>
        <Text style={[s.body, { color: SUB }]}>
          {e.limites ||
            "La pr\u00E9sente expertise est \u00E9tablie sur la base des informations et documents communiqu\u00E9s par le demandeur, d\u2019une visite du bien et d\u2019une analyse de march\u00E9 \u00E0 la date de l\u2019expertise. Elle ne constitue pas une garantie de prix de vente et pourra \u00EAtre revis\u00E9e en cas d\u2019informations compl\u00E9mentaires ou de modification des conditions de march\u00E9. L\u2019expert ne saurait \u00EAtre tenu responsable des informations erron\u00E9es ou incompl\u00E8tes qui lui auraient \u00E9t\u00E9 communiqu\u00E9es."}
        </Text>

        {/* Signature */}
        <View style={{ marginTop: 28, flexDirection: "row", justifyContent: "flex-end" }}>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[s.body, s.italic, { marginBottom: 6 }]}>
              {`Fait \u00E0 ${lieu}, le ${dateStr}`}
            </Text>
            <Text style={[s.body, s.bold, { fontSize: 10.5, marginBottom: 2 }]}>{e.redacteur}</Text>
            <Text style={[s.body, s.italic, { color: SUB, marginBottom: 1 }]}>{certif}</Text>
            <Text style={[s.body, { color: SUB }]}>Agence Immobili\u00E8re Casa Cara\u00EFbes</Text>
            <View style={{ marginTop: 22, width: 130, borderBottom: `1 solid ${INK}` }} />
            <Text style={[s.body, { color: MUTED, fontSize: 7.5, marginTop: 2 }]}>Signature</Text>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
