import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams?.token;

  if (!token) {
    return (
      <Message
        title="Ongeldige link"
        body="Er ontbreekt een verificatiecode in deze link."
      />
    );
  }

  const verification = await prisma.verificationToken.findUnique({ where: { token } });

  if (!verification || verification.expires < new Date()) {
    return (
      <Message
        title="Link verlopen"
        body="Deze bevestigingslink is niet meer geldig. Log in en vraag een nieuwe aan."
        showSignIn
      />
    );
  }

  const user = await prisma.user.findUnique({ where: { email: verification.identifier } });
  if (!user) {
    return (
      <Message
        title="Account niet gevonden"
        body="Bij dit e-mailadres hoort geen account (meer)."
      />
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier: verification.identifier } }),
  ]);

  return (
    <Message
      title="E-mailadres bevestigd"
      body="Je account is geactiveerd. Je kunt nu inloggen."
      showSignIn
    />
  );
}

function Message({
  title,
  body,
  showSignIn = false,
}: {
  title: string;
  body: string;
  showSignIn?: boolean;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="font-display text-2xl text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink/60">{body}</p>
        {showSignIn && (
          <Link
            href="/signin"
            className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-awning transition-colors"
          >
            Inloggen
          </Link>
        )}
      </div>
    </main>
  );
}
