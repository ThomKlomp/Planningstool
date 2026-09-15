import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayoutWide } from "@/lib/email";

function escapeHtml(input: string) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function dateLabel(date: Date) {
  return date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

function section(title: string, items: string[]) {
  if (items.length === 0) return "";
  return `
    <h2 style="font-size:13px; text-transform:uppercase; letter-spacing:0.04em; color:#3F6E5B; margin-top:20px; margin-bottom:6px;">${title}</h2>
    <ul style="margin:0; padding-left:18px;">${items.map((i) => `<li style="margin-bottom:4px;">${i}</li>`).join("")}</ul>
  `;
}

// Bedoeld om 1x per dag (ochtend) aangeroepen te worden door een externe
// cron-dienst, met header: Authorization: Bearer <CRON_SECRET>. Dezelfde
// beveiliging als /api/cron/open-weeks.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const companies = await prisma.company.findMany({
    include: {
      memberships: {
        where: { role: { in: ["OWNER", "MANAGER"] } },
        include: { user: true },
      },
    },
  });

  let companiesNotified = 0;

  for (const company of companies) {
    const managerEmails = company.memberships
      .map((m) => m.user.email)
      .filter((e): e is string => Boolean(e));
    if (managerEmails.length === 0) continue;

    const [offered, claimed, openedWeeks, submittedHours] = await Promise.all([
      prisma.shiftSwapRequest.findMany({
        where: { companyId: company.id, createdAt: { gte: since } },
        include: { shift: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.shiftSwapRequest.findMany({
        where: { companyId: company.id, claimedAt: { gte: since } },
        include: { shift: true },
        orderBy: { claimedAt: "asc" },
      }),
      prisma.weekStatus.findMany({
        where: { companyId: company.id, notifiedAt: { gte: since }, isOpen: true },
        orderBy: { weekStart: "asc" },
      }),
      prisma.timeEntry.findMany({
        where: { companyId: company.id, status: "SUBMITTED", updatedAt: { gte: since } },
        include: { membership: { include: { user: true } } },
        orderBy: { updatedAt: "asc" },
      }),
    ]);

    if (
      offered.length === 0 &&
      claimed.length === 0 &&
      openedWeeks.length === 0 &&
      submittedHours.length === 0
    ) {
      continue; // niets gebeurd sinds gisteren, geen mail sturen
    }

    // Namen opzoeken voor de offer/claim-lijsten (staan alleen als
    // membershipId op het ShiftSwapRequest).
    const membershipIds = new Set<string>();
    for (const r of offered) membershipIds.add(r.offeredById);
    for (const r of claimed) {
      membershipIds.add(r.offeredById);
      if (r.claimedById) membershipIds.add(r.claimedById);
    }
    const namedMembers = await prisma.membership.findMany({
      where: { id: { in: Array.from(membershipIds) } },
      include: { user: true },
    });
    const nameById = new Map(
      namedMembers.map((m) => [m.id, m.user.name ?? m.user.email ?? "Onbekend"])
    );

    const html = emailLayoutWide(
      `Dagelijkse update, ${company.name}`,
      `
        <p>Dit is er sinds gisteren gebeurd bij <strong>${escapeHtml(company.name)}</strong>:</p>
        ${section(
          "Opengestelde diensten",
          offered.map(
            (r) =>
              `${escapeHtml(dateLabel(r.shift.date))}, ${r.shift.startTime}–${r.shift.endTime} door ${escapeHtml(
                nameById.get(r.offeredById) ?? "Onbekend"
              )}`
          )
        )}
        ${section(
          "Overgenomen diensten",
          claimed.map(
            (r) =>
              `${escapeHtml(dateLabel(r.shift.date))}, ${r.shift.startTime}–${r.shift.endTime}: ${escapeHtml(
                r.claimedById ? nameById.get(r.claimedById) ?? "Onbekend" : "Onbekend"
              )} nam 'm over van ${escapeHtml(nameById.get(r.offeredById) ?? "Onbekend")}`
          )
        )}
        ${section(
          "Beschikbaarheid geopend",
          openedWeeks.map(
            (w) =>
              `Week van ${escapeHtml(
                w.weekStart.toLocaleDateString("nl-NL", { day: "numeric", month: "long" })
              )}`
          )
        )}
        ${section(
          "Ingevulde uren, ter goedkeuring",
          submittedHours.map(
            (t) =>
              `${escapeHtml(t.membership.user.name ?? t.membership.user.email ?? "Onbekend")}, ${escapeHtml(
                t.date.toLocaleDateString("nl-NL", { day: "numeric", month: "long" })
              )} (${t.startTime}–${t.endTime})`
          )
        )}
        <p style="margin-top: 24px;">
          <a href="${process.env.NEXTAUTH_URL ?? ""}/dashboard" style="display: inline-block; background: #1B1B18; color: #FAF7F2; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">
            Naar Shiftje
          </a>
        </p>
      `
    );

    await sendEmail({
      to: managerEmails,
      subject: `Dagelijkse update, ${company.name}`,
      html,
    });
    companiesNotified += 1;
  }

  return NextResponse.json({ ok: true, companiesNotified });
}
