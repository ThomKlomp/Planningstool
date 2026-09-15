import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DiscountCodesManager from "./discount-codes-manager";

export default async function DiscountCodesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) {
    redirect("/dashboard");
  }

  const codes = await prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">Kortingscodes</h1>
      <p className="mt-1 text-sm text-ink/60">
        Codes die eigenaren kunnen invoeren bij Instellingen → Facturering.
      </p>

      <div className="mt-8">
        <DiscountCodesManager
          initialCodes={codes.map((c) => ({
            id: c.id,
            code: c.code,
            type: c.type,
            value: c.value,
            duration: c.duration,
            durationMonths: c.durationMonths,
            maxRedemptions: c.maxRedemptions,
            timesRedeemed: c.timesRedeemed,
            active: c.active,
            expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
          }))}
        />
      </div>
    </div>
  );
}
