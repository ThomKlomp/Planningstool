import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { isValidTimeRange } from "@/lib/availability-slots";
import { getWeekDates, toDateParam } from "@/lib/week";

// Een manager voegt een extra tijdvak toe waarop medewerkers hun
// beschikbaarheid kunnen invullen, bv. voor een feestje.
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
  const { date, startTime, endTime } = body ?? {};
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 80) : "";
  if (!date || Number.isNaN(new Date(date).getTime())) {
    return NextResponse.json({ error: "Ongeldige datum" }, { status: 400 });
  }
  if (!isValidTimeRange(startTime, endTime)) {
    return NextResponse.json(
      { error: "Kies een begin- en eindtijd die niet gelijk zijn" },
      { status: 400 }
    );
  }

  const slot = await prisma.availabilitySlot.create({
    data: {
      companyId: membership.companyId,
      date: new Date(date),
      startTime,
      endTime,
      title: title || null,
    },
  });

  // Medewerkers laten weten dat ze hier hun beschikbaarheid op kunnen invullen.
  const others = await prisma.membership.findMany({
    where: { companyId: membership.companyId, id: { not: membership.membershipId } },
    select: { id: true },
  });
  const dateLabel = slot.date.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  await notify(
    membership.companyId,
    others.map((m) => m.id),
    {
      title: `Geef je beschikbaarheid door${title ? ` voor ${title}` : ""}`,
      body: `${dateLabel}, ${slot.startTime}–${slot.endTime}.`,
      link: `/dashboard/availability?week=${toDateParam(getWeekDates(slot.date)[0])}`,
    }
  );

  return NextResponse.json({ slot });
}
