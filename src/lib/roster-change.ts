import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { sendEmail, emailLayout } from "@/lib/email";
import { getWeekDates, toDateParam } from "@/lib/week";
import { isRosterPublished, weekStartOf } from "@/lib/roster-publish";

type ShiftLike = {
  date: Date;
  startTime: string;
  endTime: string;
  role: string | null;
};

function escapeHtml(input: string) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function shiftDateLabel(date: Date) {
  return date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

export function describeShift(s: ShiftLike) {
  return `${shiftDateLabel(s.date)}, ${s.startTime}–${s.endTime}${s.role ? ` (${s.role})` : ""}`;
}

export type ShiftChange = { membershipId: string; title: string; body: string };

/**
 * Laat medewerkers weten dat een manager/eigenaar iets aan hun diensten heeft
 * veranderd (melding in Shiftje + e-mail). Alleen zodra het rooster van die
 * week gepubliceerd is (bij een concept-rooster mag niemand iets zien) en
 * alleen voor diensten die nog moeten komen. De persoon die de wijziging zelf
 * doet krijgt geen melding. Faalt nooit: een mislukte mail mag het wijzigen
 * van het rooster niet blokkeren.
 */
export async function notifyShiftChanges(opts: {
  companyId: string;
  companyName: string;
  actorMembershipId: string;
  shiftDate: Date;
  changes: ShiftChange[];
}) {
  try {
    const today = new Date(new Date().toDateString());
    if (opts.shiftDate < today) return;

    const weekStart = weekStartOf(opts.shiftDate);
    if (!(await isRosterPublished(opts.companyId, weekStart))) return;

    const changes = opts.changes.filter((c) => c.membershipId !== opts.actorMembershipId);
    if (changes.length === 0) return;

    const link = `/dashboard/rooster?week=${toDateParam(getWeekDates(opts.shiftDate)[0])}`;
    const url = `${process.env.NEXTAUTH_URL ?? ""}${link}`;

    const members = await prisma.membership.findMany({
      where: { id: { in: changes.map((c) => c.membershipId) }, companyId: opts.companyId },
      include: { user: { select: { email: true } } },
    });
    const emailById = new Map(members.map((m) => [m.id, m.user.email]));

    for (const change of changes) {
      if (!emailById.has(change.membershipId)) continue;

      await notify(opts.companyId, [change.membershipId], {
        title: change.title,
        body: change.body,
        link,
      });

      const to = emailById.get(change.membershipId);
      if (to) {
        await sendEmail({
          to,
          subject: `${change.title} (${opts.companyName})`,
          html: emailLayout(
            escapeHtml(change.title),
            `
              <p>${escapeHtml(change.body)}</p>
              <p style="margin-top: 12px; color: #666;">Aangepast door je manager bij ${escapeHtml(opts.companyName)}.</p>
              <p style="margin-top: 20px;">
                <a href="${url}" style="display: inline-block; background: #1B1B18; color: #FAF7F2; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">
                  Bekijk het rooster
                </a>
              </p>
            `
          ),
        });
      }
    }
  } catch (err) {
    console.error("[roster-change] melding versturen mislukt", err);
  }
}
