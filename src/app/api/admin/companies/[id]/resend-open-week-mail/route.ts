import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { boundaryWeekFor, sendOpenWeekMail } from "@/lib/open-week-mail";

// Platformbeheer: de "week staat open"-mail voor één zaak opnieuw versturen,
// bijvoorbeeld als de dagelijkse taak hem niet heeft laten aankomen.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: { memberships: { include: { user: true } } },
  });
  if (!company) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  if (company.autoOpenWeeks <= 0) {
    return NextResponse.json({ error: "Deze zaak opent weken niet automatisch" }, { status: 400 });
  }

  const weekStart = boundaryWeekFor(company.autoOpenWeeks);
  const { sent, problems } = await sendOpenWeekMail(company, weekStart);
  if (sent === 0) {
    return NextResponse.json(
      { error: problems.length > 0 ? problems.join("; ") : "Geen ontvangers met een e-mailadres" },
      { status: 502 }
    );
  }

  await prisma.weekStatus.upsert({
    where: { companyId_weekStart: { companyId: company.id, weekStart } },
    update: { notifiedAt: new Date(), isOpen: true },
    create: { companyId: company.id, weekStart, isOpen: true, notifiedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    recipients: company.memberships.filter((m) => m.user.email).length,
    weekStart,
    problems,
  });
}
