import type { CSSProperties } from "react";

/**
 * Ontwerpvarianten van de homepage. Alle varianten tonen exact dezelfde
 * inhoud en functies (zie components/marketing/home-view.tsx); alleen kleur,
 * lettertype, vormen en indeling verschillen.
 *
 * Kleuren zijn RGB-drietallen ("27 27 24") zodat Tailwind ze met
 * doorzichtigheid kan gebruiken (text-ink/70). Ze worden als CSS-variabelen
 * op de <main> gezet en overschrijven de standaardwaarden uit globals.css.
 */
export type HomeTheme = {
  id: string;
  name: string;
  tagline: string;
  vars: Record<string, string>;
  /** Kleuren alleen voor de laptop, zodat het rooster op een lichte schermkleur blijft. */
  deviceVars?: Record<string, string>;
  /** Kleuren alleen voor de prijssectie. */
  priceVars?: Record<string, string>;
  fontDisplay?: string;
  fontBody?: string;
  btnRadius: string;
  hero: "split" | "center";
  heading: string;
  eyebrow: string;
  btn: string;
  btnGhost: string;
  quoteSection: string;
  quote: string;
  featureGrid: string;
  feature: string;
  priceSection: string;
  priceCard: string;
  /** Voorbeeldkleuren voor de kaart op de overzichtspagina. */
  swatches: string[];
};

const RGB = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

export function palette(c: {
  ink: string;
  paper: string;
  surface: string;
  accent: string;
  accentDark: string;
  secondary: string;
  line: string;
  onAccent?: string;
}): Record<string, string> {
  return {
    "--c-ink": RGB(c.ink),
    "--c-paper": RGB(c.paper),
    "--c-surface": RGB(c.surface),
    "--c-amber": RGB(c.accent),
    "--c-amber-dark": RGB(c.accentDark),
    "--c-awning": RGB(c.secondary),
    "--c-line": RGB(c.line),
    "--c-onaccent": RGB(c.onAccent ?? c.ink),
  };
}

export function themeStyle(
  vars: Record<string, string>,
  extra: { fontDisplay?: string; fontBody?: string; btnRadius?: string } = {}
): CSSProperties {
  const style: Record<string, string> = { ...vars };
  if (extra.fontDisplay) style["--font-space-grotesk"] = extra.fontDisplay;
  if (extra.fontBody) style["--font-plex"] = extra.fontBody;
  if (extra.btnRadius) style["--btn-radius"] = extra.btnRadius;
  return style as CSSProperties;
}

const listFeatures = "mt-10 divide-y divide-line";
const listFeature = "grid gap-2 py-8 md:grid-cols-[220px_1fr] md:gap-8";

/** De huidige look: precies zoals de site nu is. */
export const CLASSIC_THEME: HomeTheme = {
  id: "klassiek",
  name: "Klassiek (huidig)",
  tagline: "Warm papier, amber en groen. Zoals de site nu is.",
  vars: {},
  btnRadius: "9999px",
  hero: "split",
  heading: "",
  eyebrow: "text-awning",
  btn: "rounded-btn",
  btnGhost: "rounded-btn border border-line",
  quoteSection: "border-y border-line bg-surface",
  quote: "",
  featureGrid: listFeatures,
  feature: listFeature,
  priceSection: "border-t border-line bg-ink text-paper",
  priceCard: "rounded-2xl border border-dashed border-paper/30 bg-paper/5 p-6 md:p-8",
  swatches: ["#FAF7F2", "#E8A33D", "#3F6E5B", "#1B1B18"],
};

const terracotta = palette({
  ink: "#2B1710",
  paper: "#FFF3E3",
  surface: "#FFFFFF",
  accent: "#F4572B",
  accentDark: "#D63F16",
  secondary: "#0E7C70",
  line: "#F0D5B8",
  onAccent: "#FFFFFF",
});

