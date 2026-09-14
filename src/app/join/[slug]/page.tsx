import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <JoinLanding slug={params.slug} companyName={company.name} />;
  }

  const alreadyMember = session.user.memberships.some(
    (m) => m.companyId === company.id
  );
  if (alreadyMember) {
    redirect("/dashboard");
  }

  return (
    <JoinConfirm
      slug={params.slug}
      companyName={company.name}
      suggestedName={session.user.name ?? ""}
    />
  );
}
