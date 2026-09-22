import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { sendEmail, emailLayout } from "@/lib/email";

export async function PATCH(
  req: Request,
  { params }: { params: { membershipId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const target = await prisma.membership.findUnique({ where: { id: params.membershipId } });
  if (!target || target.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  const body = await req.json();
  const data: { departmentId?: string | null; role?: "MANAGER" | "EMPLOYEE" } = {};

  if (body?.departmentId !== undefined) {
    const departmentId = body.departmentId || null;
    if (departmentId) {
      const department = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!department || department.companyId !== membership.companyId) {
        return NextResponse.json({ error: "Team niet gevonden" }, { status: 404 });
      }
    }
    data.departmentId = departmentId;
  }

  // Rol wijzigen (manager <-> medewerker) mag alleen de eigenaar, en alleen
  // tussen die twee rollen: eigenaarschap zelf wijzig je hier niet.
  if (body?.role !== undefined) {
    if (membership.role !== "OWNER") {
      return NextResponse.json(
        { error: "Alleen de eigenaar kan rollen wijzigen" },
        { status: 403 }
      );
    }
    if (body.role !== "MANAGER" && body.role !== "EMPLOYEE") {
      return NextResponse.json({ error: "Ongeldige rol" }, { status: 400 });
    }
    if (target.role === "OWNER") {
      return NextResponse.json(
        { error: "De eigenaar kan hier niet van rol wisselen" },
        { status: 400 }
      );
    }
    if (target.id === membership.membershipId) {
      return NextResponse.json({ error: "Je kunt je eigen rol niet wijzigen" }, { status: 400 });
    }
    data.role = body.role;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Niets om aan te passen" }, { status: 400 });
  }

  const updated = await prisma.membership.update({
    where: { id: params.membershipId },
    data,
  });

  if (data.role && data.role !== target.role) {
    await notifyRoleChange({ ...updated, role: data.role }, membership.companyName);
  }

  return NextResponse.json({ membership: updated });
}

async function notifyRoleChange(
  membership: { id: string; companyId: string; role: "MANAGER" | "EMPLOYEE" },
  companyName: string
) {
  const roleLabel = membership.role === "MANAGER" ? "manager" : "medewerker";
  try {
    await notify(membership.companyId, [membership.id], {
      title: `Je bent nu ${roleLabel}`,
      body: `Je rol bij ${companyName} is aangepast naar ${roleLabel}.`,
      link: "/dashboard",
    });

    const user = await prisma.membership
      .findUnique({ where: { id: membership.id }, include: { user: true } })
      .then((m) => m?.user);
    if (!user?.email) return;

    await sendEmail({
      to: user.email,
      subject: `Je rol bij ${companyName} is aangepast`,
      html: emailLayout(
        "Je rol is aangepast",
        `<p>Je rol bij <strong>${companyName}</strong> is aangepast naar <strong>${roleLabel}</strong>.</p>
        ${
          membership.role === "MANAGER"
            ? "<p style=\"margin-top: 12px;\">Je kunt nu roosters maken, uren goedkeuren en teamleden beheren.</p>"
            : ""
        }`
      ),
    });
  } catch (err) {
    console.error("[team-members] rolwijziging melden mislukt", err);
  }
}
