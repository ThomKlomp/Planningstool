import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Ontwerp "Terras groen": diepgroene inkt, bijna-witte pagina in de
        // app (achter de login), lichtgroen "sage" voor de openbare pagina's,
        // terracotta als merkkleur voor de belangrijkste acties.
        ink: "#1E3326",
        paper: "#FBFDF9",
        sage: {
          DEFAULT: "#EEF1E4",
          dark: "#E2E7D6",
        },
        terra: {
          DEFAULT: "#B8542F",
          dark: "#8F3F20",
        },
        sand: "#F3D9B1",
        mist: "#EDF2E7",
        amber: {
          DEFAULT: "#E8A33D",
          dark: "#9A5F10",
        },
        awning: "#2F7D4F",
        line: "#E6EDDC",
      },
      borderRadius: {
        lg: "0.875rem",
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2.25rem",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-figtree)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
