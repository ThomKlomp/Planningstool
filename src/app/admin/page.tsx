import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CompaniesTable from "./companies-table";

export default async function AdminOverviewPage() {
  const [companies, userCount, companyCount, pendingHoursCount, platformAdminCount] =
    await Promise.all([
      prisma.company.findMany({
        include: {
          _count: { select: { memberships: true, shifts: true, timeEntries: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.user.count(),
      prisma.company.count(),
      prisma.timeEntry.count({ where: { status: "SUBMITTED" } }),
      prisma.platformAdmin.count(),
    ]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Zaken" value={companyCount} />
        <StatCard label="Gebruikers" value={userCount} />
        <StatCard label="Uren wachtend op goedkeuring" value={pendingHoursCount} />
        <StatCard label="Platform-admins" value={platformAdminCount} />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Recent aangemaakte zaken</h2>
          <Link href="/admin/companies" className="text-sm text-awning hover:underline">
            Alle zaken →
          </Link>
        </div>
        <div className="mt-3">
          <CompaniesTable companies={companies} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-white px-5 py-4">
      <p className="text-2xl font-display">{value}</p>
      <p className="text-sm text-ink/50">{label}</p>
    </div>
  );
}
