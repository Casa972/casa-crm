/**
 * Design tokens — "Quiet Luxury" (grande agence immobilière de luxe).
 * Source de vérité unique, consommée par tailwind.config.ts.
 */
export const tokens = {
  color: {
    bg: "#FAFAF8", // fond global, légèrement chaud
    surface: "#FFFFFF", // cartes
    border: "#EBEAE7",
    border2: "#E4E4E0",

    text: "#1A1A18",
    textSub: "#6B6B67",
    textMuted: "#9B9B97",

    // Accents — bleu profond + vert émeraude sourd
    primary: "#1A3A52", // bleu profond (titres, header PDF, CTA)
    primaryHover: "#244E70",
    primarySoft: "#EBF1F6",

    emerald: "#2D7A5F", // vert émeraude sourd (succès, encaissé)
    emeraldSoft: "#EAF5F0",

    amber: "#9A6D22",
    amberSoft: "#FBF4E6",

    danger: "#A03A30",
    dangerSoft: "#FBEDED",

    violet: "#5B4E8C",
    violetSoft: "#F0EEFB",
  },
  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
  },
  font: {
    // Titres : Montserrat — Données : Inter (géométrique, lisible en tableau)
    heading: "'Montserrat', system-ui, sans-serif",
    sans: "'Inter', system-ui, sans-serif",
  },
} as const;

export type Tokens = typeof tokens;
