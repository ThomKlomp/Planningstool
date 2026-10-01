import { Fraunces, DM_Sans, IBM_Plex_Mono } from "next/font/google";

// Lettertypes van het ontwerp "Maison" (homepage): een klassieke serif voor
// de koppen, een rustig schreefloos lettertype voor de tekst en een
// typemachine-achtig lettertype voor het prijsbonnetje.
const serif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});
const sans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const MAISON_FONTS = {
  display: serif.style.fontFamily,
  body: sans.style.fontFamily,
  mono: mono.style.fontFamily,
};
