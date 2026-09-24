import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireAcceptedTerms } from "@/lib/auth-guards";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin?callbackUrl=/onboarding&intent=signup");
  }

  requireAcceptedTerms(session, "/onboarding");

  // Als de gebruiker al een company heeft, stuur meteen door naar het dashboard.
  if (session.user.memberships.length > 0) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8">
        <h1 className="font-display text-2xl text-ink">Jouw zaak aanmaken</h1>
        <p className="mt-2 text-sm text-ink/60">
          Dit wordt je eigen omgeving. Je kunt hierna medewerkers uitnodigen.
        </p>
        <OnboardingForm />
      </div>
    </main>
  );
}
