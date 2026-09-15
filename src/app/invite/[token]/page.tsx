import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InviteLanding from "./invite-landing";
import AcceptInviteForm from "./accept-invite-form";

function roleLabel(role: string) {
  switch (role) {
    case "OWNER":
      return "eigenaar";
    case "MANAGER":
      return "manager";
    default:
      return "medewerker";
  }
}

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
        <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8">
          <h1 className="font-display text-2xl">
            Deze uitnodiging is niet meer geldig
          </h1>
          <p className="mt-2 text-ink/60">
            Vraag je manager om een nieuwe uitnodiging te sturen.
          </p>
        </div>
      </main>
    );
  }

  // Team is alleen relevant voor een medewerker-uitnodiging, en alleen als
  // er ook daadwerkelijk meerdere teams zijn om uit te kiezen.
  const departments =
    invite.role === "EMPLOYEE"
      ? await prisma.department.findMany({
          where: { companyId: invite.companyId },
          orderBy: { order: "asc" },
          select: { id: true, name: true },
        })
      : [];

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <InviteLanding
        token={params.token}
        companyName={invite.company.name}
        role={roleLabel(invite.role)}
        email={invite.email}
        departments={departments}
      />
    );
  }

  if (session.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8">
          <h1 className="font-display text-2xl">Verkeerd account</h1>
          <p className="mt-2 text-ink/60">
            Deze uitnodiging voor <span className="font-medium">{invite.company.name}</span>{" "}
            is voor {invite.email}. Log uit en probeer opnieuw met dat account.
          </p>
          <a
            href={`/api/auth/signout?callbackUrl=/invite/${params.token}`}
            className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-awning transition-colors"
          >
            Uitloggen
          </a>
        </div>
      </main>
    );
  }

  const isNewUser = session.user.memberships.length === 0;

  return (
    <AcceptInviteForm
      token={params.token}
      companyName={invite.company.name}
      role={roleLabel(invite.role)}
      askForName={isNewUser}
      suggestedName={session.user.name ?? ""}
      departments={departments}
    />
  );
}
