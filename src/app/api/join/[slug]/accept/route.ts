import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDepartmentId } from "@/lib/resolve-department";

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({ where: { slug: params.slug } });
  if (!company) {
    return NextResponse.json({ error: "Deze link is niet geldig" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const firstName = (body?.firstName ?? "").trim();
  const lastName = (body?.lastName ?? "").trim();

  const existing = await prisma.membership.findUnique({
    where: {
      userId_companyId: { userId: session.user.id, companyId: company.id },
    },
  });

  // Al lid: niets nieuws aanmaken (en dus ook geen teamkeuze meer
  // afdwingen), gewoon ok teruggeven zodat de pagina doorstuurt.
  if (existing) {
    if (firstName || lastName) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: [firstName, lastName].filter(Boolean).join(" ") },
      });
    }
    return NextResponse.json({ ok: true });
  }

  const resolved = await resolveDepartmentId(company.id, body?.departmentId);
  if (resolved.error) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    if (firstName || lastName) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { name: [firstName, lastName].filter(Boolean).join(" ") },
      });
    }
    await tx.membership.create({
      data: {
        userId: session.user.id,
        companyId: company.id,
        role: "EMPLOYEE",
        departmentId: resolved.departmentId,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
