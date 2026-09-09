import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";
import { getWeekDates, getISOWeekNumber } from "@/lib/week";

// Bedoeld om 1x per dag aangeroepen te worden door een externe cron-dienst
// (bv. cron-job.org), met header: Authorization: Bearer <CRON_SECRET>.
// Idempotent: gebruikt WeekStatus.notifiedAt om te voorkomen dat dezelfde
// week twee keer gemaild wordt, ook als de cron vaker draait dan nodig.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const companies = await prisma.company.findMany({
    include: { memberships: { include: { user: true } } },
  });

  const currentWeekStart = getWeekDates(new Date())[0];
  let notifiedCompanies = 0;

  for (const company of companies) {
    if (company.autoOpenWeeks <= 0) continue;

    // De "nieuwste" week die nu binnen het automatisch-open-venster valt.
    const boundaryWeekStart = new Date(currentWeekStart);
    boundaryWeekStart.setDate(
      boundaryWeekStart.getDate() + (company.autoOpenWeeks - 1) * 7
    );

    const existing = await prisma.weekStatus.findUnique({
      where: {
        companyId_weekStart: { companyId: company.id, weekStart: boundaryWeekStart },
      },
    });

    // Al gemaild, of expliciet dichtgezet door de manager: overslaan.
    if (existing?.notifiedAt) continue;
    if (existing && !existing.isOpen) continue;

    const recipients = company.memberships
      .map((m) => m.user.email)
      .filter((e): e is string => Boolean(e));

    if (recipients.length > 0) {
      await sendEmail({
        to: recipients,
        subject: `Beschikbaarheid week ${getISOWeekNumber(boundaryWeekStart)} staat open — ${company.name}`,
        html: emailLayout(
          `Nieuwe week open bij ${company.name}`,
          `<p>Je kunt nu je beschikbaarheid doorgeven voor week ${getISOWeekNumber(
            boundaryWeekStart
          )} (${boundaryWeekStart.toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
          })}).</p>`
        ),
      });
    }

    await prisma.weekStatus.upsert({
      where: {
        companyId_weekStart: { companyId: company.id, weekStart: boundaryWeekStart },
      },
      update: { notifiedAt: new Date(), isOpen: true },
      create: {
        companyId: company.id,
        weekStart: boundaryWeekStart,
        isOpen: true,
        notifiedAt: new Date(),
      },
    });

    notifiedCompanies += 1;
  }

  return NextResponse.json({ ok: true, notifiedCompanies });
}
