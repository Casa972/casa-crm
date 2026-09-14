import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "./pdfFonts";
import logoSrc from "../assets/logo.png";
import type { MandatVenteFull, Mandant } from "../schemas/redacteur/mandatVenteFull.schema";
import { calcMandatVente, isCopro, isTerrain, isFonds, needsDPE } from "../schemas/redacteur/mandatVenteFull.schema";

const P   = "#1A3A52";
const LINE = "#E4E4E0";
const INK  = "#1A1A18";
const SUB  = "#6B6B67";
const BF   = "Montserrat";
const MED  = "Montserrat";

const s = StyleSheet.create({
  page: { fontFamily: "Montserrat", fontSize: 9.5, color: INK, padding: "20mm 18mm 16mm" },
  logoBox: { alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: `1 solid ${LINE}` },
  docTitre: { fontSize: 20, fontFamily: MED, fontWeight: 700, color: INK, textAlign: "center", marginBottom: 3 },
  docNum:   { fontSize: 11, fontFamily: BF,  fontWeight: 700, color: P,   textAlign: "center", marginBottom: 2 },
  docLieu:  { fontSize: 9,  color: SUB, textAlign: "center", fontStyle: "italic", marginBottom: 14 },
  divider:  { height: 1, backgroundColor: LINE, marginBottom: 14 },
  partiesHead:     { flexDirection: "row" },
  partiesHeadCell: { flex: 1, backgroundColor: P, padding: "6 12", textAlign: "center" },
  partiesHeadTxt:  { color: "#fff", fontFamily: BF, fontWeight: 700, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 },
  mandantName:    { fontFamily: BF, fontWeight: 700, fontSize: 9.5, color: INK, textAlign: "center", marginBottom: 4 },
  mandantLine:    { fontSize: 9, color: SUB, textAlign: "center", fontStyle: "italic", lineHeight: 1.5 },
  mandantQualite: { color: P, fontFamily: BF, fontWeight: 700, fontSize: 8.5, textAlign: "center", marginTop: 4 },
  articleTitle: { fontSize: 10.5, fontFamily: BF, fontWeight: 700, color: P, marginTop: 14, marginBottom: 6, borderLeft: `3 solid ${P}`, paddingLeft: 8 },
  body:  { fontSize: 9.5, color: INK, lineHeight: 1.6, marginBottom: 6, textAlign: "justify" },
  bold:  { fontFamily: BF, fontWeight: 700 },
  italic: { fontStyle: "italic" },
  tableBox:     { border: `0.5 solid ${LINE}`, borderRadius: 4, marginVertical: 6 },
  tableRow:     { flexDirection: "row", borderBottom: `0.5 solid ${LINE}`, padding: "5 8" },
  tableRowLast: { flexDirection: "row", padding: "5 8" },
  tableLbl: { flex: 2, fontSize: 9, color: SUB },
  tableVal: { flex: 1, fontSize: 9.5, fontFamily: BF, fontWeight: 700, color: INK, textAlign: "right" },
  footer:    { position: "absolute", bottom: "10mm", left: "18mm", right: "18mm", borderTop: `0.5 solid ${LINE}`, paddingTop: 6 },
  footerTxt: { fontSize: 7, color: SUB, textAlign: "center" },
});

// PLACEHOLDER_REST
