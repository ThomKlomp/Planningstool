import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { describeShift, shiftDateLabel } from "@/lib/roster-change";
import { isRosterPublished, weekStartOf } from "@/lib/roster-publish";
import { teamIdsOf } from "@/lib/teams";
import { getWeekDates, toDateParam } from "@/lib/week";

// Een medewerker pakt zelf een open dienst op (een dienst zonder medewerker).
// Bij een dienst voor een team mogen alleen leden van dat team 'm oppakken.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const shift = await prisma.shift.findUnique({ where: { id: params.id } });
  if (!shift || shift.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }
  if (shift.membershipId) {
    return NextResponse.json({ error: "Deze dienst is al opgepakt" }, { status: 409 });
  }

  if (shift.date < new Date(new Date().toDateString())) {
    return NextResponse.json({ error: "Deze dienst is al geweest" }, { status: 409 });
  }

  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";

  // Medewerkers zien een concept-rooster niet, dus kunnen daar ook niets uit oppakken.
  if (!canManage && !(await isRosterPublished(shift.companyId, weekStartOf(shift.date)))) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  if (shift.departmentId && !canManage) {
    const me = await prisma.membership.findUnique({
      where: { id: membership.membershipId },
      include: { extraDepartments: true },
    });
    if (!me || !teamIdsOf(me).includes(shift.departmentId)) {
      return NextResponse.json(
        { error: "Deze dienst is voor een ander team" },
        { status: 403 }
      );
    }
  }

  // Alleen toewijzen als de dienst nog steeds open is: bij twee mensen die tegelijk
  // klikken wint de eerste.
  const claimed = await prisma.shift.updateMany({
    where: { id: shift.id, membershipId: null },
    data: { membershipId: membership.membershipId },
  });
  if (claimed.count === 0) {
    return NextResponse.json({ error: "Deze dienst is al opgepakt" }, { status: 409 });
  }

  // Concept-urenregel, zoals bij elke ingeroosterde dienst.
  await prisma.timeEntry
    .create({
      data: {
        companyId: shift.companyId,
        membershipId: membership.membershipId,
        shiftId: shift.id,
        date: shift.date,
        startTime: shift.startTime,
        endTime: "",
        status: "DRAFT",
      },
    })
    .catch(() => null); // er hing al een urenregel aan deze dienst

  // Managers weten dan dat de open dienst is ingevuld.
  const managers = await prisma.membership.findMany({
    where: {
      companyId: shift.companyId,
      role: { in: ["OWNER", "MANAGER"] },
      id: { not: membership.membershipId },
    },
    select: { id: true },
  });
  await notify(
    shift.companyId,
    managers.map((m) => m.id),
    {
      title: `${session.user.name ?? "Een collega"} pakte een open dienst op`,
      body: `${describeShift(shift)}.`,
      link: `/dashboard/rooster?week=${toDateParam(getWeekDates(shift.date)[0])}`,
    }
  );

  return NextResponse.json({ ok: true, label: shiftDateLabel(shift.date) });
}
