import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountSettingsForm from "./account-settings-form";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin?callbackUrl=/dashboard/account");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, passwordHash: true },
  });
  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl">Mijn account</h1>
      <p className="mt-1 text-sm text-ink/60">
        Persoonlijke instellingen, los van je zaak.
      </p>
      <div className="mt-8">
        <AccountSettingsForm
          initialName={user.name ?? ""}
          initialEmail={user.email ?? ""}
          hasPassword={Boolean(user.passwordHash)}
        />
      </div>
    </div>
  );
}
