import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Bien } from "../types/domain";
import type { FicheCommerciale } from "../schemas/ficheCommerciale.schema";


const P = "#1A3A52";
const PSFT = "#EBF1F6";
const G = "#2D7A5F";
const GSFT = "#EAF5F0";
const LINE = "#E4E4E0";
const INK = "#1A1A18";
const SUB = "#6B6B67";
const MUT = "#9B9B97";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: INK, backgroundColor: "#fff" },

  /* ── Bandeau top ── */
  topBand: { backgroundColor: P, padding: "10 15 8", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  agence: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: 1 },
  agenceSub: { fontSize: 7.5, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  refBadge: { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 4, padding: "3 8" },
  refTxt: { fontSize: 8, color: "#fff", fontFamily: "Helvetica-Bold" },

  /* ── Photo principale ── */
  mainPhoto: { width: "100%", height: 210, objectFit: "cover" },
  noPhoto: { width: "100%", height: 210, backgroundColor: PSFT, alignItems: "center", justifyContent: "center" },
  noPhotoTxt: { fontSize: 11, color: P, fontFamily: "Helvetica-Bold" },

  /* ── Titre & Prix ── */
  headerBox: { backgroundColor: P, padding: "10 15" },
  titre: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#fff", marginBottom: 3 },
  sousTitre: { fontSize: 9, color: "rgba(255,255,255,0.8)" },
  prixBox: { position: "absolute", right: 15, top: 10, backgroundColor: G, borderRadius: 5, padding: "5 12" },
  prixTxt: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#fff" },
  prixSub: { fontSize: 7.5, color: "rgba(255,255,255,0.85)", textAlign: "center" },

  /* ── Body ── */
  body: { padding: "12 15" },

  /* ── Caractéristiques ── */
  caraGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  caraItem: { backgroundColor: PSFT, borderRadius: 5, padding: "5 10", alignItems: "center", minWidth: 70 },
  caraVal: { fontSize: 12, fontFamily: "Helvetica-Bold", color: P },
  caraLbl: { fontSize: 6.5, color: SUB, textTransform: "uppercase", marginTop: 1 },

  /* ── Section ── */
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: P, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `1 solid ${LINE}`, paddingBottom: 4, marginBottom: 7, marginTop: 10 },

  /* ── Description ── */
  desc: { fontSize: 8.5, color: INK, lineHeight: 1.6 },

  /* ── Points forts ── */
  pointsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  point: { backgroundColor: GSFT, borderRadius: 4, padding: "3.5 8", flexDirection: "row", alignItems: "center", gap: 3 },
  pointDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: G },
  pointTxt: { fontSize: 7.5, color: G, fontFamily: "Helvetica-Bold" },

  /* ── Galerie ── */
  gallery: { flexDirection: "row", gap: 5 },
  galleryImg: { flex: 1, height: 72, objectFit: "cover", borderRadius: 4 },

  /* ── Infos pratiques ── */
  infoGrid: { flexDirection: "row", gap: 8 },
  infoCol: { flex: 1, border: `0.5 solid ${LINE}`, borderRadius: 5, padding: "7 9" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: `0.3 solid ${LINE}` },
  infoLbl: { fontSize: 7.5, color: SUB },
  infoVal: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: INK },

  /* ── DPE badge ── */
  dpeBadge: { backgroundColor: "#F3F3F0", borderRadius: 4, padding: "4 8", alignItems: "center" },
  dpeVal: { fontSize: 16, fontFamily: "Helvetica-Bold", color: P },
  dpeLbl: { fontSize: 6.5, color: MUT, textTransform: "uppercase" },

  /* ── Contact ── */
  contactBox: { backgroundColor: P, borderRadius: 6, padding: "9 12", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  contactLeft: { flex: 1 },
  contactName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#fff", marginBottom: 2 },
  contactInfo: { fontSize: 8, color: "rgba(255,255,255,0.8)" },
  contactAgence: { fontSize: 7.5, color: "rgba(255,255,255,0.6)", marginTop: 2 },

  /* ── Disclaimer ── */
  disclaimer: { fontSize: 6.5, color: MUT, textAlign: "center", marginTop: 8, lineHeight: 1.4 },
});

const E = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR")} €`;

