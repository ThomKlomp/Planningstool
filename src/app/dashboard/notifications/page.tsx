import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import NotificationItem from "./notification-item";

// Zie dashboard/layout.tsx: zonder dit kan Next.js een verouderde lijst
// (met meldingen die net als gelezen zijn gemarkeerd) blijven tonen bij
// client-side navigatie terug naar deze pagina.
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const { membership } = await requireMembership();

  const notifications = await prisma.notification.findMany({
    where: { membershipId: membership.membershipId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Alles wat nu getoond wordt, geldt als "gezien".
  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
  if (unreadIds.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: unreadIds } },
      data: { read: true },
    });
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Meldingen</h1>
      <p className="mt-1 text-sm text-ink/60">
        Overnames, ruilen en andere updates die voor jou relevant zijn.
      </p>

      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-white">
        {notifications.map((n) => (
          <li key={n.id} className="px-4 py-3">
            <NotificationItem notification={n} />
          </li>
        ))}
        {notifications.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-ink/40">
            Nog geen meldingen.
          </li>
        )}
      </ul>
    </div>
  );
}
