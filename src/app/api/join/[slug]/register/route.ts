import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/email-verification";
import { resolveDepartmentId } from "@/lib/resolve-department";

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const company = await prisma.company.findUnique({ where: { slug: params.slug } });
  if (!company) {
    return NextResponse.json({ error: "Deze link is niet geldig" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const firstName = (body?.firstName ?? "").trim();
  const lastName = (body?.lastName ?? "").trim();
  const email = (body?.email ?? "").trim().toLowerCase();
  const password = body?.password ?? "";

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "Alle velden zijn verplicht" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Wachtwoord moet minimaal 8 tekens zijn" },
      { status: 400 }
    );
  }

  const resolved = await resolveDepartmentId(company.id, body?.departmentId);
  if (resolved.error) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      {
        error:
          "Er bestaat al een account met dit e-mailadres. Log in en open de link opnieuw om je aan te sluiten.",
      },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        passwordHash,
      },
    });
    await tx.membership.create({
      data: {
        userId: user.id,
        companyId: company.id,
        role: "EMPLOYEE",
        departmentId: resolved.departmentId,
      },
    });
  });

  await sendVerificationEmail(email);

  return NextResponse.json({ ok: true, requiresVerification: true });
}
