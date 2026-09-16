"use client";

import { useState } from "react";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentName: string | null;
  departmentColor: string | null;
};

export default function MemberList({
  initialMembers,
  canManage,
  viewerRole,
  viewerMembershipId,
  isDemoCompany = false,
}: {
  initialMembers: Member[];
  canManage: boolean;
  viewerRole: string;
  viewerMembershipId: string;
  isDemoCompany?: boolean;
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

  const groups = new Map<string, Member[]>();
  for (const m of members) {
    const key = m.departmentName ?? "Geen team";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === "Geen team") return 1;
    if (b === "Geen team") return -1;
    return a.localeCompare(b);
  });

  // Alleen groeperen als er daadwerkelijk teams zijn ingesteld, anders
  // gewoon één platte lijst tonen zonder onnodig "Geen team"-kopje erboven.
  const hasDepartments = members.some((m) => m.departmentName);
  const sections: [string, Member[]][] = hasDepartments ? sortedGroups : [["", members]];

  return (
    <div>
      {sections.map(([departmentName, groupMembers], i) => {
        const color = groupMembers.find((m) => m.departmentColor)?.departmentColor ?? null;
        return (
          <div key={departmentName || "all"} className={i > 0 ? "mt-4" : ""}>
            {hasDepartments && (
              <p
                className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                  color ? "" : "text-ink/40"
                }`}
                style={color ? { color } : undefined}
              >
                {color && (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                )}
                {departmentName}
              </p>
            )}
            <ul className="divide-y divide-line rounded-xl border border-line bg-white">
              {groupMembers.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-ink/50">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wide text-ink/40">{m.role}</span>
                    {isDemoCompany && m.id !== viewerMembershipId && (
                      <a
                        href={`/demo-switch?email=${encodeURIComponent(m.email)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-awning hover:underline"
                      >
                        Inloggen als
                      </a>
                    )}
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
          </div>
        );
      })}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
