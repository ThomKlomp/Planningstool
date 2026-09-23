"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  createdAt: Date;
  read: boolean;
};

/**
 * Eén melding in de lijst. Het bijbehorende record staat op dit moment al
 * als gelezen in de database (de pagina markeert alles bij het laden), maar
 * de teller in de zijbalk (dashboard/layout.tsx) is een aparte, blijvende
 * server-render die Next.js anders na een klik nog even hergebruikt. Door
 * hier expliciet te verversen voordat we navigeren, klopt die teller meteen.
 */
export default function NotificationItem({ notification }: { notification: Notification }) {
  const router = useRouter();

  const content = (
    <div className="flex items-start gap-3">
      {!notification.read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-awning" />
      )}
      <div className={notification.read ? "opacity-70" : ""}>
        <p className="text-sm font-medium">{notification.title}</p>
        {notification.body && <p className="mt-0.5 text-sm text-ink/60">{notification.body}</p>}
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

  if (!notification.link) return content;

  return (
    <Link
      href={notification.link}
      onClick={() => router.refresh()}
      className="block hover:opacity-80"
    >
      {content}
    </Link>
  );
}
