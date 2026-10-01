import {
  Fraunces,
  Sora,
  Playfair_Display,
  Bricolage_Grotesque,
  Manrope,
  DM_Sans,
} from "next/font/google";

// Lettertypes voor de homepage-ontwerpen (alleen geladen op /ontwerpen/*).
const fraunces = Fraunces({ subsets: ["latin"], weight: ["600", "700"] });
const maisonSerif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});
const sora = Sora({ subsets: ["latin"], weight: ["500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"] });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"] });
const manrope = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const THEME_FONTS: Record<string, { display: string; body?: string }> = {
  maison: { display: maisonSerif.style.fontFamily, body: dmSans.style.fontFamily },
  terracotta: { display: fraunces.style.fontFamily, body: dmSans.style.fontFamily },
  nacht: { display: sora.style.fontFamily, body: dmSans.style.fontFamily },
  bistro: { display: playfair.style.fontFamily, body: dmSans.style.fontFamily },
  pop: { display: bricolage.style.fontFamily, body: dmSans.style.fontFamily },
  nordic: { display: manrope.style.fontFamily, body: manrope.style.fontFamily },
};
