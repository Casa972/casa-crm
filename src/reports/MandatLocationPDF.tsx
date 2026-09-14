import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "./pdfFonts";
import logo from "../assets/logo.png";
import type { MandatLocation } from "../schemas/redacteur/mandatLocation.schema";
import { calcMandatLocation } from "../schemas/redacteur/mandatLocation.schema";

const NAVY = "#1A3A52";
const LINE = "#D8D4CC";
const INK = "#1A1A18";
const SUB = "#5B5B57";
const MUTED = "#8A8A86";

const s = StyleSheet.create({
  page: { fontFamily: "Montserrat", fontSize: 9.5, color: INK, padding: "16mm 16mm 18mm" },
  cover: { fontFamily: "Montserrat", color: INK, padding: "24mm 22mm", alignItems: "center", justifyContent: "center" },
  logo: { width: 160, height: 54, objectFit: "contain", marginBottom: 24 },
  hair: { width: "40%", height: 0.9, backgroundColor: NAVY, marginBottom: 20 },
  kicker: { fontSize: 8, fontFamily: "Montserrat", fontWeight: 700, color: SUB, letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 18, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, textAlign: "center", letterSpacing: 1.5 },
  sub: { fontSize: 10, color: INK, textAlign: "center", marginTop: 10 },
  parties: { flexDirection: "row", width: "100%", marginTop: 28, border: `0.8 solid ${LINE}` },
  partie: { flex: 1, padding: 12 },
  partieR: { flex: 1, padding: 12, borderLeft: `0.8 solid ${LINE}` },
  lbl: { fontSize: 8, fontFamily: "Montserrat", fontWeight: 700, color: SUB, marginBottom: 6 },
  val: { fontSize: 10, fontFamily: "Montserrat", fontWeight: 700 },
  muted: { fontSize: 8.5, color: SUB, marginTop: 2 },
  date: { fontSize: 9, color: SUB, fontStyle: "italic", marginTop: 20 },
  sec: { fontSize: 11, fontFamily: "Montserrat", fontWeight: 700, color: NAVY, marginTop: 12, marginBottom: 3 },
  secLine: { height: 1.1, backgroundColor: NAVY, marginBottom: 8 },
  body: { fontSize: 9.5, lineHeight: 1.5, textAlign: "justify", marginBottom: 6 },
  bold: { fontFamily: "Montserrat", fontWeight: 700 },
  row: { flexDirection: "row", borderBottom: `0.5 solid ${LINE}` },
  lab: { width: "36%", fontSize: 9, fontFamily: "Montserrat", fontWeight: 700, padding: "4 6", backgroundColor: "#FAFAF8" },
  cell: { width: "64%", fontSize: 9, padding: "4 6" },
  footer: { position: "absolute", bottom: "10mm", left: "16mm", right: "16mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 4, flexDirection: "row", justifyContent: "space-between" },
  foot: { fontSize: 7, color: MUTED },
  sigRow: { flexDirection: "row", marginTop: 20 },
  sigBox: { flex: 1, border: `0.8 solid ${LINE}`, padding: 12, minHeight: 80, marginHorizontal: 4, alignItems: "center" },
});

const eur = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR").replace(/\s/g, "\u00A0")} \u20ac`;
const fd = (d: string) => d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "\u2014";

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.foot}>Casa Cara\u00efbes SARL \u2014 CPI 97212024000000007 \u2014 Mandat de location \u2014 Confidentiel</Text>
      <Text style={s.foot} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber}/${totalPages}`} />
    </View>
  );
}
function SH({ n, t }: { n: number; t: string }) {
  return (<><Text style={s.sec}>{n}.  {t}</Text><View style={s.secLine} /></>);
}
function KV({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return <View style={s.row}><Text style={s.lab}>{k}</Text><Text style={s.cell}>{v}</Text></View>;
}

export function MandatLocationPDF({ f }: { f: MandatLocation }) {
  const { honoraires, dateFin } = calcMandatLocation(f);
  const m = f.mandants[0];
  const mandantLabel = m ? `${m.civilite} ${m.prenom} ${m.nom}`.trim() : "\u2014";

  return (
    <Document>
      <Page size="A4" style={s.cover}>
        <Image src={logo} style={s.logo} />
        <View style={s.hair} />
        <Text style={s.kicker}>CASA CARA\u00cfBES \u2014 AGENCE IMMOBILI\u00c8RE</Text>
        <Text style={s.title}>MANDAT DE LOCATION</Text>
        <Text style={s.sub}>{f.typeMandat} \u2014 {f.mission}</Text>
        <Text style={s.sub}>{f.regimeLocatif}</Text>
        {(f.adresseBien || f.commune) && (
          <Text style={s.sub}>{[f.adresseBien, `${f.codePostal} ${f.commune}`].filter(Boolean).join(", ")}</Text>
        )}
        <View style={s.parties}>
          <View style={s.partie}>
            <Text style={s.lbl}>MANDANT</Text>
            <Text style={s.val}>{mandantLabel || "\u2014"}</Text>
            {!!m?.ville && <Text style={s.muted}>{m.ville}</Text>}
          </View>
          <View style={s.partieR}>
            <Text style={s.lbl}>MANDATAIRE</Text>
            <Text style={s.val}>Casa Cara\u00efbes SARL</Text>
            <Text style={s.muted}>CPI 97212024000000007</Text>
          </View>
        </View>
        <Text style={s.date}>Document \u00e9tabli le {fd(f.date)}{f.numero ? ` \u00b7 N\u00b0 ${f.numero}` : ""}</Text>
      </Page>

      <Page size="A4" style={s.page}>
        <SH n={1} t="OBJET DU MANDAT" />
        <Text style={s.body}>
          Le pr\u00e9sent mandat est conf\u00e9r\u00e9 par le Mandant \u00e0 Casa Cara\u00efbes SARL, titulaire de la carte professionnelle n\u00b0 CPI 97212024000000007 (mention Transaction et Gestion),
          RCS Fort-de-France 928 647 981, si\u00e8ge Impasse des Capucines, 97232 Le Lamentin, \u00e0 l'effet de {f.mission.toLowerCase()} pour le bien d\u00e9sign\u00e9 ci-apr\u00e8s,
          sous le r\u00e9gime : {f.regimeLocatif}.
        </Text>

        <SH n={2} t="D\u00c9SIGNATION DU BIEN" />
        <KV k="Adresse" v={[f.adresseBien, `${f.codePostal} ${f.commune}`].filter(Boolean).join(", ")} />
        <KV k="Nature" v={f.typeBien} />
        {f.surfaceHabitable > 0 && <KV k="Surface habitable" v={`${String(f.surfaceHabitable).replace(".", ",")} m\u00b2`} />}
        {!!f.nbPieces && <KV k="Composition" v={f.nbPieces} />}
        {!!f.refCadastrale && <KV k="R\u00e9f. cadastrale" v={f.refCadastrale} />}
        {f.enCopropriete && <KV k="Copropri\u00e9t\u00e9 / syndic" v={f.syndic || "Oui"} />}
        {!!f.descriptionBien && <Text style={s.body}>{f.descriptionBien}</Text>}

        <SH n={3} t="TYPE ET DUR\u00c9E" />
        <Text style={s.body}>
          Mandat <Text style={s.bold}>{f.typeMandat}</Text>, conclu pour une dur\u00e9e de <Text style={s.bold}>{f.dureeMois} mois</Text>
          {f.dateDebut ? ` \u00e0 compter du ${fd(f.dateDebut)}` : ""}
          {dateFin ? ` (\u00e9ch\u00e9ance indicative : ${dateFin})` : ""}.
          {f.typeMandat === "Exclusif"
            ? " Pass\u00e9 un d\u00e9lai de trois mois, le mandat exclusif peut \u00eatre d\u00e9nonc\u00e9 \u00e0 tout moment par lettre recommand\u00e9e avec avis de r\u00e9ception, moyennant un pr\u00e9avis de quinze jours."
            : " Le Mandant conserve la facult\u00e9 de rechercher un locataire par ses propres moyens, sous r\u00e9serve d'en informer le Mandataire."}
        </Text>

        <SH n={4} t="CONDITIONS FINANCI\u00c8RES" />
        <KV k="Loyer souhait\u00e9 HC" v={f.loyerSouhaite > 0 ? `${eur(f.loyerSouhaite)} / mois` : undefined} />
        {f.chargesMensuelles > 0 && <KV k="Charges" v={`${eur(f.chargesMensuelles)} / mois`} />}
        <KV k="Honoraires agence" v={honoraires > 0 ? `${eur(honoraires)} TTC (charge : ${f.chargeHonoraires})` : undefined} />
        <Text style={s.body}>
          Les honoraires de l'agence sont fix\u00e9s conform\u00e9ment au bar\u00e8me affich\u00e9 en vitrine et sur le site de l'agence.
          Ils deviennent exigibles d\u00e8s la signature du bail par un locataire pr\u00e9sent\u00e9 par le Mandataire ou, en cas de mandat exclusif,
          par tout locataire trouv\u00e9 pendant la dur\u00e9e du mandat.
        </Text>

        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <SH n={5} t="MISSIONS DU MANDATAIRE" />
        <Text style={s.body}>
          Le Mandataire est charg\u00e9 de : diffuser l'annonce du bien (portails, r\u00e9seaux, {f.avecPanneau ? "panneau sur place, " : ""}inter-agence le cas \u00e9ch\u00e9ant) ;
          s\u00e9lectionner les candidats ; organiser les visites
          {f.avecVisitesAutonomes ? " (y compris en l'absence du Mandant avec accord pr\u00e9alable)" : ""} ;
          recueillir les dossiers et v\u00e9rifier la solvabilit\u00e9 ; n\u00e9gocier les conditions du bail ;
          {f.mission !== "Recherche de locataire" ? " assurer la gestion locative courante (loyers, \u00e9tats des lieux, suivi locataire) ;" : ""}
          {" "}r\u00e9diger le projet de bail conforme \u00e0 la r\u00e9glementation applicable.
        </Text>

        <SH n={6} t="OBLIGATIONS DU MANDANT" />
        <Text style={s.body}>
          Le Mandant s'engage \u00e0 fournir tous les documents n\u00e9cessaires (diagnostics obligatoires, r\u00e8glement de copropri\u00e9t\u00e9 le cas \u00e9ch\u00e9ant,
          attestation d'assurance PNO), \u00e0 garantir la jouissance paisible du bien, et \u00e0 ne pas conclure de bail
          {f.typeMandat === "Exclusif" ? " avec un tiers pendant la dur\u00e9e du mandat exclusif sans l'entremise du Mandataire" : " sans en informer le Mandataire lorsque le candidat a \u00e9t\u00e9 pr\u00e9sent\u00e9 par l'agence"}.
        </Text>

        <SH n={7} t="R\u00c9TRACTATION" />
        <Text style={s.body}>
          Lorsque le mandat est conclu hors \u00e9tablissement, le Mandant dispose d'un d\u00e9lai de quatorze jours pour exercer son droit de r\u00e9tractation
          (art. L.221-18 du Code de la consommation), par lettre recommand\u00e9e avec avis de r\u00e9ception.
        </Text>

        {!!f.observations && (<><SH n={8} t="OBSERVATIONS" /><Text style={s.body}>{f.observations}</Text></>)}

        <SH n={9} t="SIGNATURES" />
        <Text style={s.body}>
          Fait \u00e0 {f.lieu}, le {fd(f.date)}, en deux exemplaires originaux.
        </Text>
        <View style={s.sigRow}>
          <View style={s.sigBox}>
            <Text style={s.lbl}>LE MANDANT</Text>
            <Text style={s.val}>{mandantLabel}</Text>
            <Text style={s.muted}>Signature</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={s.lbl}>LE MANDATAIRE</Text>
            <Text style={s.val}>Casa Cara\u00efbes SARL</Text>
            <Text style={s.muted}>{f.redacteur}</Text>
            <Text style={s.muted}>Signature</Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
