import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildShiftsICS } from "@/lib/ics";
import { filterVisibleForEmployee } from "@/lib/roster-publish";

// Publieke, niet-ingelogde route: de beveiliging zit in de onraadbare
// token, niet in een sessie-check — dit endpoint wordt rechtstreeks door
// Google/Apple Agenda aangeroepen, niet door een ingelogde browser.
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const membership = await prisma.membership.findUnique({
    where: { calendarToken: params.token },
    include: {
      company: { select: { name: true } },
      user: { select: { name: true } },
    },
  });

  if (!membership) {
    return new NextResponse("Onbekende of verlopen agenda-link", { status: 404 });
  }

  // Vanaf 2 weken terug (voor recent gewijzigde diensten) tot een half jaar
  // vooruit — voorkomt een onbeperkt groeiende feed.
  const from = new Date();
  from.setDate(from.getDate() - 14);
  const to = new Date();
  to.setMonth(to.getMonth() + 6);

  const allShifts = await prisma.shift.findMany({
    where: { membershipId: membership.id, date: { gte: from, lte: to } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  // Medewerkers zien alleen gepubliceerde weken, ook via de agenda-feed.
  // Eigenaar/managers zien altijd alles.
  const shifts =
    membership.role === "EMPLOYEE"
      ? await filterVisibleForEmployee(membership.companyId, allShifts)
      : allShifts;

  const ics = buildShiftsICS({
    companyName: membership.company.name,
    memberName: membership.user.name ?? "",
    shifts,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="shiftje-rooster.ics"',
      "Cache-Control": "no-store",
    },
  });
}
