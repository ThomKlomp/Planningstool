import type { Metadata } from "next";
import HomeView from "@/components/marketing/home-view";

export const metadata: Metadata = {
  title: "Roosterprogramma voor kleine horeca",
  description:
    "Shiftje is rooster software voor kleine horeca: beschikbaarheid, personeelsplanning en uren op één plek. Eén vaste prijs per zaak tot 40 medewerkers, geen kosten per gebruiker. Begin gratis, 7 dagen.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeView />;
}
