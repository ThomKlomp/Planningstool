import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MembersTable from "./members-table";
import DeleteCompanyButton from "./delete-company-button";

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      memberships: { include: { user: true }, orderBy: { createdAt: "asc" } },
      invites: { where: { acceptedAt: null }, orderBy: { createdAt: "desc" } },
      _count: { select: { shifts: true } },
    },
  });

  if (!company) notFound();

  const timeEntryCounts = await prisma.timeEntry.groupBy({
    by: ["status"],
    where: { companyId: company.id },
    _count: true,
  });

  const submitted = timeEntryCounts.find((t) => t.status === "SUBMITTED")?._count ?? 0;
  const approved = timeEntryCounts.find((t) => t.status === "APPROVED")?._count ?? 0;
  const rejected = timeEntryCounts.find((t) => t.status === "REJECTED")?._count ?? 0;

  return (
    <div className="max-w-4xl">
      <Link href="/admin/companies" className="text-sm text-ink/50 hover:text-ink">
        ← Alle zaken
      </Link>

      <div className="mt-2">
        <h1 className="font-display text-3xl">{company.name}</h1>
        <p className="mt-1 text-sm text-ink/50">
          /{company.slug} · aangemaakt {company.createdAt.toLocaleDateString("nl-NL")}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Leden" value={company.memberships.length} />
        <StatCard label="Shifts" value={company._count.shifts} />
        <StatCard label="Uren ter goedkeuring" value={submitted} />
        <StatCard label="Uren afgehandeld" value={approved + rejected} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl">Team</h2>
        <MembersTable
          companyId={company.id}
          members={company.memberships.map((m) => ({
            membershipId: m.id,
            name: m.user.name ?? m.user.email ?? "Onbekend",
            email: m.user.email ?? "",
            role: m.role,
          }))}
        />
      </section>

      {company.invites.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl">Openstaande uitnodigingen</h2>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-white text-sm">
            {company.invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-4 py-3">
                <span>{i.email}</span>
                <span className="text-xs uppercase tracking-wide text-ink/40">{i.role}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 rounded-xl border border-red-200 bg-red-50 p-4">
        <h2 className="font-display text-lg text-red-700">Gevarenzone</h2>
        <p className="mt-1 text-sm text-red-600/80">
          Zaak verwijderen kan niet ongedaan worden gemaakt. Alle leden,
          shifts, uren en beschikbaarheid van deze zaak verdwijnen mee.
        </p>
        <div className="mt-3">
          <DeleteCompanyButton companyId={company.id} companyName={company.name} />
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
