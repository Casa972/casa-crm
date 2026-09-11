import { Font } from "@react-pdf/renderer";
import montserratRegular from "../assets/fonts/Montserrat-Regular.ttf?url";
import montserratBold from "../assets/fonts/Montserrat-Bold.ttf?url";
import montserratItalic from "../assets/fonts/Montserrat-Italic.ttf?url";

let registered = false;

export function ensurePdfFonts() {
  if (registered) return;
  try {
    Font.register({
      family: "Montserrat",
      fonts: [
        { src: montserratRegular },
        { src: montserratBold, fontWeight: "bold" },
        { src: montserratItalic, fontStyle: "italic" },
      ],
    });
    Font.registerHyphenationCallback((word) => [word]);
    registered = true;
  } catch (err) {
    console.error("[pdfFonts] Montserrat indisponible", err);
  }
}

ensurePdfFonts();