const night = palette({
  ink: "#EEF1FF",
  paper: "#0C0F22",
  surface: "#141936",
  accent: "#B8FF3D",
  accentDark: "#9BE020",
  secondary: "#8C9BFF",
  line: "#2B3160",
  onAccent: "#0C0F22",
});

const bistro = palette({
  ink: "#12281F",
  paper: "#F5F0E4",
  surface: "#FBF8EF",
  accent: "#B98A38",
  accentDark: "#9A6F24",
  secondary: "#1F5C46",
  line: "#D6CCB3",
  onAccent: "#12281F",
});

const pop = palette({
  ink: "#111111",
  paper: "#FFF9E8",
  surface: "#FFFFFF",
  accent: "#FFD23F",
  accentDark: "#F5BC00",
  secondary: "#E6286E",
  line: "#111111",
});

const nordic = palette({
  ink: "#0F2740",
  paper: "#F2F7FB",
  surface: "#FFFFFF",
  accent: "#2563EB",
  accentDark: "#1D4FC4",
  secondary: "#0A9C85",
  line: "#D3E0EB",
  onAccent: "#FFFFFF",
});

/** "Shift": eigen indeling (zie components/marketing/home-view-shift.tsx). */
export const SHIFT_THEME: HomeTheme = {
  ...CLASSIC_THEME,
  id: "shift",
  name: "Shift (mijn keuze)",
  tagline:
    "Het rooster als stijl: gekleurde dienstblokjes, dikke randen, zwevende chips en een lopende band. Nieuwe indeling, niet alleen nieuwe kleuren.",
  vars: palette({
    ink: "#1F1A2E",
    paper: "#FFF8EC",
    surface: "#FFFFFF",
    accent: "#FF5A3C",
    accentDark: "#E8431F",
    secondary: "#2F7D5B",
    line: "#EADFCB",
    onAccent: "#1F1A2E",
  }),
  btnRadius: "9999px",
  swatches: ["#FFF8EC", "#FF5A3C", "#FFD66B", "#CDBFFF", "#B7E4C7", "#1F1A2E"],
};

