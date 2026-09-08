import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const invite = await prisma.invite.findUnique({
    where: { token: params.token },
    include: { company: true },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
        <div>
          <h1 className="font-display text-2xl">Deze uitnodiging is niet meer geldig</h1>
          <p className="mt-2 text-ink/60">
            Vraag je manager om een nieuwe uitnodiging te sturen.
          </p>
        </div>
      </main>
    );
  }

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/signin?callbackUrl=/invite/${params.token}`);
  }

  // Voorkom dat iemand met een ander e-mailadres de uitnodiging accepteert.
  if (session.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
        <div>
          <h1 className="font-display text-2xl">Verkeerd account</h1>
          <p className="mt-2 text-ink/60">
            Deze uitnodiging is voor {invite.email}. Log uit en probeer
            opnieuw met dat account.
          </p>
        </div>
      </main>
    );
  }

  const existing = await prisma.membership.findUnique({
    where: {
      userId_companyId: { userId: session.user.id, companyId: invite.companyId },
    },
  });

  if (!existing) {
    await prisma.$transaction([
      prisma.membership.create({
        data: {
          userId: session.user.id,
          companyId: invite.companyId,
          role: invite.role,
        },
      }),
      prisma.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);
  }

  redirect("/dashboard");
}
