import type { Metadata } from "next";

// Geen zoekresultaat: ingelogde of token-afhankelijke pagina.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DemoSwitchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
