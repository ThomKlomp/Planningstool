import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DemoCompanyReset from "./demo-company-reset";

export default async function DemoCompanyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Demo-zaak</h1>
      <p className="mt-1 text-sm text-ink/60">
        Eén vaste, goed gevulde showcase-zaak om aan klanten te laten zien.
        Pas 'm gerust aan tijdens een demo, en zet 'm daarna met de knop
        hieronder terug naar de oorspronkelijke staat voor de volgende klant.
      </p>

      <div className="mt-8">
        <DemoCompanyReset />
      </div>
    </div>
  );
}
