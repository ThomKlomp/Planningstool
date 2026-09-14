import Link from "next/link";

type Company = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  subscriptionStatus: string;
  _count: { memberships: number; shifts: number; timeEntries: number };
};

export default function CompaniesTable({ companies }: { companies: Company[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/40">
            <th className="px-4 py-3">Naam</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">Abonnement</th>
            <th className="px-4 py-3">Leden</th>
            <th className="px-4 py-3">Shifts</th>
            <th className="px-4 py-3">Urenregels</th>
            <th className="px-4 py-3">Aangemaakt</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id} className="border-b border-line last:border-0 hover:bg-paper/60">
              <td className="px-4 py-3 font-medium">
                <Link
                  href={`/admin/companies/${c.id}`}
                  className="hover:text-awning hover:underline"
                >
                  {c.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/60">{c.slug}</td>
              <td className="px-4 py-3">
                <SubscriptionBadge status={c.subscriptionStatus} />
              </td>
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
              <td colSpan={7} className="px-4 py-6 text-center text-ink/40">
                Geen zaken gevonden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function SubscriptionBadge({ status }: { status: string }) {
  const label =
    status === "ACTIVE"
      ? "Actief"
      : status === "TRIALING"
      ? "Proef"
      : status === "PAST_DUE"
      ? "Mislukt"
      : "Opgezegd";
  const classes =
    status === "ACTIVE"
      ? "bg-awning/10 text-awning"
      : status === "TRIALING"
      ? "bg-amber/20 text-amber-dark"
      : "bg-red-50 text-red-600";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>{label}</span>
  );
}