export function FicheCommercialePDF({ bien, fiche }: { bien: Bien; fiche: FicheCommerciale }) {
  const titre = fiche.titreFiche || `${bien.type} – ${bien.commune}`;
  const sousTitre = [bien.adresse, bien.commune, "Martinique"].filter(Boolean).join(" · ");
  const caras = [
    bien.surface > 0 && { val: `${bien.surface} m²`, lbl: "Surface" },
    bien.chambres > 0 && { val: String(bien.chambres), lbl: bien.chambres > 1 ? "Chambres" : "Chambre" },
    fiche.exposition && { val: fiche.exposition, lbl: "Exposition" },
    fiche.vue && { val: fiche.vue, lbl: "Vue" },
    fiche.anneeConstruction && { val: fiche.anneeConstruction, lbl: "Construction" },
    fiche.chauffage && { val: fiche.chauffage, lbl: "Chauffage" },
  ].filter(Boolean) as { val: string; lbl: string }[];

  const infosCol1 = [
    fiche.taxeFonciere > 0 && ["Taxe foncière", `${E(fiche.taxeFonciere)}/an`],
    fiche.chargesCopro > 0 && ["Charges copro", `${E(fiche.chargesCopro)}/trim.`],
    bien.statut && ["Statut", bien.statut],
    bien.cat && ["Catégorie", bien.cat === "vente" ? "Vente" : "Location"],
  ].filter(Boolean) as [string, string][];

  const infosCol2 = [
    bien.ref && ["Référence", bien.ref],
    fiche.dpe && ["Classe DPE", fiche.dpe],
    fiche.ges && ["GES", fiche.ges],
  ].filter(Boolean) as [string, string][];

  const galleryPhotos = fiche.photos.slice(0, 3);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Bandeau agence */}
        <View style={s.topBand}>
          <View>
            <Text style={s.agence}>CASA CARAÏBES</Text>
            <Text style={s.agenceSub}>Agence immobilière · Martinique · casacaraibes.com</Text>
          </View>
          {bien.ref && (
            <View style={s.refBadge}>
              <Text style={s.refTxt}>Réf. {bien.ref}</Text>
            </View>
          )}
        </View>

        {/* Photo principale */}
        {fiche.photoPrincipale ? (
          <Image src={fiche.photoPrincipale} style={s.mainPhoto} />
        ) : (
          <View style={s.noPhoto}>
            <Text style={s.noPhotoTxt}>CASA CARAÏBES</Text>
          </View>
        )}

        {/* Titre & Prix */}
        <View style={s.headerBox}>
          <Text style={s.titre}>{titre}</Text>
          <Text style={s.sousTitre}>{sousTitre}</Text>
          {bien.prix > 0 && (
            <View style={s.prixBox}>
              <Text style={s.prixTxt}>{E(bien.prix)}</Text>
              <Text style={s.prixSub}>{bien.cat === "location" ? "/mois · CC" : "FAI"}</Text>
            </View>
          )}
        </View>

        <View style={s.body}>
          {/* Caractéristiques */}
          {caras.length > 0 && (
            <View style={s.caraGrid}>
              {caras.map((c, i) => (
                <View key={i} style={s.caraItem}>
                  <Text style={s.caraVal}>{c.val}</Text>
                  <Text style={s.caraLbl}>{c.lbl}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {fiche.descriptionCommerciale && (
            <>
              <Text style={s.sectionTitle}>Description</Text>
              <Text style={s.desc}>{fiche.descriptionCommerciale}</Text>
            </>
          )}

          {/* Points forts */}
          {fiche.pointsForts.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Points forts</Text>
              <View style={s.pointsGrid}>
                {fiche.pointsForts.map((p: string, i: number) => (
                  <View key={i} style={s.point}>
                    <View style={s.pointDot} />
                    <Text style={s.pointTxt}>{p}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Galerie */}
          {galleryPhotos.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Photos</Text>
              <View style={s.gallery}>
                {galleryPhotos.map((photo: string, i: number) => (
                  <Image key={i} src={photo} style={s.galleryImg} />
                ))}
              </View>
            </>
          )}

          {/* Infos pratiques */}
          {(infosCol1.length > 0 || infosCol2.length > 0) && (
            <>
              <Text style={s.sectionTitle}>Informations pratiques</Text>
              <View style={s.infoGrid}>
                {infosCol1.length > 0 && (
                  <View style={s.infoCol}>
                    {infosCol1.map(([l, v], i) => (
                      <View key={i} style={[s.infoRow, i === infosCol1.length - 1 ? { borderBottom: 0 } : {}]}>
                        <Text style={s.infoLbl}>{l}</Text>
                        <Text style={s.infoVal}>{v}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {infosCol2.length > 0 && (
                  <View style={s.infoCol}>
                    {infosCol2.map(([l, v], i) => (
                      <View key={i} style={[s.infoRow, i === infosCol2.length - 1 ? { borderBottom: 0 } : {}]}>
                        <Text style={s.infoLbl}>{l}</Text>
                        <Text style={s.infoVal}>{v}</Text>
                      </View>
                    ))}
                    {(fiche.dpe || fiche.ges) && (
                      <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                        {fiche.dpe && <View style={s.dpeBadge}><Text style={s.dpeVal}>{fiche.dpe}</Text><Text style={s.dpeLbl}>DPE</Text></View>}
                        {fiche.ges && <View style={s.dpeBadge}><Text style={s.dpeVal}>{fiche.ges}</Text><Text style={s.dpeLbl}>GES</Text></View>}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </>
          )}

          {/* Contact */}
          <View style={s.contactBox}>
            <View style={s.contactLeft}>
              <Text style={s.contactName}>{fiche.contactNom}</Text>
              <Text style={s.contactInfo}>{fiche.contactTel} · {fiche.contactEmail}</Text>
              <Text style={s.contactAgence}>CASA CARAÏBES · RCS Fort-de-France 928 647 981 · CPI 97212024000000007</Text>
            </View>
          </View>

          <Text style={s.disclaimer}>
            Les informations contenues dans ce document sont données à titre indicatif et ne constituent pas un engagement contractuel. Prix exprimé en valeur FAI (Frais d'Agence Inclus). Document établi par Casa Caraïbes SARL — Martinique.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
