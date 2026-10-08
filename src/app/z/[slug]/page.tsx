import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignInForm from "@/app/signin/signin-form";

// Eigen inloglink per zaak (shiftje.nl/z/<slug>): medewerkers slaan deze op
// als bladwijzer en komen zo direct bij de inlogpagina van hun zaak, zonder
// omweg via de homepage. Niet indexeren.
//
// De paginatitel is "<Zaaknaam> - Shiftje": zo onthoudt de browser de pagina
// onder de naam van de zaak, en komt die bij het intypen van "shiftje" in de
// adresbalk als eerste suggestie naar voren.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  return {
    title: { absolute: company ? `${company.name} - Shiftje` : "Shiftje" },
    robots: { index: false, follow: false },
  };
}

export default async function CompanyLoginPage({ params }: { params: { slug: string } }) {
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    select: { name: true, slug: true },
  });

  if (!company) {
    return (
      <main className="auth-backdrop flex min-h-screen items-center justify-center px-6 text-center">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8">
          <h1 className="font-display text-2xl">Deze link is niet geldig</h1>
          <p className="mt-2 text-ink/60">
            Vraag je werkgever om de meest recente link te delen.
          </p>
        </div>
      </main>
    );
  }

  // Al ingelogd: gewoon door naar het dashboard (zie ook de uitleg in /signin
  // over het koppelen van een tweede Google-account aan een bestaande sessie).
  const session = await getServerSession(authOptions).catch(() => null);
  if (session?.user) {
    redirect("/dashboard");
  }

  return <SignInForm companyName={company.name} joinSlug={company.slug} />;
}
