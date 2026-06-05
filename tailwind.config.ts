import type { Config } from "tailwindcss";
import { tokens } from "./src/lib/tokens";

/**
 * Tokens "Quiet Luxury" exposés en classes Tailwind natives
 * (bg-surface, text-primary, border-line…). Aucune chaîne CSS globale.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: tokens.color.bg,
        surface: tokens.color.surface,
        line: tokens.color.border,
        line2: tokens.color.border2,
        ink: tokens.color.text,
        "ink-sub": tokens.color.textSub,
        "ink-muted": tokens.color.textMuted,
        primary: {
          DEFAULT: tokens.color.primary,
          hover: tokens.color.primaryHover,
          soft: tokens.color.primarySoft,
        },
        emerald: {
          DEFAULT: tokens.color.emerald,
          soft: tokens.color.emeraldSoft,
        },
        amber: { DEFAULT: tokens.color.amber, soft: tokens.color.amberSoft },
        danger: { DEFAULT: tokens.color.danger, soft: tokens.color.dangerSoft },
        violet: { DEFAULT: tokens.color.violet, soft: tokens.color.violetSoft },
      },
      fontFamily: {
        heading: ["Montserrat", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: tokens.radius.md,
        lg: tokens.radius.lg,
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,26,24,.04)",
        "card-hover": "0 4px 20px rgba(26,26,24,.08)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "fade-in": "fade-in .2s ease both" },
    },
  },
  plugins: [],
} satisfies Config;
