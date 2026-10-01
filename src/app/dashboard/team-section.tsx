"use client";

import { useState } from "react";
import InviteForm from "./invite-form";
import PendingInvitesList from "./pending-invites-list";

type Invite = {
  id: string;
  email: string;
  role: string;
  token: string;
  departmentId?: string | null;
  departmentName?: string | null;
};

export default function TeamSection({
  initialPendingInvites,
  departments = [],
}: {
  initialPendingInvites: Invite[];
  departments?: { id: string; name: string }[];
}) {
  const withTeam = (invite: Invite): Invite => ({
    ...invite,
    departmentName: departments.find((d) => d.id === invite.departmentId)?.name ?? null,
  });
  const [pendingInvites, setPendingInvites] = useState(initialPendingInvites.map(withTeam));

  return (
    <section className="mt-10">
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-xl">Medewerker uitnodigen</h2>
        <p className="mt-1 text-sm text-ink/60">
          Nodig een nieuwe medewerker (of manager) uit. Je kiest meteen bij welk team diegene hoort.
          Ze krijgen een e-mail met een link om een account aan te maken en sluiten daarna aan bij
          je zaak.
        </p>
        <InviteForm
          departments={departments}
          onInvited={(invite) => setPendingInvites((prev) => [withTeam(invite), ...prev])}
        />
      </div>

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
