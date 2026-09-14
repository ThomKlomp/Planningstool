import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";
import { resolveWeek, getISOWeekNumber } from "@/lib/week";

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
  const week = resolveWeek(body?.weekStart);

  const [members, shifts] = await Promise.all([
    prisma.membership.findMany({
      where: { companyId: membership.companyId },
      include: { user: true },
    }),
    prisma.shift.findMany({
      where: { companyId: membership.companyId, date: { gte: week[0], lte: week[6] } },
      include: { membership: { include: { user: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const recipients = members.map((m) => m.user.email).filter((e): e is string => Boolean(e));
  if (recipients.length === 0) {
    return NextResponse.json({ error: "Geen teamleden om naar te mailen" }, { status: 400 });
  }

  const rows = shifts
    .map((s) => {
      const date = s.date.toLocaleDateString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const who = s.membership?.user.name ?? s.membership?.user.email ?? "Nog niet toegewezen";
      return `<tr>
        <td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${date}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${s.startTime}–${s.endTime}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${who}${s.role ? ` · ${s.role}` : ""}</td>
      </tr>`;
    })
    .join("");

  const html = emailLayout(
    `Rooster week ${getISOWeekNumber(week[0])} bij ${membership.companyName}`,
    shifts.length > 0
      ? `<table style="width: 100%; border-collapse: collapse; margin-top: 12px;">${rows}</table>`
      : `<p>Er staan nog geen shifts gepland voor deze week.</p>`
  );

  const emailResult = await sendEmail({
    to: recipients,
    subject: `Rooster week ${getISOWeekNumber(week[0])} bij ${membership.companyName}`,
    html,
  });

  return NextResponse.json({
    ok: true,
    recipientCount: recipients.length,
    emailSent: !("skipped" in emailResult),
  });
}
