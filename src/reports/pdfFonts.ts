import { Font } from "@react-pdf/renderer";
import montserratRegular from "../assets/fonts/Montserrat-Regular.ttf";
import montserratBold from "../assets/fonts/Montserrat-Bold.ttf";
import montserratItalic from "../assets/fonts/Montserrat-Italic.ttf";

let registered = false;

export function ensurePdfFonts() {
  if (registered) return;
  Font.register({
    family: "Montserrat",
    fonts: [
      { src: montserratRegular, fontWeight: 400 },
      { src: montserratBold, fontWeight: 700 },
      { src: montserratItalic, fontStyle: "italic" },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

ensurePdfFonts();
