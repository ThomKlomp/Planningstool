import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignInForm from "./signin-form";

// Server-check vóórdat de inlogpagina rendert. Zonder deze check kun je met
// een nog geldige sessie (bv. oud tabblad, bladwijzer) op /signin
// terechtkomen en daar met een ánder Google-account inloggen; NextAuth
// probeert dat account dan te koppelen aan je huidige sessie in plaats van
// je gewoon in te loggen, en dat mislukt met "OAuthAccountNotLinked" als dat
// andere account al aan iemand anders hoort. Door hier altijd eerst door te
// sturen als er al een sessie is, kan die situatie niet meer ontstaan.
export default async function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (session?.user) {
    redirect(searchParams?.callbackUrl || "/dashboard");
  }

  return <SignInForm />;
}
