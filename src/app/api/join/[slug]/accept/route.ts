import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const operations = [];

  if (firstName || lastName) {
    operations.push(
      prisma.user.update({
        where: { id: session.user.id },
        data: { name: [firstName, lastName].filter(Boolean).join(" ") },
      })
    );
  }

  // Al lid: niets nieuws aanmaken, gewoon ok teruggeven zodat de pagina
  // gewoon doorstuurt naar het dashboard.
  if (!existing) {
    operations.push(
      prisma.membership.create({
        data: {
          userId: session.user.id,
          companyId: company.id,
          role: "EMPLOYEE",
        },
      })
    );
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  return NextResponse.json({ ok: true });
}
