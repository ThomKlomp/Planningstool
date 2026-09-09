"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Invite = { id: string; email: string; role: string; token: string };

export default function PendingInvitesList({ invites: initialInvites }: { invites: Invite[] }) {
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function cancelInvite(id: string, token: string, email: string) {
    if (!confirm(`Uitnodiging voor ${email} intrekken?`)) return;

    setBusyId(id);
    // Optimistisch verwijderen: meteen uit beeld, niet wachten op de server.
    setInvites((prev) => prev.filter((i) => i.id !== id));

    const res = await fetch(`/api/invites/${token}`, { method: "DELETE" });
    setBusyId(null);

    if (!res.ok) {
      // Mislukt: zet 'm terug en laat de echte data alsnog ophalen.
      setInvites(initialInvites);
      router.refresh();
    }
  }

  if (invites.length === 0) return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink/40">
        Openstaande uitnodigingen
      </p>
      <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white text-sm">
        {invites.map((invite) => (
          <li key={invite.id} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <span className="text-ink/80">{invite.email}</span>
              <span className="ml-2 text-xs uppercase tracking-wide text-ink/40">
                {invite.role}
              </span>
            </div>
            <button
              onClick={() => cancelInvite(invite.id, invite.token, invite.email)}
              disabled={busyId === invite.id}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              Intrekken
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
