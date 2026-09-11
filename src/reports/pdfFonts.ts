import { Font } from "@react-pdf/renderer";

/** Les .ttf du repo étaient du HTML (Unknown font format). CDN Fontsource = vrais TTF. */
const REGULAR = "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@5.2.5/latin-400-normal.ttf";
const BOLD = "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@5.2.5/latin-700-normal.ttf";
const ITALIC = "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@5.2.5/latin-400-italic.ttf";

let registered = false;

export function ensurePdfFonts() {
  if (registered) return;
  Font.register({
    family: "Montserrat",
    fonts: [
      { src: REGULAR },
      { src: BOLD, fontWeight: "bold" },
      { src: ITALIC, fontStyle: "italic" },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

ensurePdfFonts();
