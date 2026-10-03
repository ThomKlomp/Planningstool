import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planSlugFixes } from "@/lib/slug";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user?.isPlatformAdmin);
}

// Voorbeeld: welke slugs zouden er veranderen? Past niets aan.
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }
  return NextResponse.json({ fixes: await planSlugFixes() });
}

// Voert de wijzigingen door. De oude join-links (/join/<oude-slug>) werken daarna niet meer.
export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }
  const fixes = await planSlugFixes();
  for (const f of fixes) {
    await prisma.company.update({ where: { id: f.id }, data: { slug: f.to } });
  }
  return NextResponse.json({ fixes });
}
