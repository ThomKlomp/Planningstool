import { prisma } from "@/lib/prisma";
import ToggleAdminButton from "./toggle-admin-button";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams?.q?.trim();

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      platformAdmin: true,
      memberships: { include: { company: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-3xl">Gebruikers</h1>
      <form action="/admin/users" className="mt-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Zoek op naam of e-mail..."
          className="w-full max-w-sm rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
        />
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/40">
              <th className="px-4 py-3">Naam</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Zaken</th>
              <th className="px-4 py-3">Platform-admin</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-ink/60">{u.email}</td>
                <td className="px-4 py-3 text-ink/60">
                  {u.memberships.length === 0
                    ? "—"
                    : u.memberships.map((m) => m.company.name).join(", ")}
                </td>
                <td className="px-4 py-3">
                  {u.platformAdmin ? (
                    <span className="rounded-full bg-awning/10 px-2 py-1 text-xs font-medium text-awning">
                      Ja
                    </span>
                  ) : (
                    <span className="text-xs text-ink/40">Nee</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <ToggleAdminButton userId={u.id} isAdmin={Boolean(u.platformAdmin)} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/40">
                  Geen gebruikers gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
