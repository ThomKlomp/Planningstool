import Link from "next/link";
import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";

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
            {n.link ? (
              <Link href={n.link} className="block hover:opacity-80">
                <NotificationContent notification={n} />
              </Link>
            ) : (
              <NotificationContent notification={n} />
            )}
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

function NotificationContent({
  notification,
}: {
  notification: { title: string; body: string | null; createdAt: Date; read: boolean };
}) {
  return (
    <div className="flex items-start gap-3">
      {!notification.read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-awning" />
      )}
      <div className={notification.read ? "opacity-70" : ""}>
        <p className="text-sm font-medium">{notification.title}</p>
        {notification.body && (
          <p className="mt-0.5 text-sm text-ink/60">{notification.body}</p>
        )}
        <p className="mt-1 text-xs text-ink/40">
          {notification.createdAt.toLocaleDateString("nl-NL", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
