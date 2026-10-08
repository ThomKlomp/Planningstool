"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Department = { id: string; name: string; color: string };
type Role = "OWNER" | "MANAGER" | "EMPLOYEE";
type Member = {
  membershipId: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  extraDepartmentIds: string[];
};

function matchesQuery(m: Member, query: string) {
  const q = query.trim().toLowerCase();
  return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
}

const ROLE_ORDER: Role[] = ["OWNER", "MANAGER", "EMPLOYEE"];
const ROLE_HEADING: Record<Role, string> = {
  OWNER: "Eigenaar",
  MANAGER: "Managers",
  EMPLOYEE: "Medewerkers",
};

export default function MembersManager({
  members,
  departments,
  viewerRole,
  viewerMembershipId,
}: {
  members: Member[];
  departments: Department[];
  viewerRole: Role;
  viewerMembershipId: string;
}) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {};
    for (const m of members) map[m.membershipId] = m.departmentId;
    return map;
  });
  // Extra teams per medewerker (naast het hoofdteam): een uitzondering, dus
  // standaard ingeklapt en alleen te openen via een klein tekstlinkje.
  const [extras, setExtras] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const m of members) map[m.membershipId] = m.extraDepartmentIds;
    return map;
  });
  const [roles, setRoles] = useState<Record<string, Role>>(() => {
    const map: Record<string, Role> = {};
    for (const m of members) map[m.membershipId] = m.role;
    return map;
  });
  const [openExtrasId, setOpenExtrasId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function patch(membershipId: string, body: object) {
    const res = await fetch(`/api/team-members/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Opslaan mislukt.");
    }
  }

  async function assignMember(membershipId: string, departmentId: string) {
    const prevAssignment = assignments[membershipId] ?? null;
    const prevExtras = extras[membershipId] ?? [];
    setError(null);
    setAssignments((prev) => ({ ...prev, [membershipId]: departmentId || null }));
    // Het nieuwe hoofdteam hoort niet ook nog als extra team te staan.
    setExtras((prev) => ({
      ...prev,
      [membershipId]: (prev[membershipId] ?? []).filter((id) => id !== departmentId),
    }));
    try {
      await patch(membershipId, { departmentId: departmentId || null });
      router.refresh();
    } catch (e) {
      setAssignments((prev) => ({ ...prev, [membershipId]: prevAssignment }));
      setExtras((prev) => ({ ...prev, [membershipId]: prevExtras }));
      setError(e instanceof Error ? e.message : "Opslaan mislukt.");
    }
  }

  async function toggleExtra(membershipId: string, departmentId: string) {
    const current = extras[membershipId] ?? [];
    const next = current.includes(departmentId)
      ? current.filter((id) => id !== departmentId)
      : [...current, departmentId];
    setError(null);
    setExtras((prev) => ({ ...prev, [membershipId]: next }));
    try {
      await patch(membershipId, { extraDepartmentIds: next });
      router.refresh();
    } catch (e) {
      setExtras((prev) => ({ ...prev, [membershipId]: current }));
      setError(e instanceof Error ? e.message : "Opslaan mislukt.");
    }
  }

  // Rol wijzigen mag alleen de eigenaar, en alleen tussen manager en
  // medewerker (het eigenaarschap zelf verander je hier niet).
  function canChangeRole(m: Member) {
    return viewerRole === "OWNER" && m.role !== "OWNER" && m.membershipId !== viewerMembershipId;
  }

  async function changeRole(m: Member, role: "MANAGER" | "EMPLOYEE") {
    const label = role === "MANAGER" ? "manager" : "medewerker";
    if (!confirm(`${m.name} instellen als ${label}?`)) return;

    const previous = roles[m.membershipId];
    setBusyId(m.membershipId);
    setError(null);
    setRoles((prev) => ({ ...prev, [m.membershipId]: role }));
    try {
      await patch(m.membershipId, { role });
      router.refresh();
    } catch (e) {
      setRoles((prev) => ({ ...prev, [m.membershipId]: previous }));
      setError(e instanceof Error ? e.message : "Rol wijzigen mislukt.");
    } finally {
      setBusyId(null);
    }
  }

  const colorOf = (departmentId: string | null | undefined) =>
    departments.find((d) => d.id === departmentId)?.color ?? null;

  // Eigenaar bovenaan, dan managers, dan medewerkers; binnen een groep op naam.
  // Gebaseerd op de huidige (lokale) rol, zodat iemand direct meeverhuist
  // zodra de status is aangepast.
  const groups = ROLE_ORDER.map((role) => ({
    role,
    people: members
      .filter((m) => roles[m.membershipId] === role)
      .filter((m) => matchesQuery(m, query))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.people.length > 0);

  return (
    <div>
      {departments.length === 0 && (
        <p className="mb-3 rounded-lg bg-ink/5 px-4 py-3 text-sm text-ink/60">
          Er zijn nog geen teams. Maak ze aan bij{" "}
          <Link href="/dashboard/settings" className="text-awning underline hover:no-underline">
            Instellingen
          </Link>
          , daarna kun je hier je medewerkers indelen.
        </p>
      )}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek een medewerker"
        aria-label="Zoek een medewerker"
        className="mb-4 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-awning focus:outline-none"
      />

      {groups.length === 0 && (
        <p className="rounded-lg bg-ink/5 px-4 py-3 text-sm text-ink/60">
          Niemand gevonden voor “{query.trim()}”.
        </p>
      )}

      {groups.map((g, i) => (
        <div key={g.role} className={i > 0 ? "mt-5" : ""}>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/40">
            {ROLE_HEADING[g.role]}
          </p>
          <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
          {g.people.map((m) => (
            <li key={m.membershipId} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <Link
                  href={`/dashboard/medewerkers/${m.membershipId}`}
                  className="min-w-0 hover:underline"
                >
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="truncate text-xs text-ink/50">{m.email}</p>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  {canChangeRole(m) ? (
                    <select
                      value={roles[m.membershipId]}
                      disabled={busyId === m.membershipId}
                      onChange={(e) => changeRole(m, e.target.value as "MANAGER" | "EMPLOYEE")}
                      aria-label={`Status van ${m.name}`}
                      className="rounded-full border border-line bg-white px-2 py-1 text-xs text-ink/70 hover:border-ink disabled:opacity-50"
                    >
                      <option value="EMPLOYEE">Medewerker</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  ) : (
                    <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs text-ink/50">
                      {roles[m.membershipId] === "OWNER"
                        ? "Eigenaar"
                        : roles[m.membershipId] === "MANAGER"
                        ? "Manager"
                        : "Medewerker"}
                    </span>
                  )}
                  {departments.length > 0 && (
                    <select
                      value={assignments[m.membershipId] ?? ""}
                      onChange={(e) => assignMember(m.membershipId, e.target.value)}
                      aria-label={`Team van ${m.name}`}
                      className="rounded-lg border border-line px-2 py-1 text-xs focus:border-awning focus:outline-none"
                    >
                      <option value="">Geen team</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              {/* Extra teams: bewust klein en ingeklapt, dit is een uitzondering. */}
              {departments.length > 1 && (
                <div className="mt-1 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenExtrasId(openExtrasId === m.membershipId ? null : m.membershipId)
                    }
                    className="text-[11px] text-ink/40 hover:text-ink hover:underline"
                  >
                    {(extras[m.membershipId] ?? []).length > 0
                      ? `Extra teams (${(extras[m.membershipId] ?? []).length})`
                      : "+ Extra team"}
                  </button>
                  {openExtrasId === m.membershipId && (
                    <div className="mt-1.5 flex flex-wrap justify-end gap-1.5">
                      {departments
                        .filter((d) => d.id !== assignments[m.membershipId])
                        .map((d) => {
                          const active = (extras[m.membershipId] ?? []).includes(d.id);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => toggleExtra(m.membershipId, d.id)}
                              className={`rounded-full border px-2.5 py-1 text-xs ${
                                active
                                  ? "border-ink bg-ink text-paper"
                                  : "border-line text-ink/60 hover:border-ink"
                              }`}
                            >
                              {d.name}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
          </ul>
        </div>
      ))}

      {viewerRole !== "OWNER" && (
        <p className="mt-2 text-xs text-ink/50">
          Alleen de eigenaar kan iemand manager of medewerker maken.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
