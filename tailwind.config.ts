import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Airbnb-style palette: Rausch (brand red-pink) as the one accent,
        // everything else a black/white/gray neutral scale. The neutral
        // tokens below are backed by CSS variables (see globals.css) so
        // they flip for dark mode without touching every component.
        warmth: {
          50: "rgb(var(--color-brand-tint) / <alpha-value>)",
          100: "rgb(var(--color-brand-tint) / <alpha-value>)",
          300: "#FF7086",
          400: "#FF5A6E",
          500: "#FF385C",
          600: "#E31C5F",
          700: "rgb(var(--color-brand-strong) / <alpha-value>)",
        },
        dusk: {
          50: "rgb(var(--color-ink-muted) / <alpha-value>)",
          100: "rgb(var(--color-border) / <alpha-value>)",
          400: "rgb(var(--color-ink-muted) / <alpha-value>)",
          700: "rgb(var(--color-ink-secondary) / <alpha-value>)",
          800: "rgb(var(--color-ink) / <alpha-value>)",
          900: "rgb(var(--color-ink) / <alpha-value>)",
        },
        linen: {
          50: "rgb(var(--color-bg) / <alpha-value>)",
          100: "rgb(var(--color-surface) / <alpha-value>)",
          200: "rgb(var(--color-border) / <alpha-value>)",
        },
        card: "rgb(var(--color-card) / <alpha-value>)",
        sage: {
          300: "#4DBDB3",
          400: "#00A699",
          500: "#00897E",
          600: "#00726A",
        },
        clay: {
          200: "rgb(var(--color-surface-2) / <alpha-value>)",
          300: "rgb(var(--color-border) / <alpha-value>)",
          400: "rgb(var(--color-ink-muted) / <alpha-value>)",
        },
        gold: {
          400: "#FFC933",
          500: "#F5A623",
        },
      },
      fontFamily: {
        // No separate display face — headings use Inter Semibold (see the
        // .font-display weight override in globals.css) rather than a serif.
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Single card radius across the app — both tokens kept so existing
        // classNames don't need touching, but both now resolve to 12px.
        xl2: "12px",
        xl3: "12px",
      },
      boxShadow: {
        warm: "0 6px 20px -6px rgba(0, 0, 0, 0.18)",
        "warm-sm": "0 2px 8px -2px rgba(0, 0, 0, 0.16)",
        float: "0 -2px 16px -2px rgba(0, 0, 0, 0.12)",
      },
      maxWidth: {
        app: "430px",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232,115,74,0.35)" },
          "50%": { boxShadow: "0 0 0 10px rgba(232,115,74,0)" },
        },
        pulseSage: {
          "0%, 100%": {
            boxShadow: "0 0 0 2px rgb(var(--color-bg)), 0 0 0 2px rgba(0,166,153,0.45)",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 0 2px rgb(var(--color-bg)), 0 0 0 7px rgba(0,166,153,0)",
            transform: "scale(1.08)",
          },
        },
        giftPop: {
          "0%": { transform: "scale(0.5) translateY(24px)", opacity: "0" },
          "20%": { transform: "scale(1.08) translateY(0)", opacity: "1" },
          "30%": { transform: "scale(1)" },
          "85%": { transform: "scale(1) translateY(0)", opacity: "1" },
          "100%": { transform: "scale(0.9) translateY(-16px)", opacity: "0" },
        },
        approach: {
          "0%": { transform: "translateX(-6px)", opacity: "0.4" },
          "50%": { transform: "translateX(0px)", opacity: "1" },
          "100%": { transform: "translateX(-6px)", opacity: "0.4" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2.2s ease-in-out infinite",
        pulseSage: "pulseSage 2.4s ease-in-out infinite",
        approach: "approach 1.8s ease-in-out infinite",
        giftPop: "giftPop 3.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
