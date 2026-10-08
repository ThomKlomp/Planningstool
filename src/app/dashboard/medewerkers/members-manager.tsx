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

export default function MembersManager({
  members,
  departments,
  viewerRole,
  viewerMembershipId,
  isDemoCompany = false,
}: {
  members: Member[];
  departments: Department[];
  viewerRole: Role;
  viewerMembershipId: string;
  isDemoCompany?: boolean;
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
  const [removed, setRemoved] = useState<string[]>([]);
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

  function canRemove(m: Member) {
    if (m.membershipId === viewerMembershipId) return false;
    if (m.role === "OWNER") return false;
    // Een manager mag alleen medewerkers verwijderen, geen andere managers.
    if (viewerRole === "MANAGER" && roles[m.membershipId] !== "EMPLOYEE") return false;
    return true;
  }

  async function removeMember(m: Member) {
    if (
      !confirm(
        `${m.name} verwijderen uit het team? Deze persoon verliest direct toegang. Toekomstige shifts van deze persoon blijven staan als openstaande shift.`
      )
    ) {
      return;
    }
    setBusyId(m.membershipId);
    setError(null);
    setRemoved((prev) => [...prev, m.membershipId]);
    try {
      const res = await fetch(`/api/memberships/${m.membershipId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Verwijderen mislukt.");
      }
      router.refresh();
    } catch (e) {
      setRemoved((prev) => prev.filter((id) => id !== m.membershipId));
      setError(e instanceof Error ? e.message : "Verwijderen mislukt.");
    } finally {
      setBusyId(null);
    }
  }

  const colorOf = (departmentId: string | null | undefined) =>
    departments.find((d) => d.id === departmentId)?.color ?? null;

  // Per team (in de volgorde van Instellingen, "Geen team" onderaan); binnen een
  // team eerst de eigenaar, dan managers, dan medewerkers, daarbinnen op naam.
  // Gebaseerd op het huidige (lokale) team en de huidige rol, zodat iemand
  // direct meeverhuist zodra die wordt aangepast. Een extra team telt hier niet
  // mee: iemand staat onder zijn hoofdteam.
  const byRoleThenName = (a: Member, b: Member) =>
    ROLE_ORDER.indexOf(roles[a.membershipId]) - ROLE_ORDER.indexOf(roles[b.membershipId]) ||
    a.name.localeCompare(b.name);
  const visible = members.filter(
    (m) => !removed.includes(m.membershipId) && matchesQuery(m, query)
  );
  const groups: { id: string; name: string; color: string | null; people: Member[] }[] = [
    ...departments.map((d) => ({ id: d.id, name: d.name, color: d.color as string | null })),
    { id: "", name: "Geen team", color: null },
  ]
    .map((g) => ({
      ...g,
      people: visible
        .filter((m) => (assignments[m.membershipId] ?? "") === g.id)
        .sort(byRoleThenName),
    }))
    .filter((g) => g.people.length > 0);

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
        <div key={g.id || "geen-team"} className={i > 0 ? "mt-5" : ""}>
          {departments.length > 0 && (
            <p
              className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                g.color ? "" : "text-ink/40"
              }`}
              style={g.color ? { color: g.color } : undefined}
            >
              {g.color && (
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: g.color }} />
              )}
              {g.name}
            </p>
          )}
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
                    <span className="relative inline-flex items-center">
                      <span
                        className="pointer-events-none absolute left-2.5 h-2.5 w-2.5 rounded-full border border-line"
                        style={{ backgroundColor: colorOf(assignments[m.membershipId]) ?? "transparent" }}
                        aria-hidden
                      />
                      <select
                        value={assignments[m.membershipId] ?? ""}
                        onChange={(e) => assignMember(m.membershipId, e.target.value)}
                        aria-label={`Team van ${m.name}`}
                        className="rounded-lg border border-line py-1 pl-7 pr-2 text-xs focus:border-awning focus:outline-none"
                        style={{ borderColor: colorOf(assignments[m.membershipId]) ?? undefined }}
                      >
                        <option value="">Geen team</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </span>
                  )}
                  {isDemoCompany && m.membershipId !== viewerMembershipId && (
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
                      type="button"
                      onClick={() => removeMember(m)}
                      disabled={busyId === m.membershipId}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      Verwijderen
                    </button>
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
                              <span
                                className="mr-1.5 inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: d.color }}
                                aria-hidden
                              />
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
