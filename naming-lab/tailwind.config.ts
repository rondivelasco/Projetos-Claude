import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ─── Brand Guidelines Palette ─────────────────────────────────────────
        linen: {
          DEFAULT: "#F4F0E8",
          50:  "#FDFCF9",
          100: "#F4F0E8",
          200: "#EBE4D6",
          300: "#DDD4C0",
        },
        oak: {
          DEFAULT: "#BEA882",
          100: "#EDE5D6",
          200: "#D9C9AE",
          300: "#BEA882",
          400: "#A6916B",
          500: "#8C7855",
        },
        sand: {
          DEFAULT: "#CEBFA6",
          100: "#F0EBE3",
          200: "#DEDAD0", // ← mais claro
          300: "#CEBFA6",
          400: "#BBA98C",
        },
        forest: {
          50:  "#EAF2EB",
          100: "#C4DECA",
          200: "#94C49D",
          300: "#60A86C",
          400: "#3A8F47",
          500: "#2A7232",  // médio
          600: "#2A5231",  // ← CORE COLOR (botões, destaques)
          700: "#1F3E26",
          800: "#152A1A",
          900: "#0A160D",
          950: "#050B07",
        },
        charcoal: {
          DEFAULT: "#383834",
          50:  "#F5F4F2",
          100: "#E2E0DC",
          200: "#C6C3BC",
          300: "#A8A49B",
          400: "#8A867C",
          500: "#6C6860",
          600: "#504E48",
          700: "#383834",
          800: "#24231F",
          900: "#12110E",
        },
        // Alias "brand" → forest (mantém todas as classes brand-* existentes)
        brand: {
          50:  "#EAF2EB",
          100: "#C4DECA",
          200: "#94C49D",
          300: "#60A86C",
          400: "#3A8F47",
          500: "#2A7232",
          600: "#2A5231",
          700: "#1F3E26",
          800: "#152A1A",
          900: "#0A160D",
          950: "#050B07",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        label: "0.08em",
        wide: "0.06em",
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
