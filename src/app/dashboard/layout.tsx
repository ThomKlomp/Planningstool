import Link from "next/link";
import { requireMembership } from "@/lib/current-membership";
import SignOutButton from "@/components/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, membership } = await requireMembership();

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <aside className="flex w-60 flex-col justify-between border-r border-line bg-white px-4 py-6">
        <div>
          <div className="mb-8 px-2">
            <p className="font-display text-lg">{membership.companyName}</p>
            <p className="text-xs uppercase tracking-wide text-ink/40">
              {roleLabel(membership.role)}
            </p>
          </div>
          <nav className="space-y-1 text-sm">
            <NavLink href="/dashboard">Overzicht</NavLink>
            <NavLink href="/dashboard/availability">Beschikbaarheid</NavLink>
            <NavLink href="/dashboard/roster">Rooster</NavLink>
            <NavLink href="/dashboard/hours">Uren</NavLink>
            {session.user.isPlatformAdmin && (
              <NavLink href="/admin">Adminportaal</NavLink>
            )}
          </nav>
        </div>
        <div className="px-2">
          <p className="mb-2 truncate text-xs text-ink/50">
            {session.user.email}
          </p>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 text-ink/70 hover:bg-paper hover:text-ink"
    >
      {children}
    </Link>
  );
}

function roleLabel(role: string) {
  switch (role) {
    case "OWNER":
      return "Eigenaar";
    case "MANAGER":
      return "Manager";
    default:
      return "Medewerker";
  }
}
