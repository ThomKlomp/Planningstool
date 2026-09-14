import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B1B18",
        paper: "#FAF7F2",
        amber: {
          DEFAULT: "#E8A33D",
          dark: "#C9821F",
        },
        awning: "#3F6E5B",
        line: "#DDD5C7",
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
