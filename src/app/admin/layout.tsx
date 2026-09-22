import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/sign-out-button";
import { countChatsAwaitingReply } from "@/lib/support-notify";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin?callbackUrl=/admin");
  }
  if (!session.user.isPlatformAdmin) {
    redirect("/dashboard");
  }

  const chatsAwaitingReply = await countChatsAwaitingReply();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white px-4 py-5 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-xl">Adminportaal</p>
            <p className="text-xs text-ink/50">
              Intern overzicht, niet zichtbaar voor klanten.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <span className="hidden max-w-[14rem] truncate text-xs text-ink/50 sm:inline">
              {session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
        <nav className="mt-4 flex gap-1 overflow-x-auto text-sm">
          <AdminNavLink href="/admin">Overzicht</AdminNavLink>
          <AdminNavLink href="/admin/visits">Bezoekers</AdminNavLink>
          <AdminNavLink href="/admin/companies">Zaken</AdminNavLink>
          <AdminNavLink href="/admin/users">Gebruikers</AdminNavLink>
          <AdminNavLink href="/admin/support">
            Support-chats
            {chatsAwaitingReply > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber px-1 text-[10px] font-semibold text-ink">
                {chatsAwaitingReply}
              </span>
            )}
          </AdminNavLink>
          <AdminNavLink href="/admin/discount-codes">Kortingscodes</AdminNavLink>
          <AdminNavLink href="/admin/demo-company">Demo-zaak</AdminNavLink>
          {session.user.memberships.length > 0 && (
            <Link
              href="/dashboard"
              className="ml-auto shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-ink/50 hover:bg-paper hover:text-ink"
            >
              ← Terug naar dashboard
            </Link>
          )}
        </nav>
      </header>
      <main className="px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-ink/70 hover:bg-paper hover:text-ink"
    >
      {children}
    </Link>
  );
}
