import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePeriod } from "@/lib/hours-export";

// Telt de uren in de periode die nog niet goedgekeurd zijn, zodat de manager
// vóór het exporteren gewaarschuwd kan worden. Alleen eigenaar/manager.
//  - submitted: ingediend, wacht op beoordeling
//  - queried: manager heeft een vraag gesteld, medewerker moet nog reageren
//  - draft: ingeroosterde dienst (tot en met vandaag) die de medewerker nog niet heeft ingevuld
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

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const base = { companyId: membership.companyId, date: { gte: period.from, lte: period.to } };

  const [submitted, queried, draft] = await Promise.all([
    prisma.timeEntry.count({ where: { ...base, status: "SUBMITTED" } }),
    prisma.timeEntry.count({ where: { ...base, status: "QUERIED" } }),
    prisma.timeEntry.count({
      where: { ...base, status: "DRAFT", date: { gte: period.from, lte: period.to < today ? period.to : today } },
    }),
  ]);

  return NextResponse.json({ submitted, queried, draft, total: submitted + queried + draft });
}
