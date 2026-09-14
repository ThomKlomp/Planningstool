import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TRIAL_DAYS } from "@/lib/billing";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const body = await req.json();
  const name = (body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
  }

  const baseSlug = slugify(name) || "zaak";
  let slug = baseSlug;
  let attempt = 1;
  // Zorg dat de slug uniek is; probeer anders met een suffix.
  while (await prisma.company.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const company = await prisma.company.create({
    data: {
      name,
      slug,
      trialEndsAt,
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  return NextResponse.json({ company });
}
