"use client";

import { useState } from "react";

type Member = { id: string; name: string; email: string; role: string };

export default function MemberList({
  initialMembers,
  canManage,
  viewerRole,
  viewerMembershipId,
}: {
  initialMembers: Member[];
  canManage: boolean;
  viewerRole: string;
  viewerMembershipId: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function canRemove(member: Member) {
    if (!canManage) return false;
    if (member.id === viewerMembershipId) return false;
    if (member.role === "OWNER") return false;
    // Een manager mag alleen medewerkers verwijderen, geen andere managers.
    if (viewerRole === "MANAGER" && member.role !== "EMPLOYEE") return false;
    return true;
  }

  async function removeMember(member: Member) {
    if (
      !confirm(
        `${member.name} verwijderen uit het team? Deze persoon verliest direct toegang. Toekomstige shifts van deze persoon blijven staan als openstaande shift.`
      )
    ) {
      return;
    }

    setBusyId(member.id);
    setError(null);
    const previous = members;
    setMembers((prev) => prev.filter((m) => m.id !== member.id));

    const res = await fetch(`/api/memberships/${member.id}`, { method: "DELETE" });

    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Verwijderen mislukt.");
      setMembers(previous);
    }
  }

  return (
    <div>
      <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-xs text-ink/50">{m.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-wide text-ink/40">
                {m.role}
              </span>
              {canRemove(m) && (
                <button
                  onClick={() => removeMember(m)}
                  disabled={busyId === m.id}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  Verwijderen
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
