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
    <div className="min-h-screen bg-paper text-ink sm:flex">
      <aside className="border-b border-line bg-white sm:flex sm:w-60 sm:flex-col sm:justify-between sm:border-b-0 sm:border-r">
        <div>
          <div className="px-4 py-4 sm:px-4 sm:py-6">
            <p className="truncate font-display text-lg">{membership.companyName}</p>
            <p className="text-xs uppercase tracking-wide text-ink/40">
              {roleLabel(membership.role)}
            </p>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-line px-2 py-2 text-sm sm:flex-col sm:gap-0 sm:space-y-1 sm:overflow-visible sm:border-t-0 sm:px-2 sm:py-0">
            <NavLink href="/dashboard">Overzicht</NavLink>
            <NavLink href="/dashboard/availability">Beschikbaarheid</NavLink>
            <NavLink href="/dashboard/roster">Rooster</NavLink>
            <NavLink href="/dashboard/hours">Uren</NavLink>
            {(membership.role === "OWNER" || membership.role === "MANAGER") && (
              <NavLink href="/dashboard/settings">Instellingen</NavLink>
            )}
            {session.user.isPlatformAdmin && (
              <NavLink href="/admin">Adminportaal</NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:block sm:px-4 sm:py-6">
          <p className="min-w-0 truncate text-xs text-ink/50 sm:mb-2">
            {session.user.email}
          </p>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-ink/70 hover:bg-paper hover:text-ink sm:w-full sm:rounded-lg sm:px-3 sm:py-2 sm:text-left sm:whitespace-normal"
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