export const THEMES: HomeTheme[] = [
  SHIFT_THEME,
  {
    id: "terracotta",
    name: "Zonnig terras",
    tagline: "Warm, gezellig en uitnodigend. Koraalrood en crème met een zachte serif-kop.",
    vars: terracotta,
    btnRadius: "9999px",
    hero: "split",
    heading: "tracking-tight",
    eyebrow: "font-medium text-awning",
    btn: "rounded-btn",
    btnGhost: "rounded-btn border-2 border-ink/80",
    quoteSection: "bg-amber text-onaccent",
    quote: "text-onaccent",
    featureGrid: "mt-10 grid gap-5 md:grid-cols-2",
    feature: "rounded-3xl border border-line bg-surface p-7",
    priceSection: "bg-ink text-paper",
    priceCard: "rounded-3xl border border-paper/20 bg-paper/5 p-6 md:p-8",
    priceVars: { "--c-paper": RGB("#FFF3E3") },
    swatches: ["#FFF3E3", "#F4572B", "#0E7C70", "#2B1710"],
  },
  {
    id: "nacht",
    name: "Nachtleven",
    tagline: "Donker en strak, met een felle limoenkleur. Past bij bars, clubs en late diensten.",
    vars: night,
    deviceVars: palette({
      ink: "#1B1B18",
      paper: "#FAF7F2",
      surface: "#FFFFFF",
      accent: "#B8FF3D",
      accentDark: "#9BE020",
      secondary: "#4B58D6",
      line: "#DDD5C7",
      onAccent: "#0C0F22",
    }),
    priceVars: { "--c-paper": RGB("#EEF1FF") },
    btnRadius: "10px",
    hero: "split",
    heading: "tracking-tight",
    eyebrow: "font-medium uppercase tracking-widest text-awning",
    btn: "rounded-btn",
    btnGhost: "rounded-btn border border-line",
    quoteSection: "border-y border-line bg-surface",
    quote: "text-amber",
    featureGrid: "mt-10 grid gap-4 md:grid-cols-3",
    feature: "rounded-xl border border-line bg-surface p-6",
    priceSection: "border-t border-line bg-surface text-paper",
    priceCard: "rounded-2xl border border-line bg-paper/5 p-6 md:p-8",
    swatches: ["#0C0F22", "#B8FF3D", "#8C9BFF", "#EEF1FF"],
  },
  {
    id: "bistro",
    name: "Brasserie",
    tagline: "Rustig en verzorgd. Diepgroen met goud, rechte hoeken en een klassieke serif.",
    vars: bistro,
    btnRadius: "2px",
    hero: "center",
    heading: "tracking-tight",
    eyebrow: "uppercase tracking-[0.2em] text-awning",
    btn: "rounded-btn",
    btnGhost: "rounded-btn border border-ink/40",
    quoteSection: "border-y-4 border-double border-line bg-surface",
    quote: "italic",
    featureGrid: "mt-12 grid gap-x-12 gap-y-2 md:grid-cols-2",
    feature: "border-t border-ink/30 py-6",
    priceSection: "bg-ink text-paper",
    priceCard: "rounded-sm border border-amber/60 bg-paper/5 p-6 md:p-8",
    priceVars: { "--c-paper": RGB("#F5F0E4") },
    swatches: ["#F5F0E4", "#B98A38", "#1F5C46", "#12281F"],
  },
  {
    id: "pop",
    name: "Pop",
    tagline: "Fel en speels. Dikke randjes, harde schaduwen en veel geel, blauw en roze.",
    vars: pop,
    btnRadius: "14px",
    hero: "split",
    heading: "font-bold tracking-tight",
    eyebrow: "inline-block -rotate-1 rounded-md border-2 border-ink bg-awning px-3 py-1 font-bold text-white",
    btn: "rounded-btn border-2 border-ink shadow-[3px_3px_0_0_#111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
    btnGhost: "rounded-btn border-2 border-ink bg-surface shadow-[3px_3px_0_0_#111]",
    quoteSection: "border-y-2 border-ink bg-awning text-white",
    quote: "font-bold",
    featureGrid: "mt-10 grid gap-5 md:grid-cols-2",
    feature: "rounded-2xl border-2 border-ink bg-surface p-6 shadow-[5px_5px_0_0_#111]",
    priceSection: "border-t-2 border-ink bg-[#3B4BFF] text-paper",
    priceCard: "rounded-2xl border-2 border-ink bg-[#2F3DE0] p-6 shadow-[6px_6px_0_0_#111] md:p-8",
    priceVars: { "--c-paper": RGB("#FFFFFF") },
    swatches: ["#FFF9E8", "#FFD23F", "#E6286E", "#3B4BFF"],
  },
  {
    id: "nordic",
    name: "Koel & helder",
    tagline: "Licht, modern en rustig. Blauw op ijswit met veel ruimte, als een nette SaaS-tool.",
    vars: nordic,
    btnRadius: "8px",
    hero: "center",
    heading: "font-semibold tracking-tight",
    eyebrow: "font-medium text-awning",
    btn: "rounded-btn",
    btnGhost: "rounded-btn border border-line bg-surface",
    quoteSection: "bg-surface",
    quote: "text-ink",
    featureGrid: "mt-10 grid gap-5 md:grid-cols-3",
    feature: "rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(15,39,64,0.06),0_8px_24px_-12px_rgba(15,39,64,0.18)]",
    priceSection: "bg-ink text-paper",
    priceCard: "rounded-2xl border border-paper/15 bg-paper/5 p-6 md:p-8",
    priceVars: { "--c-paper": RGB("#F2F7FB"), "--c-amber": RGB("#5B93FF"), "--c-amber-dark": RGB("#7DA9FF") },
    swatches: ["#F2F7FB", "#2563EB", "#0A9C85", "#0F2740"],
  },
];
