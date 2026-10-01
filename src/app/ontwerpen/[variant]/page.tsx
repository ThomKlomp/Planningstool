import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import HomeView from "@/components/marketing/home-view";
import HomeViewMaison from "@/components/marketing/home-view-maison";
import { CLASSIC_THEME, THEMES } from "@/lib/home-themes";
import { THEME_FONTS } from "../fonts";

export const metadata: Metadata = {
  title: "Homepage-ontwerp",
  robots: { index: false, follow: false },
};

const ALL = [...THEMES, CLASSIC_THEME];

export function generateStaticParams() {
  return ALL.map((t) => ({ variant: t.id }));
}

export default function VariantPage({ params }: { params: { variant: string } }) {
  const theme = ALL.find((t) => t.id === params.variant);
  if (!theme) notFound();
  const fonts = THEME_FONTS[theme.id];

  return (
    <>
      {theme.id === "maison" ? (
        <HomeViewMaison fontDisplay={fonts?.display} fontBody={fonts?.body} fontMono={fonts?.mono} />
      ) : (
        <HomeView theme={{ ...theme, fontDisplay: fonts?.display, fontBody: fonts?.body }} />
      )}
      <nav
        aria-label="Ontwerpen"
        className="fixed bottom-4 left-4 z-50 flex max-w-[calc(100vw-6rem)] flex-wrap items-center gap-1 rounded-2xl bg-black/85 p-1.5 text-xs text-white shadow-lg backdrop-blur"
      >
        <Link href="/ontwerpen" className="rounded-xl px-3 py-1.5 hover:bg-white/15">
          Alle ontwerpen
        </Link>
        {ALL.map((t) => (
          <Link
            key={t.id}
            href={`/ontwerpen/${t.id}`}
            className={`rounded-xl px-3 py-1.5 ${t.id === theme.id ? "bg-white text-black" : "hover:bg-white/15"}`}
          >
            {t.name}
          </Link>
        ))}
      </nav>
    </>
  );
}
