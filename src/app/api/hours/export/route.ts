import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildHoursWorkbook, parsePeriod } from "@/lib/hours-export";

// Excel-export van goedgekeurde uren. Alleen eigenaar/manager.
// ?from=YYYY-MM-DD&to=YYYY-MM-DD (inclusief), of ?month=YYYY-MM.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const period = parsePeriod(new URL(req.url).searchParams);
  if (!period) {
    return NextResponse.json({ error: "Ongeldige periode" }, { status: 400 });
  }
  const { from, to } = period;

  const entries = await prisma.timeEntry.findMany({
    where: {
      companyId: membership.companyId,
      status: "APPROVED",
      date: { gte: from, lte: to },
    },
    include: { membership: { include: { user: true, department: true } } },
  });

  const label = `${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}`;
  const wb = await buildHoursWorkbook(
    entries.map((e) => ({
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      breakMinutes: e.breakMinutes,
      memberName: e.membership.user.name ?? e.membership.user.email ?? "Onbekend",
      departmentName: e.membership.department?.name ?? null,
    })),
    label
  );

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="uren-goedgekeurd-${label}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
