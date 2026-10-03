import { prisma } from "@/lib/prisma";
import CompaniesTable from "../companies-table";

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams?.q?.trim();

  const companies = await prisma.company.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      _count: { select: { memberships: true, shifts: true, timeEntries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-3xl">Zaken</h1>
      <form action="/admin/companies" className="mt-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Zoek op naam of slug..."
          className="w-full max-w-sm rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
        />
      </form>
      <div className="mt-4">
        <CompaniesTable companies={companies} />
      </div>
    </div>
  );
}
