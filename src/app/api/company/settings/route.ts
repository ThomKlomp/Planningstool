import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json();
  const data: {
    autoOpenWeeks?: number;
    closedWeekdays?: number[];
    showCompanyRosterToEmployees?: boolean;
  } = {};

  if (body?.autoOpenWeeks !== undefined) {
    const autoOpenWeeks = Number(body.autoOpenWeeks);
    if (!Number.isInteger(autoOpenWeeks) || autoOpenWeeks < 0 || autoOpenWeeks > 12) {
      return NextResponse.json({ error: "Ongeldige waarde (0-12)" }, { status: 400 });
    }
    data.autoOpenWeeks = autoOpenWeeks;
  }

  if (body?.closedWeekdays !== undefined) {
    if (
      !Array.isArray(body.closedWeekdays) ||
      !body.closedWeekdays.every((d: unknown) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)
    ) {
      return NextResponse.json({ error: "Ongeldige weekdagen" }, { status: 400 });
    }
    data.closedWeekdays = body.closedWeekdays;
  }

  if (body?.showCompanyRosterToEmployees !== undefined) {
    data.showCompanyRosterToEmployees = Boolean(body.showCompanyRosterToEmployees);
  }

  const company = await prisma.company.update({
    where: { id: membership.companyId },
    data,
  });

  return NextResponse.json({ company });
}
