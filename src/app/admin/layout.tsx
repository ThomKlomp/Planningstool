import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireAcceptedTerms } from "@/lib/auth-guards";
import SignOutButton from "@/components/sign-out-button";
import { countChatsAwaitingReply } from "@/lib/support-notify";
import AdminNav, { type AdminNavItem } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin?callbackUrl=/admin");
  }
  requireAcceptedTerms(session, "/admin");
  if (!session.user.isPlatformAdmin) {
    redirect("/dashboard");
  }

  const chatsAwaitingReply = await countChatsAwaitingReply();

  const navItems: AdminNavItem[] = [
    { href: "/admin", label: "Overzicht" },
    { href: "/admin/pages", label: "Pagina's" },
    { href: "/admin/visits", label: "Bezoekers" },
    { href: "/admin/companies", label: "Zaken" },
    { href: "/admin/users", label: "Gebruikers" },
    { href: "/admin/support", label: "Support-chats", badge: chatsAwaitingReply },
    { href: "/admin/discount-codes", label: "Kortingscodes" },
    { href: "/admin/demo-company", label: "Demo-zaak" },
  ];

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
        <AdminNav
          items={navItems}
          backLink={
            session.user.memberships.length > 0
              ? { href: "/dashboard", label: "← Terug naar dashboard" }
              : undefined
          }
        />
      </header>
      <main className="px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
