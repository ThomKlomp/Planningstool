"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ContactButton from "@/components/contact-button";

type Invite = { id: string; email: string; role: string; token: string; departmentId?: string | null };
type TierWarning = {
  yearly: boolean;
  fromLabel: string;
  toLabel: string;
  newMonthlyExcl: number;
} | null;

export default function InviteForm({
  onInvited,
  departments = [],
}: {
  onInvited?: (invite: Invite) => void;
  departments?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "MANAGER">("EMPLOYEE");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    inviteUrl: string;
    emailSent: boolean;
    tierWarning: TierWarning;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxReached, setMaxReached] = useState(false);
  // Extra teams: een uitzondering, dus ingeklapt achter een klein linkje.
  const [showExtras, setShowExtras] = useState(false);
  const [extraIds, setExtraIds] = useState<string[]>([]);
  // Hoofdteam van de nieuwe medewerker (leeg = de medewerker kiest zelf).
  const [departmentId, setDepartmentId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMaxReached(false);
    setResult(null);

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        role,
        extraDepartmentIds: extraIds,
        departmentId: role === "EMPLOYEE" && departmentId ? departmentId : undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Er ging iets mis.");
      setMaxReached(data.code === "MAX_MEMBERS");
      setLoading(false);
      return;
    }

    setResult({
      inviteUrl: data.inviteUrl,
      emailSent: data.emailSent,
      tierWarning: data.tierWarning ?? null,
    });
    if (data.invite) {
      onInvited?.(data.invite);
    }
    setEmail("");
    setDepartmentId("");
    setExtraIds([]);
    setShowExtras(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-ink/60">E-mailadres van de medewerker</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="naam@voorbeeld.nl"
          className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs text-ink/60">Rol</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "EMPLOYEE" | "MANAGER")}
          className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
        >
          <option value="EMPLOYEE">Medewerker</option>
          <option value="MANAGER">Manager</option>
        </select>
      </div>
      {role === "EMPLOYEE" && departments.length > 1 && (
        <div>
          <label className="block text-xs text-ink/60">Team</label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
          >
            <option value="">Medewerker kiest zelf</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-orange px-4 py-2 text-sm font-medium text-ink hover:bg-orange-dark transition-colors disabled:opacity-50"
      >
        {loading ? "Versturen..." : "Uitnodiging versturen"}
      </button>

      {/* Extra teams: klein en ingeklapt, dit is een uitzondering. Het hoofdteam
          kies je hierboven (of de medewerker kiest zelf); deze teams komen er
          automatisch bij. */}
      {departments.length > 1 && (
        <div className="w-full">
          <button
            type="button"
            onClick={() => setShowExtras((v) => !v)}
            className="text-xs text-ink/40 hover:text-ink hover:underline"
          >
            {extraIds.length > 0 ? `Extra teams (${extraIds.length})` : "+ Extra teams (optioneel)"}
          </button>
          {showExtras && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {departments.map((d) => {
                const active = extraIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      setExtraIds((prev) =>
                        prev.includes(d.id) ? prev.filter((id) => id !== d.id) : [...prev, d.id]
                      )
                    }
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

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      {result && (
        <p className="w-full text-sm text-awning">
          {result.emailSent ? (
            "Uitnodiging verstuurd per e-mail."
          ) : (
            <>
              Uitnodiging aangemaakt, maar e-mail kon niet verstuurd worden.
              Deel deze link handmatig:{" "}
              <span className="break-all font-mono text-xs">{result.inviteUrl}</span>
            </>
          )}
        </p>
      )}
    </form>

    {result?.tierWarning && (
      <p className="mt-2 w-full rounded-lg bg-amber/10 px-3 py-2 text-xs text-amber-dark">
        Let op: als deze uitnodiging wordt geaccepteerd, ga je van staffel{" "}
        {result.tierWarning.fromLabel} naar {result.tierWarning.toLabel}: €
        {result.tierWarning.newMonthlyExcl.toFixed(2)}/maand excl. btw.{" "}
        {result.tierWarning.yearly
          ? "Omdat je een jaarabonnement hebt, betaal je het verschil naar rato van de resterende maanden bij (wordt automatisch afgeschreven). Bij de verlenging geldt het volledige tarief."
          : "Dit geldt vanaf de eerstvolgende betaling."}
      </p>
    )}
    {maxReached && (
      <p className="mt-2 w-full">
        <ContactButton
          message="Hoi! Ik zit op het maximum van 40 medewerkers en wil graag weten wat de mogelijkheden zijn."
          className="rounded-full bg-orange px-4 py-2 text-sm font-medium text-ink hover:bg-orange-dark"
        >
          Neem contact op
        </ContactButton>
      </p>
    )}
    </div>
  );
}
