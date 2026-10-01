import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Via CSS-variabelen (RGB-drietallen) zodat de homepage-ontwerpen
        // (lib/home-themes.ts) de kleuren kunnen wisselen. De standaard-
        // waarden staan in globals.css en zijn de huidige kleuren.
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        paper: "rgb(var(--c-paper) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        onaccent: "rgb(var(--c-onaccent) / <alpha-value>)",
        amber: {
          DEFAULT: "rgb(var(--c-amber) / <alpha-value>)",
          dark: "rgb(var(--c-amber-dark) / <alpha-value>)",
        },
        awning: "rgb(var(--c-awning) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
      },
      borderRadius: {
        btn: "var(--btn-radius, 9999px)",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-plex)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
