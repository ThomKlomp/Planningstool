"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = { membershipId: string; name: string; email: string; role: string };

export default function MembersTable({
  companyId,
  members,
}: {
  companyId: string;
  members: Member[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function changeRole(membershipId: string, role: string) {
    setBusyId(membershipId);
    await fetch(`/api/admin/companies/${companyId}/members/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function removeMember(membershipId: string, name: string) {
    if (!confirm(`${name} verwijderen uit deze zaak?`)) return;
    setBusyId(membershipId);
    await fetch(`/api/admin/companies/${companyId}/members/${membershipId}`, {
      method: "DELETE",
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/40">
            <th className="px-4 py-3">Naam</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Rol</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.membershipId} className="border-b border-line last:border-0">
              <td className="px-4 py-3 font-medium">{m.name}</td>
              <td className="px-4 py-3 text-ink/60">{m.email}</td>
              <td className="px-4 py-3">
                <select
                  value={m.role}
                  disabled={busyId === m.membershipId}
                  onChange={(e) => changeRole(m.membershipId, e.target.value)}
                  className="rounded-lg border border-line px-2 py-1 text-xs focus:border-awning focus:outline-none"
                >
                  <option value="OWNER">Eigenaar</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Medewerker</option>
                </select>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => removeMember(m.membershipId, m.name)}
                  disabled={busyId === m.membershipId}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  Verwijderen
                </button>
              </td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-ink/40">
                Geen leden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
