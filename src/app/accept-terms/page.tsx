import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AcceptTermsForm from "./accept-terms-form";

export default async function AcceptTermsPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  // Al geaccepteerd (bv. iemand die de link nog een keer opent)? Meteen door.
  if (session.user.hasAcceptedTerms) {
    redirect(searchParams?.callbackUrl || "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8">
        <h1 className="font-display text-2xl text-ink">Nog één stap</h1>
        <p className="mt-2 text-sm text-ink/60">
          Voordat je verder kunt, hebben we je akkoord nodig met onze voorwaarden.
        </p>
        <AcceptTermsForm callbackUrl={searchParams?.callbackUrl || "/dashboard"} />
      </div>
    </main>
  );
}
