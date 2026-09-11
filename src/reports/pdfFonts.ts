import { Font } from "@react-pdf/renderer";
import montserratRegular from "../assets/fonts/Montserrat-Regular.ttf";
import montserratMedium from "../assets/fonts/Montserrat-Medium.ttf";
import montserratBold from "../assets/fonts/Montserrat-Bold.ttf";
import montserratItalic from "../assets/fonts/Montserrat-Italic.ttf";

let registered = false;

/** Police agence — Regular = « normal ». À importer avant tout StyleSheet PDF. */
export function ensurePdfFonts() {
  if (registered) return;
  Font.register({
    family: "Montserrat",
    fonts: [
      { src: montserratRegular, fontWeight: 400 },
      { src: montserratRegular, fontWeight: "normal" },
      { src: montserratMedium, fontWeight: 500 },
      { src: montserratBold, fontWeight: 700 },
      { src: montserratBold, fontWeight: "bold" },
      { src: montserratItalic, fontStyle: "italic", fontWeight: 400 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

ensurePdfFonts();
