import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAcceptedTerms } from "@/lib/auth-guards";
import JoinLanding from "./join-landing";
import JoinConfirm from "./join-confirm";

export default async function JoinPage({
  params,
}: {
  params: { slug: string };
}) {
  const company = await prisma.company.findUnique({ where: { slug: params.slug } });

  if (!company) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8">
          <h1 className="font-display text-2xl">Deze link is niet geldig</h1>
          <p className="mt-2 text-ink/60">
            Vraag je werkgever om de meest recente link te delen.
          </p>
        </div>
      </main>
    );
  }

  // Iedereen die via deze link binnenkomt wordt medewerker, dus een
  // teamkeuze is hier altijd relevant zodra er meerdere teams zijn.
  const departments = await prisma.department.findMany({
    where: { companyId: company.id },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <JoinLanding slug={params.slug} companyName={company.name} departments={departments} />
    );
  }

  const alreadyMember = session.user.memberships.some(
    (m) => m.companyId === company.id
  );
  if (alreadyMember) {
    redirect("/dashboard");
  }

  requireAcceptedTerms(session, `/join/${params.slug}`);

  return (
    <JoinConfirm
      slug={params.slug}
      companyName={company.name}
      suggestedName={session.user.name ?? ""}
      departments={departments}
    />
  );
}
