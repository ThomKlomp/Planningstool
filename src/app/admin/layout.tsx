import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

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

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white px-4 py-5 sm:px-8">
        <p className="font-display text-xl">Adminportaal</p>
        <p className="text-xs text-ink/50">
          Intern overzicht — niet zichtbaar voor klanten.
        </p>
        <nav className="mt-4 flex gap-1 overflow-x-auto text-sm">
          <AdminNavLink href="/admin">Overzicht</AdminNavLink>
          <AdminNavLink href="/admin/companies">Zaken</AdminNavLink>
          <AdminNavLink href="/admin/users">Gebruikers</AdminNavLink>
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
