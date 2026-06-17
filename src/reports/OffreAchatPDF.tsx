import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import logoSrc from "../assets/logo.png";
import type { OffreAchat, PartieOffre } from "../schemas/redacteur/offreAchat.schema";

const P    = "#1A3A52";
const LINE = "#E4E4E0";
const INK  = "#1A1A18";
const SUB  = "#6B6B67";
const BF   = "Helvetica-Bold";
const MED  = "Helvetica";

const s = StyleSheet.create({
  page:        { fontFamily: "Helvetica", fontSize: 9.5, color: INK, padding: "20mm 18mm 16mm" },
  // Header
  logoBox:     { alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: `1 solid ${LINE}` },
  // Titre
  docTitre:    { fontSize: 20, fontFamily: MED, fontWeight: 500, color: INK, textAlign: "center", marginBottom: 3 },
  docNum:      { fontSize: 11, fontFamily: BF, fontWeight: 700, color: P, textAlign: "center", marginBottom: 2 },
  docLieu:     { fontSize: 9, color: SUB, textAlign: "center", fontStyle: "italic", marginBottom: 14 },
  divider:     { height: 1, backgroundColor: LINE, marginBottom: 14 },
  // Articles
  articleTitle: { fontSize: 10.5, fontFamily: BF, fontWeight: 700, color: P, marginTop: 14, marginBottom: 6, borderLeft: `3 solid ${P}`, paddingLeft: 8 },
  body:         { fontSize: 9.5, color: INK, lineHeight: 1.6, marginBottom: 6, textAlign: "justify" },
  bold:         { fontFamily: BF, fontWeight: 700 },
  italic:       { fontStyle: "italic" },
  tableBox:     { border: `0.5 solid ${LINE}`, borderRadius: 4, marginVertical: 6 },
  tableRow:     { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, padding: "5 8" },
  tableRowLast: { flexDirection: "row", padding: "5 8" },
  tableLbl:     { flex: 2, fontSize: 9, color: SUB },
  tableVal:     { flex: 1, fontSize: 9.5, fontFamily: BF, fontWeight: 700, color: INK, textAlign: "right" },
  // Acquéreurs
  acqName:     { fontFamily: BF, fontWeight: 700, fontSize: 9.5, color: INK, textAlign: "center", marginBottom: 4 },
  acqLine:     { fontSize: 9, color: SUB, textAlign: "center", fontStyle: "italic", lineHeight: 1.5 },
  // Footer
  footer:      { position: "absolute", bottom: "10mm", left: "18mm", right: "18mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 6 },
  footerTxt:   { fontSize: 7, color: SUB, textAlign: "center" },
});

// Formateur monétaire — évite le séparateur Unicode U+202F (rendu "/" dans react-pdf)
const E = (n: number) => {
  const str = String(Math.round(n || 0));
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0") + " \u20AC";
};

const fd = (d: string) =>
  d
    ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "……………………";

const dash = "……………………………………";

const FOOTER_TXT =
  "Casa Cara\u00EFbes SARL \u2014 RCS Fort-de-France 928\u00A0647\u00A0981 \u2014 Carte pro T n\u00B0CPI97212024000000007";

// ── nombreEnLettres (copié depuis estimation.schema.ts) ──────────────────────
const UNITES = [
  "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
];
const DIZAINES = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

function centainesEnLettres(n: number): string {
  if (n === 0) return "";
  if (n < 20) return UNITES[n] ?? "";
  const d = Math.floor(n / 10), u = n % 10;
  const diz = DIZAINES[d] ?? "";
  if (d === 7 || d === 9) {
    const sub = UNITES[10 + u] ?? "";
    return d === 9 && u === 0 ? "quatre-vingt-dix" : `${diz}-${sub}`;
  }
  if (d === 8) return u === 0 ? "quatre-vingts" : `quatre-vingt-${UNITES[u] ?? ""}`;
  return u === 0 ? diz : u === 1 ? `${diz}-et-un` : `${diz}-${UNITES[u] ?? ""}`;
}

function nombreEnLettres(n: number): string {
  if (!n || n <= 0) return "zéro euro";
  const milliers = Math.floor(n / 1000);
  const reste = n % 1000;
  let resultat = "";
  if (milliers > 0) {
    resultat += milliers === 1 ? "mille" : `${centainesEnLettres(milliers)} mille`;
  }
  if (reste > 0) {
    if (milliers > 0) resultat += " ";
    resultat += centainesEnLettres(reste);
  }
  return resultat.trim() + " euros";
}
// ────────────────────────────────────────────────────────────────────────────

function AcquereurBlock({ a }: { a: PartieOffre }) {
  const name = [a.civilite, a.prenom, a.nom].filter(Boolean).join(" ");
  return (
    <View>
      <Text style={s.acqName}>{name || dash}</Text>
      {!!a.dateNaissance && (
        <Text style={s.acqLine}>
          {`Né(e) le ${new Date(a.dateNaissance + "T12:00").toLocaleDateString("fr-FR")}`}
          {!!a.lieuNaissance ? ` à ${a.lieuNaissance}` : ""}
        </Text>
      )}
      {!!a.nationalite && <Text style={s.acqLine}>Nationalité : {a.nationalite}</Text>}
      {!!a.etatCivil && <Text style={s.acqLine}>État civil : {a.etatCivil}</Text>}
      {!!a.adresse && <Text style={s.acqLine}>Domicilié(e) : {a.adresse}</Text>}
      {!!(a.codePostal || a.ville) && (
        <Text style={s.acqLine}>{[a.codePostal, a.ville.toUpperCase()].filter(Boolean).join(" ")}</Text>
      )}
      {!!a.tel && <Text style={s.acqLine}>Tél : {a.tel}</Text>}
      {!!a.email && <Text style={s.acqLine}>Email : {a.email}</Text>}
    </View>
  );
}

export function OffreAchatPDF({ f }: { f: OffreAchat }) {
  const isPret = f.typeFinancement === "Prêt bancaire";

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Logo */}
        <View style={s.logoBox}>
          <Image src={logoSrc} style={{ width: 160, height: 60, objectFit: "contain" }} />
        </View>

        {/* Titre */}
        <Text style={s.docTitre}>OFFRE D'ACHAT</Text>
        {!!f.numero && <Text style={s.docNum}>N° {f.numero}</Text>}
        <Text style={s.docLieu}>
          {f.lieu || "Fort-de-France"}, le {fd(f.date)}
        </Text>
        <View style={s.divider} />

        {/* Section ACQUÉREUR(S) */}
        <Text style={s.articleTitle}>ACQUÉREUR(S)</Text>
        <View style={{ border: `0.5 solid ${LINE}`, marginBottom: 10 }}>
          {f.acquereurs.map((a, i) => (
            <View
              key={i}
              style={
                i < f.acquereurs.length - 1
                  ? { padding: "10 12", borderBottom: `0.5 solid ${LINE}` }
                  : { padding: "10 12" }
              }
            >
              <AcquereurBlock a={a} />
            </View>
          ))}
        </View>

        {/* Section DÉSIGNATION DU BIEN */}
        <Text style={s.articleTitle}>DÉSIGNATION DU BIEN</Text>
        <View wrap={false} style={s.tableBox}>
          {[
            ["Type de bien", f.typeBien],
            ["Adresse", f.adresseBien],
            ["Commune", f.commune ? `${f.commune}${f.codePostal ? ` (${f.codePostal})` : ""}` : ""],
            ["Réf. mandat", f.mandatRef],
            ["Vendeur (connu)", f.nomVendeur],
          ]
            .filter(([, v]) => !!v)
            .map(([l, v], i, arr) => (
              <View key={i} style={i === arr.length - 1 ? s.tableRowLast : s.tableRow}>
                <Text style={[s.tableLbl, { fontFamily: BF, fontWeight: 700, color: INK }]}>{l}</Text>
                <Text style={{ flex: 2, fontSize: 9.5, color: INK }}>{v || dash}</Text>
              </View>
            ))}
        </View>
        {!!f.descriptionBien && (
          <Text style={s.body}>
            <Text style={s.bold}>Description : </Text>
            {f.descriptionBien}
          </Text>
        )}

        {/* Section PRIX OFFERT */}
        <Text style={s.articleTitle}>PRIX OFFERT</Text>
        <Text style={s.body}>
          Le(s) acquéreur(s) soussigné(s) offre(nt) d'acquérir le bien ci-dessus désigné au prix de{" "}
          <Text style={s.bold}>{E(f.prixOffert)}</Text>
          {f.prixOffert > 0 ? (
            <Text style={[s.italic, { color: SUB }]}>
              {" "}({nombreEnLettres(Math.round(f.prixOffert))})
            </Text>
          ) : null}
          , tous frais d'agence inclus, frais de notaire en sus à la charge de l'acquéreur.
        </Text>

        {/* Section FINANCEMENT */}
        <Text style={s.articleTitle}>FINANCEMENT</Text>
        <Text style={s.body}>
          <Text style={s.bold}>Mode de financement : </Text>
          {f.typeFinancement}
        </Text>
        {isPret && (
          <View wrap={false} style={s.tableBox}>
            {[
              ["Montant du prêt sollicité", f.montantPret > 0 ? E(f.montantPret) : null],
              ["Apport personnel", f.apportPersonnel > 0 ? E(f.apportPersonnel) : null],
              ["Banque sollicitée", f.banqueSollicitee || null],
              ["Taux maximum", f.tauxMax > 0 ? `${f.tauxMax} %` : null],
              ["Durée maximale", f.dureePretMois > 0 ? `${f.dureePretMois} mois` : null],
            ]
              .filter(([, v]) => v !== null)
              .map(([l, v], i, arr) => (
                <View key={i} style={i === arr.length - 1 ? s.tableRowLast : s.tableRow}>
                  <Text style={[s.tableLbl, { fontFamily: BF, fontWeight: 700, color: INK }]}>{l as string}</Text>
                  <Text style={{ flex: 2, fontSize: 9.5, color: INK }}>{v as string}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Section CONDITIONS SUSPENSIVES */}
        <Text style={s.articleTitle}>CONDITIONS SUSPENSIVES</Text>
        {!f.conditionPret && !f.conditionVenteBien && !f.autresConditions ? (
          <Text style={s.body}>La présente offre est formulée sans condition suspensive particulière.</Text>
        ) : (
          <View>
            {f.conditionPret && (
              <Text style={s.body}>
                {"\u2022"}{" "}
                <Text style={s.bold}>Obtention d'un prêt bancaire : </Text>
                La présente offre est soumise à l'obtention par l'acquéreur d'un ou plusieurs prêts immobiliers
                d'un montant de {E(f.montantPret)}, au taux maximum de {f.tauxMax}% sur une durée maximale
                de {f.dureePretMois} mois, auprès de {f.banqueSollicitee || "tout établissement bancaire"}.
              </Text>
            )}
            {f.conditionVenteBien && (
              <Text style={s.body}>
                {"\u2022"}{" "}
                <Text style={s.bold}>Vente préalable d'un bien immobilier : </Text>
                La présente offre est soumise à la vente préalable du bien appartenant à l'acquéreur
                {!!f.descriptionBienVente ? ` (${f.descriptionBienVente})` : null}.
              </Text>
            )}
            {!!f.autresConditions && (
              <Text style={s.body}>
                {"\u2022"}{" "}
                <Text style={s.bold}>Autres conditions : </Text>
                {f.autresConditions}
              </Text>
            )}
          </View>
        )}

        {/* Section MODALITÉS */}
        <Text style={s.articleTitle}>MODALITÉS</Text>
        <View wrap={false} style={s.tableBox}>
          {[
            ["Validité de l'offre", `${f.validiteJours} jour${f.validiteJours > 1 ? "s" : ""} ouvrés à compter de la date ci-dessus`],
            ["Séquestre", f.sequestre > 0 ? E(f.sequestre) : null],
            ["Notaire désigné", f.notaire || null],
            ["Entrée en jouissance", f.dateEntreeJouissance ? fd(f.dateEntreeJouissance.length === 10 ? f.dateEntreeJouissance : "") || f.dateEntreeJouissance : null],
          ]
            .filter(([, v]) => v !== null)
            .map(([l, v], i, arr) => (
              <View key={i} style={i === arr.length - 1 ? s.tableRowLast : s.tableRow}>
                <Text style={[s.tableLbl, { fontFamily: BF, fontWeight: 700, color: INK }]}>{l as string}</Text>
                <Text style={{ flex: 2, fontSize: 9.5, color: INK }}>{v as string}</Text>
              </View>
            ))}
        </View>
        <Text style={[s.body, { marginTop: 4 }]}>
          En cas d'acceptation, un avant-contrat (compromis ou promesse de vente) sera établi dans les meilleurs
          délais. Un séquestre de {f.sequestre > 0 ? E(f.sequestre) : "montant à convenir"} sera versé à la
          signature de l'avant-contrat, entre les mains du notaire désigné.
        </Text>

        {/* Section SIGNATURES */}
        <Text style={s.articleTitle}>SIGNATURES</Text>
        <View wrap={false} style={{ marginTop: 4, border: `0.5 solid ${LINE}` }}>
          <View style={{ flexDirection: "row" }}>
            {/* Acquéreur(s) */}
            <View style={{ flex: 1, padding: "10 12", borderRight: `0.5 solid ${LINE}` }}>
              <Text style={[s.body, { fontFamily: BF, fontWeight: 700, marginBottom: 8, textAlign: "center" }]}>
                {f.acquereurs.length > 1 ? "LES ACQUÉREURS" : "L'ACQUÉREUR"}
              </Text>
              {f.acquereurs.map((a, i) => (
                <View
                  key={i}
                  style={
                    i > 0
                      ? { marginTop: 14, paddingTop: 10, borderTop: `0.5 solid ${LINE}` }
                      : { marginBottom: 6 }
                  }
                >
                  <Text style={[s.body, { fontFamily: BF, fontWeight: 700, textAlign: "center" }]}>
                    {[a.civilite, a.prenom, a.nom].filter(Boolean).join(" ")}
                  </Text>
                  <Text style={[s.body, { color: SUB, fontStyle: "italic", fontSize: 8.5, textAlign: "center", marginTop: 4 }]}>
                    Lu et approuvé — Bon pour offre d'achat
                  </Text>
                  <Text style={[s.body, { color: SUB, fontStyle: "italic", fontSize: 8.5, textAlign: "center", marginTop: 2 }]}>
                    Signature
                  </Text>
                  <View style={{ height: 35 }} />
                </View>
              ))}
            </View>
            {/* Agence */}
            <View style={{ flex: 1, padding: "10 12" }}>
              <Text style={[s.body, { fontFamily: BF, fontWeight: 700, marginBottom: 8, textAlign: "center" }]}>
                L'AGENCE
              </Text>
              <Text style={[s.body, { fontFamily: BF, fontWeight: 700, textAlign: "center" }]}>
                Casa Cara\u00EFbes SARL
              </Text>
              {!!f.redacteur && (
                <Text style={[s.body, { textAlign: "center" }]}>
                  Représentée par {f.redacteur}
                </Text>
              )}
              <Text style={[s.body, { textAlign: "center" }]}>
                À {f.lieu || "Fort-de-France"}, le {fd(f.date)}
              </Text>
              <Text style={[s.body, { color: SUB, fontStyle: "italic", fontSize: 8.5, textAlign: "center", marginTop: 8 }]}>
                Signature
              </Text>
              <View style={{ height: 35 }} />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>{FOOTER_TXT}</Text>
        </View>

      </Page>
    </Document>
  );
}
