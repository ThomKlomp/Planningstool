import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { getISOWeekNumber, toDateParam } from "@/lib/week";
import { weekStartOf } from "@/lib/roster-publish";

// Publiceert het rooster van een week (zichtbaar voor medewerkers) of zet het
// terug naar concept. Alleen eigenaar/manager.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body?.weekStart || typeof body.published !== "boolean") {
    return NextResponse.json({ error: "weekStart en published zijn verplicht" }, { status: 400 });
  }
  const parsed = new Date(body.weekStart);
  if (isNaN(parsed.getTime())) {
    return NextResponse.json({ error: "Ongeldige week" }, { status: 400 });
  }
  const weekStart = weekStartOf(parsed);
  const published: boolean = body.published;

  const existing = await prisma.rosterWeek.findUnique({
    where: { companyId_weekStart: { companyId: membership.companyId, weekStart } },
  });

  const rosterWeek = await prisma.rosterWeek.upsert({
    where: { companyId_weekStart: { companyId: membership.companyId, weekStart } },
    update: {
      published,
      publishedAt: published ? new Date() : null,
    },
    create: {
      companyId: membership.companyId,
      weekStart,
      published,
      publishedAt: published ? new Date() : null,
    },
  });

  // Alleen bij de eerste publicatie van een week krijgen medewerkers een
  // melding; opnieuw publiceren na een correctie spamt niemand.
  if (published && !existing?.notifiedAt) {
    const employees = await prisma.membership.findMany({
      where: { companyId: membership.companyId, role: "EMPLOYEE" },
      select: { id: true },
    });
    await notify(
      membership.companyId,
      employees.map((m) => m.id),
      {
        title: `Rooster week ${getISOWeekNumber(weekStart)} staat online`,
        body: "Je kunt nu zien wanneer je werkt.",
        link: `/dashboard/rooster?week=${toDateParam(weekStart)}`,
      }
    );
    await prisma.rosterWeek.update({
      where: { id: rosterWeek.id },
      data: { notifiedAt: new Date() },
    });
  }

  return NextResponse.json({ rosterWeek });
}
