"use client";

import { useState } from "react";
import InviteForm from "./invite-form";
import PendingInvitesList from "./pending-invites-list";

type Invite = { id: string; email: string; role: string; token: string };

export default function TeamSection({
  initialPendingInvites,
}: {
  initialPendingInvites: Invite[];
}) {
  const [pendingInvites, setPendingInvites] = useState(initialPendingInvites);

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl">Medewerker uitnodigen</h2>
      <InviteForm
        onInvited={(invite) => setPendingInvites((prev) => [invite, ...prev])}
      />

      {pendingInvites.length > 0 && (
        <div className="mt-4">
          <PendingInvitesList
            invites={pendingInvites}
            onCancelled={(id) =>
              setPendingInvites((prev) => prev.filter((i) => i.id !== id))
            }
          />
        </div>
      )}
    </section>
  );
}
