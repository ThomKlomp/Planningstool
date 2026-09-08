import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin?callbackUrl=/admin");
  }
  if (!session.user.isPlatformAdmin) {
    redirect("/dashboard");
  }

  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: { memberships: true, shifts: true, timeEntries: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const [userCount, pendingHoursCount] = await Promise.all([
    prisma.user.count(),
    prisma.timeEntry.count({ where: { status: "SUBMITTED" } }),
  ]);

  return (
    <main className="min-h-screen bg-paper px-8 py-10 text-ink">
      <h1 className="font-display text-3xl">Adminportaal</h1>
      <p className="mt-1 text-sm text-ink/60">
        Intern overzicht — niet zichtbaar voor klanten.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Zaken" value={companies.length} />
        <StatCard label="Gebruikers" value={userCount} />
        <StatCard label="Uren wachtend op goedkeuring" value={pendingHoursCount} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl">Zaken</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3">Naam</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Leden</th>
                <th className="px-4 py-3">Shifts</th>
                <th className="px-4 py-3">Urenregels</th>
                <th className="px-4 py-3">Aangemaakt</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-ink/60">{c.slug}</td>
                  <td className="px-4 py-3">{c._count.memberships}</td>
                  <td className="px-4 py-3">{c._count.shifts}</td>
                  <td className="px-4 py-3">{c._count.timeEntries}</td>
                  <td className="px-4 py-3 text-ink/50">
                    {c.createdAt.toLocaleDateString("nl-NL")}
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink/40">
                    Nog geen zaken aangemaakt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
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
